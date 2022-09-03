# node-nginx-builder

Config:
```
new NginxBuilder({
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
```
Result:
```
server{
    listen 80;
    server_name myapp.domain.local myapp.domain.ch;
    
    location / {
        root /var/www/myapp;
        try_files $uri $uri/ /index.html?$query_string;
    }
    location  /api/ {
        proxy_pass http://http://host.docker.internal:8003/api/;
    }
    location  /api/docs/ {
        proxy_pass http://http://host.docker.internal:8003/swagger/;
    }
}
```