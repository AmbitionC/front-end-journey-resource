### 面试中遇到的问题：

#### （1）TS限定变量类型与后端赋值

  - TypeScript在编译阶段进行类型检查，如果赋值的类型不匹配，会在编译时报错。运行时需要确保数据类型正确或进行类型断言。

#### （2）Vue2/3双向数据绑定

  - Vue 2中双向数据绑定通过`v-model`指令实现，依赖于`Object.defineProperty`。Vue 3改为使用Proxy，提高了性能和兼容性。

#### （3）Node.js介绍

  - Node.js是一个基于Chrome V8引擎的JavaScript运行环境，允许使用JavaScript进行服务器端编程。

#### （4）Node.js线程模型

  - Node.js采用单线程事件循环模型，通过事件循环和回调队列处理异步操作，同时利用多核CPU的优势进行多线程操作。

#### （5）Node.js流

  - 流是Node.js中处理数据的一种方式，包括可读流（readable）、可写流（writable）和双工流（duplex）。

#### （6）后端接口数据格式

  - 后端接口通常返回JSON格式数据，因为它易于阅读和解析，也适合前后端分离的架构。

#### （7）流式传输

  - 流式传输可以用于大量数据的传输，如视频、音频等，减少内存占用。

#### （8）OAuth协议

  - OAuth是一个授权框架，允许用户向第三方应用授权，而无需暴露自己的账户密码。

#### （9）Session机制

  - Session用于跟踪用户状态，存储在服务器端，好处是安全性高，弊端是占用服务器资源。

#### （10）队列

  - 队列是一种先进先出（FIFO）的数据结构，用于任务调度和异步处理。

#### （11）Promise队列

  - Promise的`resolve`发送的队列请求是并行的，但`then`处理是串行的。

#### （12）JWT

  - JWT是一种无状态认证机制，由头部、载荷和签名三部分组成。

#### （13）localStorage存储JSON

  - `localStorage`存储的是以字符串形式序列化的对象，可以存储数组。

#### （14）localStorage与cookie

  - `localStorage`容量更大，不随请求发送，而cookie会随请求发送，容量较小。

#### （15）刷新后数据保留

  - 刷新页面后，`localStorage`数据保留，cookie如果设置了过期时间，可能会被清除。

#### （16）localStorage存储位置

  - `localStorage`数据存储在浏览器中，与具体页面域名相关。

#### （17）localStorage键值对存储

  - `localStorage`支持键值对存储方式。

#### （18）localStorage存储对象

  - 如果直接存储对象，需要先将其转换为字符串，可以使用`JSON.stringify()`。

#### （19）JSON.stringify缺点

  - `JSON.stringify()`在序列化对象时，会忽略不可枚举的属性和函数，且不能序列化循环引用的对象。
