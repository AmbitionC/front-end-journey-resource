### 面试中遇到的问题：

#### （1）平时是怎么去学习前端的？

**答题思路**：这类问题考察学习主动性与信息筛选能力。建议按「系统输入 + 实践沉淀 + 持续跟进」组织：

+ **系统输入**：官方文档（MDN、框架官网）打底，配合经典书籍或成体系的课程补足原理。
+ **实践沉淀**：做项目、造轮子、读优秀源码，把知识变成能落地的经验，并输出博客/笔记加深理解。
+ **持续跟进**：关注社区（GitHub Trending、掘金、周刊）和新标准（ES 提案、框架更新），保持技术敏感度。

#### （2）做 GPT 项目的背景和根源？

**答题思路**：这是围绕项目经历的追问，考察你对项目价值的理解。建议讲清「为什么做（业务/痛点）→ 我负责什么 → 用到的关键技术 → 量化产出」。突出你在其中解决的具体问题（如流式响应、上下文管理、Token 计费），避免只复述功能列表。

#### （3）讲一讲流式渲染是什么，以及你在项目中是如何使用的？

**流式渲染（Streaming）** 指服务端不等内容全部就绪，而是**分块（chunk）边生成边下发**，浏览器边接收边渲染，从而更快出现首屏内容。

+ **服务端**：HTTP 响应用 `Transfer-Encoding: chunked`，或基于 SSE（`text/event-stream`）持续推送数据块。
+ **前端**：用 `fetch` 的 `response.body.getReader()` 读取 `ReadableStream`，逐块解码后追加到视图。
+ **典型场景**：GPT 对话中把模型逐字返回的 token 实时打字机式展示，无需等整段回答生成完，显著降低感知延迟。

#### （4）Websocket 跟 HTTP，优缺点？Websocket建立连接的过程，需要详细一点。通讯协议是什么，有哪些？

**WebSocket** 是建立在 TCP 之上的**全双工**通信协议，一次握手后长连接保持，服务端可主动推送。

+ **对比 HTTP**：HTTP 是**请求-响应**、无状态、每次带完整头部、服务端不能主动发消息；WebSocket 建连后头部开销极小、支持双向实时通信，适合聊天、推送、协同编辑。
+ **握手过程**：客户端发起一个特殊的 HTTP 请求，携带 `Upgrade: websocket`、`Connection: Upgrade` 和随机的 `Sec-WebSocket-Key`；服务端校验后返回 `101 Switching Protocols`，并用 Key 加固定 GUID 做 SHA-1 生成 `Sec-WebSocket-Accept` 回传，握手完成后协议从 HTTP 升级为 WebSocket，复用同一条 TCP 连接。
+ **协议标识**：明文用 `ws://`，加密（走 TLS）用 `wss://`。之后数据以**帧（frame）** 为单位收发。

#### （5）说一下Pinia持久化的原理？有哪些实现方式？用插件实现的，那这个插件是做了什么事情？

**核心原理**：Pinia 支持插件机制，插件能拿到每个 store 实例，通过订阅状态变化把数据同步到浏览器存储，页面刷新时再读回来恢复。

+ **手动方式**：在 store 里用 `watch` 监听 state，变化时写入 `localStorage`，初始化时用存储值作为默认 state。
+ **插件方式**（常用 `pinia-plugin-persistedstate`）：插件在 store 创建时先从 `localStorage`/`sessionStorage` 读取并 `store.$patch` 恢复；再用 `store.$subscribe` 监听 state 变更，序列化后写回存储。可配置持久化的 key、存储介质、以及只持久化部分字段（paths）。

#### （6）看代码题：宏任务与微任务 2. 原型链、构造函数、this的指向

**宏任务与微任务**：事件循环每次取**一个宏任务**执行（script 整体、`setTimeout`、`setInterval`、I/O），执行完立即**清空所有微任务**（`Promise.then`、`queueMicrotask`、`MutationObserver`），再进入下一轮宏任务。所以微任务总是先于下一个宏任务执行。

**原型链**：每个对象有 `__proto__` 指向其构造函数的 `prototype`，访问属性时沿原型链向上查找直到 `null`。构造函数的 `prototype.constructor` 指回构造函数本身。

**this 指向**（运行时决定，看调用方式）：默认调用指向全局/`undefined`（严格模式）、方法调用指向调用者对象、`call/apply/bind` 显式绑定、`new` 指向新实例、箭头函数不绑定 this 而继承外层作用域。

#### （7）this 是什么东西，有什么用，我可以拿他来干什么？有什么运用场景？

**this** 是函数执行时的**上下文引用**，它的值不由定义位置决定，而由**调用方式**决定。

+ **作用**：让方法能访问所属对象的属性/其他方法，实现代码复用（同一函数作用于不同对象）。
+ **绑定规则**：方法调用指向对象、`new` 指向实例、`call/apply/bind` 显式指定、箭头函数继承外层 this。
+ **场景**：对象方法内引用自身数据、构造函数/类里初始化实例属性、事件处理函数中指向触发元素、用 `bind` 固定回调的 this。

#### （8）new 一个对象或者函数的时候，它中间发生了什么事情？原理是什么？

`new` 调用构造函数时依次做四步：

**（1）** 创建一个空对象。

**（2）** 把该对象的原型 `__proto__` 指向构造函数的 `prototype`。

**（3）** 将构造函数内的 `this` 绑定到这个新对象并执行函数体。

**（4）** 若构造函数返回的是**对象**则用该返回值，否则返回新创建的对象。

```javascript
function myNew(Fn, ...args) {
  const obj = Object.create(Fn.prototype);
  const res = Fn.apply(obj, args);
  return res instanceof Object ? res : obj;
}
```

#### （9）算法题：求最长上升子字符串？

**答题思路**：以「最长上升子序列（LIS）」为例，`dp[i]` 表示以第 i 个元素结尾的最长上升子序列长度，对每个 i 回看前面所有 `j`，若 `nums[j] < nums[i]` 则 `dp[i] = max(dp[i], dp[j] + 1)`，答案取 `dp` 最大值，时间复杂度 O(n²)。

```javascript
function lengthOfLIS(nums) {
  if (!nums.length) return 0;
  const dp = new Array(nums.length).fill(1);
  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
    }
  }
  return Math.max(...dp);
}
```

若要 O(n log n)，可维护一个「递增尾数组」，用二分查找替换第一个大于等于当前值的位置。

#### （10）当输入 URL，按下回车，浏览器发生了什么事情？

+ **（1）URL 解析与缓存检查**：解析协议/域名，先查浏览器缓存、Service Worker。
+ **（2）DNS 解析**：域名解析成 IP（本地缓存 → 递归查询）。
+ **（3）建立连接**：TCP 三次握手，HTTPS 再做 TLS 握手协商密钥。
+ **（4）发送 HTTP 请求 / 接收响应**：服务端返回 HTML，可能命中协商缓存返回 304。
+ **（5）渲染**：解析 HTML 构建 DOM，解析 CSS 构建 CSSOM，合并成渲染树，再经过布局（Layout）、绘制（Paint）、合成（Composite）上屏；期间遇到 JS 会下载执行。
+ **（6）断开连接**：TCP 四次挥手（keep-alive 下可复用）。

#### （11）在解析html的时候，遇到js会暂停解析html，你有什么办法来让它不暂停吗？

普通 `<script>` 会**阻塞** HTML 解析（要下载并执行完才继续），解决办法主要靠脚本的加载属性：

+ **`defer`**：并行下载脚本，**不阻塞**解析，等 HTML 解析完、`DOMContentLoaded` 之前按顺序执行。适合依赖 DOM、需保证顺序的脚本。
+ **`async`**：并行下载，**下载完立即执行**（会短暂打断解析），执行顺序不保证。适合独立的第三方脚本（如统计）。
+ **其他**：把 `<script>` 放在 `<body>` 底部、动态创建 script 标签插入、用模块 `<script type="module">`（默认 defer 行为）。

#### （12）CSS有什么可以实现动画的？

+ **`transition`**：为属性变化（如 hover）添加过渡，简单的状态间补间动画。
+ **`animation` + `@keyframes`**：定义多帧关键帧，可循环、可控制方向/延迟/次数，实现复杂动画。
+ **`transform`**：位移/缩放/旋转，配合前两者使用，且**由合成器处理不触发重排**，性能好。
+ **性能提示**：优先动画 `transform` 和 `opacity`，避免动画 `width/left/top` 这类引发 Layout 的属性；必要时用 `will-change` 提前提升合成层。

#### （13）知道跨域嘛？要怎么进行解决？有什么方式？

跨域是**浏览器同源策略**的限制：协议、域名、端口任一不同即跨域，请求会被拦截。常见解决方案：

+ **CORS**（主流）：服务端设置 `Access-Control-Allow-Origin` 等响应头允许跨域；非简单请求会先发 `OPTIONS` 预检。
+ **代理**：开发环境用 devServer proxy、生产用 Nginx 反向代理，绕过浏览器限制（服务端之间无同源策略）。
+ **JSONP**：利用 `<script>` 标签不受限，仅支持 GET，现已少用。
+ 其他：`postMessage` 跨窗口通信、`document.domain`（同主域）等。

#### （14）如何去保证、判断用户的登录态？

核心是**服务端签发凭证 + 客户端每次请求携带凭证 + 服务端校验**，两种主流方案：

+ **Session + Cookie**：登录后服务端存 session，返回 sessionId 写入 Cookie，后续请求自动带上，服务端查 session 判断登录态。状态在服务端，利于集中失效，但分布式需共享 session。
+ **Token（JWT）**：登录返回签名的 token，前端存 `localStorage` 或 Cookie，请求放到 `Authorization` 头；服务端用密钥验签即可，无需存储，适合分布式和跨端。可配合短期 access token + refresh token 续期。

#### （15）在vue中有响应式，讲一下响应式是什么？以及如何实现响应式？

**响应式** 指数据变化时，依赖该数据的视图/计算自动更新，无需手动操作 DOM。核心是**数据劫持 + 依赖收集 + 派发更新**。

+ **Vue2**：用 `Object.defineProperty` 给每个属性定义 getter/setter，getter 里收集依赖（Watcher），setter 里通知更新。缺点：无法监听新增/删除属性和数组下标（需 `Vue.set`）。
+ **Vue3**：改用 `Proxy` 代理整个对象，能拦截属性的增删改查、支持数组和 Map/Set，配合 `effect` 做依赖追踪（`track`）与触发（`trigger`），性能与能力都更强。

#### （16）能用原生的方式，不借助vue去实现响应式嘛，怎么实现，有什么方式？

可以，核心思路是**劫持数据读写 + 在读时收集依赖、写时触发回调**。

```javascript
function reactive(obj, effect) {
  return new Proxy(obj, {
    get(target, key) {
      // 依赖收集（此处简化为直接关联 effect）
      return Reflect.get(target, key);
    },
    set(target, key, value) {
      Reflect.set(target, key, value);
      effect(); // 派发更新
      return true;
    },
  });
}
const state = reactive({ count: 0 }, () => console.log('更新', state.count));
state.count++; // 触发更新
```

+ **`Object.defineProperty`**：Vue2 的方式，逐属性定义 getter/setter，需递归处理嵌套对象。
+ **`Proxy`**：Vue3 的方式，代理整个对象，能捕获增删改，无需递归初始化。
+ 更完整的实现要维护「依赖表」（key → effect 集合），配合发布订阅模式做精确更新。

#### （17）pnpm有什么用？他跟npm、yarn有什么区别？你为什么要选择pnpm，他是有什么优势嘛？

**pnpm** 是包管理器，核心优势在于**节省磁盘 + 依赖结构严格**。

+ **硬链接 + 内容寻址存储**：所有包只在全局 store 存一份，项目里通过硬链接引用，多个项目共享，安装快、省空间。
+ **符号链接的非扁平 node_modules**：只有直接依赖被提升到顶层，避免 npm/yarn 扁平化带来的「幽灵依赖」（能引用到没在 package.json 声明的包）。
+ **对比**：npm/yarn 采用扁平化 `node_modules` 会重复拷贝、易产生幽灵依赖；pnpm 更严格、更省空间、安装更快，且天然适合 monorepo（配合 workspace）。
