# Simple Nginx configuration builder - NodeJS 
![Heading](https://www.f5.com/content/dam/f5-com/page-assets-en/home-en/products/nginx/2020/nginx-product-icon-open-source_1100x481.jpg)

Config:
```
new NginxBuilder({
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
                    host: "host.docker.internal",
                    path:'/api/',
                    port: 8003,
                },
                {
                    locationPath:' /api/docs/',
                    host: "host.docker.internal",
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
                    host: "host.docker.internal",
                    path:'/api/',
                    port: 8004,
                },
                {
                    locationPath:' /api/docs/',
                    host: "host.docker.internal",
                    path:'/swagger/',
                    port: 8004,
                },
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
```
Result:
```
server
{
	listen 80;
	server_name app1.domain.local app1.domain.ch;
	location /
	{
		root /var/www/app1;
		try_files $uri $uri/ /index.html?$query_string;
	}
	location /api/
	{
		proxy_pass http://host.docker.internal:8003/api/;
	}
	location /api/docs/
	{
		proxy_pass http://host.docker.internal:8003/swagger/;
	}
}

server
{
	listen 80;
	server_name app2.domain.local app2.domain.ch;
	location /
	{
		root /var/www/app2;
		try_files $uri $uri/ /index.html?$query_string;
	}
	location /api/
	{
		proxy_pass http://host.docker.internal:8004/api/;
	}
	location /api/docs/
	{
		proxy_pass http://host.docker.internal:8004/swagger/;
	}
}
```

How to use:
```
const nginxBuilder = new NginxBuilder(yourConfig);

nginxBuilder.saveToFile(nginxBuilder.build(),{
    encoding:  'utf8',
    indent: '\t',
    newLineSeparator: '\n',
    maxStatementLength: 80, // if statement is longer than that it will be splitted into multiple lines
})

```
