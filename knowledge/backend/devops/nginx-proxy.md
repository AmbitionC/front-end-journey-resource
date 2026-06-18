Nginx 是高性能的 HTTP 服务器和反向代理，以事件驱动、异步非阻塞架构著称，是现代 Web 架构中不可缺少的流量入口。

## 反向代理

反向代理站在服务端一侧，代替后端服务接受客户端请求，再转发给内网服务。客户端看到的始终是代理地址，后端服务对外不可见。

**基本反向代理配置**：

```nginx
# /etc/nginx/conf.d/api.conf

server {
    listen 80;
    server_name api.example.com;

    # 将所有请求转发到 Node.js 应用
    location / {
        proxy_pass http://127.0.0.1:3000;

        # 关键头：传递真实客户端信息
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置（视业务调整）
        proxy_connect_timeout 5s;
        proxy_read_timeout    60s;
        proxy_send_timeout    60s;
    }
}
```

Node.js 应用中读取真实 IP：

```ts
// trust proxy 告知 Express 信任 X-Forwarded-For
app.set('trust proxy', 1);

app.use((req, _res, next) => {
  const realIp = req.ip; // 已是客户端真实 IP
  next();
});
```

## HTTPS 配置（Let's Encrypt）

```nginx
server {
    listen 80;
    server_name api.example.com;
    # HTTP 强制重定向到 HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    # 现代 SSL 配置
    ssl_protocols             TLSv1.2 TLSv1.3;
    ssl_ciphers               ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache         shared:SSL:10m;
    ssl_session_timeout       1d;

    # HSTS（告知浏览器后续 1 年只用 HTTPS）
    add_header Strict-Transport-Security "max-age=31536000" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

## 负载均衡

```nginx
# 定义后端集群
upstream api_cluster {
    # 默认轮询（round-robin）
    server 10.0.0.1:3000 weight=2;  # 权重高，分配更多流量
    server 10.0.0.2:3000 weight=1;
    server 10.0.0.3:3000 backup;    # 备用节点，其他节点全故障时启用

    # ip_hash：同一 IP 始终路由到同一节点（适合需要会话粘性的场景）
    # ip_hash;

    # least_conn：优先路由到连接数最少的节点
    # least_conn;

    keepalive 32;  # 保持长连接池，减少 TCP 握手开销
}

server {
    listen 443 ssl http2;
    server_name api.example.com;
    # ... ssl 配置 ...

    location / {
        proxy_pass http://api_cluster;
        proxy_http_version 1.1;
        proxy_set_header Connection "";  # 配合 keepalive 使用
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**负载均衡算法对比**：

| 算法 | 配置 | 特点 |
|---|---|---|
| 轮询（Round Robin） | 默认 | 简单均匀，适合无状态服务 |
| 加权轮询 | `weight=N` | 按性能分配流量 |
| IP Hash | `ip_hash` | 会话粘性，同 IP 固定后端 |
| 最少连接 | `least_conn` | 动态负载均衡，适合长连接 |

## 静态资源托管与缓存

```nginx
server {
    listen 443 ssl http2;
    server_name www.example.com;

    root /var/www/dist;
    index index.html;

    # 静态资源强缓存（哈希文件名，不变则永久缓存）
    location ~* \.(js|css|png|jpg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML 文件不缓存（每次检查更新）
    location ~* \.html$ {
        add_header Cache-Control "no-cache";
    }

    # SPA 路由：所有路径都返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 转发
    location /api/ {
        proxy_pass http://api_cluster/;
    }
}
```

## Gzip 压缩

```nginx
# nginx.conf 的 http 块内
gzip on;
gzip_comp_level 6;
gzip_min_length 1024;
gzip_types
    text/plain
    text/css
    text/javascript
    application/javascript
    application/json
    image/svg+xml;
gzip_vary on;
```

## 限流防刷

```nginx
# 定义限流区域（共享内存 10m，每 IP 每秒 10 请求）
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    # burst=20：允许短时突发 20 个请求
    # nodelay：突发请求立即处理而非延迟排队
    proxy_pass http://api_cluster;
}
```

## 面试常问

- **正向代理与反向代理的区别**：正向代理代理的是客户端（如 VPN、科学上网），服务端不知道真实客户端；反向代理代理的是服务端，客户端不知道真实后端。
- **为什么要透传 `X-Forwarded-For`**：后端需要知道真实客户端 IP 用于日志、限流、风控；不透传则后端只能看到代理 IP。
- **Nginx worker 进程数怎么配置**：`worker_processes auto` 让 Nginx 自动匹配 CPU 核数；`worker_connections` 控制每个 worker 的最大连接数，总并发 = worker_processes × worker_connections。
- **upstream keepalive 的作用**：Nginx 与后端服务保持长连接池，避免每次请求都三次握手，显著降低延时和 CPU 消耗。
