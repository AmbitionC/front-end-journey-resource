Cookie相关的HTTP首部字段主要有两个：

#### Set-Cookie (响应头部字段): 
    - **用途**：服务器通过`Set-Cookie`响应首部字段向客户端（通常是用户的浏览器）发送一个或多个Cookie。这些Cookie包含了服务器希望浏览器存储并随后续请求一同发送回服务器的信息。
    - **格式**：`Set-Cookie: name=value; expires=Date; path=Path; domain=Domain; Secure; HttpOnly; SameSite=...; ...`
    - **字段说明**： 
        * `name=value`：定义了Cookie的名称及其对应值。
        * `expires`：指定Cookie何时失效，可以是绝对日期时间或相对时间。
        * `path`：指定了Cookie应被发送回服务器的URL路径范围。
        * `domain`：限制了Cookie能在哪些域名下发送。
        * `Secure`：指示Cookie仅在HTTPS安全连接上传输。
        * `HttpOnly`：防止Cookie通过JavaScript脚本被获取，增强了安全性，防止跨站脚本攻击（XSS）。
        * `SameSite`：控制Cookie是否伴随跨站请求发送，可能的值有`Strict`、`Lax`和`None`。



#### Cookie (请求头部字段): 
    - **用途**：客户端在发起HTTP请求时，会自动在请求头部包含之前收到并在本地存储的Cookies，通过`Cookie`请求首部字段将它们发送回服务器。
    - **格式**：`Cookie: name=value; name2=value2; ...`
    - **字段说明**：每个键值对表示一个已存储的Cookie，按照收到的`Set-Cookie`指令携带相关信息。



通过这两个字段，服务器和客户端之间可以实现在无状态的HTTP协议基础上进行有限的状态管理和用户认证等功能。同时，Cookie还涉及隐私和安全方面，需要谨慎处理以保护用户数据。

