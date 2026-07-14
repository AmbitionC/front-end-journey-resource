### 面试中的问题：

#### （1）自我介绍

**答题思路**：用 1 分钟讲清「你是谁 + 技术亮点 + 为什么匹配」。建议结构：教育背景 → 最拿得出手的 1~2 个项目及你的角色和量化产出 → 熟悉的技术栈 → 想来该岗位的原因。多用与 JD 相关的关键词，突出与前端开发相关的经验，避免流水账。

#### （2）聊实习 聊项目 20min

**答题思路**：长时间的项目深挖，考察真实经历与技术深度。建议用 **STAR** 结构，围绕 1~2 个核心项目展开：业务背景与要解决的问题 → 你负责的模块和角色 → 关键技术选型及理由、你做的技术决策 → 遇到的难点如何排查解决 → 量化产出。提前准备好项目的架构、数据流、性能优化点，能经得起追问「为什么这么做、还有别的方案吗」。

#### （3）在鉴权方面，如果前端缓存都不可用，那还有什么方案进行辅助

前端缓存（Cookie/localStorage）不可用时，鉴权重心放到**服务端与请求链路**：

+ **服务端会话**：服务端维护 session 状态，凭证靠其他方式携带（如 URL 参数、请求头）。
+ **Token 放请求头**：不依赖自动携带的 Cookie，登录后由 JS 显式把 token 放到 `Authorization` 头随请求发送。
+ **OAuth2 / 单点登录**：交由统一认证中心签发和校验凭证。
+ **短时凭证 + 刷新**：access token 有效期短，配合 refresh token 续期，降低泄露风险。
+ 其他辅助：设备指纹/IP 校验、后端 session 集中存储（如 Redis）做校验兜底。

#### （4）CSRF攻击原理和防御方法

**CSRF（跨站请求伪造）**：攻击者诱导已登录用户访问恶意页面，借用浏览器**自动携带 Cookie** 的特性，以用户身份向目标站点发起非预期的请求。

**防御方法**：

+ **CSRF Token**：服务端下发随机 token，表单/请求头带上，服务端校验，攻击者拿不到该 token。
+ **SameSite Cookie**：设置 `SameSite=Lax/Strict`，跨站请求不携带 Cookie，是现在的主流防线。
+ **校验来源**：验证 `Origin` / `Referer` 头是否为可信域。
+ **二次确认**：敏感操作加验证码或短信确认。

#### （5）为什么说cookie对移动端不友好

+ **跨端/跨域受限**：Cookie 依赖域名和浏览器环境，在 App 内嵌 WebView、Hybrid、原生请求等场景下不易共享和携带，Token 放请求头更灵活。
+ **每次请求都携带**：同域请求会自动带上 Cookie，增加移动网络下的**请求体积和流量开销**。
+ **容量小**：单个 Cookie 约 4KB，存储能力有限。
+ **安全与管理**：需处理 XSS/CSRF、`HttpOnly`、过期等，跨端一致性差。移动端更常用 Token（存本地、放 `Authorization` 头）的无状态方案。

#### （6）webpack方面做了哪些配置去优化首屏

+ **代码分割（Code Splitting）**：`splitChunks` 拆分第三方库和公共模块，路由级动态 `import()` 按需加载，减小首屏包体。
+ **Tree Shaking**：基于 ES Module 静态分析剔除未引用代码（配合 `sideEffects`）。
+ **压缩**：JS 用 Terser、CSS 用 cssnano 压缩，开启 Gzip/Brotli。
+ **按需加载与预取**：`webpackPrefetch`（空闲预取）、`webpackPreload`（当前导航需要）提示浏览器提前加载。
+ **资源优化**：图片压缩、小图转 base64、CDN 托管静态资源、提取 CSS（`mini-css-extract-plugin`）。
+ **缓存**：`contenthash` 命名利于长期缓存，`runtimeChunk` 分离运行时。

#### （7）webpack的构建过程

+ **（1）初始化**：读取配置合并命令行参数，创建 Compiler 实例，加载插件。
+ **（2）编译**：从 `entry` 入口出发，调用 loader 把非 JS 模块（CSS、图片、TS 等）转换成 JS 可识别的模块。
+ **（3）构建依赖图**：解析每个模块的 `import`/`require`，递归找出所有依赖，形成**依赖图（Dependency Graph）**。
+ **（4）生成 chunk**：根据入口和分包规则把模块组织成 chunk。
+ **（5）输出**：把 chunk 转成最终产物（assets），根据 `output` 配置写入磁盘。整个过程通过 Tapable 提供的**钩子**让插件介入各阶段。

#### （8）一个事件循环场景题

**答题思路**：这类题给一段含 `setTimeout`、`Promise`、`async/await` 的代码问输出顺序。核心规则：

+ 先执行**同步代码**（主栈），遇异步注册回调。
+ 主栈清空后**清空所有微任务**（`Promise.then`、`await` 之后的代码、`queueMicrotask`）。
+ 再取**一个宏任务**（`setTimeout`、事件回调）执行，执行完再清空微任务，如此循环。

关键点：`await x` 后面的代码相当于 `.then` 回调，属于微任务；微任务优先级高于宏任务。答题时按「同步 → 微任务队列 → 下一个宏任务」逐步推演即可。

#### （9）进程和线程的一些区别

+ **定义**：进程是操作系统**资源分配**的基本单位，线程是 **CPU 调度**的基本单位；一个进程可包含多个线程。
+ **资源**：进程间内存独立、互相隔离；同进程内线程**共享内存和资源**（堆、全局变量），但各有独立的栈和程序计数器。
+ **开销**：进程创建/切换开销大、通信需 IPC（管道、消息队列等）；线程切换轻、通信直接读共享内存，但需加锁避免竞态。
+ **稳定性**：一个进程崩溃不影响其他进程；一个线程崩溃可能拖垮整个进程。
+ **举例**：浏览器多进程架构（渲染进程、GPU 进程等），渲染进程内又有 JS 引擎线程、GUI 线程、事件触发线程等。

### 做题：

#### （10）一个类方法的题

**答题思路**：这类题考察 `class` 语法、实例方法与静态方法、`this` 指向和原型。要点：

+ **实例方法**定义在原型上，需实例调用，可访问实例属性；**静态方法**用 `static` 声明，挂在类本身，通过 `类名.方法()` 调用，不能访问实例。
+ **`this` 指向**：方法作为回调传递时可能丢失 `this`，需 `bind` 或箭头函数（类字段）绑定。
+ 注意私有字段 `#x`、getter/setter、继承时 `super` 的用法。

```javascript
class Counter {
  count = 0;
  inc = () => this.count++;      // 类字段箭头函数，this 恒定
  static create() { return new Counter(); } // 静态方法
}
```

#### （11）一个二叉树层序遍历的变体

**答题思路**：层序遍历用 **BFS + 队列**，关键技巧是**每层开始时记录当前队列长度**，一次内层循环处理完整一层，从而能按层分组（变体如锯齿遍历、每层最大值、右视图等都基于此）。

```javascript
function levelOrder(root) {
  if (!root) return [];
  const res = [], queue = [root];
  while (queue.length) {
    const size = queue.length, level = [];
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    res.push(level); // 变体：如锯齿遍历可对偶数层 level.reverse()
  }
  return res;
}
```
