![请求与响应报文并排：request/status line、field section、空行、content；再分离 message semantics 与 HTTP/1.1 framing，标出 Content-Length/Transfer-Encoding 冲突会导致解析差异](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/http-message-semantics-framing-v1.webp)
*图：请求与响应都按 start-line → field section → 空行 → content 读取；右侧把 HTTP 语义与 HTTP/1.1 framing 分开，并标出长度字段冲突。*

---

#### <font style="color:rgb(33, 37, 41);">HTTP报文定义</font>
<font style="color:rgb(33, 37, 41);">HTTP报文是在HTTP应用程序直接发送的</font><font style="color:#D46B08;">数据块</font><font style="color:rgb(33, 37, 41);">。这些数据块以一些文本形式的元信息（meta-information）开头。这些信息</font>**<font style="color:rgb(33, 37, 41);">描述了报文的内容及含义，后面跟着可选的数据部分</font>**<font style="color:rgb(33, 37, 41);">。这些报文在客户端、服务器和代理直接流动。</font>



#### 报文的组成
<font style="color:rgb(33, 37, 41);">HTTP报文是简单的</font><font style="color:#D46B08;">格式化的数据块</font><font style="color:rgb(33, 37, 41);">。每条报文都包含一条来自客户端的请求，或者一条来自服务端的响应。他们由三个部分组成：对报文进行描述的</font>**<font style="color:rgb(33, 37, 41);">起始行</font>**<font style="color:rgb(33, 37, 41);">（Start Line），包含属性的</font>**<font style="color:rgb(33, 37, 41);">首部块</font>**<font style="color:rgb(33, 37, 41);">（Header），以及可选的、包含数据的</font>**<font style="color:rgb(33, 37, 41);">主体</font>**<font style="color:rgb(33, 37, 41);">（Body）部分。</font>


<font style="color:#8C8C8C;">报文的组成示意图</font>



#### 报文的结构
<font style="color:rgb(33, 37, 41);">起始行（Start Line）和首部（Header）是由行分隔符的</font>**<font style="color:rgb(33, 37, 41);">ASCII文本</font>**<font style="color:rgb(33, 37, 41);">，每行都以一个由两个字符组成的行终止序列作为结束，其中包含一个回车符（ASCII码13）和一个换行符（ASCII码10）。</font>

<font style="color:rgb(33, 37, 41);">实体的主体或报文的主体是一个</font>**<font style="color:rgb(33, 37, 41);">可选的数据块</font>**<font style="color:rgb(33, 37, 41);">。与起始行和首部不同的是主体可以包含文本或二进制数据，也可以为空。</font><font style="color:rgb(33, 37, 41);">  
</font>

#### <font style="color:rgb(33, 37, 41);">报文的语法</font>
<font style="color:rgb(33, 37, 41);">所有的HTTP报文都可以分为两类：</font><font style="color:#D46B08;">请求报文</font><font style="color:rgb(33, 37, 41);">（Request Message）和</font><font style="color:#D46B08;">响应报文</font><font style="color:rgb(33, 37, 41);">（Response Message）。请求报文会向Web服务器请求一个动作。响应报文会将请求的结果返回给客户端。请求和响应报文的基本报文机构相同。</font>


<font style="color:#8C8C8C;">请求报文和响应报文的示意图</font>

<font style="color:rgb(33, 37, 41);"></font>

#### <font style="color:rgb(33, 37, 41);">起始行（Start Line）</font>
<font style="color:rgb(33, 37, 41);">所有的HTTP报文都以一个起始行作为开始。请求报文的其实行说明了</font>**<font style="color:rgb(33, 37, 41);">要做些什么</font>**<font style="color:rgb(33, 37, 41);">。响应报文的起始行说明了</font>**<font style="color:rgb(33, 37, 41);">发生什么</font>**<font style="color:rgb(33, 37, 41);">。</font>

+ **<font style="color:rgb(33, 37, 41);">请求行</font>**<font style="color:rgb(33, 37, 41);">：请求报文请求服务器对资源进行一些操作。请求报文的起始行，包含了一个方法和一个请求的URL，这个方法描述了服务器应该执行的操作，请求URL描述了要对哪个资源执行这个方法。请求行中还包含了HTTP的版本，用来告知服务器，客户端使用的是哪种HTTP。</font>
+ **<font style="color:rgb(33, 37, 41);">响应行</font>**<font style="color:rgb(33, 37, 41);">：响应报文承载了状态信息和操作产生的所有结果数据，将其返回给客户端。响应报文的起始行，或称为响应行，包含了响应报文使用的</font>**<font style="color:rgb(33, 37, 41);">HTTP版本、状态码</font>**<font style="color:rgb(33, 37, 41);">，以及描述操作状态的文本形式的原因短语。</font>

**<font style="color:rgb(33, 37, 41);"></font>**

#### <font style="color:rgb(33, 37, 41);">方法（Method）</font>
<font style="color:rgb(33, 37, 41);">请求的起始行以方法作为开始，方法用来告知服务器需要做些什么。</font>


<font style="color:#8C8C8C;">请求方法列表</font>

**<font style="color:rgb(33, 37, 41);"></font>**

#### <font style="color:rgb(33, 37, 41);">状态码（Status Code）</font>
<font style="color:rgb(33, 37, 41);">这三位数字描述了请求过程中所发生的情况。每个状态码的第一位数字都用于描述状态的一般类别。</font>下表列举了一些常见的 HTTP 请求状态码及其描述：

| 状态码 | 类别 | 描述 |
| :---: | :---: | --- |
| 200 | 成功 | OK。请求已成功处理，服务器返回了请求的资源或数据。 |
| 301 | 重定向 | Moved Permanently。请求的资源已被永久移动到新的URL。 |
| 302 | 重定向 | 请求的资源临时移动到另一个URL，客户端应使用GET方法获取资源。 |
| 304 | 重定向 | Not Modified。资源未修改，客户端可以使用缓存的版本。 |
| 400 | 客户端错误 | Bad Request。服务器无法理解请求，可能是因为请求格式错误。 |
| 401 | 客户端错误 | Unauthorized。请求需要用户验证。 |
| 403 | 客户端错误 | Forbidden。服务器理解请求但拒绝执行。 |
| 404 | 客户端错误 | Not Found。请求的资源在服务器上未找到。 |
| 500 | 服务器错误 | Internal Server Error。服务器内部错误，无法完成请求。 |
| 502 | 服务器错误 | Bad Gateway。服务器作为网关或代理，从上游服务器收到无效响应。 |
| 503 | 服务器错误 | Service Unavailable。服务器目前不可用（由于超载或维护）。 |
| 504 | 服务器错误 | Gateway Timeout。服务器作为网关或代理，未从上游服务器接收请求。 |


<font style="color:#8C8C8C;">状态码列表</font>

## 语义与报文定界是两层问题

[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html) 定义方法、状态、字段与内容的语义；同一语义可以映射到不同 HTTP 版本的线格式。

[RFC 9112](https://www.rfc-editor.org/rfc/rfc9112.html) 专门规定 HTTP/1.1 报文语法、连接管理和 framing；`Content-Length` 与 `Transfer-Encoding` 的冲突会造成解析差异，必须按规范拒绝或处理。

## 参考资料

- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
- [RFC 9112: HTTP/1.1](https://www.rfc-editor.org/rfc/rfc9112.html)
