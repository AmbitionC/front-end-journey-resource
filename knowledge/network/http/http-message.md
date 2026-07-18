![请求与响应报文并排：request/status line、field section、空行、content；再分离 message semantics 与 HTTP/1.1 framing，标出 Content-Length/Transfer-Encoding 冲突会导致解析差异](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/http-message-semantics-framing-v1.webp)
*图：请求与响应都按 start-line → field section → 空行 → content 读取；右侧把 HTTP 语义与 HTTP/1.1 framing 分开，并标出长度字段冲突。*

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

## 参考资料

- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
- [RFC 9112: HTTP/1.1](https://www.rfc-editor.org/rfc/rfc9112.html)
