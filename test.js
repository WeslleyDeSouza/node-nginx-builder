const path = require('path')
const { NginxBuilder } = require( "./dist/index" );



const nginxBuilder = new NginxBuilder({
    outputPath: path.resolve(__dirname, "config"),
    fileName: "local.webserver.conf",
    apps: [
        {
            name: "business",
            serverName: "business.movit.local business.movit.ch",
            port: 80,

            proxy: [
                {
                    locationPath:' /api/',
                    host: "http://host.docker.internal",
                    path:'/api/',
                    port: 8003,
                },
            ],
            locations:[
                {
                    locationPath:'/',
                    path: "/var/www/business",
                }
            ]
        },
    ],
})

nginxBuilder.saveToFile(nginxBuilder.build())