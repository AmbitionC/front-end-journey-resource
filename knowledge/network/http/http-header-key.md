#### <font style="color:rgb(33, 37, 41);">HTTP通用首部字段</font>
<font style="color:rgb(33, 37, 41);">通用首部字段是指，请求报文和响应报文双方都会使用的首部。包含字段及作用如下表所示：</font>

<font style="color:#8C8C8C;">HTTP通用首部字段及作用表</font>

| **字段** | **作用** |
| :---: | --- |
| Cache-Control | <font style="color:rgb(33, 37, 41);">通过指定首部Cache-Control的指令，就可以操作缓存的工作机制。如no-cache，public等。首部字段 Cache-Control 能够控制缓存的行为</font> |
| Connection | <font style="color:rgb(33, 37, 41);">主要有两个作用，控制不再转发给代理的首部字段、管理持久连接</font> |
| Data | 首部字段data表明创建HTTP报文和日期 |
| Pragma | <font style="color:rgb(33, 37, 41);">报文指令。与http1.1之前的版本兼容</font> |
| Trailer | <font style="color:rgb(33, 37, 41);">首部字段Trailer会事先说明在报文主体后记录了哪些首部字段，可以应用在HTTP1.1版本分块传输编码时使用</font> |
| Transfer-Encoding | <font style="color:rgb(33, 37, 41);">规定了传输报文主体时采用的编码方式</font> |
| Upgrade | <font style="color:rgb(33, 37, 41);">用于检测HTTP协议及其他协议是否可以使用更高版本进行通信</font> |
| Via | <font style="color:rgb(33, 37, 41);">追踪客户端与服务器之间的请求响应和响应报文的传输途径。还可以避免请求回环的发生</font> |
| Warning | <font style="color:rgb(33, 37, 41);">告知用户一些与缓存相关问题的警告</font> |




![](https://cdn.nlark.com/yuque/0/2024/png/577681/1717680831426-13f9885b-4015-4ba4-aaeb-01169f124a65.png)

