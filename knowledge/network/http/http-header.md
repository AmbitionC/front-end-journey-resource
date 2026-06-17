#### <font style="color:rgb(33, 37, 41);">HTTP报文结构</font>
<font style="color:rgb(33, 37, 41);">HTTP 协议的请求和响应报文中必定包含 HTTP 首部。首部内容为客户端和服务器分别</font><font style="color:#D46B08;">处理请求和响应提供所需要的信息</font><font style="color:rgb(33, 37, 41);">。</font>

HTTP请求报文有以下四个部分组成：

    - **请求方法**
    - **URI**
    - **HTTP版本**
    - **HTTP首部字段：请求首部字段、通用首部字段、实体首部字段和其他**

![](https://cdn.nlark.com/yuque/0/2022/png/577681/1652596703044-dfa85f36-ba88-4426-8965-8e6fa81b6d82.png)

<font style="color:#8C8C8C;">请求报文示意图</font>

HTTP响应报文有以下三个部分组成：

    - **HTTP版本**
    - **状态码**
    - **HTTP首部字段：请求首部字段、通用首部字段、实体首部字段和其他**

![](https://cdn.nlark.com/yuque/0/2022/png/577681/1652596740367-af42237a-930f-4991-ab11-76ba415582e5.png)

<font style="color:#8C8C8C;">响应报文示意图</font>

<font style="color:#8C8C8C;"></font>

#### <font style="color:rgb(33, 37, 41);">HTTP首部字段</font>
<font style="color:rgb(33, 37, 41);">在客户端与服务器之间以 HTTP 协议进行通信的过程中，</font>**<font style="color:rgb(33, 37, 41);">无论是请求还是响应都会使用首部字段，它起到传递额外重要信息的作用。</font>**<font style="color:rgb(33, 37, 41);">使用首部字段是为了给浏览器和服务器提供报文主体大小、所使用的语言、认证信息等内容。</font>

<font style="color:rgb(33, 37, 41);">在 HTTP 首部中以Content-Type这个字段来表示报文主体的对象类型：</font>

```bash
Content-Type: text/html
```



#### <font style="color:rgb(33, 37, 41);">HTTP首部字段类型</font>
+ **通用首部字段（General Header Fields）**：请求报文和响应报文都会使用的首部。
+ **请求首部字段（Request Header Fields）**：<font style="color:rgb(33, 37, 41);">从客户端向服务器端发送请求报文时使用的首部。补充了请求的附加内容、客户端信息、响应内容相关优先级等信息。</font>
+ **<font style="color:rgb(33, 37, 41);">响应首部字段（Response Header Fields）</font>**<font style="color:rgb(33, 37, 41);">：从服务器端向客户端返回响应报文时使用的首部。补充了响应的附加内容，也会要求客户端附加额外的内容信息。</font>
+ **<font style="color:rgb(33, 37, 41);">实体首部字段（Entity Header Fields）</font>**<font style="color:rgb(33, 37, 41);">：针对请求报文和响应报文的实体部分使用的首部。补充了资源内容更新时间等与实体有关的信息。</font>

