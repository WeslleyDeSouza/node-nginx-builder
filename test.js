const path = require('path')
const { NginxBuilder } = require( "./dist/index" );

const nginxBuilder = new NginxBuilder({
    outputPath: path.resolve(__dirname, "config"),
    fileName: "docker.webserver.conf",
    apps: [
        {
            name: "app1",
            serverName: "app1.domain.local app1.domain.ch",
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
                    path: "/var/www/app1",
                }
            ]
        },
        {
            name: "app2",
            serverName: "app2.domain.local app2.domain.ch",
            port: 80,
            proxy: [
                {
                    locationPath:' /api/',
                    host: "http://host.docker.internal",
                    path:'/api/',
                    port: 8004,
                },
                {
                    locationPath:' /api/docs/',
                    host: "http://host.docker.internal",
                    path:'/swagger/',
                    port: 8004,
                },
                {
                    locationPath:' /api/file/image/',
                    host: "http://host.docker.internal",
                    path:'/api/upload/',
                    port: 8005,
                }
            ],
            locations:[
                {
                    locationPath:'/',
                    path: "/var/www/app2",
                }
            ]
        },
    ],
})

nginxBuilder.saveToFile(nginxBuilder.build())