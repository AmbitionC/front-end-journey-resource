腾讯云智二面，题目覆盖 Spring、Java 并发与 JVM、Linux I/O 多路复用、AI Agent 与 TCP 状态。原帖发表于2026年4月22日，未说明实际面试日期和具体岗位；发表日期不作为面试日期。

以下短答均为编辑整理的学习思路，不是当事人的现场回答。原帖记录了自我介绍、反问，并明确表示无手撕题；底层代码相关追问未留下细节，保留待补。

## Spring 框架

<details data-knowledge-key="spring-container"><summary>（1）请谈谈你对 Spring 框架中 IOC（控制反转）的理解，包括其核心机制和对象生命周期的全流程。</summary></details>
<p>先把控制反转解释为由容器依据 Bean 定义创建对象、解析依赖和管理生命周期，再沿实例化、依赖注入、初始化及后处理、使用和适用的销毁回调说明流程。区分原始实例与可能返回的代理，singleton 与 prototype 的销毁责任也不同。</p>

<details data-knowledge-key="java-dynamic-proxy"><summary>（2）请说明 Spring 中 AOP（面向切面编程）的核心价值（解耦）及实现方式。</summary></details>
<p>把日志、事务等横切行为从业务实现中抽离，围绕连接点应用切面。Spring 常见 AOP 通过 JDK 接口代理或 CGLIB 子类代理拦截调用，只有经过适用代理的调用才会增强；目标内部 this 自调用有明确边界，织入式 AOP 则是另一种机制。</p>

<details data-knowledge-key="java-dynamic-proxy"><summary>（3）Spring 中 JDK 动态代理和 CGLIB 动态代理有什么区别？</summary></details>
<p>JDK 动态代理生成指定接口的实现并把调用交给 InvocationHandler；CGLIB 生成目标类子类，通过可覆写方法拦截。后者受 final 类、final/private 方法及可见性限制，接口代理和子类代理也都要核对实际调用路径；框架配置影响选择，不能只凭有接口推断最终代理类型。</p>

<details data-knowledge-key="spring-container"><summary>（4）Spring 是如何处理循环依赖的？请解释三级缓存机制的原理。</summary></details>
<p>先限定版本、配置、单例作用域与注入方式，再用已完成单例、早期引用、早期引用工厂解释受限的属性注入循环。早期引用可经后处理器形成适用代理，不能把提前实例化等同初始化完成；构造器环、prototype 环及不兼容包装不会被普遍解决，Boot 默认政策还须与 Framework 实现分开核对。</p>

## Java 并发与 JVM

<details data-knowledge-key="os-thread-sync"><summary>（5）请谈谈你对 volatile 关键字的理解，其核心作用是什么？</summary></details>
<p>围绕同一 volatile 字段的写读同步关系说明可见性与有序性，再与锁的互斥作用区分。volatile 的单次字段访问语义不会让 count++ 等复合读改写原子，也不会自动保护被引用对象的所有可变状态。</p>

<details data-knowledge-key="os-thread-sync"><summary>（6）volatile 关键字在懒汉单例模式中有什么应用？为什么需要用到它？</summary></details>
<p>若讨论双重检查锁定的懒汉写法，实例引用需要 volatile，以建立构造完成后的安全发布关系；临界区内的第二次检查与锁负责避免重复创建，volatile 不能替代它们。原文未给具体代码，不能推定现场一定使用双检；也可说明同步访问或类初始化持有者等其他合法实现。</p>

<details data-knowledge-key="java-runtime-memory"><summary>（7）请解释 Java 中的工作内存与主存，以及二者之间的同步机制。</summary></details>
<p>先说明主存与工作内存是解释共享变量和线程执行视图的抽象，不能直接等同物理内存、CPU 缓存或 JVM 栈。以 happens-before 解释 monitor 解锁与后续加锁、同一 volatile 字段写与后续读等同步关系，避免说所有普通读写都会立即相互可见。</p>

<details data-knowledge-key="java-runtime-memory"><summary>（8）JVM 内存模型的具体实现位置在哪里？它与硬件层、JVM 抽象层如何映射？</summary></details>
<p>先澄清原题中的内存模型指 JMM 还是 JVM 运行时数据区：前者约束线程可观察行为，后者描述堆、栈、方法区等逻辑资源。JMM 由编译器与 JVM 在目标硬件上落实，具体优化和指令依实现核对；没有一块固定物理区域就叫内存模型，缓存一致性也不能单独替代它。</p>

<details data-knowledge-key="java-runtime-memory"><summary>（9）请说说 Java 命令、GC 监控的相关知识，怎么查GC。</summary></details>
<p>先固定目标进程、JDK 与收集器，再区分堆概况、回收累计统计、单次 GC 事件和对象保留证据。可用目标 jcmd help 核对可用诊断命令、用 jstat 采样趋势，必要时与 GC 日志或 JFR 事件对齐；GC.run 是主动请求回收，堆转储与直方图有影响，不能当无成本的查看操作。</p>

## Linux I/O 多路复用

<details data-knowledge-key="linux-io-multiplexing"><summary>（10）请解释 select、poll、epoll 三种 IO 多路复用模型的原理，以及它们的优缺点（如连接数限制、性能问题）。</summary></details>
<p>先讲多个 fd 的就绪等待，再比较 select 的位图与编号范围、poll 的数组提交和 epoll 的持久关注集合与就绪事件。poll 没有常用 fd_set 的1024编号限制，epoll 仍受 fd 限额和内存等资源约束；比较成本时必须说明集合规模、活跃比例与连接变动。</p>

<details data-knowledge-key="linux-io-multiplexing"><summary>（11）epoll 模型是如何突破 select/poll 的连接数限制的？其核心数据结构是什么？</summary></details>
<p>先修正题目前提：poll 本身没有 select 常用 fd_set 的固定编号上限，epoll 也不代表无限连接。epoll 维护内核关注集合和就绪集合；例如 Linux v6.12 用红黑树组织监控项、链表组织就绪项，这些实现细节不能推出所有负载下整个处理过程都是 O(1)。</p>

<details data-knowledge-key="linux-io-multiplexing"><summary>（12）epoll 的水平触发（LT）和边缘触发（ET）有什么区别？各自的工作模式是怎样的？</summary></details>
<p>LT 在就绪条件持续满足时仍可报告，ET 不能依赖未处理旧数据再次提醒。用非阻塞读取2 KiB却仅读1 KiB的例子说明为何 ET 通常需要读到 EAGAIN；遇到每轮公平性预算时保留应用 ready 状态继续轮转，写方向也要主动尝试并保存部分写进度。</p>

<details data-knowledge-key="linux-io-multiplexing"><summary>（13）epoll 机制存在哪些开销问题？技术选型时需要如何权衡？</summary></details>
<p>分开统计注册修改、内核事件投递、结果交付、应用读写与业务处理的成本，再考虑 fd 和每连接内存、缓冲及下游队列。大集合但活跃比例低时 epoll 常有价值，频繁变动或大量同时活跃仍需同负载测量；LT/ET 的实现复杂度与公平性也属于选型成本。</p>

## AI Agent 与大模型

<details data-knowledge-key="agent-architecture"><summary>（14）智能回答（传统大模型）与 AI Agent 的核心区别是什么？AI Agent 的核心要素有哪些？</summary></details>
<p>先区分模型单次生成、固定工作流和运行时动态选择行动的 Agent 系统，再说明目标、模型与指令、工具、状态或记忆、观察校验循环及停止条件。工具返回需要验收，模型提出动作不等于执行成功；是否需要 Agent 应由任务的动态性和可验证收益决定。</p>

<details data-knowledge-key="context-engineering"><summary>（15）请谈谈 AI Agent 中上下文工程与记忆管理的关系，二者的核心作用是什么？</summary></details>
<p>上下文工程决定本次模型调用能看到什么，记忆管理决定哪些信息被保存、更新、删除以及如何按需召回。持久存储中的内容只有经过相关性、权限和预算筛选进入当前输入后才影响本次调用；摘要、记忆索引和模型当前已读信息要分开验证。</p>

<details data-knowledge-key="llm-token-context"><summary>（16）上下文大小是被什么限制？</summary></details>
<p>先区分模型或 API 声明的窗口限制与部署实际上能承载的长度。模型版本及其位置机制、训练范围和服务规则决定支持边界，输入、工具及输出等计数按接口核对；KV Cache 显存、并发与计算成本进一步约束实际运行。</p>

<details data-knowledge-key="prompt-context-compression"><summary>（17）当上下文超出限制时，会采用什么处理机制？</summary></details>
<p>先在请求前估算并预留输出预算，超出时按任务选择去重、裁剪、抽取、摘要、外部记忆与按需检索。具体服务可能拒绝请求或按约定截断，不能假定模型会自动无损压缩；压缩后验证目标、关键事实、否定条件和出处，缺失则回源或缩小范围。</p>

<details data-knowledge-key="llm-long-context"><summary>（18）影响 AI Agent 上下文容量的因素有哪些？</summary></details>
<p>分别说明声明窗口、资源可运行长度和任务中的有效上下文。工具定义、历史、检索证据、多模态表示及输出预留占用预算，KV Cache、并发、计算和时延影响运行容量；噪声、位置和压缩保真还会影响信息能否被正确利用。</p>

<details data-knowledge-key="transformer-arch"><summary>（19）你对 Transformer 架构的了解有多少？</summary></details>
<p>沿 token 表示和位置机制、Attention 的 Q/K/V 聚合、FFN、残差与归一化说明主干，再区分原始编码器解码器与现代常见的 Decoder-only。若讨论生成，补充因果掩码和逐 token 推理；这些是编辑学习路径，原帖未记录具体架构细问，不能扩写成现场追问。</p>

## TCP 连接状态

<details data-knowledge-key="tcp-handshake"><summary>（20）TIME_WAIT 与 CLOSE_WAIT 状态分别是什么含义？有什么作用？</summary></details>
<p>结合关闭状态机说明：CLOSE_WAIT 表示收到对端 FIN 后等待本地应用关闭发送方向；TIME_WAIT 在适用关闭路径中保留状态，以便处理最终确认丢失及旧报文的影响。二者可能正常出现，持续积压要结合连接生命周期和报文证据排查，不能把所有 TIME_WAIT 都当故障。</p>

## 待补充的原文信息

<details data-binding-status="pending_semantic_verification"><summary>（21）底层代码相关追问（原文未记录具体题目，待补）</summary><span>关联知识点待核实。</span></details>
<p>原帖只提到还问过底层代码相关内容，没有方法名、代码、条件或具体问法。现阶段只能保留这一信息缺口，不能推定为源码阅读、算法题或其他已经明确的知识考点。</p>
