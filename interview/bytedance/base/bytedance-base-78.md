候选人自述：字节跳动后端实习一面；原文没有确认面试日期。以下仅整理已见文字，不代表完整现场问答。

以下短答是编辑整理的复习思路，与当事人现场回答区分。

<details data-binding-status="pending_semantic_verification"><summary>（1）恶意充值识别 Skill 怎么实现？</summary><p>关联知识点待核实。</p></details>

<p>需要先给出真实业务输入、可用证据、输出与执行权限；原帖没有实现细节，保留待补，不替作者编造规则或封号流程。</p>

<details data-binding-status="pending_semantic_verification"><summary>（2）封号的规则怎么写？</summary><p>关联知识点待核实。</p></details>

<p>先区分风险证据、规则判断和处置权限，再说明规则版本、误报与复核。原帖没有具体条件和阈值，不能把通用整理当成当事人的现场实现。</p>

<details data-binding-status="pending_semantic_verification"><summary>（3）为什么排查恶意用户，而不直接修改充值逻辑？</summary><p>关联知识点待核实。</p></details>

<p>当事人说任务由公司安排，事后认为直接修改逻辑更合适。关于活动阶段的说明是拟议的复盘解释，原帖未确认当时的实际决策依据，也不能据此宣称漏洞已被修复。</p>

<details data-knowledge-key="agent-deterministic-workflow"><summary>（4）为什么用 Agent，代码直接判断并封号不就行了吗？</summary></details>

<p>原帖把“业务规则仍在探索、Agent 可辅助积累分析信息”写成事后拟议的解释，未证实这是当时的实际决策依据。复习时应比较确定性规则与 Agent 的可测收益、错误风险和成本；稳定且可枚举的判断可以由代码执行，不能据此认定原项目已经这样实现。</p>

<details data-binding-status="pending_semantic_verification"><summary>（5）有没有对误封采取措施？</summary><p>关联知识点待核实。</p></details>

<p>原帖仅明确提到人工处理申诉，没有给出自动补偿机制。保留这一事实；可讨论复核和恢复作为编辑建议，不能写成项目已有能力。</p>

<details data-knowledge-key="java-thread-pool"><summary>（6）拆分线程池怎么做？</summary></details>

<p>先按任务的耗时、优先级与下游依赖确定隔离边界，再说明每个池的线程数、有界排队和拒绝行为。多个池仍共享进程资源，要同时限制总并发并观察排队与下游压力。</p>

<details data-knowledge-key="java-thread-pool"><summary>（7）线程池的任务经 HTTP 还是 RPC 传入？用了 RPC，为什么还需要线程池？</summary></details>

<p>先说明实际执行链上的接入线程、RPC 回调和业务任务分别在哪运行，原帖没有给出具体框架和配置。是否另设业务池取决于隔离需求，额外一次提交也会引入排队、超时和拒绝处理。</p>

<details data-knowledge-key="java-thread-pool"><summary>（8）动态拆分中的“动态”指什么？拆分后线程池会释放吗？</summary></details>

<p>区分修改存量池参数和创建、切换、回收业务池。说明新任务怎样路由、旧任务怎样结束以及谁负责关闭；关闭发起不等于所有任务已经结束，原帖未提供具体实现。</p>

<details data-knowledge-key="api-idempotency"><summary>（9）充值赠送 token 怎么保证幂等、一致性与原子性？</summary></details>

<p>用稳定充值事件标识约束同一业务效果，把去重记录、赠送记录和余额变动放进明确的事务边界。跨系统超时要查询或对账，不能只用互斥锁或收到成功响应来推断原子性。</p>

<details data-binding-status="pending_semantic_verification"><summary>（10）JEV 判题怎么优化，与大模型输入有何区别；流程、知识库、部署来源和官方收费分别是什么？</summary><p>关联知识点待核实。</p></details>

<p>JEV 的含义、具体模型和实际部署在原帖中没有说明，均待补。仅保留原始追问，不能把缩写改成某个产品，也不能填写猜测的模型价格。</p>

<details data-knowledge-key="java-runtime-memory"><summary>（11）JVM 运行时内存分区有哪些？</summary></details>

<p>先区分运行时数据区与 JMM，再按堆、方法区及运行时常量池、程序计数器、虚拟机栈与实现需要的本地方法栈说明用途。元空间等实现细节与规范概念分开，进程内存也不只包含堆。</p>

<details data-binding-status="pending_semantic_verification"><summary>（12）垃圾回收机制是什么？</summary><p>关联知识点待核实。</p></details>

<p>原帖只提到对 minor GC 有印象，没有给出具体 JDK、收集器或完整回答。应按实际版本补充可达性与收集机制后再关联完整知识正文，本稿保留待补。</p>

<details data-knowledge-key="mysql-index"><summary>（13）MySQL 索引类型有哪些？</summary></details>

<p>先说明按结构、约束和存储组织分类是不同维度，再限定实际引擎。InnoDB 的聚簇索引与二级索引需要结合行数据、主键和回表说明，不能把所有 MySQL 索引都归为同一结构。</p>

<details data-knowledge-key="mysql-index"><summary>（14）哪些情况会导致索引无法有效用于查询？</summary></details>

<p>从查询条件、联合索引前缀、函数与转换和数据分布分析，再读实际执行计划。没被选用与索引结构失效不同，不能把缺少前导列或出现范围条件一律描述成整棵索引无效。</p>

<details data-knowledge-key="mysql-index"><summary>（15）怎么排查慢 SQL？</summary></details>

<p>先取得真实 SQL、参数与耗时，区分扫描、排序、锁等待和返回量，再检查计划与数据分布。减少字段和添加索引只是候选改动，要保持语义并用相同负载比较效果。</p>

<details data-knowledge-key="mysql-index"><summary>（16）应该加什么样的索引？</summary></details>

<p>围绕实际过滤、排序和输出字段设计候选索引，评估前导列、覆盖收益及写维护成本。原帖没有给定表结构和查询，不能给出声称适用的具体建索引语句。</p>

<details data-binding-status="pending_semantic_verification"><summary>（17）力扣 198：打家劫舍。</summary><p>关联知识点待核实。</p></details>

<p>原帖明确给出题号与题名；完整约束和题解待补，暂不扩写未经核验的题干。</p>

