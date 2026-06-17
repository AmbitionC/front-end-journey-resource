#### <font style="color:rgb(33, 37, 41);">状态码概念</font>
<font style="color:rgb(33, 37, 41);">HTTP状态码用来告诉客户端发生了什么事情。</font>**<font style="color:rgb(33, 37, 41);">状态码是在每条响应报文的起始行返回</font>**<font style="color:rgb(33, 37, 41);">的，会返回一个数字状态和一个可读的状态。数字码</font>**<font style="color:rgb(33, 37, 41);">便于程序进行差错处理</font>**<font style="color:rgb(33, 37, 41);">，原因短语便于用户理解。</font>



#### <font style="color:rgb(33, 37, 41);">状态码分类</font>
<font style="color:rgb(33, 37, 41);">状态码的分类如下表所示：</font>

<font style="color:#8C8C8C;">状态码分类表</font>

| **<font style="color:rgb(33, 37, 41);">整体范围</font>** | **<font style="color:rgb(33, 37, 41);">已定义范围</font>** | **<font style="color:rgb(33, 37, 41);">分类</font>** |
| :---: | :---: | :---: |
| <font style="color:rgb(33, 37, 41);">100 ~ 199</font> | <font style="color:rgb(33, 37, 41);">100 ~ 101</font> | <font style="color:rgb(33, 37, 41);">信息提示</font> |
| <font style="color:rgb(33, 37, 41);">200 ~ 299</font> | <font style="color:rgb(33, 37, 41);">200 ~ 206</font> | <font style="color:rgb(33, 37, 41);">成功</font> |
| <font style="color:rgb(33, 37, 41);">300 ~ 399</font> | <font style="color:rgb(33, 37, 41);">300 ~ 305</font> | <font style="color:rgb(33, 37, 41);">重定向</font> |
| <font style="color:rgb(33, 37, 41);">400 ~ 499</font> | <font style="color:rgb(33, 37, 41);">400 ~ 415</font> | <font style="color:rgb(33, 37, 41);">客户端错误</font> |
| <font style="color:rgb(33, 37, 41);">500 ~ 599</font> | <font style="color:rgb(33, 37, 41);">500 ~ 505</font> | <font style="color:rgb(33, 37, 41);">服务端错误</font> |


+ <font style="color:rgb(33, 37, 41);">100到199之间的状态码用于</font>**<font style="color:rgb(33, 37, 41);">信息提示</font>**
+ <font style="color:rgb(33, 37, 41);">200到299之间的状态码表示</font>**<font style="color:rgb(33, 37, 41);">成功</font>**
+ <font style="color:rgb(33, 37, 41);">300到399之间的状态码表示</font>**<font style="color:rgb(33, 37, 41);">资源已被转移</font>**
+ <font style="color:rgb(33, 37, 41);">400到499之间的状态码表示</font>**<font style="color:rgb(33, 37, 41);">客户端请求出错</font>**
+ <font style="color:rgb(33, 37, 41);">500到599之间的状态码表示</font>**<font style="color:rgb(33, 37, 41);">服务器出错</font>**

<font style="color:rgb(33, 37, 41);"></font>

#### <font style="color:rgb(33, 37, 41);">1xx：信息状态码</font>
<font style="color:#8C8C8C;">1xx信息状态码分类表</font>

| **<font style="color:rgb(33, 37, 41);">状态码</font>** | **<font style="color:rgb(33, 37, 41);">含义</font>** | **<font style="color:rgb(33, 37, 41);">描述</font>** |
| :---: | :---: | :---: |
| <font style="color:rgb(33, 37, 41);">100</font> | <font style="color:rgb(33, 37, 41);">继续</font> | <font style="color:rgb(33, 37, 41);">初始的请求已经接受，请客户端继续发送剩余部分</font> |
| <font style="color:rgb(33, 37, 41);">101</font> | <font style="color:rgb(33, 37, 41);">切换协议</font> | <font style="color:rgb(33, 37, 41);">请求这要求服务器切换协议，服务器已确定切换</font> |




#### <font style="color:rgb(33, 37, 41);">2xx：成功状态码</font>
<font style="color:#8C8C8C;">2xx成功状态码分类表</font>

| **<font style="color:rgb(33, 37, 41);">状态码</font>** | **<font style="color:rgb(33, 37, 41);">含义</font>** | **<font style="color:rgb(33, 37, 41);">描述</font>** |
| :---: | :---: | :---: |
| <font style="color:rgb(33, 37, 41);">200</font> | <font style="color:rgb(33, 37, 41);">成功</font> | <font style="color:rgb(33, 37, 41);">服务器已成功处理了请求</font> |
| <font style="color:rgb(33, 37, 41);">201</font> | <font style="color:rgb(33, 37, 41);">已创建</font> | <font style="color:rgb(33, 37, 41);">请求成功并且服务器创建了新的资源</font> |
| <font style="color:rgb(33, 37, 41);">202</font> | <font style="color:rgb(33, 37, 41);">已接受</font> | <font style="color:rgb(33, 37, 41);">服务器已接受请求，但尚未处理</font> |
| <font style="color:rgb(33, 37, 41);">203</font> | <font style="color:rgb(33, 37, 41);">非授权信息</font> | <font style="color:rgb(33, 37, 41);">服务器已成功处理请求，但返回的信息可能来自另一个来源</font> |
| <font style="color:rgb(33, 37, 41);">204</font> | <font style="color:rgb(33, 37, 41);">无内容</font> | <font style="color:rgb(33, 37, 41);">服务器已成功处理请求，但返回的资源可能来自另一个来源</font> |
| <font style="color:rgb(33, 37, 41);">205</font> | <font style="color:rgb(33, 37, 41);">重置内容</font> | <font style="color:rgb(33, 37, 41);">服务器处理成功，用户终端重置文档视图</font> |
| <font style="color:rgb(33, 37, 41);">206</font> | <font style="color:rgb(33, 37, 41);">部分内容</font> | <font style="color:rgb(33, 37, 41);">服务器成功处理了部分GET请求</font> |




#### <font style="color:rgb(33, 37, 41);">3xx：重定向状态码</font>
<font style="color:#8C8C8C;">3xx重定向状态码分类表</font>

| **<font style="color:rgb(33, 37, 41);">状态码</font>** | **<font style="color:rgb(33, 37, 41);">含义</font>** | **<font style="color:rgb(33, 37, 41);">描述</font>** |
| :---: | :---: | :---: |
| <font style="color:rgb(33, 37, 41);">300</font> | <font style="color:rgb(33, 37, 41);">多种选择</font> | <font style="color:rgb(33, 37, 41);">针对请求，服务器可执行多种操作</font> |
| <font style="color:rgb(33, 37, 41);">301</font> | <font style="color:rgb(33, 37, 41);">永久重定向</font> | <font style="color:rgb(33, 37, 41);">请求的页面已永久跳转到新的url</font> |
| <font style="color:rgb(33, 37, 41);">302</font> | <font style="color:rgb(33, 37, 41);">临时移动</font> | <font style="color:rgb(33, 37, 41);">服务器目前从不同位置的网页响应请求，但请求仍继续使用原有位置来进行以后的请求</font> |
| <font style="color:rgb(33, 37, 41);">303</font> | <font style="color:rgb(33, 37, 41);">查看其他位置</font> | <font style="color:rgb(33, 37, 41);">请求者应当对不同的位置使用单独的GET请求来检索响应时，服务器返回此代码</font> |
| <font style="color:rgb(33, 37, 41);">304</font> | <font style="color:rgb(33, 37, 41);">未修改</font> | <font style="color:rgb(33, 37, 41);">自从上次请求后，请求的网页未修改过</font> |
| <font style="color:rgb(33, 37, 41);">305</font> | <font style="color:rgb(33, 37, 41);">使用代理</font> | <font style="color:rgb(33, 37, 41);">请求者只能使用代理访问请求的网页</font> |
| <font style="color:rgb(33, 37, 41);">307</font> | <font style="color:rgb(33, 37, 41);">临时重定向</font> | <font style="color:rgb(33, 37, 41);">服务器目前从不同位置的网页响应请求，但请求者应继续使用原有位置来进行以后的请求</font> |




#### <font style="color:rgb(33, 37, 41);">4xx：客户端错误状态码</font>
<font style="color:#8C8C8C;">4xx客户端状态码分类表</font>

| **<font style="color:rgb(33, 37, 41);">状态码</font>** | **<font style="color:rgb(33, 37, 41);">含义</font>** | **<font style="color:rgb(33, 37, 41);">描述</font>** |
| :---: | :---: | :---: |
| <font style="color:rgb(33, 37, 41);">400</font> | <font style="color:rgb(33, 37, 41);">错误请求</font> | <font style="color:rgb(33, 37, 41);">服务器不理解请求的语法</font> |
| <font style="color:rgb(33, 37, 41);">401</font> | <font style="color:rgb(33, 37, 41);">未授权</font> | <font style="color:rgb(33, 37, 41);">请求要求用户的身份演验证</font> |
| <font style="color:rgb(33, 37, 41);">403</font> | <font style="color:rgb(33, 37, 41);">禁止</font> | <font style="color:rgb(33, 37, 41);">服务器拒绝请求</font> |
| <font style="color:rgb(33, 37, 41);">404</font> | <font style="color:rgb(33, 37, 41);">未找到</font> | <font style="color:rgb(33, 37, 41);">服务器找不到请求的页面</font> |
| <font style="color:rgb(33, 37, 41);">405</font> | <font style="color:rgb(33, 37, 41);">方法禁用</font> | <font style="color:rgb(33, 37, 41);">禁用请求中指定的方法</font> |
| <font style="color:rgb(33, 37, 41);">406</font> | <font style="color:rgb(33, 37, 41);">不接受</font> | <font style="color:rgb(33, 37, 41);">无法使用请求的内容特性响应请求的页面</font> |
| <font style="color:rgb(33, 37, 41);">407</font> | <font style="color:rgb(33, 37, 41);">需要代理授权</font> | <font style="color:rgb(33, 37, 41);">请求需要代理的身份认证</font> |
| <font style="color:rgb(33, 37, 41);">408</font> | <font style="color:rgb(33, 37, 41);">请求超时</font> | <font style="color:rgb(33, 37, 41);">服务器等候请求时发生超时</font> |
| <font style="color:rgb(33, 37, 41);">409</font> | <font style="color:rgb(33, 37, 41);">冲突</font> | <font style="color:rgb(33, 37, 41);">服务器在完成请求时发生冲突</font> |
| <font style="color:rgb(33, 37, 41);">410</font> | <font style="color:rgb(33, 37, 41);">已删除</font> | <font style="color:rgb(33, 37, 41);">客户端请求的资源已经不存在</font> |
| <font style="color:rgb(33, 37, 41);">411</font> | <font style="color:rgb(33, 37, 41);">需要有效长度</font> | <font style="color:rgb(33, 37, 41);">服务器不接受不含有效长度表头字段的请求</font> |
| <font style="color:rgb(33, 37, 41);">412</font> | <font style="color:rgb(33, 37, 41);">未满足前提条件</font> | <font style="color:rgb(33, 37, 41);">服务器未满足请求者在请求中设置的其中一个前提条件</font> |
| <font style="color:rgb(33, 37, 41);">413</font> | <font style="color:rgb(33, 37, 41);">请求实体过大</font> | <font style="color:rgb(33, 37, 41);">由于请求实体过大，服务器无法处理，因此拒绝请求</font> |
| <font style="color:rgb(33, 37, 41);">414</font> | <font style="color:rgb(33, 37, 41);">请求url过长</font> | <font style="color:rgb(33, 37, 41);">请求的url过长，服务器无法处理</font> |
| <font style="color:rgb(33, 37, 41);">415</font> | <font style="color:rgb(33, 37, 41);">不支持格式</font> | <font style="color:rgb(33, 37, 41);">服务器无法处理请求中附带媒体格式</font> |
| <font style="color:rgb(33, 37, 41);">416</font> | <font style="color:rgb(33, 37, 41);">范围无效</font> | <font style="color:rgb(33, 37, 41);">客户端请求的范围无效</font> |
| <font style="color:rgb(33, 37, 41);">417</font> | <font style="color:rgb(33, 37, 41);">未满足期望</font> | <font style="color:rgb(33, 37, 41);">服务器无法满足请求表头字段要求</font> |




#### <font style="color:rgb(33, 37, 41);">5xx：服务端错误状态码</font>
<font style="color:#8C8C8C;">5xx服务端状态码分类表</font>

| **<font style="color:rgb(33, 37, 41);">状态码</font>** | **<font style="color:rgb(33, 37, 41);">含义</font>** | **<font style="color:rgb(33, 37, 41);">描述</font>** |
| :---: | :---: | :---: |
| <font style="color:rgb(33, 37, 41);">500</font> | <font style="color:rgb(33, 37, 41);">服务器错误</font> | <font style="color:rgb(33, 37, 41);">服务器内部错误，无法完成请求</font> |
| <font style="color:rgb(33, 37, 41);">501</font> | <font style="color:rgb(33, 37, 41);">尚未实施</font> | <font style="color:rgb(33, 37, 41);">服务器不具备完成请求的功能</font> |
| <font style="color:rgb(33, 37, 41);">502</font> | <font style="color:rgb(33, 37, 41);">错误网关</font> | <font style="color:rgb(33, 37, 41);">服务器作为网关或代理出现错误</font> |
| <font style="color:rgb(33, 37, 41);">503</font> | <font style="color:rgb(33, 37, 41);">服务不可用</font> | <font style="color:rgb(33, 37, 41);">服务器目前无法使用</font> |
| <font style="color:rgb(33, 37, 41);">504</font> | <font style="color:rgb(33, 37, 41);">网关超时</font> | <font style="color:rgb(33, 37, 41);">网关或代理服务器，未及时获取请求</font> |
| <font style="color:rgb(33, 37, 41);">505</font> | <font style="color:rgb(33, 37, 41);">不支持版本</font> | <font style="color:rgb(33, 37, 41);">服务器不支持请求中使用的HTTP协议版本</font> |


**<font style="color:rgb(33, 37, 41);"></font>**

