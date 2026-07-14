### 面试中遇到的问题：

#### （1）TS限定变量类型与后端赋值

TypeScript 的类型只在**编译期**存在，编译成 JS 后类型信息被完全擦除，**运行时不做任何检查**。所以后端返回的数据即使声明成某个 interface，也不能保证运行时真的是这个结构。

+ **拿到数据**：接口返回值一般标注为具体类型或 `unknown`，避免直接用 `any` 丢掉类型保护。
+ **保证正确**：关键数据在运行时用**类型守卫**（`typeof`、`in`、自定义 `is` 谓词）或 zod / io-ts 等**运行时校验库**做校验，而不是仅靠 `as` 断言——断言只是骗过编译器，数据错了照样崩。

#### （2）Vue2/3双向数据绑定

`v-model` 本质是**语法糖**：`:value` 绑定 + `@input` 监听。底层依赖响应式系统实现数据变更驱动视图。

+ **Vue 2**：用 `Object.defineProperty` 劫持每个属性的 getter/setter。缺陷是无法监听**属性的新增/删除**（需 `Vue.set`）和**数组下标**变更，且要递归遍历对象做初始化。
+ **Vue 3**：改用 `Proxy` 代理整个对象，能拦截属性增删、数组索引等所有操作，**惰性递归**（访问到才代理嵌套对象），性能更好。
+ **组件用法差异**：Vue 3 中 `v-model` 默认对应 `modelValue` prop 和 `update:modelValue` 事件，并支持多个 `v-model:xxx`。

#### （3）Node.js介绍

Node.js 是基于 Chrome **V8 引擎**的 JavaScript 运行时，让 JS 能脱离浏览器运行在服务端。它用 **libuv** 提供事件循环和异步 I/O，采用**单线程 + 事件驱动 + 非阻塞 I/O**模型，适合高并发、I/O 密集型场景（接口服务、网关、实时通信）。生态上有 npm 包管理和 CommonJS/ESM 模块系统。

#### （4）Node.js线程模型

**主线程是单线程**的：JS 代码在一个线程上跑事件循环，不会因为多线程产生锁竞争。但「单线程」不代表整个进程只有一个线程。

+ **事件循环**：libuv 驱动，分 timers、poll、check 等多个阶段，配合宏任务/微任务队列调度回调。
+ **线程池**：libuv 默认有 4 个线程（`UV_THREADPOOL_SIZE` 可调），处理文件 I/O、DNS、`crypto` 等无法异步化的操作。
+ **多核利用**：CPU 密集任务用 `worker_threads` 开工作线程，或用 `cluster` / 多进程（PM2）把请求分摊到多核。

#### （5）Node.js流

流（Stream）是**分块**处理数据的抽象，不用把整份数据一次性读进内存，边读边处理，省内存也更快。

+ **四种类型**：可读流（Readable，如 `fs.createReadStream`）、可写流（Writable，如 HTTP response）、双工流（Duplex，如 TCP socket）、转换流（Transform，如 gzip 压缩）。
+ **背压（backpressure）**：`pipe()` 会在下游消费不过来时自动暂停上游，避免内存被撑爆，这是流相比一次性读写的关键优势。

#### （6）后端接口数据格式

主流是 **JSON**：文本格式、可读性好、`JSON.parse/stringify` 原生支持、与前端对象天然对应，适合前后端分离。此外还有 **form-data / x-www-form-urlencoded**（表单、文件上传）、**Protobuf**（二进制、体积小性能高，多用于 RPC/gRPC 内部服务）、**XML**（旧系统、SOAP）。选型看场景：对外接口 JSON 为主，高性能内部通信可上 Protobuf。

#### （7）流式传输

流式传输指数据**边生成边发送、边接收边消费**，不用等全部就绪。好处是首字节延迟低、内存占用小。

+ **HTTP 层**：靠 `Transfer-Encoding: chunked` 分块传输，或 `Content-Type: text/event-stream`（SSE）持续推送。
+ **典型场景**：视频/音频点播（边下边播）、大文件下载、大模型逐字输出、日志实时推送。前端可用 `fetch` 的 `response.body.getReader()` 逐块读取。

#### （8）OAuth协议

OAuth 2.0 是**授权**框架（注意是授权 Authorization，不是认证），让用户在不暴露账号密码的前提下，授权第三方应用访问自己在资源服务器上的部分数据（如「用微信登录」「授权读取通讯录」）。

+ **四个角色**：资源拥有者（用户）、客户端（第三方应用）、授权服务器、资源服务器。
+ **授权码模式（最常用）**：客户端引导用户到授权服务器登录同意 → 拿到临时 **code** → 后端用 code + client_secret 换取 **access_token** → 用 token 访问资源。code 换 token 放在后端，避免 token 泄露。

#### （9）Session机制

HTTP 无状态，Session 用来在服务端**保存用户登录态**。流程：用户登录成功后服务端生成 `sessionId` 并存储会话数据，把 `sessionId` 通过 **Cookie** 下发给浏览器；后续请求自动带上 Cookie，服务端据此找回会话。

+ **优点**：数据存服务端，客户端只有一个 ID，安全性较高，可随时在服务端主动失效。
+ **缺点**：占服务器内存，且**分布式部署有共享问题**——需把 Session 存到 Redis 等集中存储，否则要靠粘性会话。这也是无状态的 JWT 出现的动机。

#### （10）队列

队列是**先进先出（FIFO）**的线性数据结构，一端入队（enqueue）、另一端出队（dequeue）。JS 里可用数组 `push`/`shift` 模拟，但 `shift` 是 O(n)，量大时用双指针或链表实现 O(1)。

+ **应用**：事件循环的任务队列、消息队列（Kafka/RabbitMQ）削峰解耦、BFS 广度优先遍历、请求限流的等待队列。
+ **变体**：双端队列（Deque）、优先队列（堆实现，按优先级出队）。

#### （11）Promise队列

Promise 的回调进入**微任务队列（microtask queue）**，优先级高于宏任务（setTimeout 等），每次宏任务结束后会清空所有微任务再进入下一轮。

+ **并行 vs 串行**：`Promise.all([p1, p2])` 里的异步任务是**并发发起**的（谁先创建谁先跑），但 `.then` 链是**串行**的——前一个 `then` 的返回值传给下一个。
+ **控制并发**：需要「一批请求做完再做下一批」用 `Promise.all`；需要限制并发数（如同时最多 3 个请求）要自己实现并发池，用递归或 `while` 从任务数组里取任务补位。

#### （12）JWT

JWT（JSON Web Token）是**无状态**认证方案，token 自身携带用户信息，服务端不用存会话。由 `.` 分隔的三部分组成：

+ **Header**：算法与类型（如 `HS256`）。
+ **Payload**：载荷/声明（用户 id、过期时间 exp 等），只是 Base64Url 编码，**不加密，不能放敏感信息**。
+ **Signature**：用密钥对前两部分签名，防篡改。改了 payload 签名就对不上。

优点是天然适合分布式（服务端无需共享 Session）；缺点是签发后**难以主动失效**，一般靠短有效期 + refresh token，或维护黑名单来兜底。

#### （13）localStorage存储JSON

`localStorage` 只能存**字符串**。要存对象或数组，需先 `JSON.stringify(obj)` 序列化再 `setItem`，读取时 `JSON.parse(getItem(...))` 反序列化。数组同理——它本质也是通过 JSON 字符串保存的，取出后 parse 回数组即可。

#### （14）localStorage与cookie

+ **容量**：localStorage 约 5~10MB；cookie 仅约 4KB。
+ **随请求发送**：cookie 会**自动附加在同域每次 HTTP 请求头**里（增加带宽、可做服务端鉴权）；localStorage 纯客户端存储，不会自动发送。
+ **生命周期**：localStorage 持久保存，需手动清除；cookie 可设 `expires`/`max-age`，不设则为会话级。
+ **访问**：都能被 JS 读取；但 cookie 可加 `HttpOnly` 禁止 JS 访问（防 XSS 窃取），localStorage 无此保护。

#### （15）刷新后数据保留

刷新页面属于同一浏览器上下文，三种存储表现不同：

+ **localStorage**：持久保留，除非手动清除或用户清缓存。
+ **cookie**：在有效期内保留，过期或会话级 cookie 关闭标签页后清除。
+ **sessionStorage**：**刷新保留，但关闭标签页即清空**，且不跨标签页共享。这是它和 localStorage 的核心区别。

#### （16）localStorage存储位置

数据存在**浏览器本地磁盘**（各浏览器有自己的存储文件/数据库），按**同源（协议 + 域名 + 端口）**隔离。也就是说 `https://a.com` 和 `http://a.com`、`a.com` 与 `b.com` 的 localStorage 互不可见，遵循同源策略。

#### （17）localStorage键值对存储

localStorage 是 **key-value** 结构，键和值都必须是**字符串**。核心 API：`setItem(key, value)`、`getItem(key)`、`removeItem(key)`、`clear()`，以及 `key(index)`、`length`。存非字符串会被隐式转成字符串（如存对象会变成 `"[object Object]"`），所以对象一定要先 `JSON.stringify`。

#### （18）localStorage存储对象

直接 `setItem('user', obj)` 会得到 `"[object Object]"`，丢失数据。正确做法是序列化：

```javascript
localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Tom' }));
const user = JSON.parse(localStorage.getItem('user'));
```

注意 `JSON.stringify` 会丢掉函数、`undefined`、`Symbol`，无法处理循环引用，`Date` 会变成字符串——存复杂对象时要留意。

#### （19）JSON.stringify缺点

+ **丢失特殊值**：`function`、`undefined`、`Symbol` 作为对象属性会被**忽略**，作为数组元素会变成 `null`。
+ **循环引用报错**：对象存在循环引用时直接抛 `TypeError`。
+ **类型失真**：`Date` 变成 ISO 字符串（parse 回来是字符串不是 Date）；`NaN`/`Infinity` 变成 `null`；`BigInt` 直接报错；`Map`/`Set` 变成空对象 `{}`。
+ **忽略不可枚举属性**：只序列化自身可枚举属性，原型链上的属性不处理。

处理循环引用/特殊类型时可传第二个参数 `replacer` 自定义，或改用 `structuredClone`（深拷贝，但不产生字符串）。
