import path from 'path';
import fs from 'fs';
import { nginxFormat } from 'nginx-format';

const filterEmpty = (x:string) =>!!x

// ---- Blocks
abstract class NginxBlock {
    abstract blockName: string;

    abstract get rawTemplate(): string;

    abstract get template(): string;
}

class LocationBlock extends NginxBlock {
    blockName:string = 'location'

    constructor(protected locationPath:string, private filePath = '') {
        super();
    }

    get lineBlock(){
        return [this.blockName, this.locationPath, '{'].join(' ')
    }


    get lineFileRoot(){
        return  ['root', this.filePath + ';'].join(' ')
    }
    get lineTryFiles(){
        return  'try_files $uri $uri/ /index.html?$query_string;'
    }

    get rawTemplate() {
       return [
            this.lineBlock,
            this.lineFileRoot,
            this.lineTryFiles,
            '}'
        ].join('\n')
    }

    get template(): string {
        return this.rawTemplate;
    }
}

class ReverseProxyBlock extends LocationBlock {
    constructor(protected locationPath:string,
                protected host:string,
                protected port:number,
                protected proxyPath:string,
                protected options?:IProxyOptions,
    ) {
        super(locationPath);
    }

    get hostProxy(){
        return (this.options?.https ? 'https://' : 'http://') + this.host
    }
    get portProxy(){
        return this.port
    }

    get pathProxy():string{
        return this.proxyPath
    }

    get lineBlock():string{
        return [this.blockName, `${this.options?.locationPrefix ? this.options?.locationPrefix  +' ' : '' }`, this.locationPath, '{'].filter(filterEmpty).join(' ')
    }

    get lineProxy():string{
        return ['proxy_pass',` `,this.hostProxy,this.portProxy ? ':'+this.portProxy:'',this.pathProxy+';'].join('')
    }



    get lineRewrite():string | null{
        return this.options?.rewrite ? `rewrite ${this.options?.rewrite};` : null
    }
    get rawTemplate() {
        return [
            this.lineBlock,
            this.lineRewrite,
            this.lineProxy,
            '}'
        ].filter(filterEmpty).join('\n')
    }

    get template(): string {
        return this.rawTemplate;
    }
}

class ServerBlock extends NginxBlock {
    blockName:string = 'server'
    protected children:NginxBlock[] = []
    constructor(protected serverName:string,protected port:number) {
        super();
    }

    get lineListen(){
        return `listen ${this.port};`
    }
    get lineServerName(){
        return `server_name ${this.serverName};`
    }

    get rawTemplate() {
        return [this.blockName+'{',this.lineListen,this.lineServerName+'}'].join('\n')
    }

    get template(): string {
        const block = this.renderBlocks()
        return  block
    }

    injectBlock(block){
        this.children.push(block)
    }

    renderBlocks(){
        let block = this.rawTemplate;
        block = [
             block.slice(0,block.lastIndexOf('}')),
             this.children.map(child => child.template).join('\n'),
            '}'
        ].join('\n')
        return block
    }
}

// -----

//---- Options

interface IProxy{
    locationPath:string
    host: string;
    path?: string;
    port: number;
    options?:IProxyOptions
}
interface IProxyOptions{https?:boolean,rewrite?:string,locationPrefix?:string}

interface IOptions {
    // outputPath where .conf should be saved
    outputPath: string;
    // name of the output file
    fileName: string;

    apps: {
        name: string;
        serverName: string;
        port: number;
        filePath?: string;
        docsUrl?: string;
        ssl?: {};
        locations:{
            locationPath:string,
            path: string
        }[]
        proxy?:IProxy[];
    }[];
}

class NginxBuilderOptions {
    constructor(protected params: IOptions) {}

    getApps(){
        return this.params.apps
    }

    getApp(name:string){
        return this.params.apps.find(app => app.name == name)
    }

    getOutputOptions(){
        return {
            fileName:this.params.fileName,
            outputPath:this.params.outputPath
        }
    }
}
// -----


export class NginxBuilder {
    protected config:NginxBuilderOptions

    constructor(params: IOptions) {
        this.config = new NginxBuilderOptions(params);
    }

    public getApps(){
       return this.config.getApps();
    }

    public getApp(name:string){
        return this.config.getApp(name);
    }

    public build(appName?){
        let blocks = []
        if(appName){}

        for(let app of this.getApps()){
            const serverBlock = new ServerBlock(app.serverName,app.port)

            app.locations?.forEach(location =>{
                const locationBlock = new LocationBlock(location.locationPath,location.path);
                serverBlock.injectBlock(locationBlock)
            })
            app.proxy?.forEach(proxy =>{
                const reserveProxyBlock = new ReverseProxyBlock(
                    proxy.locationPath,
                    proxy.host,
                    proxy.port,
                    proxy.path,
                    proxy.options
                );
                serverBlock.injectBlock(reserveProxyBlock)
            })

           blocks.push(serverBlock.template)
        }

        return blocks.join('\n')

    }

    saveToFile(content, formattedConfig  = undefined){
        const  {fileName,outputPath} = this.config.getOutputOptions()

        if(formattedConfig){
            content = nginxFormat(content)
        }

        fs?.writeFileSync(
            path.join(outputPath,fileName)
            ,content,"utf8")
    }

}

export default NginxBuilder