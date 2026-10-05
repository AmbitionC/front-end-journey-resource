以下原题或题目类别依据候选人的公开自述整理，经历、实现效果与面试结果未经独立证明。每题后的短答是独立教学归纳，不是作者现场回答；未记录的追问不补写。

一题关键字被遮蔽，不推断其内容。括号内个人评价不当作原题或标准答案。

<details data-knowledge-key="agent-resume-interview">
<summary>（1）自我介绍</summary>
</details>

简述与岗位相关的能力、一个项目和自己的贡献，用可复现结果支撑。短答不补造作者履历或面试表现。

<details data-knowledge-key="agent-project-portfolio">
<summary>（2）项目是网上找的还是什么？</summary>
</details>

如实说明项目来自课程、开源还是自主需求，并具体讲自己新增、修改与验证的部分。参考项目并不妨碍学习，关键是理解和独立解决问题的证据。

<details data-knowledge-key="agent-resume-interview">
<summary>（3）有实习过吗？</summary>
</details>

按实际经历说明是否实习、负责范围与持续时间；没有实习可介绍真实项目。不能把教程经历改写成企业工作。

<details data-knowledge-key="agent-project-evaluation">
<summary>（4）项目中挑战最大的是什么？</summary>
</details>

把难点说成明确问题、改动与可验证产出，例如质量提升或故障率变化，并给测试口径。只说做了微调却没有目标、数据和对照，无法证明收益。

<details data-knowledge-key="llm-capability-boundaries">
<summary>（5）出现幻觉怎么处理？</summary>
</details>

先分类是证据不足、检索错、推断错还是格式错，再选择补证据、改提示、校验或拒答。RAG 与微调都不能保证无幻觉，必须在具体任务上评估。

<details data-knowledge-key="prompt-basics">
<summary>（6）提示词具体是怎么做？</summary>
</details>

提示明确任务、可用证据、缺证时的回答规则和输出格式，并配合样例测试。仅写“不要编造”不能可靠限制事实错误，还要做检索与结果核验。

<details data-knowledge-key="prompt-testing-debugging">
<summary>（7）还有其他提示词吗？</summary>
</details>

围绕失败类型补约束或示例，检查是否改善原问题以及是否引入退化。不要为了显得全面而堆提示词；版本变化要能回放固定测试集。

<details data-knowledge-key="agent-memory-architecture">
<summary>（8）Agent的短期长期记忆是怎么实现的？</summary>
</details>

短期状态服务当前会话，长期记忆跨会话保存获准事实与经验，读取时受预算和权限限制。写入要校验来源与时间，处理冲突、过期和删除。

<details data-knowledge-key="agent-architecture">
<summary>（9）如果让你设计一个Agent要考虑哪些模块？</summary>
</details>

先确定任务，再设计模型接口、工具、状态、上下文、调度、权限与评测闭环。最小实现不必具备所有高级模块，但每次调用应可追踪并有终止条件。

<details data-knowledge-key="llm-error-retry-fallback">
<summary>（10）如果遇到api超时和报错怎么解决？</summary>
</details>

设置 deadline，区分瞬态、永久与结果不明错误，有限重试并退避；必要时降级。超时不能证明写操作没执行，重试前需幂等合同或结果查询。

<details data-knowledge-key="agent-failure-recovery">
<summary>（11）有没有考虑用大模型自己排除api超时和报错？</summary>
</details>

模型可帮助解释错误或提出下一步，但宿主验证计划并限制权限、重试和预算。网络超时、认证失败和副作用状态应由确定性机制判断，不能完全交给模型猜测。

<details data-knowledge-key="llm-token-budget">
<summary>（12）消耗token过快怎么排查？</summary>
</details>

按 run 记录输入、输出、缓存和工具结果 token，定位长历史、重复检索或循环调用。再调整上下文选择与终止条件，压缩后还要检查是否损伤任务质量。

<details data-knowledge-key="java-thread-pool">
<summary>（13）讲一下java线程池？</summary>
</details>

线程池通过线程复用、队列和拒绝策略管理执行容量，核心数、最大数、队列共同作用。CPU 与阻塞任务要分别压测，不能固定套核数公式。

<details data-knowledge-key="java-thread-pool">
<summary>（14）如果你重新设计一个线程池会怎么设计？</summary>
</details>

先定义提交、排队、执行、关闭与拒绝合同，再设计有界队列、worker 生命周期和错误处理。线程安全、取消、饥饿与资源上限比能启动几个线程更关键。

<details data-knowledge-key="java-runtime-memory">
<summary>（15）怎么把class文件加载到jvm中？</summary>
</details>

类加载器读取或生成字节码并定义类，随后经历链接中的验证、准备和解析，以及满足条件时的初始化。解析时机可变化，不能把读取 class 文件当作整个加载生命周期。

<details data-knowledge-key="db-transaction-lock">
<summary>（16）mysql的undolog，redolog，binlog区别和场景？</summary>
</details>

undo 支持回滚与 MVCC 旧版本读取，redo 支持 InnoDB 崩溃恢复，binlog 记录服务层变更供复制和恢复。三者层级与用途不同，日志写入与刷盘策略也决定持久边界。

<details data-knowledge-key="db-transaction-lock">
<summary>（17）什么是两阶段提交？</summary>
</details>

通用两阶段提交分准备与提交，用协调者统一决议，但会有阻塞和故障恢复问题。MySQL 中 redo 与 binlog 的协调也是相关场景，需说明所讨论的范围，不能混为所有分布式事务。

<details data-knowledge-key="os-deadlock">
<summary>（18）多线程写一个死锁</summary>
</details>

两个线程按相反顺序持有 A、B 锁并等待另一把可形成循环等待。可用固定锁序、减少嵌套或有期限尝试打破条件；演示死锁时需隔离运行并能终止。

<details data-knowledge-key="java-value-semantics">
<summary>（19）随便写一个单例模式</summary>
</details>

可用静态持有者或枚举表达某些单例需求；若使用双重检查锁，要保证实例发布符合内存模型。类加载器、序列化和测试需求会影响边界，单例也不等于共享状态线程安全。

<details>
<summary>（20）为什么要*********关键字？</summary>
</details>

原帖关键字被遮蔽为星号，无法确定所问内容。应先取得完整题目，再解释对应语义；这里不擅自把它替换为 volatile 或其他关键字。

<details data-knowledge-key="algorithm-array">
<summary>（21）算法：合并两个有序数组</summary>
</details>

若第一个数组预留空间，可从两个有序段的末尾向前比较，把较大元素写到末尾，避免覆盖未读取数据。明确长度与排序方向，时间 O(m+n)、额外空间 O(1)。

<details data-knowledge-key="agent-resume-interview">
<summary>（22）反问</summary>
</details>

可询问岗位主要任务、团队评测方法和新人支持，帮助判断匹配。原帖未记录回复，不能替公司给出具体安排。
