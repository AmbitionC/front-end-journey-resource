<font style="color:rgb(13, 13, 13);">重定向（Redirect）和转发（Forward）是两种不同的HTTP请求处理机制，它们有以下区别：</font>

| <font style="color:rgb(13, 13, 13);">特征</font> | <font style="color:rgb(13, 13, 13);">重定向（Redirect）</font> | <font style="color:rgb(13, 13, 13);">转发（Forward）</font> |
| :---: | --- | --- |
| <font style="color:rgb(13, 13, 13);">客户端行为</font> | <font style="color:rgb(13, 13, 13);">是</font> | <font style="color:rgb(13, 13, 13);">否</font> |
| <font style="color:rgb(13, 13, 13);">浏览器地址栏</font> | <font style="color:rgb(13, 13, 13);">发生变化，显示新的URL</font> | <font style="color:rgb(13, 13, 13);">保持不变，仍显示原始URL</font> |
| <font style="color:rgb(13, 13, 13);">请求次数</font> | <font style="color:rgb(13, 13, 13);">两次请求，第一次请求资源，第二次请求新的URL</font> | <font style="color:rgb(13, 13, 13);">一次请求，服务器内部转发</font> |
| <font style="color:rgb(13, 13, 13);">传递数据</font> | <font style="color:rgb(13, 13, 13);">可以传递GET或POST参数</font> | <font style="color:rgb(13, 13, 13);">可以传递数据，但是不可见于URL</font> |
| <font style="color:rgb(13, 13, 13);">发生时间</font> | <font style="color:rgb(13, 13, 13);">发生在浏览器端请求之后</font> | <font style="color:rgb(13, 13, 13);">发生在服务器端处理请求之内</font> |
| <font style="color:rgb(13, 13, 13);">适用场景</font> | <font style="color:rgb(13, 13, 13);">页面跳转、跨域请求</font> | <font style="color:rgb(13, 13, 13);">内部资源调用、请求转发到其他Servlet</font> |


#### 定义<font style="color:rgb(13, 13, 13);">：</font>
    - **重定向（Redirect）**<font style="color:rgb(13, 13, 13);">：客户端发送请求到服务器，服务器收到请求后返回一个重定向响应，告知客户端需要重新发送请求到另一个URL。</font>
    - **转发（Forward）**<font style="color:rgb(13, 13, 13);">：服务器在处理请求时，将请求转发到另一个资源或 Servlet，然后将该资源的响应返回给客户端，客户端不会察觉到服务器的转发。</font>

<font style="color:rgb(13, 13, 13);"></font>

#### 发生的位置<font style="color:rgb(13, 13, 13);">：</font>
    - **重定向**<font style="color:rgb(13, 13, 13);">：发生在客户端，客户端接收到重定向响应后会重新向新的URL发送请求。</font>
    - **转发**<font style="color:rgb(13, 13, 13);">：发生在服务器端，服务器在处理请求时决定是否转发到另一个资源。</font>

<font style="color:rgb(13, 13, 13);"></font>

#### URL的变化<font style="color:rgb(13, 13, 13);">：</font>
    - **重定向**<font style="color:rgb(13, 13, 13);">：客户端会收到一个新的URL作为响应，因此地址栏会显示新的URL。</font>
    - **转发**<font style="color:rgb(13, 13, 13);">：客户端不会感知到地址的变化，仍然保持原始的URL。</font>

<font style="color:rgb(13, 13, 13);"></font>

#### 请求的方式<font style="color:rgb(13, 13, 13);">：</font>
    - **重定向**<font style="color:rgb(13, 13, 13);">：是一种新的请求，客户端会发送一个新的HTTP请求到重定向后的URL。</font>
    - **转发**<font style="color:rgb(13, 13, 13);">：是在服务器端的内部操作，客户端的请求不会被重新发送。</font>

<font style="color:rgb(13, 13, 13);"></font>

#### 数据共享<font style="color:rgb(13, 13, 13);">：</font>
    - **重定向**<font style="color:rgb(13, 13, 13);">：不共享请求中的数据，每次重定向都是独立的请求。</font>
    - **转发**<font style="color:rgb(13, 13, 13);">：可以共享请求中的数据，转发到的资源可以访问原始请求的数据。</font>

