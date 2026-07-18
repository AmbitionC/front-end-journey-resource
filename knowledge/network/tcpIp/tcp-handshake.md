TCP 建连与关闭不是两张孤立的“背诵图”，而是一套由序列号、确认号、标志位和定时器共同驱动的状态机。排障时应从状态迁移与报文证据出发，而不是只记“三次握手、四次挥手”。

![客户端与服务端通过 SYN、ACK、FIN 在 TCP 状态机中完成建连、半关闭与最终释放](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/tcp-connection-state-handshake-close-v1.webp)
*图：上半部分同步两个方向的初始序列号，下半部分展示主动关闭方经过 FIN-WAIT 与 TIME-WAIT、被动关闭方经过 CLOSE-WAIT 与 LAST-ACK。*

---

## 三次握手在同步什么

[RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html)定义了当前 TCP 状态机、序列号空间和连接处理规则。假设客户端初始序列号为 x，服务端为 y：

1. 客户端发送 `SYN, seq=x`，从 `CLOSED` 进入 `SYN-SENT`。
2. 服务端收到后发送 `SYN, ACK, seq=y, ack=x+1`，进入 `SYN-RECEIVED`。
3. 客户端回复 `ACK, ack=y+1` 并进入 `ESTABLISHED`；服务端收到该 ACK 后也进入 `ESTABLISHED`。

SYN 本身占用一个序列号，所以确认号是 x+1 或 y+1。ACK 表示“下一个期望收到的序列号”，不是“我一共收到了多少个包”。TCP 后续按字节编号并使用累计确认，因此不能用报文个数推导 ACK。

第三次握手的价值是让服务端确认自己的 SYN 已到达客户端。如果只交换两次，服务端无法区分“客户端确认了双向参数”与“旧 SYN 触发了一个客户端并不知道的半连接”。

## 选项协商与丢包

SYN 中可以携带 MSS、窗口扩大、SACK permitted、时间戳等选项。只有握手中成功出现的选项才能用于该连接；抓包看到某端操作系统支持某能力，不代表这条连接已经协商。

握手报文也会丢失。发送方在重传计时器到期后重发 SYN 或 SYN-ACK，接收方依据五元组、状态、序列号和 flags 处理重复报文。服务端在 `SYN-RECEIVED` 中保存的条目称为半连接；backlog 耗尽时新连接可能超时或被拒绝。SYN cookies 是资源压力下的实现策略，但不改变线上的三步语义。

## 关闭为何常画成四步

TCP 是全双工字节流，两个方向可以独立关闭。主动关闭方发送 FIN 只表示“我不会再发送新字节”，仍可继续接收对方的数据，这叫 half-close。

典型流程如下：

1. A 发送 FIN，进入 `FIN-WAIT-1`。
2. B 确认 FIN，进入 `CLOSE-WAIT`；A 收到 ACK 后进入 `FIN-WAIT-2`。
3. B 的应用完成剩余发送并调用 close，B 发送 FIN，进入 `LAST-ACK`。
4. A 确认该 FIN，进入 `TIME-WAIT`；B 收到 ACK 后进入 `CLOSED`。

中间两步可以合并，例如 B 没有剩余数据时用一个 FIN+ACK 响应，因此“四次”不是固定报文数量。真正稳定的是两个方向分别发送 FIN、分别得到确认。

## TIME-WAIT 与异常终止

`TIME-WAIT` 让主动关闭方在一段时间内保留连接标识：一方面可以重发最后的 ACK，另一方面让网络中的旧重复段过期，避免污染相同四元组的新连接。大量 TIME-WAIT 不应直接通过危险内核参数“消除”，应先确认连接复用、上游 keep-alive、短连接模式和端口预算。

RST 表示连接被拒绝、状态不存在或需要异常复位。对于落在接收窗口内的可疑 RST/SYN，[RFC 5961](https://www.rfc-editor.org/rfc/rfc5961.html)引入 challenge ACK 等加固建议，降低盲注入直接终止连接的风险。RST 与 FIN 的区别是：FIN 参与有序关闭，RST 通常立即中止并丢弃未完成语义。

## 抓包排障步骤

先按五元组过滤一条连接，再依次检查：

- SYN 是否发出、重传间隔如何，SYN-ACK 是否返回；
- 相对 seq/ack 是否连续，窗口是否为零，是否出现重复 ACK 或重传；
- 应用超时发生在 DNS、TCP、TLS 还是业务响应阶段；
- 关闭方是谁，是否长期停在 `CLOSE-WAIT`（应用未 close）或 `FIN-WAIT-2`；
- 是否出现 RST，以及 RST 前最后一个合法状态和报文是什么。

握手成功只证明 TCP 控制报文往返并同步状态，不证明 TLS、鉴权或业务健康。生产监控应把 connect、TLS handshake、TTFB 和完整请求分别计时。

## 小结

三次握手同步双向序列号和选项；关闭阶段让两个方向独立发送 FIN 并确认；TIME-WAIT 与重传保证最后阶段仍可恢复。把每个报文放回 RFC 状态机，就能解释丢包、重复、半连接、half-close 与异常 RST，而无需死记固定报文张数。

## 参考资料

- [RFC 9293: Transmission Control Protocol](https://www.rfc-editor.org/rfc/rfc9293.html)
- [RFC 5961: Improving TCP Robustness to Blind In-Window Attacks](https://www.rfc-editor.org/rfc/rfc5961.html)
