#### 长连接
+ **概念**：<font style="color:rgb(77, 77, 77);">长连接情况下，客户端和服务端首先建立连接，且建立连接后，</font>**<font style="color:rgb(77, 77, 77);">用于传输HTTP数据的TCP连接不会关闭</font>**<font style="color:rgb(77, 77, 77);">。服务端在此访问这个服务器时，会继续使用已经建立的连接。此种方式</font><font style="color:#D46B08;">常用于P2P点对点的通信</font><font style="color:rgb(77, 77, 77);">。</font>
+ **<font style="color:rgb(77, 77, 77);">长连接的响应头：</font>**

```plain
Connection: keep-alive
```

+ **<font style="color:rgb(77, 77, 77);">流程</font>**<font style="color:rgb(77, 77, 77);">：建立连接 ----> 数据传输 ...（保持连接）...数据传输 ----> 关闭连接</font>
+ **<font style="color:rgb(77, 77, 77);">适用场景</font>**<font style="color:rgb(77, 77, 77);">：</font>
    - <font style="color:rgb(77, 77, 77);">监控系统：物联网IOT场景下的监控系统；</font>
    - <font style="color:rgb(77, 77, 77);">即时通信系统：用户登录、发送信息；</font>
    - <font style="color:rgb(77, 77, 77);">即时报价系统：后台数据库实时变化。</font>
+ **优势：**
    - 第一次连接后无需再建立TCP连接，损耗降低；
    - 点对点通信场景时具有优越性。
+ **劣势：**
    - <font style="color:rgb(77, 77, 77);">一些大用户量、高并发场景下，如果使用长连接会对服务端造成压力；</font>



#### 短连接
+ **概念**：客户端与服务端每进行一次报文收发时才进行一次TCP连接，**通信完成后立即断开连接**。此种方式常用于**一点对多点的通讯**。<font style="color:rgb(33, 37, 41);">在</font>**<font style="color:rgb(33, 37, 41);">HTTP/1.0中默认使用短连接</font>**<font style="color:rgb(33, 37, 41);">。也就是说，客户端和服务器每进行一次HTTP操作，就建立一次连接，任务结束就中断连接。</font>
+ **流程：**<font style="color:rgb(77, 77, 77);">建立连接 ----> 数据传输 ----> 关闭连接...建立连接 ----> 数据传输 ----> 关闭连接</font>
+ **<font style="color:rgb(77, 77, 77);">适用场景：</font>**
    - <font style="color:rgb(77, 77, 77);">Web网站的HTTP服务：web网站这么频繁的成千上万甚至上亿客户端的连接用短连接更省一些资源。</font>
    - <font style="color:rgb(77, 77, 77);">如果都用长连接，而且同时用成千上万的用户，每个用户都占有一个连接的话，可想而知服务器的压力有多大。所以并发量大，但是每个用户又不需频繁操作的情况下需要短连接。</font>
+ **优势**：
    - 一对多且会有多次请求/响应的情况下，短连接不会各自占有连接，导致拥塞。
+ **劣势：**
    - 每一次建立短连接都需要完整的TCP连接流程。



![](https://cdn.nlark.com/yuque/0/2022/png/577681/1652109891513-78301964-3034-4061-9e97-0128f89db118.png)

<font style="color:#8C8C8C;">短连接和长连接的示意图</font>

<font style="color:#8C8C8C;"></font>

#### 持久连接
+ **概念**：持久连接（Persistent Connection）也是HTTP的Keep-Alive的机制，是<font style="color:#E8323C;">使用同一个TCP连接来发送/接收多个HTTP的请求/应答</font><font style="color:rgb(33, 37, 41);">。而不是为每一个请求/应答打开新的连接的方法。</font><font style="color:rgb(77, 77, 77);">HTTP/1.1默认使用持久连接。</font>
+ **<font style="color:rgb(33, 37, 41);">优势：</font>**
    - <font style="color:rgb(33, 37, 41);">无需每个请求创建单独的TCP连接，</font>**<font style="color:rgb(33, 37, 41);">减少TCP连接数量，降低了服务端的负载</font>**<font style="color:rgb(33, 37, 41);">，降低了网络拥塞的可能；</font>
    - <font style="color:rgb(77, 77, 77);">在一个连接上实现HTTP请求和应答的流水，即允许客户端发出多个请求，而不必在接收到前一请求的应答后才发出下一请求，</font>**<font style="color:rgb(77, 77, 77);">极大减少时间消耗</font>**<font style="color:rgb(77, 77, 77);">。</font>
    - <font style="color:rgb(77, 77, 77);">可以更加优雅地实现HTTP协议，由于持续连接的存在无需报告错误后无需关闭连接，因此</font>**<font style="color:rgb(77, 77, 77);">客户端可使用最新的协议特性发出请求</font>**<font style="color:rgb(77, 77, 77);">，如果接收到表示错误的应答，则换用更旧的语义。</font>  


