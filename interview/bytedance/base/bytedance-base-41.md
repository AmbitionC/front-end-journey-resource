以下原题或题目类别依据候选人的公开自述整理，经历、实现效果与面试结果未经独立证明。每题后的短答是独立教学归纳，不是作者现场回答；未记录的追问不补写。

“实习拷打”“项目介绍”只记了类别；具体追问未知。原帖“React”可能指 ReAct，需澄清。

<details data-knowledge-key="agent-resume-interview">
<summary>（1）实习拷打</summary>
</details>

先交代负责的模块、任务边界和协作对象，再用一次真实改进说明方案、验证与结果。没有记录的实习追问不补写，也不把团队产出全算成个人贡献。

<details data-knowledge-key="agent-project-portfolio">
<summary>（2）项目介绍</summary>
</details>

按用户需求、输入输出、关键模块和个人贡献介绍项目，选一个能演示或复现的流程。指标应有测试方法和对照，不能用“用了大模型”代替项目价值。

<details data-knowledge-key="async-job-queue">
<summary>（3）有多个消息投递到消息队列，处理的结果怎么与发送的请求对应呢？</summary>
</details>

提交时生成 requestId/jobId，消息和结果都携带同一关联标识；结果落库后按用户权限查询或推送。关联请求不等于防重，还要用幂等键处理重复投递。

<details data-knowledge-key="async-job-queue">
<summary>（4）为什么不直接通过数据库通信而需要用消息队列呢？</summary>
</details>

队列用于缓冲突发、解耦生产与消费、重试和分配任务；数据库仍保存任务状态。若低频轮询已满足需求，也可先用数据库任务表，不能认为所有异步业务必须上 MQ。

<details data-knowledge-key="llm-sse-streaming">
<summary>（5）项目有没有前端流式输出展示？</summary>
</details>

可用 SSE 把进度和文本增量送到前端，先解析完整事件再更新 UI。网络 chunk 不等于事件，重连还须携带游标并避免重复执行有副作用的请求。

<details data-knowledge-key="jwt-auth">
<summary>（6）身份认证是怎么做的？</summary>
</details>

区分认证身份和授权操作：后端验证 Session 或令牌后，再检查用户能否访问具体资源。前端隐藏按钮不能代替鉴权，Cookie 模式还需考虑 CSRF 与安全属性。

<details data-knowledge-key="build-agent-framework">
<summary>（7）你觉得langchain和langgraph框架提供了什么功能？优势在哪？</summary>
</details>

LangChain 提供模型、工具等集成与可组合接口；LangGraph 用状态和节点边表达可持久化的执行流程。价值是减少编排代码，但检查点、权限和重试语义仍由应用设计。

<details data-knowledge-key="agent-react">
<summary>（8）讲讲大模型的React</summary>
</details>

原帖写作“React”，在大模型语境中可能指 ReAct，需先澄清。ReAct 交替选择行动、执行工具和观察结果；React 则是 UI 库，两者不能混为同一概念。

<details data-knowledge-key="multi-agent">
<summary>（9）讲讲工具调用和多智能体协作</summary>
</details>

工具调用是模型提出结构化请求、宿主校验并执行；多智能体还要划分职责、输入状态和结果归并。多模型并发并不会自然形成协作，必须处理冲突、超时和重复副作用。

<details data-knowledge-key="context-engineering">
<summary>（10）对于上下文工程，你觉得有哪些主流的技术？</summary>
</details>

上下文工程包括指令分层、检索、记忆、摘要、工具描述和预算分配。先保留当前任务与可靠证据，再压缩低价值历史，并用回归样例检查压缩是否丢掉关键约束。

<details data-knowledge-key="agent-memory-architecture">
<summary>（11）讲讲RAG和持久化记忆的区别</summary>
</details>

RAG 按当前查询检索外部知识；持久化记忆保存会话以外仍需使用的用户事实或经验。两者可共用检索设施，但写入规则、权限、有效期和冲突处理不同。

<details data-knowledge-key="prompt-cot">
<summary>（12）什么是思维链（CoT）？</summary>
</details>

CoT 是引导模型分步骤处理问题的一类提示方法，效果要用任务集验证。生成的推理文本也可能出错，不能当作可信解释或要求暴露内部思考；可请求简短依据和可核验结果。

<details data-knowledge-key="agent-skill-design">
<summary>（13）为什么Agent还需要Instructions, Rules, MCP, Skills？</summary>
</details>

指令说明目标和约束，Rules 通常承载常驻规则，Skills 封装按需加载的任务步骤与资源，MCP 提供工具和资源交互协议。它们处于不同层，名称本身不授予权限。

<details data-knowledge-key="agent-skill-design">
<summary>（14）Rules和Skills有什么区别？为什么不把Skills的指导写进Rules？</summary>
</details>

把所有技能内容常驻会增加上下文负担和冲突。可把通用规则保持精简、任务细节按触发条件加载，但触发与加载方式取决于实际宿主，不能把某产品的行为当通用标准。

<details data-knowledge-key="llm-sse-streaming">
<summary>（15）SSE和普通的HTTP的区别是什么？</summary>
</details>

SSE 本身运行在 HTTP 上，响应类型为 text/event-stream，并按空行分隔事件。它与一次返回完整 JSON 的常见请求不同，仍须处理连接、代理缓冲和重连。

<details data-knowledge-key="llm-sse-streaming">
<summary>（16）SSE和文件传输协议FTP有什么区别？他们不都是流式传输吗？</summary>
</details>

“流式”描述逐步传输，并不说明业务协议相同。SSE 推送 UTF-8 事件；FTP 面向文件传输并使用自己的控制与数据连接，不能用来直接替代浏览器的 SSE 事件订阅。

<details data-knowledge-key="rate-limit-circuit">
<summary>（17）为什么Redis可以做限流？怎么做限流？</summary>
</details>

用 Redis 保存窗口计数或令牌状态，借原子命令或 Lua 让检查与扣减不可分割。需定义用户维度、过期时间、时钟和故障降级；只做 INCR 后再单独 EXPIRE 会有竞态。

<details data-knowledge-key="redis-data-structure">
<summary>（18）Redis为什么速度快？</summary>
</details>

内存访问、高效数据结构与事件驱动 I/O 让常见操作开销低，但大键、慢命令、持久化和网络也会限制吞吐。“单线程所以快”不是充分解释，线程模型还随版本与配置变化。

<details data-knowledge-key="db-sharding">
<summary>（19）数据库分表是怎么分的？为什么一个表太大需要分表？</summary>
</details>

先按查询模式选择分片键，可按范围、哈希或租户拆表，分散数据量和热点。代价是跨分片查询、事务和迁移更复杂；索引与归档能解决时，不宜过早分表。

<details data-knowledge-key="docker-basics">
<summary>（20）docker和普通的虚拟机有什么区别？</summary>
</details>

容器主要利用操作系统隔离与资源限制，共享宿主内核；虚拟机通常提供独立客体内核。容器启动与镜像更轻，但内核隔离边界不同，不能认为它天然等于虚拟机的安全边界。

<details data-knowledge-key="algorithm-tree">
<summary>（21）LeetCode中等难度，计算二叉树最大宽度</summary>
</details>

按层 BFS 给节点记录完全二叉树位置，层宽为最右位置减最左位置再加一，包含中间空位。每层减去首个位置避免数值无谓增长；JS 可用 BigInt，时间 O(n)。
