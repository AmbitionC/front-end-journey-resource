![](https://cdn.nlark.com/yuque/0/2022/png/577681/1652282185729-aef58466-e306-4901-99d3-435c743657f6.png)

<font style="color:#8C8C8C;">HTTPS连接建立示意图</font>

<font style="color:rgb(33, 37, 41);">（1）客户端向服务端发送报文，包含</font>**<font style="color:rgb(33, 37, 41);">TLS版本号</font>**<font style="color:rgb(33, 37, 41);">，支持的</font>**<font style="color:rgb(33, 37, 41);">加密算法，随机数</font>**<font style="color:rgb(33, 37, 41);">。</font>

<font style="color:rgb(33, 37, 41);">（2）服务端返回握手报文消息，包含最终决定的</font><font style="color:#D46B08;">加密算法</font><font style="color:rgb(33, 37, 41);">（这个加密算法一定是客户端发送给服务端加密算法的子集）、</font>**<font style="color:rgb(33, 37, 41);">随机数、服务端的数字证书</font>**<font style="color:rgb(33, 37, 41);">。</font>

<font style="color:rgb(33, 37, 41);">（3）客户端</font><font style="color:#D46B08;">验证服务端证书</font><font style="color:rgb(33, 37, 41);">，证书包含的信息有：公钥、颁发机构、过期时间等。</font>

<font style="color:rgb(33, 37, 41);">（4）Client生成预设主密钥（Premaster Key），再加上服务端和客户端的随机数，按照一定的算法生成</font><font style="color:#D46B08;">会话密钥</font><font style="color:rgb(33, 37, 41);">。</font>

<font style="color:rgb(33, 37, 41);">（5）客户端发送报文给服务端，内容包括通过服务端的公钥对预主密钥进行加密的数据。</font>

<font style="color:rgb(33, 37, 41);">（6）服务端通过私钥解密，得到预主密钥。</font>

<font style="color:rgb(33, 37, 41);">（7）服务端通过服务端和客户端的随机数和预设主密钥组成</font><font style="color:#D46B08;">会话秘钥</font><font style="color:rgb(33, 37, 41);">, 跟客户端会话秘钥相同。</font>

<font style="color:rgb(33, 37, 41);">（8）客户端发送会话秘钥加密的握手消息，主要验证服务端是否正常接受客户端加密的消息。</font>

<font style="color:rgb(33, 37, 41);">（9）服务端也会通过会话秘钥加密一条消息回传给客户端，如果客户端能够正常接受的话表明SSL层连接建立完成。</font>

