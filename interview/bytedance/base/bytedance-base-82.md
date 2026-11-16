记录自述为字节后端 / Agent 开发秋招一面，线上技术面试与在线 Coding 约 55 分钟。面试具体日期未公开，重点为 Java 基础、消息和缓存、数据库整体优化，以及业务系统设计与 AI 应用理解。

本页仅依据已见文字整理，原帖图片未核验，不据图片补充问题或条件。知识组织方式的比较对象、点赞规则和 Coding 完整题干仍待确认；以下短答是编辑整理的复习思路，不代表当事人的现场回答、实际实现或已取得的效果。

## Java 基础

<details data-knowledge-key="java-value-semantics"><summary>（1）什么是单例模式？</summary></details>
<p>单例在明确的作用域内提供一个受控共享实例和访问入口，可以利用类初始化等机制实现安全发布。要区分创建次数、类加载器或容器范围与对象后续的并发修改；单例本身不保证线程安全。</p>

<details data-knowledge-key="java-value-semantics"><summary>（2）哪些场景适合使用单例模式？</summary></details>
<p>先确认对象确实需要共享生命周期，例如配置访问器或受控资源池，再考虑初始化、并发访问、测试替换与关闭。用户和事务等请求状态不宜塞进全局共享实例，没有共享需求时无需强行使用单例。</p>

<details data-knowledge-key="java-value-semantics"><summary>（3）long 与 Long 用 == 和 equals() 比较，结果是否一样？</summary></details>
<p>先看两边的静态类型：基本值用 == 比数值，两个 Long 引用用 == 比身份，混用时可能拆箱且 null 会失败。Long.equals 要求对方也是同值的 Long；基本类型不能直接调用 equals，不能用包装缓存的偶然结果代替比较合同。</p>

## 消息、缓存与分布式协调

<details data-knowledge-key="async-job-queue"><summary>（4）RabbitMQ 如何避免消息丢失？</summary></details>
<p>沿生产确认、正确路由、队列与消息持久化、复制故障范围以及消费完成后确认分别检查。生产确认不代表消费完成，重投仍可能发生，业务要用稳定事件 ID、幂等和恢复机制；不能承诺任意故障下绝对不丢。</p>

<details data-knowledge-key="async-job-queue"><summary>（5）RabbitMQ 消费者应该什么时候 ACK？</summary></details>
<p>在业务结果与必要幂等记录持久提交后再 ACK，失败则按可恢复性重试或隔离。提交成功后 ACK 丢失可能导致重投，消费者仍需识别已完成任务；收到消息就确认再异步处理会留下丢任务窗口。</p>

<details data-knowledge-key="redis-cache"><summary>（6）如何解决缓存穿透？</summary></details>
<p>先校验请求并限制无效流量，再按业务选择短时负缓存或正确维护的布隆过滤器，防止不存在的键反复回源。负缓存有容量和失效成本，布隆阴性可拒绝还依赖合法集合完整装载与新增同步，不能忽略误拒绝风险。</p>

<details data-knowledge-key="db-transaction-lock"><summary>（7）怎样理解和实现分布式事务？</summary></details>
<p>先确认参与资源和需要的原子性、隔离、可补偿性及故障恢复，再选择满足合同的协调机制。两阶段提交区分 prepare 与最终决议，协调故障时要依持久记录恢复；消息或补偿方案也需幂等和对账，不是任意跨系统操作的共同本地事务。</p>

<details data-binding-status="pending_semantic_verification"><summary>（8）Redis 相关追问涉及执行状态、Lua 和 SET NX EX 分布式锁，怎样说明这些概念的边界？</summary><p>关联知识点待核实。</p></details>
<p>可先确认“执行状态”指任务、事务还是脚本状态，再区分 Lua 的服务端原子执行与 SET NX EX 的有期限租约。当前文字只列追问关键词，未给出所讨论的状态与操作，关联知识点仍待核实，不补造现场问题或实现。</p>

<details data-knowledge-key="redis-distributed-lock"><summary>（9）为什么抢锁和设置过期时间不能简单分两条命令执行？</summary></details>
<p>两条命令之间若崩溃或断连，可能已抢到锁却没有租约期限，应使用一次带 NX 与 EX 或 PX 的原子 SET。释放时还要原子校验本次所有权，租约过期后的陈旧业务写入另用资源端版本等约束，不能只靠锁删除解决。</p>

## MySQL 与数据库整体优化

<details data-knowledge-key="db-transaction-lock"><summary>（10）MySQL 行锁和表锁有什么区别，什么情况下触发？</summary></details>
<p>先说明引擎、隔离级别、索引与语句，再区分索引记录、间隙以及表级意向锁等范围。InnoDB 缺少合适访问路径可能锁住大量记录，不等于自动升级为表锁；普通一致性读也不能一概套用锁定读规则。</p>

<details data-knowledge-key="database-performance-diagnosis"><summary>（11）如果你是数据库 Owner，整个数据库性能比较差，会怎样优化？</summary></details>
<p>先对齐受影响业务的请求率、尾延迟、错误和数据库资源基线，再按查询工作量、锁事务、CPU内存与I/O、连接网络、返回需求、数据生命周期及共享负载分类定位。每项动作绑定证据、负责人和停止或回退条件，灰度后用同口径复测，不能把整体诊断缩成只加索引。</p>

<details data-knowledge-key="database-performance-diagnosis"><summary>（12）除了慢 SQL 和机器问题，数据库优化还能扩展至少六个不同方向吗？</summary></details>
<p>除慢 SQL 和机器资源之外，可从锁与事务、连接与网络、返回需求、数据生命周期、共享资源与变更竞争、读取路径与复制架构六个视角展开。每个方向都应说明观察证据、候选动作和代价；例如读取副本还要核对延迟、一致性与复制开销，列够名词不能证明瓶颈已经定位。</p>

<details data-knowledge-key="database-performance-diagnosis"><summary>（13）多个团队共用数据库时，怎样治理长事务和上线操作？</summary></details>
<p>明确各团队的业务原子性、任务归属和变更责任，定位事务及阻塞链，减少事务中无关等待，再按允许的提交合同拆批和限速。DDL 还需核验元数据锁、操作能力、窗口与回退演练，在线 DDL 也不能绕过所有锁或保证随时无代价撤销。</p>

<details data-knowledge-key="db-sharding"><summary>（14）历史数据归档、分区都属于治理大表，除了分区，还有什么办法？</summary></details>
<p>先按访问模式、行宽、增长和一致性目标定位限制，再比较垂直拆分、冷热分层、读副本或跨节点分片等候选。普通 InnoDB 分区与跨节点分片不同；每种选择都要验证迁移、查询覆盖和恢复成本，不按行数套固定方案。</p>

<details data-knowledge-key="db-sharding"><summary>（15）数据库设计和表设计方面有哪些优化思路？</summary></details>
<p>先看字段与访问模式，评估热字段和大字段分离、表间职责、键和索引，以及受控冗余能否减少实际查询成本。拆表或冗余都增加查询、更新一致性与迁移代价，要用目标负载验证，不能把“列多”直接等同于必须拆。</p>

<details data-knowledge-key="database-performance-diagnosis"><summary>（16）表设计之外，还能从哪些方向优化数据库？</summary></details>
<p>重新核对访问和返回需求、连接池与网络往返、读写和分析负载、资源竞争与跨团队变更，而不是继续换名罗列索引。先归因哪类工作占用实例，再比较受控并发、错峰、隔离、异步处理或容量方案，并复测业务结果与资源成本。</p>

## 直播间点赞与 AI 理解

<details data-binding-status="pending_semantic_verification"><summary>（17）一个直播 App 为每个直播间增加点赞功能，用户点击后在直播间左上角展示点赞总数，怎样从前端到后端设计？</summary><p>关联知识点待核实。</p></details>
<p>先确认连续点赞、撤销、去重、防刷、展示延迟和最终一致性的要求，再描述前端事件、受控提交、权威计数与总数分发的候选链路。原文未给出规则答案或完整方案，不能直接假定每人一票或无限累加；端到端知识关联待核实。</p>

<details data-binding-status="pending_semantic_verification"><summary>（18）同一个用户是否可以连续点赞？</summary><p>关联知识点待核实。</p></details>
<p>这是设计前必须确认的产品规则：单次表态与可连续累加会影响事件身份、计数和去重方式。材料只说明作者提出了澄清，没有记录对方答案，所以保留待确认，不替题目选择一种规则。</p>

<details data-knowledge-key="llm-long-context"><summary>（19）大模型上下文窗口是不是越大越好，为什么？</summary></details>
<p>区分声明窗口、资源允许的可运行长度与具体任务的有效上下文，更大窗口不保证证据被可靠利用。还要比较预填充延迟、KV Cache、并发与质量，按任务筛选和验证关键证据，用长度及位置切片评测，不能只看最大 Token 数。</p>

<details data-binding-status="pending_semantic_verification"><summary>（20）一种名称尚待确认的知识组织方式与 Ontology，各适合什么场景？</summary><p>关联知识点待核实。</p></details>
<p>先补齐第一种知识组织方式的准确名称，再按对象语义、关系表达、更新和查询需求比较。当前材料不能确定是在比较知识图谱、文档组织还是其他概念，因此不重建题名，也不只因 Ontology 关键词绑定既有本体页。</p>

## Coding、反问与个人经历

<details data-binding-status="pending_semantic_verification"><summary>（21）原地删除重复元素：完整规则和“最多保留两次”的条件是什么？</summary><p>关联知识点待核实。</p></details>
<p>当前仅有“疑似最多保留两次”的描述，尚缺输入是否有序、重复定义、保留次数与输出要求。先确认完整题干和样例，再选择原地维护策略、复杂度与边界测试；暂不推定为某道固定题，也不绑定算法。</p>

<details data-binding-status="pending_semantic_verification"><summary>（22）团队具体负责什么业务，需要重点补哪些能力？</summary><p>关联知识点待核实。</p></details>
<p>可围绕核心用户、任务、数据流、责任边界和近期交付目标询问，再据真实岗位要求补齐对应基础与实践。材料没有完整团队介绍和能力清单，通用学习建议不能代替对方实际业务范围，关联待核实。</p>

<details data-binding-status="pending_semantic_verification"><summary>（23）怎样询问本场表现和改进建议？</summary><p>关联知识点待核实。</p></details>
<p>可请面试官围绕具体问题指出表达、知识或设计取舍上的缺口，并把建议转成可验证练习。材料没有完整反馈，不能替面试官生成评价或推定录用结果，知识关联待核实。</p>

<details data-binding-status="pending_semantic_verification"><summary>（24）岗位 Base 是否在上海？</summary><p>关联知识点待核实。</p></details>
<p>工作地点应以招聘方当前岗位说明或直接确认为准，并区分团队所在地与本岗位实际办公要求。材料只保留了提问，没有给出明确答案，不推断岗位地点，知识关联待核实。</p>

<details data-binding-status="pending_semantic_verification"><summary>（25）此前是否参加过相关面试，为什么没有继续推进？</summary><p>关联知识点待核实。</p></details>
<p>如实区分流程阶段、已确认反馈和自己的决定，说明可公开的事实与改进即可。原文没有披露完整原因，不能补造拒绝、放弃或中断经历，知识关联待核实。</p>

<details data-binding-status="pending_semantic_verification"><summary>（26）目前是否仍在实习，工作安排如何？</summary><p>关联知识点待核实。</p></details>
<p>由当事人按可公开范围说明当前状态、交接和可到岗安排，个人地点等信息无需在复习稿中展开。材料未给出答案，不据发布时间推断实习状态或所在城市，知识关联待核实。</p>

- [数据库整体性能诊断与共享实例治理](../../../knowledge/backend/database/database-performance-diagnosis.md)
