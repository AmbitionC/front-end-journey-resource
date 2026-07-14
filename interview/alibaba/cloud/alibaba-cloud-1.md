### 面试遇到的问题：

#### （1）list套dictionary根据不同key排序

用 `sorted()` 或 `list.sort()`，通过 `key` 参数传入取值函数指定排序依据，`reverse=True` 可倒序。`sort()` 原地修改、`sorted()` 返回新列表，两者都是**稳定排序**。

```python
data = [{"name": "a", "age": 30}, {"name": "b", "age": 20}]
# 按 age 升序
data.sort(key=lambda x: x["age"])
# 多级排序：先按 age 升序，再按 name 降序（用负号或元组技巧）
result = sorted(data, key=lambda x: (x["age"], x["name"]))
```

#### （2）简单介绍下react前端框架

React 是用于构建用户界面的 **JavaScript 库**（并非全功能框架），核心是**组件化**和**声明式**：把 UI 拆成可复用的组件，用 JSX 描述「状态对应的 UI 长什么样」，状态变化时由 React 负责更新视图。

+ **数据驱动视图**：开发者只关心 `state`，不手动操作 DOM。
+ **单向数据流**：数据自上而下通过 props 传递，逻辑清晰、易调试。
+ **生态**：路由（React Router）、状态管理（Redux/Zustand）需另行搭配，灵活但需自己组装。

#### （3）React框架特点

+ **虚拟 DOM + Diff**：状态变化时先在内存中生成新的虚拟 DOM 树，与旧树做 Diff，只把差异部分更新到真实 DOM，减少昂贵的 DOM 操作。
+ **声明式编程**：`UI = f(state)`，写「要什么结果」而非「怎么一步步改」。
+ **组件化与 Hooks**：函数组件配合 `useState`/`useEffect` 管理状态和副作用，取代类组件的生命周期。
+ **单向数据流**：数据可预测，配合 `key` 优化列表复用。

#### （4）如果是原生JS怎么修改节点

先**选取**再**修改**。选取用 `getElementById` / `querySelector` / `querySelectorAll`。

+ **改内容**：`textContent`（纯文本，安全）、`innerHTML`（可解析 HTML，注意 XSS）。
+ **改属性/样式**：`setAttribute`、`element.className`、`classList.add/remove`、`style.xxx`。
+ **增删节点**：`createElement` + `appendChild` / `insertBefore`，删除用 `remove()`；批量插入用 `DocumentFragment` 减少重排。

#### （5）挖简历，问webpack

Webpack 是**静态模块打包器**：从 `entry` 入口出发递归分析模块依赖，构建**依赖图**，最终打包成一个或多个 `bundle`。核心概念：

+ **Entry / Output**：打包入口与产物输出配置。
+ **Loader**：转换非 JS 资源，如 `babel-loader` 转译 ES6+、`css-loader`/`style-loader` 处理样式（从右到左执行）。
+ **Plugin**：介入构建生命周期做更强能力，如 `HtmlWebpackPlugin` 生成 HTML、`DefinePlugin` 注入环境变量。
+ **优化**：`splitChunks` 代码分割、Tree Shaking 去除死代码、`mode: production` 自动压缩。

#### （6）JavaScript和Java的区别

除了名字像，两者几乎没关系。

+ **类型系统**：JS 是**动态弱类型**，运行时确定类型；Java 是**静态强类型**，编译期检查。
+ **运行方式**：JS 由引擎（V8 等）解释/JIT 执行，主要跑在浏览器/Node；Java 编译成字节码在 **JVM** 上跑，一次编译到处运行。
+ **面向对象**：JS 基于**原型链**继承（ES6 class 是语法糖）；Java 基于**类**的继承。
+ **应用场景**：JS 偏 Web 前端与全栈（Node）；Java 偏后端服务、Android、大型企业应用。

#### （7）MySQL和MongoDB区别

+ **数据模型**：MySQL 是**关系型**，数据存在有固定 schema 的表（行/列）中；MongoDB 是 **NoSQL 文档型**，以类 JSON 的 BSON 文档存储，schema 灵活。
+ **查询语言**：MySQL 用 SQL，支持多表 `JOIN`；MongoDB 用文档查询 API，通常靠内嵌文档或 `$lookup` 处理关联。
+ **事务与一致性**：MySQL 天然支持 ACID 事务，强一致；MongoDB 4.0+ 才支持多文档事务，更偏可用性和水平扩展。
+ **适用场景**：结构固定、强事务（如订单财务）选 MySQL；结构多变、读写量大、快速迭代（如日志、内容）选 MongoDB。

#### （8）docker怎么连接磁盘上访问自己电脑上的文件

用**挂载**把宿主机路径映射进容器，容器读写的就是本机文件。

+ **Bind Mount（直接挂本机目录）**：`docker run -v /本机路径:/容器路径 image`，适合开发时同步代码。
+ **Volume（Docker 管理的卷）**：`docker run -v myvol:/data image`，数据由 Docker 托管，适合数据库持久化。
+ 加 `:ro` 可只读挂载，如 `-v /host:/container:ro`。

#### （9）项目是本地的还是开源的

**答题思路**：这是考察项目真实性和你的参与深度。如实说明性质（课程/个人练手/实习内网/开源），若开源可给 GitHub 链接并说 star、协作情况；若是内部项目则说清你负责的模块和产出。重点不在开不开源，而在能否讲清你**做了什么、解决了什么问题**。

#### （10）应聘过数据分析，为什么要转开发

**答题思路**：面试官想确认转型是否想清楚、是否稳定。建议正面讲：从数据分析中发现自己更喜欢**动手把想法落地成产品**、对工程实现有成就感；同时把数据背景讲成**加分项**（懂数据、能做数据驱动的功能、和后端/算法沟通顺畅）。避免贬低前一份方向，落点在「能力可迁移 + 明确的长期投入」。
