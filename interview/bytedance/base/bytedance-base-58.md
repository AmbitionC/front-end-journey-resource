作者自述为 Agent 开发岗位的一面，发帖日期为 2026 年 9 月 7 日；实际面试日期与招聘批次未明确。问题围绕项目、授权、异步事件和编程基础，项目的具体实现未公开。

以下短答由编辑独立整理，供学习与准备使用，并非作者现场回答或企业标准答案。个人经历按本人事实作答；省略、推断、反问和反馈均明确标注，不冒充完整面试官原题。

## 一面

### 一、自我介绍 & 背景部分

<details><summary>（1）简单介绍下你的个人背景、教育经历、实习经历，以及为什么求职 AI Agent 开发岗位？</summary></details>

按本人真实背景、相关项目和贡献解释求职动机；原帖只有问题，不能替作者回答个人经历。

### 项目背景

<details><summary>（2）讲一讲这个量化 AI Agent 项目整体是什么样的，要解决什么问题？</summary></details>

说明项目目标、使用者、可调用工具、运行状态和验收；原帖未公开完整架构，以下设计建议不能当成作者实现。

<details><summary>（3）原有系统存在哪些风险？Agent 会出现哪些异常问题？</summary></details>

可检查越权、重复动作、错误参数、超时后未知结果及资源超限；项目已发生的事故和影响需本人证据，不能臆造。

### 权限体系设计

<details data-knowledge-key="agent-identity-auth"><summary>（4）Agent 的 TOKEN 是什么，怎么获取，起到什么作用？</summary></details>

先区分访问凭证和模型 token。访问凭证由可信身份系统签发/取得，用于验证主体和授权范围；工具执行端仍需校验身份、租户、过期和撤销。

<details data-knowledge-key="agent-permission-model"><summary>（5）TOKEN 和权限是怎么关联的？数据库层面如何设计？</summary></details>

把主体、凭证标识、授权策略、资源范围及有效期关联；数据库持有可撤销授权记录，凭证中的 scope 不能替代执行时按资源与参数授权。

<details><summary>（6）你们定义的 RWBNCT 这 6 类权限 scope 分别代表什么，实际落地了哪几个？（缩写定义待确认）</summary></details>

原帖没有给 RWBNCT 六个字母的定义和已实现范围；必须查该项目权限契约，不能按字母猜含义。

<details data-knowledge-key="agent-permission-model"><summary>（7）如果要对下单权限做更细粒度管控（限制交易标的、单笔金额），该如何实现？</summary></details>

在工具服务端按主体、账户、标的、单笔金额与累计额度进行授权；参数规范化后再检查，策略失效/额度不够时拒绝，不能只在 Prompt 中限制。

### SSE 推流相关

<details data-knowledge-key="sse-server"><summary>（8）SSE 在项目里用来做什么？推送的数据格式是什么样？</summary></details>

SSE 可传任务进度和结果片段；响应为 text/event-stream，每条事件用 data: 等字段并以空行结束，可带 event 和 id。它不是任务执行状态的权威存储。

<details data-knowledge-key="sse-server"><summary>（9）SSE 如何处理断连？心跳保活怎么做？</summary></details>

EventSource 支持断连重连，服务端可发 retry 和注释心跳；还需处理代理缓冲、空闲超时、慢消费者和资源释放，不能只依赖连接始终在线。

<details data-knowledge-key="sse-server"><summary>（10）客户端断网重连之后，怎么实现断点续传，不用任务从头跑？</summary></details>

用 taskId 查询持久任务，以事件 id/Last-Event-ID 回放保留窗口内的后续事件；过旧游标返回快照再继续。断流不重做下单副作用，客户端也应按事件 ID 去重。

### 幂等 / 防重复下单

<details data-knowledge-key="agent-idempotency"><summary>（11）Agent 超时重复下单是高风险问题，你们怎么实现幂等避免重复操作？</summary></details>

同一业务意图使用稳定幂等标识，在权威存储中原子登记请求与状态；重试返回旧结果或查询未知结果，必要时把该标识传给下游，避免仅用短期缓存锁。

<details data-knowledge-key="agent-idempotency"><summary>（12）幂等 key 是怎么生成的？为什么不让大模型自己生成 key？</summary></details>

由可信客户端/服务在首次业务意图建立后生成并持久保存，重试复用，并绑定请求摘要防止同 key 不同参数；模型可能随机重生成，不能作为身份与幂等权威。

### 限流 & Redis

<details data-knowledge-key="ai-rate-limiting"><summary>（13）系统限流规则是什么？分别对哪些维度做限流？</summary></details>

按用户/租户、模型、工具及高风险写入分别设速率、并发和预算；规则须由实际容量决定，原帖没有给项目具体阈值，不能补数字。

<details data-knowledge-key="ai-rate-limiting"><summary>（14）限流是如何基于 Redis Lua 脚本实现的？讲讲实现思路。</summary></details>

Lua 原子读取限流状态、补充/扣减额度并设置过期，返回是否准入及等待时间；明确桶/窗口规则、键作用域和时钟，脚本应短小且有界。

<details data-knowledge-key="redis-cache"><summary>（15）Redis 做缓存有什么优势？</summary></details>

内存访问与丰富原子类型适合热点读取、计数和临时状态；收益取决于命中率和负载，同时承担 TTL、容量、失效及数据库一致性管理。

<details data-knowledge-key="redis-cache"><summary>（16）如果 Redis 宕机、缓存失效会带来什么影响？</summary></details>

缓存故障会使请求回源增加，应设有界回源、限流、熔断和受控降级；权限/下单幂等若依赖 Redis，还需更强权威存储与故障策略，不能盲目放行。

<details data-knowledge-key="redis-cache"><summary>（17）如果大量 key 同时过期，缓存击穿数据库，该怎么处理？</summary></details>

大量 key 同时过期通常叫缓存雪崩，单热点失效并发回源是击穿；错开 TTL、热点预热/单飞回填、限制回源并发，确保降级仍符合数据时效要求。

### 异步任务、消息队列、存储

<details data-knowledge-key="async-job-queue"><summary>（18）为什么长耗时的回测、下单不使用同步 HTTP，要改成异步 + SSE？同步方案遇到了什么问题？</summary></details>

同步长请求易遇网关超时和连接占用；提交后返回 jobId，由持久任务/Worker 执行，SSE 只传进度。重连恢复任务而不是重新提交下单。

<details><summary>（19）项目中 MySQL 数据库都存储哪些数据？</summary></details>

原帖未给实际表结构。设计上可持久存主体授权、任务/运行状态、幂等请求与结果、业务记录及事件引用；具体项目存了哪些必须查实现。

### 三、计算机基础 & Python 底层

<details data-knowledge-key="algorithm-hash"><summary>（20）Python 字典底层是什么结构？插入、查询原理是什么？</summary></details>

以 CPython 3.14 为例，dict 是紧凑哈希表：计算 hash，探测索引并校验 key，相等则取值/更新，否则插入，负载增长时扩容；平均 O(1)，最坏 O(n)。

<details data-knowledge-key="algorithm-hash"><summary>（21）Python 字典哈希冲突如何处理？</summary></details>

CPython 3.14 dict 使用开放寻址，通过探测序列寻找候选槽，比较 hash 和 key；不是简单的拉链法，碰撞多时性能会下降。

<details data-knowledge-key="algorithm-hash"><summary>（22）Python 字典删除操作底层逻辑是怎样的？</summary></details>

常规含删除的 CPython 3.14 combined dict 会标记 dummy 槽以保留探测链，再移除条目引用；搜索遇 dummy 继续，遇从未使用的空槽才可结束，具体布局随版本变化。

### 四、手写编程题

<details data-knowledge-key="algorithm-linked-list"><summary>（23）实现 LRU Cache，要求 O (1) 的 put、get，需要自己实现双向链表结构，讲思路尝试写代码。</summary></details>

哈希表指向自建双向链表节点，读/写命中移到头；新键插头，超容量删尾并同步哈希表。平均 O(1)，注意容量零、重复更新和头尾哨兵连接。

<details data-knowledge-key="algorithm-heap"><summary>（24）给定数组，求出现频率最高的 Top‑K 元素，讲实现思路，时间复杂度是多少？有没有优化方案？</summary></details>

先统计 n 个元素的频次，得到 u 个不同键；1≤k≤u 时用大小 k 的最小堆，通常 O(n+u log k)。频次桶可做到 O(n+u)，需 O(n+u) 空间；k=0、k>u 和并列输出顺序先约定。
