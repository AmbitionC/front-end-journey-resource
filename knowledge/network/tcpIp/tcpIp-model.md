TCP/IP 模型的价值不是背四层或七层名称，而是沿一次真实通信追踪：应用产生哪些字节，传输层怎样标识端点与可靠性，IP 怎样跨网络路由，链路层怎样把下一跳装进帧。名称、地址、端口、路由和 MAC 各自回答不同问题。

![应用数据在 TCP/IP 各层封装，经 DNS、路由、链路、NAT 与远端解封装的端到端路径](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/tcpip-model-encapsulation-path-v1.webp)
*图：每一跳链路帧会变化，IP 端点通常保持，TCP 连接用地址与端口标识；中间设备可能执行 NAT。*

## 模型是职责边界

[RFC 1122](https://www.rfc-editor.org/rfc/rfc1122.html)描述 Internet 主机需求，常用 TCP/IP 分为 link、internet、transport、application。OSI 七层适合讨论功能，但互联网实现不总按七个独立模块落地。排障应看实际协议和路径，不为“属于第几层”争论。

应用层包括 HTTP、DNS、TLS 等协议；传输层常见 TCP/UDP/QUIC；Internet 层为 IP 与控制协议；link 层负责当前链路的帧与介质。TLS 常在应用与传输之间提供安全，但这不要求创造一个固定新层。

## 名称、地址与端口

域名是人和服务使用的名称，经 DNS 解析为一个或多个 IP。IP 地址用于路由到网络接口/主机，端口在主机内选择 socket/服务。URL 还包含 scheme、path 和 authority，不能把域名等同服务器。

一条 TCP 连接通常由协议与源/目的 IP、源/目的端口标识。客户端源端口临时分配；服务器可以同一 443 接收大量连接。虚拟主机和 TLS SNI 让同一 IP:port 服务多个域名。

## Encapsulation

应用写入字节；TCP 切分成 segments 并加源/目的端口、序号与 flags；IP 加源/目的地址等 header；链路层加下一跳帧头与校验。接收端逐层验证和解封装，把字节交给正确进程。

封装有开销，MTU 限制单个链路包大小。应用 payload 加 TCP/IP/TLS header 可能超过路径 MTU。IPv6 源端负责合适分片/PMTUD，中间路由器不进行 IPv4 式分片；屏蔽必要 ICMP 会造成“能连接但大包卡住”。

## IP：尽力而为的数据报

[IPv6 Specification RFC 8200](https://www.rfc-editor.org/rfc/rfc8200.html)定义 IPv6 数据报与扩展头。IP 负责根据路由表逐跳转发，不承诺到达、顺序或不重复。TTL/Hop Limit 每跳减少，防止路由环无限循环。

主机判断目的是否在本地前缀；本地则解析邻居链路地址，远端则把帧交默认网关。路由器查看目的 IP 选择下一跳。每一跳 MAC/frame 都会更换，源/目的 IP 通常端到端保持，除非 NAT/隧道等改写。

## TCP：可靠有序字节流

[TCP RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html)定义连接、序号、确认、重传和状态。TCP 提供有序 byte stream，不保留应用消息边界：一次 `write` 不等于对端一次 `read`。应用协议必须用 length、delimiter 或自描述 framing。

三次握手同步连接状态；序号/ACK 检测丢失与重传；flow control 保护接收方缓冲；congestion control 保护网络。可靠不等于请求只处理一次：客户端超时重发 HTTP 请求时，服务端可能已经执行，业务仍需 idempotency key。

TCP 关闭是双向的，FIN 表示一方向不再发送；RST 表示异常重置。TIME_WAIT 保护旧 segment 与关闭握手。大量短连接应使用连接复用/池，但池会受到 DNS 更新、证书和负载均衡连接固定的影响。

## UDP 与 QUIC

UDP 提供 datagram、端口和校验，通常不提供重传、顺序与拥塞控制，应用若需要需自行实现。DNS 常用 UDP 但可回退 TCP；实时媒体可能接受部分丢失换低延迟。

QUIC 在 UDP 之上实现加密、可靠 stream 与拥塞控制，多个 stream 避免 TCP 连接级队头阻塞。它仍受 IP、路径 MTU、NAT 和防火墙影响，不能简单叫“无连接 UDP 所以更快”。

## NAT、代理与负载均衡

NAT 改写地址/端口并维护映射，私网客户端共享公网地址；映射有超时，长空闲连接需 keepalive。反向代理终止客户端连接，再建立到上游的新连接，因此服务端看到的 peer 可能是代理，原始地址通过受信 header 传递。

L4 负载均衡按连接信息，L7 理解 HTTP 等应用协议。连接级均衡意味着一个长连接不会因每条请求重新分配。排障时画出每一段连接、TLS 在哪终止、DNS 返回什么和健康检查看到什么。

## 从一次 HTTPS 请求排障

顺序检查：DNS 是否解析正确且缓存未过期；本机是否有路由；ARP/NDP 是否得到下一跳；TCP/QUIC 是否握手；TLS 证书、SNI 和时间是否正确；HTTP status/body；应用下游。使用 `dig`、`ip route`/`route`、`traceroute`、`ss`/`netstat`、`curl -v` 和 packet capture，各自验证一个边界。

“ping 通”只说明某类 ICMP 路径，并不保证 TCP 443、TLS 或应用健康；反过来禁 ping 也不代表服务故障。抓包内容可能敏感，生产使用最小过滤和受控保存。

## 参考资料

- [RFC 1122：Requirements for Internet Hosts](https://www.rfc-editor.org/rfc/rfc1122.html)
- [RFC 8200：Internet Protocol, Version 6](https://www.rfc-editor.org/rfc/rfc8200.html)
- [RFC 9293：Transmission Control Protocol](https://www.rfc-editor.org/rfc/rfc9293.html)
