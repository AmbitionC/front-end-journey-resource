以下是HTTP常见的响应状态码及其含义：

| <font style="color:rgb(13, 13, 13);">状态码</font> | <font style="color:rgb(13, 13, 13);">含义</font> |
| :---: | --- |
| <font style="color:rgb(13, 13, 13);">200</font> | <font style="color:rgb(13, 13, 13);">OK - 请求成功</font> |
| <font style="color:rgb(13, 13, 13);">201</font> | <font style="color:rgb(13, 13, 13);">Created - 请求已创建新资源</font> |
| <font style="color:rgb(13, 13, 13);">204</font> | <font style="color:rgb(13, 13, 13);">No Content - 请求成功，但响应中无内容返回</font> |
| <font style="color:rgb(13, 13, 13);">301</font> | <font style="color:rgb(13, 13, 13);">Moved Permanently - 永久重定向</font> |
| <font style="color:rgb(13, 13, 13);">302</font> | <font style="color:rgb(13, 13, 13);">Found - 临时重定向</font> |
| <font style="color:rgb(13, 13, 13);">400</font> | <font style="color:rgb(13, 13, 13);">Bad Request - 请求无效</font> |
| <font style="color:rgb(13, 13, 13);">401</font> | <font style="color:rgb(13, 13, 13);">Unauthorized - 未授权，需要身份验证</font> |
| <font style="color:rgb(13, 13, 13);">403</font> | <font style="color:rgb(13, 13, 13);">Forbidden - 无权限访问</font> |
| <font style="color:rgb(13, 13, 13);">404</font> | <font style="color:rgb(13, 13, 13);">Not Found - 请求的资源不存在</font> |
| <font style="color:rgb(13, 13, 13);">405</font> | <font style="color:rgb(13, 13, 13);">Method Not Allowed - 请求中使用了不允许的方法</font> |
| <font style="color:rgb(13, 13, 13);">500</font> | <font style="color:rgb(13, 13, 13);">Internal Server Error - 服务器内部错误</font> |
| <font style="color:rgb(13, 13, 13);">503</font> | <font style="color:rgb(13, 13, 13);">Service Unavailable - 服务不可用</font> |




<font style="color:rgb(13, 13, 13);">HTTP 响应状态码用于表示服务器对请求的处理结果，以下是一些常见的 HTTP 响应状态码及其含义：</font>



#### 1xx - 信息性状态码<font style="color:rgb(13, 13, 13);">：</font>
    - **100 Continue**<font style="color:rgb(13, 13, 13);">：服务器已收到请求的一部分，客户端应继续发送剩余的请求。</font>
    - **101 Switching Protocols**<font style="color:rgb(13, 13, 13);">：服务器已经理解了客户端的请求，将通过协议升级来完成这个请求。</font>

<font style="color:rgb(13, 13, 13);"></font>

#### 2xx - 成功状态码<font style="color:rgb(13, 13, 13);">：</font>
    - **200 OK**<font style="color:rgb(13, 13, 13);">：请求成功，服务器已经成功处理了请求。</font>
    - **201 Created**<font style="color:rgb(13, 13, 13);">：请求已经被实现，新资源已经被创建。</font>
    - **204 No Content**<font style="color:rgb(13, 13, 13);">：服务器成功处理了请求，但没有返回任何内容。</font>

<font style="color:rgb(13, 13, 13);"></font>

#### 3xx - 重定向状态码<font style="color:rgb(13, 13, 13);">：</font>
    - **301 Moved Permanently**<font style="color:rgb(13, 13, 13);">：被请求的资源已永久移动到新位置。</font>
    - **302 Found**<font style="color:rgb(13, 13, 13);">：请求的资源临时从不同的 URI 响应请求。</font>
    - **304 Not Modified**<font style="color:rgb(13, 13, 13);">：客户端发送了一个条件式请求，资源未修改。</font>

<font style="color:rgb(13, 13, 13);"></font>

#### 4xx - 客户端错误状态码<font style="color:rgb(13, 13, 13);">：</font>
    - **400 Bad Request**<font style="color:rgb(13, 13, 13);">：请求无效，服务器不理解或无法处理请求。</font>
    - **401 Unauthorized**<font style="color:rgb(13, 13, 13);">：请求需要用户身份验证。</font>
    - **403 Forbidden**<font style="color:rgb(13, 13, 13);">：服务器已经理解请求，但是拒绝执行它。</font>
    - **404 Not Found**<font style="color:rgb(13, 13, 13);">：请求的资源不存在。</font>

<font style="color:rgb(13, 13, 13);"></font>

#### 5xx - 服务器错误状态码<font style="color:rgb(13, 13, 13);">：</font>
    - **500 Internal Server Error**<font style="color:rgb(13, 13, 13);">：服务器内部错误，无法完成请求。</font>
    - **502 Bad Gateway**<font style="color:rgb(13, 13, 13);">：充当网关或代理的服务器收到了来自上游服务器的无效响应。</font>
    - **503 Service Unavailable**<font style="color:rgb(13, 13, 13);">：服务器暂时无法处理请求，通常是因为过载或维护。</font>

