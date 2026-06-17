### 面试问题记录：

#### （1）网页加载的过程

  - 从用户输入URL开始，经历DNS解析、TCP连接建立、HTTP请求发送、服务器响应、浏览器渲染等步骤。

#### （2）一个完整的URL的结构

  - 包括协议（如http或https）、域名、端口（默认不写）、路径、查询字符串和锚点。

#### （3）DNS的存在意义和作用

  - DNS将域名转换为IP地址，简化用户访问网站的过程，解决可读性和分布式查询问题。

#### （4）http默认端口号

  - HTTP的默认端口号是80。

#### （5）http和https的区别

  - HTTPS在HTTP基础上增加了SSL/TLS协议，提供了数据加密、完整性校验和身份验证。

#### （6）React数据管理包的下载和管理

  - 使用npm或Yarn等工具，通过命令如`npm install`或`yarn add`来下载和管理React项目中的包。

#### （7）包管理工具

  - 除了npm，还有Yarn、pnpm等包管理工具，它们提供了不同的包管理和缓存机制。

#### （8）响应式布局的实现

  - 通过媒体查询（Media Queries）、相对单位（如%、em、rem）和弹性盒子（Flexbox）实现。

#### （9）flex布局的属性

  - 包括`flex-direction`、`justify-content`、`align-items`等，控制容器内项目排列和对齐。

#### （10）flex主轴方向的改变

  - 使用`flex-direction`属性，可以设置为`row`、`row-reverse`、`column`或`column-reverse`。

#### （11）CSS预处理器

  - 如Sass、Less，允许使用变量、嵌套规则、混合（mixins）等高级功能，最终编译为CSS。

#### （12）实现动画效果的方法

  - 可以通过CSS的`@keyframes`或JavaScript的动画库（如GreenSock）实现。

#### （13）CSS角度实现动画

  - 使用`@keyframes`定义动画序列，然后通过选择器应用到元素上。

#### （14）前端CSS单位介绍

  - 包括像素(px)、相对单位(em, rem)、视口宽度(vw)等。

#### （15）em的标准

  - `em`相对于父元素的字体大小，如果没有指定则相对于浏览器默认字体大小。

#### （16）前端数据存储方法

  - 包括localStorage、sessionStorage、cookies等，用于在客户端存储数据。

#### （17）版本管理工具的使用

  - 使用Git进行版本控制，通过命令如`git checkout`、`git reset`等来回退到之前的版本。

#### （18）Git的基本概念

  - Git是一个分布式版本控制系统，用于跟踪和管理代码变更。

#### （19）Git分支的概念

  - 分支允许从当前代码状态创建一个独立的开发线，便于并行开发和实验。

#### （20）异步操作的实现过程

  - 描述JavaScript中异步操作的实现，如回调函数、Promises、async/await等。

#### （21）JS事件循环机制

  - JavaScript使用事件循环处理异步行为，通过任务队列和事件循环来实现非阻塞I/O操作。
