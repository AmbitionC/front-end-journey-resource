### 面试中的问题：

#### （1）Vue的响应式实现机制

响应式核心是**数据劫持 + 依赖收集**：读取数据时收集用到它的「依赖」（watcher/effect），数据变化时通知这些依赖重新执行。

+ **Vue 2**：用 `Object.defineProperty` 给每个属性劫持 getter/setter。缺陷是**无法检测属性的新增/删除**（需 `Vue.set`）、数组下标和 length 变化，还要递归遍历对象一次性劫持。
+ **Vue 3**：改用 **Proxy** 代理整个对象，能拦截属性增删、数组变化，且**惰性递归**（访问到嵌套对象才代理），性能更好、无需 `Vue.set`。依赖收集用 `track`、触发更新用 `trigger`，配合 `effect` 实现。

#### （2）Promise的原理和异常处理

Promise 是异步编程的解决方案，代表一个未来才会结束的操作，有 **pending / fulfilled / rejected** 三态，状态一旦改变**不可逆**。`then` 注册成功/失败回调并**返回新 Promise**，因此可链式调用。

**异常处理**：

+ 构造函数或 `then` 回调中抛出的错误、以及 `reject` 都会被后续的 `catch` 捕获。
+ `catch` 本质是 `then(null, onRejected)`，链式中任意环节出错会「冒泡」到最近的 catch。
+ `async/await` 场景用 `try/catch` 包裹；同步的 `try/catch` **无法**捕获未 await 的 Promise 异步错误。
+ `finally` 无论成败都执行，适合清理。

#### （3）async/await的使用和reject操作

`async/await` 是基于 Promise 的语法糖，用**同步的写法**写异步代码。`async` 函数总是返回 Promise，`await` 会「暂停」函数执行直到后面的 Promise 落定并取出结果。

+ **处理 reject**：被 await 的 Promise 若 reject，会在 await 处**抛出异常**，用 `try/catch` 捕获；也可以 `await promise.catch(...)` 就地兜底。
+ **并发优化**：多个互不依赖的异步任务别串行 await，用 `Promise.all([...])` 并发，任一失败则整体 reject（可用 `Promise.allSettled` 拿到全部结果）。

```javascript
async function load() {
  try {
    const [a, b] = await Promise.all([fetchA(), fetchB()]);
    return { a, b };
  } catch (err) {
    console.error("失败：", err);
  }
}
```

#### （4）TypeScript与JavaScript的对比

TS 是 JS 的**超集**，在 JS 之上加了**静态类型系统**，最终编译成 JS 运行（类型仅存在于编译期，运行时被擦除）。

+ **类型安全**：编译期就能发现类型错误、拼写错误，减少运行时 bug。
+ **开发体验**：类型即文档，IDE 能精准补全、跳转、重构。
+ **工程能力**：接口（interface）、泛型、枚举、联合/交叉类型让大型项目更好维护。
+ **代价**：需要编译步骤、要写类型、有学习成本；类型不保证运行时安全（外部数据仍需校验）。

#### （5）事件循环和定时器的准确性

JS 是单线程，靠**事件循环**调度：同步代码走**调用栈**，异步回调进任务队列。每轮循环先清空所有**微任务**（Promise.then、queueMicrotask），再取一个**宏任务**（setTimeout、事件、I/O）执行，如此往复。

**定时器为什么不准**：`setTimeout(fn, 1000)` 只保证「**至少**」1000ms 后把回调放入队列，实际执行还要等调用栈清空、前面的宏任务跑完，所以有延迟累积。

+ **requestAnimationFrame**：与屏幕刷新率同步（约每 16.7ms 一帧），适合做动画，比 setTimeout 更平滑、页面不可见时自动暂停。
+ **高精度**：需要精确计时用 `performance.now()`，长间隔可用「目标时间戳 + 每帧校正」的方式补偿误差。

#### （6）JavaScript的数据类型和null、undefined的特殊性质

**7 种原始类型**：`undefined`、`null`、`number`、`string`、`boolean`、`symbol`、`bigint`；外加**引用类型** `object`（含数组、函数等）。

+ **undefined**：变量声明未赋值、函数无返回值、访问不存在的属性时的默认值。
+ **null**：表示「有意的空值」，常用于主动清空引用。
+ **典型考点**：`typeof null === "object"`（历史遗留 bug）；`null == undefined` 为 `true`（宽松相等会做转换），但 `null === undefined` 为 `false`。判断类型更可靠用 `Object.prototype.toString.call(x)`。

#### （7）内存的堆和栈，数据类型的存储位置

+ **栈（Stack）**：空间小、存取快、由系统自动管理。存放**基本类型的值**和**引用类型的地址（指针）**、以及函数调用的执行上下文。
+ **堆（Heap）**：空间大、存取相对慢。存放**引用类型的实际数据**（对象、数组、函数）。

因此：基本类型赋值是**值拷贝**（互不影响）；引用类型赋值拷贝的是**地址**，两个变量指向同一个堆对象，改一个另一个也变。不再被引用的堆对象由**垃圾回收**（标记清除）自动释放。

#### （8）跨域问题的原因和解决方案

**原因**：浏览器的**同源策略**——协议、域名、端口三者任一不同即跨域，出于安全会拦截跨域的 AJAX 响应（请求其实发出去了，是响应被浏览器拦下）。

**解决方案**：

+ **CORS**（主流）：服务端设置 `Access-Control-Allow-Origin` 等响应头允许指定源；带 cookie 需 `credentials` 配合。复杂请求会先发 `OPTIONS` 预检。
+ **代理**：开发时用 devServer proxy、生产用 Nginx 反向代理，让请求变成同源转发。
+ **JSONP**：利用 `<script>` 标签不受同源限制，只支持 GET，已较少用。
+ 其他：`postMessage`（跨窗口通信）、document.domain（同主域）等。

#### （9）编译打包工具的使用和配置

主流工具及定位：

+ **Webpack**：功能最全、生态成熟，通过 entry/output/loader/plugin 配置，适合复杂工程；缺点是大项目冷启动/构建慢。
+ **Vite**：开发环境基于**原生 ESM + esbuild** 免打包按需编译，启动秒开、HMR 快；生产用 Rollup 打包。
+ **esbuild / SWC**：用 Go/Rust 写的极速转译器，常作为其他工具的底层加速。

**常见配置项**：入口出口、别名（alias）、loader/插件、代码分割（splitChunks）、环境变量、source map、Tree Shaking 与压缩。选型看项目规模和对构建速度的诉求。

#### （10）Vue项目的性能优化策略

+ **加载优化**：路由懒加载 + 组件异步加载、代码分割、gzip/CDN、图片懒加载与压缩，减小首屏体积。
+ **渲染优化**：列表用稳定 `key`、长列表用**虚拟滚动**、`v-if`（销毁重建）与 `v-show`（切换显示）按场景取舍、避免 `v-if` 和 `v-for` 同用。
+ **响应式/计算优化**：用 `computed` 缓存派生值、`v-once`/`v-memo` 跳过重复渲染、大数据用 `Object.freeze` 免去响应式劫持开销。
+ **打包优化**：Tree Shaking、组件库按需引入、分析并拆分大依赖。

#### （11）CSS的flex布局原理

给容器设 `display: flex` 后，子元素成为 flex item，沿**主轴**和**交叉轴**排列。主轴方向由 `flex-direction` 决定（默认水平）。

+ **容器属性**：`justify-content`（主轴对齐）、`align-items`（交叉轴对齐）、`flex-wrap`（是否换行）、`gap`（间距）。
+ **子项属性**：`flex-grow`（放大比例）、`flex-shrink`（缩小比例）、`flex-basis`（基准尺寸），简写为 `flex: 1`。
+ **优势**：一维布局的对齐、分配空间、自适应非常方便，是响应式布局的主力（二维布局用 Grid）。

#### （12）CSS长度单位的理解和使用

+ **px**：绝对像素，精确但不随环境缩放。
+ **em**：相对**父/当前元素的 font-size**，会层层叠加，适合按文字缩放的内边距等。
+ **rem**：相对**根元素（html）的 font-size**，不受父级影响，常配合根字号做整站响应式缩放。
+ **vw / vh**：视口宽/高的 1%，适合做全屏、随窗口自适应的尺寸。
+ **%**：相对包含块对应属性的百分比。

**实践**：字体和整体缩放用 rem、布局占比用 % 或 flex/grid、视口相关用 vw/vh，配合 `clamp()` 做流式响应式。

#### （13）浏览器从输入URL到页面渲染的详细过程

+ **（1）URL 解析与缓存检查**：解析 URL，先查浏览器/系统缓存。
+ **（2）DNS 解析**：域名解析为 IP（逐级查缓存 → 本地 → DNS 服务器）。
+ **（3）建立连接**：TCP 三次握手，HTTPS 还要 TLS 握手协商密钥。
+ **（4）发送请求 / 接收响应**：发 HTTP 请求，服务端返回 HTML；可能命中强/协商缓存。
+ **（5）浏览器渲染**：解析 HTML 构建 **DOM 树**、解析 CSS 构建 **CSSOM**，合成 **Render Tree** → **Layout（回流）**算位置尺寸 → **Paint** 绘制 → **Composite** 合成上屏。
+ **（6）JS 执行**：遇到 `<script>` 默认阻塞解析（`defer/async` 可优化），JS 可修改 DOM/CSSOM 触发**回流/重绘**。

期间还有 TCP 挥手、资源并行加载等细节。
