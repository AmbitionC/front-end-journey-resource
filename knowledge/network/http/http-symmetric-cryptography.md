#### <font style="color:rgb(33, 37, 41);">定义</font>
<font style="color:rgb(33, 37, 41);">根据</font>**密钥的类型**<font style="color:rgb(33, 37, 41);">可以将现代的密码技术分为：</font>**<font style="color:rgb(33, 37, 41);">对称加密算法和非对称加密算法</font>**<font style="color:rgb(33, 37, 41);">。所有对称加密算法都有一个共同的特点：</font>**<font style="color:#D46B08;">加密和解密所使用的密钥都是相同的</font>**<font style="color:rgb(33, 37, 41);">。</font>

<font style="color:rgb(33, 37, 41);">对称加密算法是加密跟解密采用同一把密钥，而且通讯双方都必须获得密钥并保证密钥的安全性。非对称加密算法采用的加密钥匙（公钥）和解密钥匙（私钥）。</font>

+ <font style="color:rgb(33, 37, 41);">优缺点</font>
    - **<font style="color:rgb(33, 37, 41);">优点：加解密速度快，效率高</font>**
    - **<font style="color:rgb(33, 37, 41);">缺点：不便于秘钥的分发和管理，安全性不高</font>**



#### <font style="color:rgb(33, 37, 41);">常见的对称加密算法</font>
<font style="color:rgb(33, 37, 41);">在对称加密算法中常用的算法有：</font>[**<font style="color:#D46B08;">DES</font>**](https://baike.baidu.com/item/DES)**<font style="color:#D46B08;">、</font>**[**<font style="color:#D46B08;">3DES</font>**](https://baike.baidu.com/item/3DES)**<font style="color:#D46B08;">、AES、TDEA、</font>**[**<font style="color:#D46B08;">Blowfish</font>**](https://baike.baidu.com/item/Blowfish)**<font style="color:#D46B08;">、RC2</font>**<font style="color:rgb(33, 37, 41);">等</font>

+ **<font style="color:rgb(33, 37, 41);">DES（Data Encryption Standard）加密算法：</font>**<font style="color:rgb(33, 37, 41);">1977年美国标准局（NBS）发布的数据加密标准（DES），并且在20年内都是美国政府所使用的标准加密方式。它是一种分组密码，以64位为分组对数据加密，它的密钥长度是56位，加密解密用同一算法。运算速度较快，适用于加密大量数据的场合。</font>
+ **<font style="color:rgb(33, 37, 41);">3DES（Triple DES）：</font>**<font style="color:rgb(33, 37, 41);">是基于DES的对称算法，对一块数据用三个不同的密钥进行三次加密，强度更高。</font>
+ **<font style="color:rgb(33, 37, 41);">AES（Advanced Encrytion Standard）加密算法：</font>**<font style="color:rgb(33, 37, 41);">AES至今仍然是最强大的对称加密算法，目前还不存在从技术上有效破解AES的方法是密码学中的高级加密标准。该加密算法采用对称分组密码体制，密钥长度的最少支持为128、192、256，分组长度128位，算法应易于各种硬件和软件实现。这种加密算法是美国联邦政府采用的区块加密标准，AES标准用来替代原先的DES，已经被多方分析且广为全世界所使用。</font>

<font style="color:rgb(33, 37, 41);"></font>

#### <font style="color:rgb(33, 37, 41);">加密算法效果对比</font>
| **名称** | **密钥长度** | **运算速度** | **安全性** | **资源消耗** |
| :---: | :---: | :---: | :---: | :---: |
| DES | 56位 | 较快 | 低 | 中 |
| 3DES | 112位或168位 | 慢 | 中 | 高 |
| AES | 128、192、256位 | 快 | 高 | 低 |




#### <font style="color:rgb(33, 37, 41);">补充知识点</font>
<font style="color:rgb(33, 37, 41);">现代对称密码可以分为</font>**<font style="color:rgb(33, 37, 41);">序列密码和分组密码</font>**<font style="color:rgb(33, 37, 41);">两类：</font>

+ **<font style="color:rgb(33, 37, 41);">序列密码：</font>**<font style="color:rgb(33, 37, 41);">将明文中的每个字符单独加密后再组合成密文；</font>
+ **<font style="color:rgb(33, 37, 41);">分组密码：</font>**<font style="color:rgb(33, 37, 41);">将原文分为若干个组，每个组进行整体加密，其最终加密结果依赖于同组的各位字符的具体内容。分组加密的结果不仅受密钥影响，也会受到同组其他字符的影响。</font>

![](https://cdn.nlark.com/yuque/0/2022/png/577681/1653494875413-9b88df4d-c8f0-4cd5-b7e3-7426c5a01e8a.png) 

<font style="color:#8C8C8C;">序列密码示意图</font>

![](https://cdn.nlark.com/yuque/0/2022/png/577681/1653494887910-cbbba384-59cd-4cdd-ab5a-0afef0af0959.png)

<font style="color:#8C8C8C;">分组密码示意图</font>

<font style="color:#8C8C8C;"></font>

