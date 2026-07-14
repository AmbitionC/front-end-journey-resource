### 面试问题记录：

#### （1）网页加载的过程

从输入 URL 到页面呈现：**URL 解析与缓存检查 → DNS 解析拿到 IP → 建立 TCP 连接（三次握手，HTTPS 再加 TLS）→ 发送 HTTP 请求 → 服务器响应返回 HTML → 浏览器解析渲染（构建 DOM/CSSOM、生成渲染树、布局、绘制、合成）**。期间还会并行请求 CSS、JS、图片等子资源。

#### （2）一个完整的URL的结构

一个完整 URL 由以下部分组成：

`协议://用户名:密码@主机名:端口/路径?查询字符串#锚点`

+ **协议**：如 `http`、`https`。
+ **主机/域名**与**端口**（http 默认 80、https 默认 443，默认时可省略）。
+ **路径**：定位服务器资源。
+ **查询字符串**：`?key=value` 传参。
+ **锚点（fragment）**：`#` 后内容定位页面内位置，不发送给服务器。

#### （3）DNS的存在意义和作用

**DNS** 把便于记忆的**域名解析为机器识别的 IP 地址**，让用户无需记 IP 即可访问网站。它采用**分级分布式**架构（根 → 顶级域 → 权威域名服务器）和**多级缓存**（浏览器、系统、本地 DNS），既保证可读性，又降低查询延迟和单点压力。

#### （4）http默认端口号

HTTP 的默认端口是 **80**，HTTPS 的默认端口是 **443**。使用默认端口时 URL 中可省略不写。

#### （5）http和https的区别

+ **安全性**：HTTP 明文传输，易被窃听篡改；HTTPS 在 TCP 与 HTTP 之间加 **TLS/SSL** 层，提供**加密、完整性校验和身份认证**。
+ **端口**：HTTP 用 80，HTTPS 用 443。
+ **成本**：HTTPS 需 CA 证书，多一次 TLS 握手，但安全性远高，是当前标配。

#### （6）React数据管理包的下载和管理

用 **npm** 或 **Yarn/pnpm** 安装依赖，如 `npm install redux react-redux` 或 `yarn add zustand`。依赖及版本记录在 `package.json`，`package-lock.json`/`yarn.lock` 锁定精确版本保证团队环境一致。React 常见的状态管理库有 Redux（Redux Toolkit）、Zustand、Recoil、MobX 等。

#### （7）包管理工具

+ **npm**：Node 自带，生态最全，早期存在扁平化依赖冗余问题。
+ **Yarn**：引入 lockfile 和并行安装，早期在速度和确定性上优于 npm。
+ **pnpm**：用**硬链接 + 内容寻址存储**，全局只存一份依赖，磁盘占用小、安装快，且依赖结构更严格（避免幽灵依赖）。

#### （8）响应式布局的实现

常见手段：

+ **媒体查询**：`@media` 按屏幕宽度切换样式。
+ **相对单位**：`%`、`em`、`rem`、`vw`/`vh` 让尺寸随视口/字体缩放。
+ **弹性布局**：Flexbox、Grid 自适应排列。
+ **移动端**：配合 `<meta name="viewport">` 和 rem/vw 适配方案。

#### （9）flex布局的属性

+ **容器属性**：`flex-direction`（主轴方向）、`justify-content`（主轴对齐）、`align-items`（交叉轴对齐）、`flex-wrap`（换行）。
+ **项目属性**：`flex-grow`、`flex-shrink`、`flex-basis`（简写 `flex`）、`align-self`、`order`。

#### （10）flex主轴方向的改变

用容器的 **`flex-direction`** 属性设置主轴方向，取值：`row`（默认，水平从左到右）、`row-reverse`、`column`（垂直）、`column-reverse`。主轴方向改变后，`justify-content` 与 `align-items` 作用的轴向也随之互换。

#### （11）CSS预处理器

**Sass/Less/Stylus** 为 CSS 引入编程能力：**变量、嵌套、混入（mixin）、函数、继承、模块化导入**，最终编译成浏览器可识别的 CSS，提升可维护性和复用性。如今也可用原生 CSS 变量（`--var`）实现部分能力。

#### （12）实现动画效果的方法

+ **CSS**：`transition`（状态过渡）、`@keyframes` + `animation`（关键帧动画），可用 GPU 加速的 `transform`/`opacity`，性能好。
+ **JavaScript**：`requestAnimationFrame` 手写逐帧、或用 GSAP 等动画库做复杂时序控制。
+ **SVG / Canvas**：矢量动画与高性能图形动画。

#### （13）CSS角度实现动画

用 **`@keyframes`** 定义动画各阶段的样式，再通过 `animation` 属性把它应用到元素上，配置时长、缓动、循环次数等。

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.loading { animation: spin 1s linear infinite; }
```

#### （14）前端CSS单位介绍

+ **绝对单位**：`px`（像素）。
+ **相对单位**：`em`（相对父/自身字体大小）、`rem`（相对根元素字体大小）、`%`（相对父元素）。
+ **视口单位**：`vw`/`vh`（视口宽/高的 1%）、`vmin`/`vmax`。

#### （15）em的标准

`em` 是**相对单位**：用于字体大小时相对**父元素的 font-size**；用于其他属性（如 padding）时相对**元素自身的 font-size**。若未显式设置，则逐级继承直到浏览器默认字号（通常 16px）。相比之下 `rem` 始终相对根元素，更易控制。

#### （16）前端数据存储方法

+ **localStorage**：持久化，约 5MB，同源共享，需手动清除。
+ **sessionStorage**：仅当前会话（标签页）有效，关闭即清。
+ **cookie**：约 4KB，会随请求自动携带，常用于登录态，可设 `HttpOnly`/`Secure`/过期时间。
+ **IndexedDB**：浏览器端结构化数据库，容量大，适合离线存储大量数据。

#### （17）版本管理工具的使用

用 **Git** 做版本控制。回退相关：`git checkout`/`git switch` 切换分支或恢复文件、`git reset`（移动分支指针，`--soft`/`--mixed`/`--hard`）、`git revert`（生成一个反向提交，安全回退已推送的历史）。日常还有 `git log`、`git diff`、`git stash` 等。

#### （18）Git的基本概念

**Git** 是**分布式版本控制系统**，每个开发者本地都有完整仓库和历史。核心区域：**工作区 → 暂存区（stage）→ 本地仓库**，通过 `add`/`commit` 流转，再用 `push`/`pull` 与远程同步。它以快照方式记录变更，支持高效的分支与合并。

#### （19）Git分支的概念

**分支**是指向某次提交的**可移动指针**，用于从主线拉出独立开发线，实现并行开发与实验而互不影响。常见流程：从主分支拉 feature 分支开发，完成后经 Code Review 合并（`merge`/`rebase`）回主分支。分支切换成本极低是 Git 的核心优势。

#### （20）异步操作的实现过程

JavaScript 单线程，靠异步避免阻塞：

+ **回调函数**：最原始，易产生「回调地狱」。
+ **Promise**：链式 `.then`/`.catch`，解决嵌套与错误传递。
+ **async/await**：基于 Promise 的语法糖，用同步写法写异步，配合 `try/catch` 捕获错误，可读性最好。

底层由**事件循环 + 任务队列**驱动。

#### （21）JS事件循环机制

JS 主线程执行同步代码，异步回调按类型进入队列：

+ **宏任务**：`setTimeout`、`setInterval`、I/O、事件回调。
+ **微任务**：`Promise.then`、`queueMicrotask`、`MutationObserver`。

执行顺序：**同步栈清空 → 清空所有微任务 → 取一个宏任务执行 → 再清空微任务**，如此循环。因此微任务总是先于下一个宏任务执行，这保证了 Promise 回调的及时性。
