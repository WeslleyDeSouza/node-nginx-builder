import path from 'path';
import fs from 'fs';
import { nginxFormat } from 'nginx-format';


// ---- Blocks
abstract class NginxBlock {
    abstract get rawTemplate(): string;

    abstract get template(): string;
}

class LocationBlock extends NginxBlock {
    blockName = 'location'

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
    ) {
        super(locationPath);
    }

    get hostProxy(){
        return 'http://'+this.host
    }
    get portProxy(){
        return this.port
    }

    get pathProxy(){
        return this.proxyPath
    }

    get lineProxy(){
        return ['proxy_pass',' ',this.hostProxy,':',this.portProxy,this.pathProxy+';'].join('')
    }
    get rawTemplate() {
        return [
            this.lineBlock,
            this.lineProxy,
            '}'
        ].join('\n')
    }

    get template(): string {
        return this.rawTemplate;
    }
}

class ServerBlock extends NginxBlock {
    protected children:NginxBlock[] = []

    blockName = 'server'

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
        proxy?: {
            locationPath:string
            host: string;
            path?: string;
            port: number;
        }[];
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

            app.locations.forEach(location =>{
                const locationBlock = new LocationBlock(location.locationPath,location.path);
                serverBlock.injectBlock(locationBlock)
            })
            app.proxy.forEach(proxy =>{
                const reserveProxyBlock = new ReverseProxyBlock(
                    proxy.locationPath,
                    proxy.host,
                    proxy.port,
                    proxy.path
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