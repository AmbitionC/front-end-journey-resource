这份自述记录对应腾讯混元后台一面，问题覆盖 Java 并发、分布式限流和 Agent 工程；具体面试日期与正式岗位名称未说明。 原记录主要保留提问，以下回答思路为编辑补充，不能据此推断当事人的现场作答、项目实现或面试结果。

<details data-knowledge-key="ai-rate-limiting"><summary>（1）如何手写令牌桶算法？</summary></details>
<p>令牌桶以速率 r 补充额度、容量 C 限制突发，每次按权重 w 先补充、再比较、允许才扣减；拒绝不扣额度。手写时用单调时间差，把补充与扣减放进同一临界区，并拒绝零、负数、NaN/Infinity，以及永远装不下的 w &gt; C。单进程锁只保护本实例，多实例共享桶还需原子准入，不能把各实例的完整额度相加后称为全局限额。</p>

<details data-knowledge-key="os-thread-sync"><summary>（2）synchronized 和 volatile 有什么区别？</summary></details>
<p>synchronized 通过同一对象的 monitor 提供临界区互斥、可重入和解锁到后续加锁的可见性关系，相关访问必须遵守同一锁协议。volatile 对字段读写提供可见性与有序性约束，不把 count++ 等读改写组合变成原子操作。应按共享状态的不变量选择锁或原子 API，volatile 引用也不会自动保护所指对象内部的所有修改。</p>

<details data-knowledge-key="os-thread-sync"><summary>（3）Java 中锁升级的过程是什么？</summary></details>
<p>先确认这里指哪一版 HotSpot 对 synchronized 的实现，语言规范并未要求固定的偏向、轻量、重量三级流程。以启用偏向锁的 HotSpot 8 为历史例子，可说明偏向处理、栈锁 CAS 与 monitor 膨胀；JDK 15 默认禁用偏向锁，JDK 23 又改变了默认轻量锁机制。实际触发路径与版本及运行条件有关，不能断言每个对象都会按同一顺序逐级升级。</p>

<details data-knowledge-key="algorithm-hash"><summary>（4）HashMap 和 ConcurrentHashMap 的底层实现是什么？</summary></details>
<p>先报版本，再沿哈希定位、桶内冲突和扩容解释：OpenJDK 25 的 HashMap 以桶数组配合链表或树桶，普通共享结构修改需要外部同步。ConcurrentHashMap 结合空桶 CAS、已有桶的局部协调和协助扩容，读取及单 key 更新按其并发合同分析，复合业务操作仍需对应原子 API 或额外协议。JDK 7 的 Segment 分段锁属于历史实现，不能推广到所有版本。</p>

<details data-knowledge-key="ai-rate-limiting"><summary>（5）Redis + Lua 怎样应对百万级的队列式并发限流？</summary></details>
<p>先澄清“百万级”指累计请求、每秒准入量还是队列积压，再用真实热点分布与脚本压测吞吐和尾延迟。Redis Lua 可原子完成短小的检查与扣减，但脚本阻塞节点，热点 Key 不会因增加分片自动拆开，多 Key 脚本还受 Cluster 同槽限制。实际任务交给有容量、等待上限、deadline、取消和公平策略的调度器，出队时重新获取预算与并发资格。网络超时可能已经扣减或发出调用，因此预留与结算要幂等，用量未知时待对账，不能把“脚本原子”解释成无需重试或固定延迟。</p>

<details data-knowledge-key="rag-pipeline"><summary>（6）什么是 RAG？</summary></details>
<p>RAG 在回答前从外部资料检索证据，再把适用片段交给模型生成。可以沿离线解析、切块、索引和在线过滤、召回、重排、上下文组装说明流程。检索不等于训练，召回相关也不等于答案真实，权限、引用与分层评测仍需独立检查。</p>

<details data-knowledge-key="agent-intent-clarification"><summary>（7）意图识别和问题重写是用一个模型完成的吗？</summary></details>
<p>先分别定义意图标签与槽位、供检索使用的改写查询，不能由两个功能名字推断模型数量。同一模型可以在不同任务合同下承担两步，也可按延迟、成本与错误隔离拆分；选择要比较路由准确、改写保真和端到端检索结果。</p>

<details data-knowledge-key="agent-memory-summarization"><summary>（8）记忆压缩怎样实现？</summary></details>
<p>把原始记录、带来源的事实和给当前模型使用的工作摘要分开，冻结待压缩前缀，检查关键约束后再替换上下文。保留未覆盖尾部和工具调用配对，异步摘要用原子版本检查拒绝迟到覆盖。用后续任务正确、否定条件保留和回源能力评估，不能只看压缩比例。</p>

<details data-knowledge-key="mcp-protocol"><summary>（9）MCP 协议怎样实现，MCP Server 需要向外暴露哪些接口？</summary></details>
<p>先固定协议版本与传输，再分清协议消息和业务 API。以 2025-11-25 合同为例，工具能力对应 tools/list、tools/call；只有实现资源或提示能力时才提供相应的列举与读取方法，服务不必实现全部原语。能力清单不能代替鉴权，参数、错误与副作用仍由服务端和宿主按职责校验。</p>

<details data-knowledge-key="build-agent-framework"><summary>（10）了解过哪些 Agent 开发框架？</summary></details>
<p>从实际了解的框架选两三个，按模型与工具集成、状态执行、持久恢复和可观测性说明分工。比如 LangChain 提供可组合的 Agent harness，LangGraph 偏向显式状态和控制流编排；选型还要核对版本、失败恢复与维护成本。</p>
