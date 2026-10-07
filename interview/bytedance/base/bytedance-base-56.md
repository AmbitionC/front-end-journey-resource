以下原题或题目类别依据候选人的公开自述整理，经历、实现效果与面试结果未经独立证明。每题后的短答是独立教学归纳，不是作者现场回答；未记录的追问不补写。

原文同时提到不同面试，但这里只能提取其中明确列出的题目，不推断缺失面试内容。

<details data-knowledge-key="java-value-semantics">
<summary>（1）string stringbuild stringbuffer 比较</summary>
</details>

String 不可变；StringBuilder 可变且不保证并发安全，StringBuffer 的部分操作同步。多个调用组成的复合动作仍需考虑原子性，不能用“有同步”推断所有业务逻辑都安全。

<details data-knowledge-key="java-runtime-memory">
<summary>（2）java内存一般会有什么问题？哪些情况会OOM？OOM怎么排查？</summary>
</details>

先按异常信息区分堆、元空间、直接/本地内存和线程创建问题，结合 GC、线程与进程内存趋势排查。堆快照用于找引用链，不能用加堆大小解决所有 OOM。

<details data-knowledge-key="garbage-collection">
<summary>（3）堆快满了会发生什么？gc策略？</summary>
</details>

分配压力可能触发收集，但触发条件和算法由收集器决定；若回收后仍无足够空间会失败。观察存活对象、分配率和暂停，再决定限并发、释放引用或调参。

<details data-knowledge-key="garbage-collection">
<summary>（4）什么是新生代老年代？怎么晋升的？</summary>
</details>

分代收集器把不同存活周期对象分区管理，晋升通常与年龄、空间和收集策略有关。不是所有收集器都采用同一新老年代结构，也不能固定说对象存活几次就一定晋升。

<details data-binding-status="pending_semantic_verification">
<summary>（5）线程有几种状态？</summary>
<p>关联知识点待核实。</p>
</details>

Java Thread.State 有 NEW、RUNNABLE、BLOCKED、WAITING、TIMED_WAITING、TERMINATED；RUNNABLE 不等于操作系统当前正在 CPU 上运行。结合锁等待、条件等待与线程栈理解状态。

<details data-knowledge-key="os-deadlock">
<summary>（6）死锁怎么产生的？怎么解决？tryLock怎么处理？</summary>
</details>

互斥、持有等待、不剥夺与循环等待共同形成死锁条件；统一锁序或有期限获取可打破部分条件。tryLock 失败应释放已持锁并退避，防止忙等与活锁。

<details data-knowledge-key="http-message">
<summary>（7）get post对比 那个性能好？为什么接口查询一般用post？</summary>
</details>

GET 与 POST 没有固定性能高低，取决于缓存、负载和业务；GET 适合安全读取，复杂查询也可按接口合同用 POST。不能认为“查询一般用 POST”是通用规范。

<details data-binding-status="pending_semantic_verification">
<summary>（8）java里怎么调用http的？http vs rpc</summary>
<p>关联知识点待核实。</p>
</details>

Java 可用 HttpClient 等库发 HTTP；RPC 是调用远端服务的抽象，可承载于 HTTP 等协议之上。比较应看契约、序列化、超时和演进，HTTP 与 RPC 不是同一层的互斥分类。

<details data-knowledge-key="mysql-index">
<summary>（9）慢sql怎么排查？怎么开slow_query_log？</summary>
</details>

启用慢日志并设 long_query_time 等条件，收集语句、耗时与访问行，再用执行计划分析索引和锁等待。生产开日志要考虑开销，不能只凭慢日志判断根因。

<details data-knowledge-key="mysql-index">
<summary>（10）慢sql写入超10s的查询怎么设置？log_slow_admin_statements是什么？</summary>
</details>

MySQL 8.4 中 long_query_time=10 表示以秒为单位的阈值；slow_query_log 控制记录，其他条件也影响是否写入。log_slow_admin_statements 是是否记录指定管理语句的开关，不是耗时阈值。

<details data-knowledge-key="sql-core">
<summary>（11）sql里面笛卡尔积是什么？</summary>
</details>

笛卡尔积把两边每行组合，m 与 n 行会产生 m×n 组，CROSS JOIN 或缺连接条件可能形成它。过滤可能改变最终输出，但中间成本仍需看执行计划。

<details data-knowledge-key="java-thread-local">
<summary>（12）介绍ThreadLocal？为什么会内存泄漏？还会有什么问题？</summary>
</details>

线程持有的 Map 对 value 是强引用，key 变为 null 不等于及时移除；线程池还可能保留旧请求上下文。finally.remove、避免绑定共享可变对象，并明确异步上下文传播边界。

<details data-knowledge-key="prompt-context-compression">
<summary>（13）怎么解决因上下文不足而压缩产生的幻觉？</summary>
</details>

摘要保留事实、来源、时间与未完成约束，关键原始材料可检索，出现不确定时重新取证。压缩降低长度也可能损失信息，要用错误样例测试，而非让模型自行补齐。

<details data-knowledge-key="vector-db-selection">
<summary>（14）向量数据库是什么？项目里用的什么模型？</summary>
</details>

向量数据库保存向量并支持相似度检索，常配元数据过滤和近似索引。模型、维度和度量需与实际 Embedding 一致，候选人具体用的型号不能从原帖补造。

<details data-knowledge-key="agent-skill-map">
<summary>（15）ai时代下 后端开发程序员该怎么做？</summary>
</details>

后端基础仍用于权限、状态、并发和可靠交付，再补模型接口、评测、上下文与成本管理。用一个真实小项目验证能力，职业走向是个人选择，不能宣称某岗位必然被替代。

<details data-knowledge-key="algorithm-string">
<summary>（16）算法：leetcode3无重复字符的最长字串</summary>
</details>

用滑动窗口和最近出现位置维护“窗口内无重复”不变量，右移时左边界取 max，防止倒退。时间 O(n)，字符口径需明确；原题按其约束处理，产品文本另考虑 Unicode 分段。

<details data-knowledge-key="agent-resume-interview">
<summary>（17）反问部门信息</summary>
</details>

可询问团队实际业务、岗位职责与新人支持，以面试官回复为准。原文没有回复内容，不能补造部门介绍。

<details data-knowledge-key="agent-resume-interview">
<summary>（18）过程中还问我是不是只会java有没有做过客户端啥的</summary>
</details>

如实说明使用过的语言、客户端项目与个人贡献，没有实践时明确经验边界。可用一个实际实现与验证说明学习迁移能力，不把了解写成做过。
