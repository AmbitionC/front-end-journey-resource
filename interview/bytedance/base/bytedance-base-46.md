以下原题或题目类别依据候选人的公开自述整理，经历、实现效果与面试结果未经独立证明。每题后的短答是独立教学归纳，不是作者现场回答；未记录的追问不补写。

算法明确为比较版本号，但原帖截图未取得，未核验截图中的输入输出。

<details data-knowledge-key="agent-resume-interview">
<summary>（1）首先是简单自我介绍</summary>
</details>

用一分钟介绍岗位相关能力、真实项目与个人贡献，教育经历只提供必要信息。面经中的个人背景不复写到公开资料，教学示例也不能充当候选人履历。

<details data-knowledge-key="agent-project-portfolio">
<summary>（2）项目介绍</summary>
</details>

先说明用户、核心流程和自己的工作，再选可演示功能。项目描述要有具体输入输出，不能把 AI 生成的代码数量当作项目效果。

<details data-knowledge-key="agent-project-requirements">
<summary>（3）项目的使用场景</summary>
</details>

说明谁在何时遇到什么问题、使用频率和当前替代方案。使用场景决定权限、界面与性能要求，未验证的用户需求应与真实反馈区分。

<details data-knowledge-key="agent-project-requirements">
<summary>（4）为什么做这个项目</summary>
</details>

把动机落实成可检验的需求和成功条件，再说明为什么当前方案值得实现。若只是学习项目也可明确说明，不虚构业务价值或真实用户。

<details data-knowledge-key="agent-permission-model">
<summary>（5）项目中的权限设计</summary>
</details>

按角色、资源和操作建权限模型，后端统一检查对象所有权和租户。页面可提示允许动作，但不能成为唯一拦截点。

<details data-knowledge-key="jwt-auth">
<summary>（6）在账号体系上如何保证业务逻辑不能被绕过</summary>
</details>

所有受保护接口从服务端取得可信身份，并在业务层检查对象访问与状态约束。不能相信客户端传来的用户 ID 或角色，直接请求接口也要得到相同授权结果。

<details data-knowledge-key="agent-permission-model">
<summary>（7）权限控制具体怎么实现</summary>
</details>

在统一入口完成身份认证，在具体操作校验资源权限，必要时数据库查询加租户条件。拒绝默认开放，权限变更和失效也要明确生效方式。

<details data-knowledge-key="localStorage-sessionStorage">
<summary>（8）什么是 Cookie</summary>
</details>

Cookie 是浏览器按域、路径等规则保存并随请求发送的一类键值状态，可设置 HttpOnly、Secure 和 SameSite。它只是传输与存储机制，不能自动证明用户身份。

<details data-knowledge-key="jwt-auth">
<summary>（9）什么是 Session</summary>
</details>

Session 通常由服务端保存登录状态，客户端持有随机会话标识。服务端按标识查状态并检验过期与权限，多实例部署需要共享或一致的会话存储。

<details data-knowledge-key="jwt-auth">
<summary>（10）Cookie 和 Session 的区别</summary>
</details>

Cookie 是客户端状态机制，Session 是一种服务端会话设计，常把 Session ID 放进 Cookie。两者不是互斥方案，也不能把 Session 说成一定比所有令牌方案安全。

<details data-knowledge-key="jwt-auth">
<summary>（11）Session 登录流程</summary>
</details>

登录验证成功后轮换并设置会话标识，后续请求携带 Cookie，服务端查会话并授权；退出与过期时失效。需防会话固定、泄漏和 CSRF。

<details data-knowledge-key="responsive-layout">
<summary>（12）页面布局主要使用什么技术</summary>
</details>

可按页面使用 Flexbox 排一维内容、Grid 排二维区域，并用响应式约束适配屏幕。具体项目采用何种布局应按代码说明，不能从面经推断。

<details data-knowledge-key="agent-coding">
<summary>（13）页面搭建过程中 AI 帮你完成了哪些工作</summary>
</details>

说明 AI 参与的原型、样式或代码建议，以及自己如何审核和验证。生成完成后仍要检查可访问性、布局和功能，不把未经验证产物记作交付。

<details data-knowledge-key="agent-project-portfolio">
<summary>（14）哪些部分是自己完成和修改的</summary>
</details>

用提交、代码入口或测试说明个人完成和修改的部分，清楚区分生成、审查与手写工作。评价贡献要看问题解决和质量，不能编造百分比。

<details data-binding-status="pending_semantic_verification">
<summary>（15）为什么这么设计？</summary>
<p>关联知识点待核实。</p>
</details>

先陈述设计要满足的需求与约束，再解释组件职责和接口。用真实对照或测试说明取舍，缺失项目细节时只给答题方法。

<details data-binding-status="pending_semantic_verification">
<summary>（16）为什么不用另外一种方案？</summary>
<p>关联知识点待核实。</p>
</details>

比较备选方案在复杂度、维护、性能和安全上的代价，说明为什么当前约束下选择这一种。不要把未采用的方案笼统说成“不好”。

<details data-knowledge-key="web-attack">
<summary>（17）有没有考虑安全问题？</summary>
</details>

从输入、输出、身份、权限和依赖边界检查攻击面，重点验证 XSS、CSRF 与越权。具体措施要有服务端控制或测试证据，不能只说“用了 HTTPS”。

<details data-knowledge-key="agent-permission-model">
<summary>（18）如果别人绕过前端怎么办？</summary>
</details>

绕过前端后，后端仍应验证身份、资源权限、参数与业务状态。前端校验提升体验，服务端才负责守住数据与操作边界。

<details data-knowledge-key="jwt-auth">
<summary>（19）Session 为什么这样设计？</summary>
</details>

说明会话的生命周期、存储、轮换与失效需求如何决定设计。优点是便于集中撤销，代价是状态存储和多实例一致性，不能默认无成本。

<details data-knowledge-key="agent-coding">
<summary>（20）AI 到底帮你完成了哪些工作？</summary>
</details>

列出 AI 实际协助的任务以及哪些建议被拒绝或修改，再说明最终如何验证。不要把一次聊天中提出的方案等同于项目已实现。

<details data-knowledge-key="agent-project-portfolio">
<summary>（21）哪些代码是你自己写的？</summary>
</details>

用具体文件或功能区分自己写、修改和审核的代码，解释一段关键实现。不能以背出 AI 输出代替对程序行为和故障边界的理解。

<details data-knowledge-key="design-state">
<summary>（22）路由怎么实现</summary>
</details>

客户端路由把 URL 映射到页面状态，可用 History API 或 hash。History 模式直接访问深路径需服务端支持入口回退，hash 片段不发给服务端；路由守卫不能代替接口授权。

<details data-knowledge-key="design-state">
<summary>（23）路由具体用了哪些方法</summary>
</details>

History 模式常用 pushState/replaceState 更新记录、popstate 响应导航；hash 模式监听 hashchange。框架可封装这些方法，需说明实际使用的方案。

<details data-knowledge-key="http-message">
<summary>（24）页面跳转会不会携带参数</summary>
</details>

跳转可以携带路径参数、查询参数或本地导航状态，但各自刷新与分享语义不同。敏感凭证不应放 URL，状态要避免超出接收页面的实际需要。

<details data-knowledge-key="http-message">
<summary>（25）参数怎么传递</summary>
</details>

路径适合标识资源，query 适合筛选等可分享条件，请求体适合复杂输入。编码与校验在接收端统一处理，不把 URL 参数视为可信身份。

<details data-binding-status="pending_semantic_verification">
<summary>（26）后端怎么接收参数</summary>
<p>关联知识点待核实。</p>
</details>

后端从路由、query 或 body 解析后按 Schema 校验类型与范围，再进行鉴权和业务处理。重复字段、默认值和非法输入都应有明确规则。

<details data-knowledge-key="http-message">
<summary>（27）GET 和 POST 的区别。</summary>
</details>

GET 通常读取资源并具有安全、幂等语义；POST 让资源处理提交的数据。两者都可走 HTTPS，性能取决于内容和缓存，不能按方法名固定判断快慢。

<details data-knowledge-key="jwt-auth">
<summary>（28）Session 为什么不用 URL 传。</summary>
</details>

Session ID 放 URL 容易进入日志、历史、分享链接或 Referer；通常用安全 Cookie 承载。Cookie 仍需妥善保护和 CSRF 防御，不能因不在 URL 就认为无泄漏风险。

<details data-knowledge-key="jwt-auth">
<summary>（29）为什么不用 JWT。</summary>
</details>

JWT 适合某些分布式验证场景，Session 易于集中失效；取舍看撤销、存储与服务边界。JWT 是格式与签名机制，不自动免疫越权、泄漏或 CSRF。

<details data-knowledge-key="web-attack">
<summary>（30）为什么这样设计更安全。</summary>
</details>

安全应由威胁和控制效果证明，例如减少 URL 泄漏、限制 Cookie 脚本访问、检查 CSRF 和对象权限。不能只比较技术名词就断言某个方案更安全。

<details data-knowledge-key="java-value-semantics">
<summary>（31）Java 有哪些基本数据类型</summary>
</details>

Java 基本类型为 byte、short、int、long、float、double、char、boolean；String 是引用类型。char 是 UTF-16 代码单元，不能认为一个 char 总等于一个用户感知字符。

<details data-knowledge-key="type-system">
<summary>（32）JavaScript 数据类型有哪些</summary>
</details>

JS 原始类型包括 undefined、null、boolean、number、bigint、string、symbol，另有 object；函数也是对象。typeof null 的结果是 object，需单独判空，数组也不属于独立 typeof 类型。

<details data-knowledge-key="event-loop">
<summary>（33）页面请求以后，同步任务和异步任务执行顺序</summary>
</details>

同步代码先在当前调用栈执行，之后在合适检查点清空微任务，再处理后续任务。网络完成和定时器触发时刻需要具体程序，不能凭“异步”标签列出固定全局顺序。

<details data-knowledge-key="event-loop">
<summary>（34）Event Loop（事件循环）</summary>
</details>

事件循环协调任务、微任务检查点和渲染机会；长同步任务会阻塞交互。浏览器与 Node.js 有不同调度细节，口述时先明确运行环境。

<details data-knowledge-key="event-loop">
<summary>（35）为什么设计微任务和宏任务</summary>
</details>

微任务允许在下一任务前完成 Promise 回调等一致性工作；任务把事件处理分批推进。无限追加微任务会延迟渲染，两类队列不是“越快越好”的等级。

<details data-knowledge-key="promise">
<summary>（36）微任务有哪些</summary>
</details>

Promise 的 then/catch/finally 回调、queueMicrotask 和某些观察器回调通常进入微任务。注册回调不等于同步执行，仍需区分 Promise 构造器本身的同步代码。

<details data-knowledge-key="event-loop">
<summary>（37）宏任务有哪些</summary>
</details>

定时器、用户交互和部分网络事件等进入任务调度，但不同任务源有自身规则。setTimeout 只保证最早可执行时间，不能保证精确延时或与所有其他事件固定排序。

<details data-knowledge-key="agent-resume-interview">
<summary>（38）实习生主要负责哪些工作</summary>
</details>

原帖此处为反问，教学上可询问实习生的独立任务、导师支持和交付标准。具体工作必须以团队实际回复为准。

<details data-knowledge-key="agent-resume-interview">
<summary>（39）团队目前主要使用哪些技术栈</summary>
</details>

可询问前后端、模型和基础设施的实际技术栈及版本，判断学习准备。短答不替团队补造未记录的信息。

<details data-knowledge-key="agent-skill-map">
<summary>（40）团队更看重实习生哪些能力</summary>
</details>

可反问团队衡量实习生的标准，再结合实做证明编码、沟通、排查和学习能力。不能把个人推测写成公司的招聘规则。

<details data-knowledge-key="agent-resume-interview">
<summary>（41）后续还有哪些面试流程</summary>
</details>

询问剩余环节、考察重点和预计安排，并以招聘方通知为准。面经没有给出可验证答案，不能承诺固定流程。

<details data-knowledge-key="algorithm-string">
<summary>（42）比较版本号（Compare Version Numbers）就是 LeetCode 165 那道。</summary>
</details>

按点拆分版本，去掉分段前导零，缺少的段按零补齐后逐段比较。可先比有效数字长度再比字典序，避免整数溢出；这不是带预发布标签的完整 SemVer 比较。
