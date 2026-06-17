|  | HTTP | HTTPS |
| :---: | --- | --- |
| 安全性 | 未加密的明文传输 | 具有安全性的SSL加密协议 |
| 连接 | 无状态 | SSL+HTTP协议组成的可加密传输、身份认证的网络协议 |
| 连接端口 | 80 | 443 |
| 证书 | 无证书 | <font style="color:rgb(33, 37, 41);">需要CA机构wosign的颁发的SSL证书</font> |


#### HTTP
+ <font style="color:rgb(33, 37, 41);">HTTP是互联网上应用最为广泛的一种网络协议，HTTP用于从服务器传输超文本到本地浏览器的传输协议，它可以</font>**使浏览器更加高效，网络传输减少**<font style="color:rgb(33, 37, 41);">。</font>
+ <font style="color:rgb(33, 37, 41);">HTTP是超文本传输协议，信息是明文传输。</font>

<font style="color:rgb(33, 37, 41);"></font>

#### HTTPS
+ <font style="color:rgb(33, 37, 41);">HTTPS是以安全为目标的HTTP通道，简单讲是HTTP的安全版，HTTPS的安全基础是</font><font style="color:#D46B08;">SSL</font><font style="color:rgb(33, 37, 41);">，因此加密的详细内容就需要SSL。</font>
+ <font style="color:rgb(33, 37, 41);">HTTPS协议的主要作用可以分为两种：一种是</font>**<font style="color:rgb(33, 37, 41);">建立一个信息安全通道</font>**<font style="color:rgb(33, 37, 41);">，来保证数据传输的安全；另一种就是</font>**<font style="color:rgb(33, 37, 41);">确认网站的真实性</font>**<font style="color:rgb(33, 37, 41);">。</font>

<font style="color:rgb(33, 37, 41);"></font>

#### HTTPS如何实现安全性
<font style="color:rgb(33, 37, 41);">客户端在使用HTTPS方式与Web服务器通信时有以下几个步骤，如图所示。</font>

![](https://cdn.nlark.com/yuque/0/2024/png/577681/1717680077318-1584893d-2873-46bc-b9c5-ea00bfabe685.png)

<font style="color:#8C8C8C;">客户端与服务端使用HTTPS通信流程示意图</font>

1. <font style="color:rgb(33, 37, 41);">客户使用https的URL访问Web服务器，要求与Web服务器</font>**<font style="color:rgb(33, 37, 41);">建立SSL连接</font>**<font style="color:rgb(33, 37, 41);">。</font>
2. <font style="color:rgb(33, 37, 41);">Web服务器收到客户端请求后，会将网站的</font>**<font style="color:rgb(33, 37, 41);">证书信息</font>**<font style="color:rgb(33, 37, 41);">（证书中包含公钥）传送一份给客户端。</font>
3. <font style="color:rgb(33, 37, 41);">客户端的浏览器与Web服务器开始协商SSL连接的安全等级，也就是</font>**<font style="color:rgb(33, 37, 41);">信息加密的等级</font>**<font style="color:rgb(33, 37, 41);">。</font>
4. <font style="color:rgb(33, 37, 41);">客户端的浏览器根据双方同意的安全等级，建立会话密钥，然后利用网站的</font>**<font style="color:rgb(33, 37, 41);">公钥将会话密钥加密</font>**<font style="color:rgb(33, 37, 41);">，并传送给网站。</font>
5. <font style="color:rgb(33, 37, 41);">Web服务器利用自己的</font>**<font style="color:rgb(33, 37, 41);">私钥解密出会话密钥</font>**<font style="color:rgb(33, 37, 41);">。</font>
6. <font style="color:rgb(33, 37, 41);">Web服务器利用会话密钥加密与客户端之间的通信。</font>

<font style="color:rgb(33, 37, 41);"></font>

#### HTTPS缺点？
HTTPS虽然有诸多优势，但也有有一定的代价：

+ <font style="color:rgb(33, 37, 41);">HTTPS协议握手阶段比较</font>**<font style="color:rgb(33, 37, 41);">费时</font>**<font style="color:rgb(33, 37, 41);">，会使页面的加载时间延长近50%，增加10%到20%的耗电；</font>
+ <font style="color:rgb(33, 37, 41);">HTTPS连接缓存不如HTTP高效，会</font>**<font style="color:rgb(33, 37, 41);">增加数据开销和功耗</font>**<font style="color:rgb(33, 37, 41);">，甚至已有的安全措施也会因此而受到影响；</font>
+ **<font style="color:rgb(33, 37, 41);">SSL证书</font>**<font style="color:rgb(33, 37, 41);">需要钱，功能越强大的证书费用越高，个人网站、小网站没有必要一般不会用。</font>
+ <font style="color:rgb(33, 37, 41);">SSL证书通常需要绑定IP，不能在同一IP上绑定多个域名。</font>
+ <font style="color:rgb(33, 37, 41);">HTTPS协议的加密范围也比较有限，在黑客攻击、服务器劫持等方面几乎起不到什么作用。最关键的，SSL证书的信用链体系并不安全，特别是在某些国家可以控制CA根证书的情况下，中间人攻击一样可行。</font>



