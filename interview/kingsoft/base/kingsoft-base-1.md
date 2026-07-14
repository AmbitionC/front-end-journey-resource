### 一面问题总结：

#### （1）项目介绍和经验分享

**答题思路**：用 STAR 结构讲一个最有代表性的项目——背景与你的角色、遇到的技术难点、你的方案与取舍、最终**量化产出**（性能提升、体验改善、上线效果）。突出你**独立负责**和**主动优化**的部分，避免流水账式罗列功能。

#### （2）浏览器资源解析顺序的调整

浏览器自上而下解析 HTML，遇到资源会影响渲染时机，可据此调整加载顺序：

+ **CSS**：放 `<head>`，尽早下载，避免无样式闪烁（FOUC）。
+ **JS**：用 `defer`（按顺序、DOMContentLoaded 前执行）或 `async`（下载完即执行、不保证顺序）避免阻塞解析；关键脚本可内联。
+ **优先级提示**：`<link rel="preload">` 提前加载关键资源、`prefetch` 预取后续资源、`preconnect` 提前建连。

#### （3）图片加载优化策略

+ **懒加载**：`loading="lazy"` 或 IntersectionObserver，视口外不加载。
+ **格式与压缩**：优先 WebP/AVIF，配合 `<picture>` 按浏览器降级。
+ **响应式**：`srcset`/`sizes` 按 DPR 和视口给不同尺寸，避免大图小用。
+ **其他**：雪碧图/字体图标合并小图、CDN 分发、占位图 + 渐进加载、首屏图片 `preload`。

#### （4）CSS样式冲突处理

+ **作用域隔离**：CSS Modules、Scoped CSS（Vue `scoped`）、Shadow DOM。
+ **命名规范**：BEM 约定，降低全局选择器冲突。
+ **优先级**：理解权重（内联 > id > class > 标签），慎用 `!important`。
+ **工程化**：CSS-in-JS、原子化 CSS（Tailwind）从源头避免命名碰撞。

#### （5）JS对象实例判断

+ **`instanceof`**：沿原型链检查构造函数的 `prototype` 是否存在，跨 iframe/realm 会失效。
+ **`Object.prototype.toString.call(x)`**：返回 `[object Type]`，可靠区分内置类型（数组、Date、null 等）。
+ **`Array.isArray()`**：专门判断数组，跨 realm 也可靠。
+ **`constructor`**：`x.constructor === Foo`，但可被改写，不够稳。

#### （6）事件代理的概念和应用

事件代理（委托）利用**事件冒泡**：把子元素的监听器统一绑到父元素上，通过 `event.target` 判断实际触发的子元素。**好处**：减少监听器数量、节省内存，且对**动态新增**的子元素自动生效。典型场景：长列表、表格行操作按钮。注意 `focus/blur` 等不冒泡的事件不适用（需用捕获或 `focusin`）。

#### （7）浏览器缓存策略

分两层：

+ **强缓存**：命中则不发请求。`Cache-Control: max-age`（优先）、`Expires`（旧、绝对时间）。
+ **协商缓存**：强缓存失效后带条件请求校验。`ETag`/`If-None-Match`（内容哈希）、`Last-Modified`/`If-Modified-Since`（修改时间），命中返回 `304`。

实践：静态资源文件名带 hash + 长 `max-age` 永久强缓存，HTML 用协商缓存保证更新。

#### （8）npm安装流程

`npm install` 大致流程：**（1）** 读取 `package.json` 依赖，结合 `package-lock.json` 确定版本；**（2）** 构建依赖树并做**扁平化**（尽量提升到顶层 `node_modules` 以复用、避免嵌套）；**（3）** 从缓存或 registry 下载 tar 包并校验完整性（`integrity`）；**（4）** 解压落盘、执行生命周期脚本（`preinstall/postinstall`），并写回 lock 文件。

#### （9）npm下载速度优化和空间占用减少

+ **换源/代理**：淘宝镜像、企业私有 registry，或 `nrm` 切换。
+ **包管理器**：用 **pnpm**——全局内容寻址存储 + 硬链接，磁盘占用和安装速度都优于 npm。
+ **缓存与锁**：CI 缓存 `~/.npm`、用 `npm ci` 按 lock 精确安装。
+ **精简依赖**：清理无用依赖、区分 `dependencies/devDependencies`。

#### （10）yarn和npm的对比

+ **lock 文件**：`yarn.lock` vs `package-lock.json`，都锁定版本保证一致性。
+ **历史差异**：早期 yarn 以并行安装、离线缓存、确定性安装领先，npm 5+ 已补齐大部分。
+ **Workspaces**：两者都支持 monorepo。
+ **现状**：yarn Berry（PnP）走了不同路线；追求速度与省盘更推荐 **pnpm**。选型看团队与生态一致性即可。

#### （11）第三方包修改和安装

需要改第三方包时：

+ **patch-package**：改完 `node_modules` 后生成补丁文件，随安装自动应用，适合小改动。
+ **fork/私有包**：改动大就 fork 后发到私有 registry，或用 `npm link`/workspace 本地联调。
+ **overrides/resolutions**：仅需锁定间接依赖版本时，用 `package.json` 的 `overrides`（npm）或 `resolutions`（yarn）。

#### （12）Vuex的作用

Vuex 是 Vue 的**集中式状态管理**，解决多组件共享状态与跨层级通信混乱的问题。核心概念：`state`（单一数据源）、`getters`（派生状态）、`mutations`（**同步**修改，唯一改 state 的途径，便于追踪）、`actions`（处理异步再提交 mutation）、`modules`（模块拆分）。**单向数据流**让状态变化可预测、可调试。Vue3 中更推荐更轻量的 **Pinia**。

#### （13）跨站脚本攻击的预防

XSS 是攻击者注入并执行恶意脚本。防御：

+ **输出转义**：对插入 HTML 的用户内容做转义，避免直接 `innerHTML`。
+ **框架默认防护**：React/Vue 默认转义插值，慎用 `dangerouslySetInnerHTML`/`v-html`。
+ **CSP**：设置 `Content-Security-Policy` 限制脚本来源。
+ **其他**：`HttpOnly` Cookie 防脚本窃取、富文本白名单过滤（DOMPurify）。

#### （14）全局错误捕获和处理

+ **JS 运行时错误**：`window.onerror`、`window.addEventListener('error')`（`error` 事件还能捕获资源加载失败）。
+ **未处理的 Promise**：`window.addEventListener('unhandledrejection')`。
+ **框架层**：Vue `errorHandler`、React Error Boundary（`componentDidCatch`）。
+ **落地**：统一收集后上报到监控平台（如 Sentry），配合 sourcemap 定位。

#### （15）异步请求的统一提示处理

在 **Axios 拦截器**里统一处理，避免每个请求重复写：

+ **请求拦截**：统一加 token、开 loading。
+ **响应拦截**：按业务 code / HTTP status 统一处理——401 跳登录、5xx 弹通用错误提示、成功关 loading。
+ **体验优化**：请求合并/防抖、错误 message 去重、超时重试。这样把提示逻辑收敛到一处，业务代码只关心数据。

#### （16）个人前端技术优势

**答题思路**：挑 1~2 个你真正扎实的方向讲深（如性能优化、工程化、某框架源码、可视化），用具体项目和成果佐证，而非空泛说「基础扎实」。结尾可点出学习能力与解决问题的方法论，让优势可信、可迁移。

#### （16）性能优化策略

分维度回答，体现体系化认知：

+ **加载**：资源压缩/懒加载、代码分割与 Tree Shaking、CDN、缓存策略、preload。
+ **渲染**：减少重排重绘、虚拟列表、防抖节流、`requestAnimationFrame`、骨架屏。
+ **框架**：合理 `key`、避免不必要渲染（`memo`/`shouldComponentUpdate`）、按需引入。
+ **度量**：用 Lighthouse、Performance 面板、Web Vitals（LCP/FID/CLS）定位并验证收益。

#### （17）最近的学习计划

**答题思路**：展示持续学习的意愿与方向感。给出**具体**目标（如深入某框架源码、系统学习 TS 类型体操、补齐工程化/Node 能力）、学习方式（读文档/源码、做项目、写总结）和与岗位的关联，避免泛泛而谈「多学习」。

#### （18）反问环节

**答题思路**：借反问表现兴趣与思考。可问：团队技术栈与工程化程度、我将参与的业务和产品阶段、成长路径与 code review 文化、当前团队最大的技术挑战。避免一上来只问薪资、加班等细节。

### 二面问题总结：

#### （1）内存泄漏的场景和分析方法

常见泄漏场景：

+ 未清理的**定时器/事件监听器**、未取消的订阅。
+ **闭包**长期持有大对象引用。
+ 脱离 DOM 但仍被 JS 引用的**游离节点**。
+ 全局变量、缓存（Map/数组）只增不删。

**分析方法**：Chrome DevTools Memory 面板，用 **Heap Snapshot** 多次快照对比增长、`Detached` 节点，或 **Performance/Allocation timeline** 观察内存是否持续攀升不回落。

#### （2）大型前端项目编译时间优化

+ **缓存**：持久化缓存（Webpack5 `cache: filesystem`）、`babel-loader` 缓存。
+ **减少工作量**：`include/exclude` 缩小 loader 范围、`thread-loader` 多进程、按需编译。
+ **更快的工具链**：用 **Vite/esbuild/SWC** 替代 babel，dev 环境用原生 ESM 免打包。
+ **拆分**：合理 code splitting、DLL（旧方案）、Module Federation 拆子应用独立构建。

#### （3）模块化的理解

模块化把代码按功能拆成独立、可复用、作用域隔离的单元，解决全局污染和依赖管理问题。规范演进：

+ **CommonJS**：Node 使用，`require`/`module.exports`，**同步**加载、运行时。
+ **AMD**：浏览器异步（RequireJS）。
+ **ES Module**：语言标准，`import/export`，**静态**结构，支持 Tree Shaking，编译时确定依赖。

#### （4）栈和队列的区别

+ **栈（Stack）**：**后进先出（LIFO）**，只在栈顶操作（push/pop）。用于函数调用栈、撤销、括号匹配。
+ **队列（Queue）**：**先进先出（FIFO）**，队尾入、队头出。用于任务调度、BFS、消息缓冲。

两者都是线性结构，区别在于访问端点不同。

#### （5）链表环的判断方法

用**快慢指针**（Floyd 判圈）：慢指针每次走一步、快指针走两步，若存在环，快指针最终会追上慢指针（相遇）；若快指针走到 `null` 则无环。时间 `O(n)`、空间 `O(1)`。

```javascript
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}
```

如需找**入环节点**，相遇后让一指针回到头，两指针同速前进，再次相遇处即入口。

#### （6）反问环节

**答题思路**：二面通常是资深工程师，可问更技术的问题：团队的架构演进与技术债、如何做技术选型和 code review、你所在方向未来一年的规划，以及对候选人上手后的期望，展现深度与匹配度。

### HR面问题总结：

#### （1）学习前端的方法和经历

**答题思路**：讲清你的学习路径和方法论——从入门到深入的关键节点、遇到瓶颈如何突破（读文档/源码、做项目、总结输出）。重点体现**自驱力和持续成长**，用具体例子而非「我很爱学习」的空话。

#### （2）解决问题的思路和策略

**答题思路**：给出结构化方法：复现并定位问题 → 拆解与假设 → 查资料/看源码/最小复现验证 → 解决并复盘沉淀。举一个你独立排查线上或疑难 bug 的真实例子，体现逻辑性和主动性。

#### （3）个人最大的成就

**答题思路**：选一个能体现你**能力和影响力**的成就（可以是项目难点攻克、性能大幅提升、推动某项改进），用 STAR 说清你的贡献和量化结果。真实、具体、与目标岗位能力相关即可，不必刻意夸大。

#### （4）个人基本信息

**答题思路**：如实、简洁地介绍教育背景、求职意向、到岗时间与稳定性等 HR 关心的信息。回答坦诚、逻辑清晰，对职业规划表达出与岗位一致的稳定预期即可。
