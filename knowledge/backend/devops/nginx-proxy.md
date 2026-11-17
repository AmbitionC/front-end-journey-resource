![客户端→Nginx listener→location 匹配→proxy_pass→三台 upstream；显示请求头重写、缓冲区、连接超时与 round-robin/least_conn 选择，响应反向返回](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/nginx-reverse-proxy-upstream-routing-v1.webp)
*图：沿“客户端 → listener → location → proxy_pass → upstream”读取请求。location 框列出的是匹配形式，不是四项固定优先级；缓冲和超时框是配置职责示意，不表示响应必须依次经过这些处理节点。*

---

Nginx 可以作为 HTTP 服务器与反向代理，使用平台支持的事件处理机制管理连接；实际容量受连接、文件描述符、内存和后端负载影响，不能从架构名称推导固定并发数。Agent API 可用它处理 TLS 终止、路由、负载均衡和流式响应转发。[NGINX 连接处理机制](https://nginx.org/en/docs/events.html)

以需要网络的新文档请求为例，客户端先解析域名并建立或复用连接，入口再按监听地址与端口、Host 等信息选择虚拟主机，按 URI 匹配 location，由 `proxy_pass` 指向后端或 upstream 组；选中业务实例后，应用自身的路由才决定具体处理函数。DNS、缓存与客户端连接过程见[浏览器导航与渲染](../../fe/browser/browser-navigation-rendering.md)；服务端分派依据见[NGINX 请求处理说明](https://nginx.org/en/docs/http/request_processing.html)。

以下配置是教学片段，未在真实服务器部署验证；证书、模块、代理拓扑和超时须按环境核对。官方滚动文档核验于 2026-11-17，涉及默认值时明确版本边界。

## Nginx 的核心角色

| 角色 | 说明 |
|---|---|
| 反向代理（Reverse Proxy） | 接收外部请求，转发到内网服务，隐藏后端拓扑 |
| 负载均衡（Load Balancer） | 将流量分发到多个后端实例，支持多种调度策略 |
| TLS 终止（TLS Termination） | 在 Nginx 层结束客户端 TLS；回源用 HTTP 还是 HTTPS，由内部安全边界决定 |
| 静态文件服务（Static File Server） | 直接从磁盘响应静态资源，绕过应用层 |
| 流量保护 | 分别限制请求速率和连接数；上游失败转移需单独配置，不能把连接限制等同于速率限制或完整熔断 |

## 正向代理 vs 反向代理

两者最核心的区别在于"代理谁、对谁透明"：

| 维度 | 正向代理 | 反向代理 |
|---|---|---|
| 代理方向 | 代理客户端 | 代理服务端 |
| 谁配置 | 客户端（如浏览器代理设置） | 服务端管理员 |
| 对外呈现 | 目标服务通常直接看到代理连接；是否获知客户端信息取决于协议与头部策略 | 客户端通常连接公开入口；实际后端信息仍可能通过响应等暴露 |
| 典型用途 | 企业 HTTP 出口代理、访问控制 | API 网关、CDN 回源、微服务入口 |
| 典型工具 | Squid、Clash | Nginx、HAProxy、Envoy |

## 核心配置结构

下面是 HTTP 路由相关的配置层次；完整配置另有 main、events 等上下文：

```
http           ← 全局 HTTP 设置（gzip、日志格式、upstream）
└── server     ← 虚拟主机（监听端口、域名）
    └── location  ← 路径匹配规则（proxy_pass、root、return）
```

```nginx
# /etc/nginx/nginx.conf（精简版）
http {
    # 全局 upstream 定义（所有 server 共享）
    upstream agent_api {
        server 10.0.0.1:8080;
        server 10.0.0.2:8080;
        keepalive 32;
    }

    server {
        listen 443 ssl;
        http2 on; # 需 ngx_http_v2_module；此指令从 1.25.1 起可用
        server_name api.example.com;

        # SSL 证书路径
        ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

        # 路径级别的规则
        location /v1/ {
            proxy_pass http://agent_api;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
        }
    }
}
```

对这里的同层、非嵌套 location：`=` 精确命中即结束；否则记住最长匹配前缀，若该前缀带 `^~`，跳过后续正则检查；否则按配置顺序取首个命中的正则。对仅包含前缀与正则的本例，正则均不匹配时使用先前记住的最长前缀。`^~` 不是任意前缀都能胜过更长前缀的全局优先级；嵌套 location 等复杂情形需按实际配置分析。[location 规则](https://nginx.org/en/docs/http/ngx_http_core_module.html#location)

## 反向代理基础配置

`proxy_set_header` 是反向代理中最容易被忽视的关键点——不正确透传会导致后端无法获取真实客户端信息：

```nginx
location /api/ {
    proxy_pass http://agent_api;

    # 后端需要知道请求的原始 Host（影响虚拟主机路由）
    proxy_set_header Host              $host;

    # 真实客户端 IP（单层代理用此字段）
    proxy_set_header X-Real-IP         $remote_addr;

    # 多层代理时追加的 IP 链（如 CDN → Nginx → 后端）
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;

    # 告知后端原始协议是 HTTP 还是 HTTPS
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Express 默认依据直接连接地址计算 `req.ip`。需要使用代理头时，`trust proxy` 必须匹配实际可信代理和所有可达路径；`1` 只适用于已确认的一跳合同，路径长度不一致或入口未清理伪造头时会信错客户端数据。[Express 代理信任配置](https://expressjs.com/en/guide/behind-proxies/)

## HTTPS 配置

```nginx
# HTTP → HTTPS 强制跳转
server {
    listen 80;
    server_name api.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    http2 on; # 从 1.25.1 起可用，且需编译 HTTP/2 模块
    server_name api.example.com;

    ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    # 只允许 TLS 1.2 / 1.3，禁用旧版弱协议
    ssl_protocols             TLSv1.2 TLSv1.3;
    ssl_ciphers               ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Session 复用，减少握手开销
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;

    # HSTS：告知浏览器 1 年内只用 HTTPS
    add_header Strict-Transport-Security "max-age=31536000" always;

    location / {
        proxy_pass http://agent_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

Let's Encrypt 证书申请命令（Certbot）：

```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx

# 自动申请并配置（会修改 Nginx 配置）
certbot --nginx -d api.example.com

# 证书自动续期（写入 cron 或 systemd timer）
certbot renew --quiet
```

## 负载均衡

[NGINX 负载均衡文档](https://nginx.org/en/docs/http/load_balancing.html) 定义 upstream group 以及轮询、least connections、IP hash 等选择方法；算法选择不能替代上游超时与失败处理。


```nginx
upstream agent_api {
    # 默认轮询（round-robin）
    server 10.0.0.1:8080 weight=2;  # 权重高，分配更多流量
    server 10.0.0.2:8080 weight=1;
    server 10.0.0.3:8080 backup;    # 备用节点，主节点全故障时启用

    # ip_hash; # 同 IP 始终路由到同一节点
    # least_conn; # 优先路由到当前连接数最少的节点

    keepalive 32; # 每 worker 缓存的空闲上游连接上限，不是总连接数
}
```

**负载均衡策略对比**：

| 策略 | 配置指令 | 适用场景 |
|---|---|---|
| 轮询（Round Robin） | 默认，无需配置 | 无状态服务，实例性能相近 |
| 加权轮询（Weighted） | `weight=N` | 实例性能差异大时按比例分流 |
| IP Hash | `ip_hash` | 需要会话粘性（Session Sticky） |
| 最少连接（Least Conn） | `least_conn` | 长连接场景，动态均衡后端负载 |

HTTP 上游复用还要满足协议与 Connection 头条件。官方文档注明 1.29.7 起 `proxy_http_version` 默认 1.1，之前默认 1.0；这里显式设置 1.1 并清空普通 HTTP 回源的 Connection 头。`keepalive` 控制每 worker 的空闲连接缓存，不限制活动连接总数。[upstream keepalive](https://nginx.org/en/docs/http/ngx_http_upstream_module.html#keepalive)

## Agent 服务关键配置

这是 AI 工程师最需要关注的部分。LLM 推理慢、响应以流式输出，默认的 Nginx 配置会在两个地方"翻车"。

### 请求流架构

![客户端经 HTTPS 请求 /v1/chat，Nginx 终止 TLS 并将请求转给选定 Agent 实例；实例持续输出 SSE 事件，代理陆续转发，应用完成后结束本次 HTTP 响应。](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/nginx-proxy-sse-sequence-v2.png)
*图：示例为 SSE 响应。关闭响应缓冲有助降低积攒延迟，仍可能有应用、网络和客户端缓冲；本次 HTTP 响应结束不表示 TCP 连接关闭。*

### SSE (Server-Sent Events) 流式响应

SSE 可用于逐步返回模型输出。代理开启响应缓冲时可能积攒数据再发送，增加事件延迟，并不保证一定等完整响应结束才发送。此路径显式关闭响应缓冲；应用、其他代理和客户端仍须正确发送、转发和解析事件。[proxy_buffering](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_buffering)

```nginx
location /v1/chat/completions {
    proxy_pass http://agent_api;

    # ⚠️ 关键：关闭响应缓冲，chunk 实时透传
    proxy_buffering off;

    # 禁用响应缓存；与 X-Accel-Buffering 控制不是同一功能
    proxy_cache off;

    # 教学参数：相邻上游读取的空闲间隔；不是总任务时限
    proxy_read_timeout    300s;
    proxy_send_timeout    300s;
    proxy_connect_timeout 10s;
    proxy_http_version 1.1;
    proxy_set_header Connection "";

    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

上游 `X-Accel-Buffering: no` 也可控制响应缓冲；是否处理此头由 `proxy_ignore_headers` 等配置决定。`proxy_cache off` 仅关闭缓存。`proxy_read_timeout` 约束相邻上游读取的等待，`proxy_send_timeout` 约束相邻请求写入的等待；总任务 deadline 仍须由应用另行落实。[代理模块合同](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_read_timeout)

### WebSocket 升级

Agent 平台的长会话、双向通信场景（如实时工具调用反馈）通常使用 WebSocket。Nginx 默认不转发 `Upgrade` 头，需显式配置：

```nginx
location /ws/ {
    proxy_pass http://agent_api;

    # WebSocket 握手：从 HTTP/1.1 升级协议
    proxy_http_version 1.1;
    proxy_set_header Upgrade    $http_upgrade;
    proxy_set_header Connection "upgrade";

    # WebSocket 长连接，心跳间隔内不能超时
    proxy_read_timeout 3600s;  # 教学参数：上游无数据间隔，不是会话总时长

    proxy_set_header Host            $host;
    proxy_set_header X-Real-IP       $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

## CORS 与 Gzip

```nginx
# CORS（跨域资源共享）统一在 Nginx 层处理
location /api/ {
    # 允许指定来源（生产环境不要用 *）
    add_header Access-Control-Allow-Origin  "https://app.example.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

    # 预检请求直接返回 204
    if ($request_method = OPTIONS) {
        return 204;
    }

    proxy_pass http://agent_api;
}
```

```nginx
# Gzip 压缩（放在 http 块）
gzip on;
gzip_comp_level 6;
gzip_min_length 1024;
gzip_types text/plain text/css application/javascript application/json;
gzip_vary on;

# SSE 路径先保持不压缩，再实测逐事件到达延迟与各层缓冲
```

## 常见误区与最佳实践

**误区 1：忘记关闭 `proxy_buffering`，SSE 不实时**

响应缓冲可能增加事件到达延迟，不能将它等同于必须读完整响应的缓存。检查 SSE 路径的实际 buffering 设置、上游控制头及端到端事件到达时间；关闭 Nginx 缓冲不能替代应用主动输出与客户端解析。

**误区 2：`proxy_read_timeout` 太短导致 LLM 请求中断**

默认 60 秒指相邻上游读取的等待上限。持续有数据的响应可以超过这个总时长；反之首个事件迟迟未到也可能触发超时。根据允许空闲、心跳、资源占用和应用总 deadline 选择数值，不能仅按模型名称统一延长。

**误区 3：WebSocket 忘记设置 `proxy_http_version 1.1`**

本文采用 HTTP/1.1 Upgrade 隧道，须转发相应的 Upgrade/Connection 头并使用合适的回源协议。1.29.7 之前回源协议默认 1.0，此后默认 1.1，显式配置可避免依赖默认值；101 表示协议切换成功，不能把它列作失败状态。该示例不涵盖其他 HTTP 版本的 WebSocket 建连方式。[NGINX WebSocket 代理](https://nginx.org/en/docs/http/websocket.html)

**误区 4：`X-Forwarded-For` 被篡改**

客户端可以伪造 `X-Forwarded-For`。若 Nginx 是直接面对客户端的唯一入口，可覆盖该字段为连接地址；已有可信 CDN/代理时，须按已核验代理链清理和解释转发头。盲目追加会保留伪造值，盲目覆盖又可能只剩 CDN 地址；后端信任规则必须与入口策略一致。

**最佳实践**：
- SSL 证书用 Certbot 自动管理，不要手动维护有效期
- 为不同业务路径（SSE / REST / WebSocket）分别定义 `location` 块，按需配置 timeout 和 buffering
- 按版本核对 upstream 空闲连接缓存、回源协议与 Connection 头，实测连接复用
- 生产环境不要在 Nginx 层直接暴露 `server_tokens on`（默认泄露版本号），建议关闭

## 面试要点

- **正向代理与反向代理的区别**：前者代表客户端访问目标服务，后者代表服务入口选择后端；是否隐藏来源或拓扑，还取决于协议和信息暴露。
- **`X-Forwarded-For` 的作用**：记录请求经过的代理链路，后端通过此字段获取真实客户端 IP，用于日志、限流、风控。多层代理时值为逗号分隔的 IP 链。
- **为什么 SSE 常关闭响应缓冲**：减少事件被积攒后发送的延迟，并结合上游输出、其他代理与客户端作端到端验证。
- **WebSocket 握手原理**：客户端发送 `Upgrade: websocket` + `Connection: Upgrade` 头，服务端返回 `101 Switching Protocols`，之后连接升级为全双工 WebSocket 协议。Nginx 需要透传这两个头并使用 HTTP/1.1。
- **`keepalive` 在 upstream 中的意义**：缓存可复用的空闲上游连接，减少重复建连；它不是活动连接或请求总量限制，实际收益要测量。
- **`worker_processes` 怎么配置**：`auto` 可按可用处理器自动选择 worker 数；`worker_connections` 包含客户端和上游等连接，还受文件描述符限制。两者乘积不能直接当最大业务请求并发。[NGINX worker 配置](https://nginx.org/en/docs/ngx_core_module.html#worker_connections)

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [淘天 AI 应用研发实习：后端基础、Transformer 与训练](../../../interview/alibaba/ai/alibaba-ai-32.md)
<!-- interview-source-history:end -->

## 参考资料

- [NGINX HTTP proxy module](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [NGINX HTTP load balancing](https://nginx.org/en/docs/http/load_balancing.html)
- [NGINX 请求处理与虚拟主机选择](https://nginx.org/en/docs/http/request_processing.html)
- [NGINX location 匹配规则](https://nginx.org/en/docs/http/ngx_http_core_module.html#location)
- [NGINX WebSocket 代理](https://nginx.org/en/docs/http/websocket.html)
- [NGINX upstream keepalive](https://nginx.org/en/docs/http/ngx_http_upstream_module.html#keepalive)
- [NGINX worker 与连接资源限制](https://nginx.org/en/docs/ngx_core_module.html#worker_connections)
- [NGINX HTTP/2 模块与 http2 指令](https://nginx.org/en/docs/http/ngx_http_v2_module.html#http2)
- [NGINX 连接处理机制](https://nginx.org/en/docs/events.html)
- [Express：可信代理与转发头](https://expressjs.com/en/guide/behind-proxies/)
