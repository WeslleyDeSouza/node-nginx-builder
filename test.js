const path = require('path')
const { NginxBuilder } = require( "./dist/index" );

const nginxBuilder = new NginxBuilder({
    outputPath: path.resolve(__dirname, "config"),
    fileName: "docker.webserver.conf",
    apps: [
        {
            name: "myapp",
            serverName: "myapp.domain.local myapp.domain.ch",
            port: 80,
            proxy: [
                {
                    locationPath:' /api/',
                    host: "http://host.docker.internal",
                    path:'/api/',
                    port: 8003,
                },
                {
                    locationPath:' /api/docs/',
                    host: "http://host.docker.internal",
                    path:'/swagger/',
                    port: 8003,
                },
            ],
            locations:[
                {
                    locationPath:'/',
                    path: "/var/www/myapp",
                }
            ]
        },
    ],
})

nginxBuilder.saveToFile(nginxBuilder.build())