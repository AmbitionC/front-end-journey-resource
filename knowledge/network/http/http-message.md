![请求和响应报文并排：都由起始行、字段区、一个空行和可选内容组成，请求例子是 POST /orders 带 13 字节 JSON，响应例子是 201 Created 带 16 字节 JSON；下方把 RFC 9110 的语义层和 RFC 9112 的 HTTP/1.1 定界层分开，并标出同时带 Content-Length 和 Transfer-Encoding 会让前后节点切出不同边界，需要拒绝或规范化](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/http-message-semantics-framing-v2.dark.png)
*图：上半部分按 起始行 → 字段区 → 空行 → 内容 读报文；下半部分把 HTTP 语义与 HTTP/1.1 定界分开，并标出两个长度字段同时出现的后果。*

HTTP 报文承载一次请求或响应的控制数据、字段和可选内容。理解报文时要分开两层：方法、状态码、字段和内容属于 HTTP 语义；字节如何分行、定界和传输则由具体 HTTP 版本规定。

## HTTP/1.1 报文结构

[RFC 9112](https://www.rfc-editor.org/rfc/rfc9112.html) 将 HTTP/1.1 报文写成 `start-line`、零个或多个 `field-line`、一个空行，以及可选 `message-body`。发送方用 `CRLF` 结束起始行和字段行；接收方应先把报文当作字节序列解析，不能一开始就按任意 Unicode 字符串处理。

```http
POST /orders?dry_run=true HTTP/1.1
Host: api.example.com
Content-Type: application/json
Content-Length: 13

{"sku":"A-1"}
```

请求行是 `method SP request-target SP HTTP-version`。其中 `request-target` 不是笼统的“完整 URL”，而是以下四种形式之一：

- `origin-form`：直接访问源站时最常见，如 `/orders?dry_run=true`；
- `absolute-form`：向代理发送请求时使用完整 URI；
- `authority-form`：只用于 `CONNECT`，如 `example.com:443`；
- `asterisk-form`：用于面向整个服务器的 `OPTIONS *`。

HTTP/1.1 不允许 `request-target` 包含空白字符；收到畸形请求行时也不应静默“修正后继续执行”，否则不同节点的解析差异可能绕过安全检查。

响应的起始行是 `HTTP-version SP status-code SP [reason-phrase]`。原因短语只用于描述，客户端应依据三位状态码处理响应。

## 字段名与字段值的字符边界

[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html) 规定字段名是大小写不敏感的 `token`；HTTP/1.1 的字段行形如 `field-name ":" OWS field-value OWS`，字段名与冒号之间不允许空白。

字段值由各字段自己的语法进一步约束。通用语法允许可见字符、内部的空格或水平制表符，并为历史兼容保留 `obs-text`；新字段通常应限制为可见 US-ASCII、空格和水平制表符。前导/尾随空白不属于解析后的字段值，`CR`、`LF` 或 `NUL` 出现在字段值中则是无效且危险的。这里不能简化成“所有首部都是 ASCII 文本”，更不能在协议解析前任意解码。

## 常见状态码的准确边界

状态码第一位表示大类，但具体处理必须看该状态码的语义：

| 状态码 | 类别 | 描述 |
| :---: | :---: | --- |
| 200 | 成功 | OK。请求已成功处理，服务器返回了请求的资源或数据。 |
| 301 | 重定向 | Moved Permanently。请求的资源已被永久移动到新的URL。 |
| 302 | 重定向 | Found。目标资源暂时位于 `Location` 指向的另一个 URI；出于历史兼容，用户代理在后续请求中**可以**把 POST 改成 GET，但这不是强制行为。若必须保留方法，应考虑 307。 |
| 304 | 重定向 | Not Modified。资源未修改，客户端可以使用缓存的版本。 |
| 400 | 客户端错误 | Bad Request。服务器无法理解请求，可能是因为请求格式错误。 |
| 401 | 客户端错误 | Unauthorized。请求需要用户验证。 |
| 403 | 客户端错误 | Forbidden。服务器理解请求但拒绝执行。 |
| 404 | 客户端错误 | Not Found。请求的资源在服务器上未找到。 |
| 500 | 服务器错误 | Internal Server Error。服务器内部错误，无法完成请求。 |
| 502 | 服务器错误 | Bad Gateway。服务器作为网关或代理，从上游服务器收到无效响应。 |
| 503 | 服务器错误 | Service Unavailable。服务器目前不可用（由于超载或维护）。 |
| 504 | 服务器错误 | Gateway Timeout。服务器作为网关或代理时，未能及时从完成该请求所需访问的上游服务器收到响应。 |

## 语义与报文定界是两层问题

[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html) 定义方法、状态、字段与内容的语义；同一语义可以映射到不同 HTTP 版本的线格式。例如，302 只允许而不强制 POST 改为 GET，504 描述的也是等待上游响应超时，而不是“没有收到上游请求”。

[RFC 9112](https://www.rfc-editor.org/rfc/rfc9112.html) 专门规定 HTTP/1.1 报文语法、连接管理和 framing；`Content-Length` 与 `Transfer-Encoding` 的冲突会造成解析差异，必须按规范拒绝或处理。

## 从 HTTP/1.0 比较到 HTTP/2

比较时先固定起点：原题若问 HTTP/1.0，就不能只背 HTTP/1.1 与 HTTP/2 的差别。[RFC 1945 §1.3](https://www.rfc-editor.org/rfc/rfc1945.html#section-1.3)记录的 HTTP/1.0 常见行为是每次请求前建连接、响应后关闭，报文以文本起始行和字段表达；这不意味着所有历史实现都没有连接复用扩展。HTTP/1.1 的持久连接演进又是另一层比较，不能把它的默认行为倒算给 1.0。

HTTP/2 保留 HTTP 的方法、状态等语义，改用二进制帧，把不同请求与响应放到可在同一连接上交错的 stream，并用 HPACK 压缩字段。[RFC 9113 §4–5、§8.2](https://www.rfc-editor.org/rfc/rfc9113.html#section-4)分别规定分帧、多路复用和字段编码；HPACK 不是把所有响应内容统一压缩。它减少应用层串行等待与重复字段开销，但下层 TCP 的丢失恢复仍可能阻塞该连接上的数据交付，不能说“升级到 HTTP/2 就没有队头阻塞”，也不能承诺每个请求必然更快。

## HTTP/2 与 HTTP/3：应用语义延续，传输边界不同

[RFC 9113](https://www.rfc-editor.org/rfc/rfc9113)定义 HTTP/2 的二进制分帧与多路复用：多条 stream 可以共用一个 TCP 连接，流控和头部压缩按协议处理。TCP 向上提供有序字节流，一段丢失仍可能让该连接后续数据等待；应用 stream 多路复用不消除所有传输队头阻塞。

[RFC 9114](https://www.rfc-editor.org/rfc/rfc9114)将 HTTP/3 映射到 QUIC。[RFC 9000](https://www.rfc-editor.org/rfc/rfc9000)中 QUIC 基于 UDP 实现可靠传输、独立流与连接管理；HTTP/3 并非“UDP 所以不可靠”。单条流丢失不必阻塞另一条独立流按序交付，但共享拥塞控制、应用依赖与压缩依赖仍可造成等待。HTTP 方法、状态码等语义不因换传输就全部改变。

实际协议由客户端、服务端和中间网络共同协商，不能看到 HTTPS 就判定 HTTP/2 或 HTTP/3。排查时分别记录协议、连接复用、丢包与响应依赖，避免用总耗时推断某版本必然更快。

## 练一练

### 高频考点题 1：报文结构

HTTP/1.1 报文中，头部字段和消息内容之间用什么分隔？

- A. 一个空行
- B. 一个分号
- C. 一个逗号
- D. 不需要分隔

**答案：A。** 报文依次是起始行、零个或多个字段行、一个空行和可选的内容。

### 高频考点题 2：字段名大小写

HTTP 字段名 Content-Type 和 content-type 是否等价？

- A. 等价，字段名大小写不敏感
- B. 不等价，必须严格匹配
- C. 只在 HTTP/2 中等价
- D. 只在请求中等价

**答案：A。** 字段名是大小写不敏感的 token；HTTP/2 和 HTTP/3 还要求以小写形式传输。

### 高频考点题 3：原因短语

响应行 HTTP/1.1 200 Something 里，客户端应该依据什么判断结果？

- A. 原因短语 Something
- B. 响应体的长度
- C. HTTP 版本号
- D. 三位状态码 200

**答案：D。** 原因短语只用于描述，可以为空；处理逻辑看状态码语义。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节全栈一二面：调度器、流式恢复与浏览器网络](../../../interview/bytedance/base/bytedance-base-53.md)
- [字节 Agent 实习：模型选择与可信通信](../../../interview/bytedance/base/bytedance-base-54.md)
- [阿里 Java 研发一面：Agent 协作、Kafka 与 Redis](../../../interview/alibaba/ai/alibaba-ai-33.md)
- [OPPO AI 全栈一面：Prompt 到 UI、RAG 与前端性能](../../../interview/oppo/ai/oppo-ai-2.md)
- [字节全栈实习：Session、权限与前端基础](../../../interview/bytedance/base/bytedance-base-46.md)
- [字节全栈与测试：JVM、并发与 SQL 排查](../../../interview/bytedance/base/bytedance-base-56.md)
- [蚂蚁暑期面经：线程池、数据来源与多 Agent 评测](../../../interview/antfin/ai/antfin-ai-14.md)
- [字节 Agent 实习：缓存一致性、定时任务与后端基础](../../../interview/bytedance/base/bytedance-base-47.md)
<!-- interview-source-history:end -->

## 参考资料

- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
- [RFC 9112: HTTP/1.1](https://www.rfc-editor.org/rfc/rfc9112.html)

- [RFC 1945：HTTP/1.0 的报文与连接行为](https://www.rfc-editor.org/rfc/rfc1945.html)
- [RFC 9113：HTTP/2 分帧、stream 与 HPACK](https://www.rfc-editor.org/rfc/rfc9113.html)
