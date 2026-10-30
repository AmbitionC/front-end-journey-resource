### 蚂蚁暑期面经：线程池、数据来源与多 Agent 评测

原帖发表于 2026 年 4 月，自述为蚂蚁暑期面试，未披露具体轮次与部门。技术记录涉及 Java 基础、数据预处理和航旅排障 Agent 项目；以下只围绕明确问题整理，不复制可定位个人的教育背景，也不补写未公开的项目配置或趋势追问。

面试经历为个人自述，未经企业独立确认。以下短答及示例为编辑教学整理，不代表当事人的现场回答、项目配置或实验结果。

<details data-knowledge-key="java-thread-pool"><summary>（1）带队列的 Java 线程池怎样接收和执行任务？</summary></details>
<p>回答时先说明核心线程数、最大线程数、空闲保活时间及其单位、任务队列、线程工厂与拒绝策略等构造参数。典型 ThreadPoolExecutor 会先尝试核心线程，再入队，队列无法接纳时再尝试扩到最大线程数，仍不能接纳才拒绝；关闭与并发变化也会影响结果。无界队列可能使最大线程数难以发挥预期作用，容量应按任务特性和资源预算确定。</p>

<details data-binding-status="pending_semantic_verification"><summary>（2）垃圾回收算法与 G1、ZGC 怎样区分？</summary><p>关联知识点待核实。</p></details>
<p>应区分标记、复制、整理等算法思想与组合这些机制的具体收集器。G1 与 ZGC 的可用版本、并发阶段和资源取舍不同，ZGC 并非 JDK 8 提供的收集器；“低停顿”也不是任何负载下的时延保证。原帖未提供实际运行版本、日志和目标，现有知识正文尚不足以完整承接这道比较题，关联继续待核实。</p>

<details data-binding-status="pending_semantic_verification"><summary>（3）Spring Boot Starter 包含什么，怎样参与自动配置？</summary><p>关联知识点待核实。</p></details>
<p>Starter 通常聚合一组配套依赖；自动配置另由框架识别并按条件装配 Bean，二者不能等同为一个神秘的“自动创建所有对象”步骤。实际入口、条件评估和覆盖规则需按使用的 Spring Boot 版本核对。原帖未给版本，当前知识库也缺可完整承接本题的专门讲解，因此暂不绑定或计热。</p>

<details data-binding-status="pending_semantic_verification"><summary>（4）Spring AOP 的基本机制和边界是什么？</summary><p>关联知识点待核实。</p></details>
<p>Spring AOP 常通过运行时代理在匹配的方法调用处执行通知；代理机制与配置、类型有关，不能说它无条件拦截所有 Java 调用。对象内部自调用等绕过代理的路径是常见边界，AOP 也不等同于容器的依赖注入。原帖没有公开具体配置，现有候选知识不足以完整承接本题，关联待核实。</p>

<details data-knowledge-key="mysql-index"><summary>（5）慢 SQL 怎样定位，为什么“有索引”仍可能很慢？</summary></details>
<p>先检查执行计划与实际扫描、返回行数、过滤和排序、锁等待及存储资源，确认耗时发生在哪里。索引是否可用取决于谓词、字段顺序、类型与排序规则等条件，优化器也可能因为成本选择扫描；不能列一个语法就断言必然失效。将改写、索引和数据分布放到代表性负载下比较，兼顾写入成本与业务正确性。</p>

<details data-knowledge-key="redis-cache"><summary>（6）博客项目为什么使用 Redis，应该怎样解释场景？</summary></details>
<p>用真实访问路径说明缓存要减少哪种重复工作，哪些数据允许陈旧、谁是权威以及如何失效。举例时要明确是教学假设，不能替原作者指定文章列表、计数或会话等用途。若数据库负载很低、命中收益不明显或一致性代价过高，不使用分布式缓存也可能更合适；选型应由指标和约束支撑。</p>

<details data-knowledge-key="http-message"><summary>（7）HTTP/1.1 与 HTTP/2 的主要差异是什么？</summary></details>
<p>HTTP/2 在一条连接上用二进制帧和流组织多路请求，并提供头部压缩等机制；HTTP 方法与状态码等语义仍需区分于传输表示。它减少部分应用层串行等待，但基于 TCP 时丢包仍可能影响同连接上的其他流，不能说完全消除了队头阻塞。是否更快还受连接、负载与服务端实现影响。</p>

<details data-knowledge-key="os-process-thread"><summary>（8）数据预处理为什么可能选择多进程而不是多线程？</summary></details>
<p>先比较任务是 CPU 计算还是 I/O 等待、是否需要隔离以及数据共享和传输成本。多进程可以提供更独立的地址空间和故障边界，但进程间通信与复制可能更贵；线程共享数据更方便，也带来同步风险。语言运行时是否限制某类 CPU 并行需另行核对，不能在原帖没有说明语言时替作者补上某个解释器限制。</p>

<details data-knowledge-key="data-lineage"><summary>（9）Agent 项目的数据来源与真实性怎样说明？</summary></details>
<p>说明数据由谁产生、采集和标注，覆盖哪些业务与时间范围，是否有使用许可、隐私处理和版本记录，并抽样检查与目标任务的对应关系。真实业务数据也可能有偏差、错误和泄漏，合成数据则要说明生成与独立验证过程。原帖是在追问来源，未公开答案，不能将其表述为已使用真实业务数据。</p>

<details data-knowledge-key="multi-agent"><summary>（10）怎样讲清多 Agent 工作流？</summary></details>
<p>先解释为什么需要多角色，再说明每个角色的输入输出、状态所有权、路由和停止条件，以及谁负责权限、预算和最终验收。串行依赖与可并行任务要分开，工具失败、重复执行和信息冲突要有明确处理。使用多个 Agent 不自动提高质量；应与单 Agent 或确定性流程在同一任务集比较，原帖未披露其具体分工。</p>

<details data-knowledge-key="agent-evaluation"><summary>（11）Agent 项目的效果应该用哪些指标验证？</summary></details>
<p>从实际任务的成功标准开始，优先检查环境终态、工具和权限约束，再记录质量、时延、成本与失败恢复。用冻结的代表性任务和困难切片比较基线，开放质量采用经过校准的评分并结合人工复核。只展示一个准确率、模型自评或成功演示不能证明系统整体有效；原帖没有给出当事人的数值。</p>

<details data-knowledge-key="agent-coding"><summary>（12）怎样复盘 AI Coding 的体验与难以解决的 Bug？</summary></details>
<p>选择可展示证据的真实任务，说明 AI 参与的步骤、它缺少什么上下文、怎样复现失败，以及最终如何通过测试和 Diff 复核。区分生成代码、理解需求与完成交付，避免只给产品好坏的感受评价。原帖没有描述具体 Bug，本页不补写当事人的工具使用经历或虚构成功案例。</p>

<details data-binding-status="pending_semantic_verification"><summary>（13）微服务为什么没有完全落地（项目约束待补）？</summary><p>关联知识点待核实。</p></details>
<p>原帖没有说明拟拆分范围、团队和负载，也没有给出最后取舍。应补齐这些条件后再讨论独立部署、故障隔离与分布式复杂度，不能替当事人编写放弃微服务的具体理由。</p>

<details data-binding-status="pending_semantic_verification"><summary>（14）结合新趋势，项目还有哪些优化空间（具体趋势待补）？</summary><p>关联知识点待核实。</p></details>
<p>原文未给出被讨论的趋势或完整架构。这里保留开放追问，不把后来流行的框架、模型或方法补写成当场考点，也不据此增加对应知识热度。</p>
