#### <font style="color:rgb(33, 37, 41);">请求首部字段</font>
<font style="color:rgb(33, 37, 41);">请求首部字段可以分为：</font>**<font style="color:#D46B08;">请求信息性首部字段、Accept首部字段、条件请求首部字段、安全请求首部字段、代理请求首部字段</font>**<font style="color:rgb(33, 37, 41);">。</font>

<font style="color:#8C8C8C;">请求信息性首部字段及作用表</font>

| **字段** | **作用** |
| :---: | --- |
| From | <font style="color:rgb(33, 37, 41);">请求来自何方，格式是客户端用户的有效电子邮件地址</font> |
| Host | <font style="color:rgb(33, 37, 41);">服务器的主机名和端口号</font> |
| Referer | <font style="color:rgb(33, 37, 41);">这次请求的URL是从哪里获得的</font> |
| User-Agent | <font style="color:rgb(33, 37, 41);">客户端的浏览器或代理信息</font> |


<font style="color:#8C8C8C;">Accept首部字段及作用表</font>

| **字段** | **作用** |
| :---: | --- |
| Accept | <font style="color:rgb(33, 37, 41);">客户端通过该首部字段告诉服务器自己可以接收哪些媒体类型，如</font>text/html、image/*、*/*<font style="color:rgb(33, 37, 41);">。此外，还有可以权重系数（q值）来表示媒体类型的优先级</font> |
| Accept-Charset | <font style="color:rgb(33, 37, 41);">客户端可以接收哪些字符集</font> |
| Accept-Encoding | <font style="color:rgb(33, 37, 41);">客户端支持的内容编码及内容编码的优先级顺序</font> |
| Accept-Language | <font style="color:rgb(33, 37, 41);">客户端能够处理的自然语言集（中文、英文等）</font> |
| TE | <font style="color:rgb(33, 37, 41);">客户端能够处理的传输编码，还可以指定伴随trailer字段的分块传输编码方式</font> |


<font style="color:#8C8C8C;">条件请求首部字段及作用表</font>

| **字段** | **作用** |
| :---: | --- |
| Expect | 客户端通过该首部字段告知服务器它们需求某种行为，现在该首部与响应码100 Continue紧密相关。如果服务器无法理解该首部的值，就应该返回417 Expectation Failed |
| If-Match | 服务器会比对该字段的值和资源的ETag值，仅当两者一致时，才会执行请求，否则，返回412 Precondition Failed。该字段值为*时，会忽略ETag值 |
| If-Modified-Since | 该字段值应该是一个日期，如果服务器上资源的更新时间较该字段值新则处理该请求，否则，返回304 Not Modified |
| If-None-Match  | 与If-Match相反，该字段的值与请求资源的ETag不一致时，处理该请求 |
| If-Range  | 该字段的值（ETag或时间）与资源的ETag或时间一致时，作为范围请求处理（参加首部字段Range）。否则，返回全体资源 |
| If-Unmodified-Since | 与If-Modified-Since相反，服务器上资源的更新时间早于该字段值时处理请求，否则，返回412 Precondition Failed |
| Range | 范围请求，只获取部分资源。如Range: bytes=5001-10000，表示获取从第5001字节至10000字节的资源。成功处理范围请求时返回206 Partial Content响应，无法处理范围请求时返回200 OK响应及全部资源 |


<font style="color:#8C8C8C;">安全请求首部字段及作用表</font>

| **字段** | **作用** |
| :---: | --- |
| Authorization | 向服务器回应自己的身份验证信息。客户端收到来自服务器的401 Authentication Required响应后，要在其请求中包含这个首部 |
| Cookie | HTTP/1.1中没有定义，用于客户端识别和跟踪的扩展首部 |


<font style="color:#8C8C8C;">代理请求首部字段及作用表</font>

| **字段** | **作用** |
| :---: | --- |
| Max-Forwards | 只能和TRACE方法一起使用，指定经过代理或其他中间节点的最大数目。每个收到带此首部的TRACE请求的应用程序，在请求转发之前都要将这个值减1；如果应用程序收到请求时，该首部值为0，则立即回应一条200 OK响应 |
| Proxy-Authorization | 与Authorization类似，用于客户端与代理服务器之间的身份验证 |




#### <font style="color:rgb(33, 37, 41);">响应首部字段</font>
<font style="color:rgb(33, 37, 41);">响应首部字段可以分为：</font>**<font style="color:#D46B08;">响应信息性首部字段、协商首部字段、安全响应首部字段</font>**<font style="color:rgb(33, 37, 41);">。</font>

<font style="color:#8C8C8C;">响应信息性首部字段及作用表</font>

| **字段** | **作用** |
| :---: | --- |
| Age | 响应已经产生了多长时间。HTTP/1.1规定缓存服务器在创建响应时必须包含Age首部 |
| Location | 客户端应重定向到指定URI，基本配合3**响应出现 |
| Retry-After  | 告诉客户端多久之后再次发送请求。主要配合503 Service Unavailable使用，或与3**响应一起使用 |
| Server | HTTP服务器的应用程序信息 |


<font style="color:#8C8C8C;">协商首部字段及作用表</font>

| **字段** | **作用** |
| :---: | --- |
| Accept-Ranges  | 服务器是否能处理范围请求，bytes表示能，none表示不能 |
| Vary | + 通知客户端，服务器端的协商中会使用哪些来自客户端请求的首部<br/>+ 缓存控制：对某次请求，响应报文的Vary中会指定一些首部名称，客户端后续请求相同资源时，这些首部与缓存的那次请求完全一致时才会返回缓存的资源 |


<font style="color:#8C8C8C;">安全响应首部字段及作用表</font>

| **字段** | **作用** |
| :---: | --- |
| Proxy-Authorizate | 与WWW-Authenticate类似，用于代理与客户端之间的认证，407 Proxy Authentication Required响应必须包含该首部 |
| Set-Cookie | 非HTTP/1.1标准首部 |
| WWW-Authenticate | 告诉客户端访问所请求资源的认证方案，401 Unauthorized响应中肯定有该首部 |


<font style="color:rgb(33, 37, 41);"> </font>

#### <font style="color:rgb(33, 37, 41);">实体首部字段</font>
> <font style="color:rgb(33, 37, 41);">实体首部字段是在请求报文和响应报文中的实体部分所使用的首部，用于补充内容的更新时间等与实体相关的信息</font>
>

<font style="color:rgb(33, 37, 41);">实体首部字段可以分为：</font>**<font style="color:#D46B08;">实体信息性首部字段、内容首部字段、实体缓存首部字段</font>**<font style="color:rgb(33, 37, 41);">。</font>

<font style="color:#8C8C8C;">实体信息性首部字段及作用表</font>

| **字段** | **作用** |
| :---: | --- |
| Allow | 通知客户端可以对特定资源使用那些HTTP方法。405 Method Not Allowed响应中必须包含该首部 |


<font style="color:#8C8C8C;">内容首部字段及作用表</font>

| **字段** | **作用** |
| :---: | --- |
| Content-Encoding | 告诉客户端实体的主体部分选用的内容编码方式。具体方式参见Accept-Encoding |
| Content-Language | 告诉客户端实体主体使用的自然语言（中文、英文等） |
| Content-Length  | 表明实体主体部分的大小（单位：字节）。对实体主体进行内容编码传输时，不能再使用该首部字段 |
| Content-Location | 报文主体部分相对应的URI |
| Content-MD5 | 一串由MD5算法生成的值。对于检查在传输过程中数据是否被无意的修改非常有用，但不能用于安全目的，因为报文如果被有意的修改，该字段的值也可以计算后作相应修改 |
| Content-Range  | 针对范围请求，提供了请求实体在原始实体内的位置（范围），还给出了整个实体的长度 |
| Content-Type | 响应报文中对象的媒体类型 |


<font style="color:#8C8C8C;">实体缓存首部字段及作用表</font>

| **字段** | **作用** |
| :---: | --- |
| ETag | <font style="color:rgb(33, 37, 41);">实体标记，就是一种标识资源的方式</font> |
| Expires | <font style="color:rgb(33, 37, 41);">资源失效日期，当Cache-Control有指定max-age指令时，会优先处理max-age</font> |
| Last-Modified | <font style="color:rgb(33, 37, 41);">资源最终修改时间</font> |


<font style="color:rgb(33, 37, 41);"> </font>

