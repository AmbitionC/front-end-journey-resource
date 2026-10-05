字节跳动 · 全栈 · 一面。经历为候选人自述，未经独立证实；短答为整理者的教学归纳，不代表现场回答或企业标准答案。原记录的第 2—11 题只统述实习项目的业务讨论，未提供逐题问法，以下不补造这些问题。

<details data-knowledge-key="agent-resume-interview">
<summary>（1）如何做自我介绍？</summary>
</details>

围绕目标岗位说明相关背景、承担过的工作和一个可核验的工程结果，区分个人职责与团队成果。没有做过的项目或技术如实说明，具体经历和指标只能来自自己的证据。

<details data-knowledge-key="rag-pipeline">
<summary>（2）RAG 解决什么问题？</summary>
</details>

RAG 在生成前检索外部材料，把相关证据提供给模型，适合资料更新、私有知识或需要可追溯依据的问答。它不直接更新模型参数，也不能保证答案正确；检索遗漏、证据过时和生成误读都需要评估。

<details data-knowledge-key="rag-chunking">
<summary>（3）RAG 把全文给模型，还是只给一部分？</summary>
</details>

通常先把文档切成带元数据的块，再召回、重排和按预算组装相关片段；短文档或特定任务也可以给全文。选择取决于相关性、上下文限制、成本与答案证据，不能把“只给块”当成所有 RAG 的定义。

<details data-knowledge-key="rag-loader-parser">
<summary>（4）PDF 从上传到最终召回经过哪些阶段？</summary>
</details>

上传先保存原文件与版本，再解析正文、版面和必要的 OCR，切分并记录页码、权限和块 ID，生成检索索引。查询侧检索、过滤和重排后回到原文取证；解析失败、删除更新和权限变更也要传播，不能把文件上传等同于可召回。

<details data-knowledge-key="embedding-basics">
<summary>（5）向量化具体怎样做？</summary>
</details>

把经过相同预处理的文本输入 Embedding 模型，得到固定维数的向量并与块 ID、模型版本和原文关联。查询使用兼容的表示空间，按距离或相似度查候选；维度相同不代表不同模型的向量可混用，相似也不等于事实正确。

<details data-knowledge-key="rag-hybrid-search">
<summary>（6）RAG 除向量检索，还会用关键词检索吗？</summary>
</details>

可以组合词法与向量召回：关键词擅长精确名称、编号和术语，向量有利于语义改写。先按稳定 ID 去重，再用排名融合或经校准的分数融合并重排；是否组合要用同一问题集检验，不能默认原始分数直接相加。

<details data-knowledge-key="rag-evaluation">
<summary>（7）RAG 有哪些缺点？</summary>
</details>

检索会漏证据，切分可能破坏条件，旧索引和权限过滤可能影响召回；生成仍会误读或编造。还增加索引更新、调用成本与等待时间，外部内容也可能含提示注入。应分别检查检索、上下文、答案和权限边界，而不是只看最终回复。

<details data-knowledge-key="rag-evaluation">
<summary>（8）RAG 效果怎么评估，自动测试和人工测试怎样分工？</summary>
</details>

固定代表性问题、可用材料及判定标准，分别检查召回、引用支持、回答正确性和延迟。确定规则可自动执行，开放答案用人工或经校准的模型判断；保留错误切片与复核样本，自动跑完不等于自动判分准确。

<details data-knowledge-key="agent-project-portfolio">
<summary>（9）怎样说明自己的 Agent 实践？</summary>
</details>

如实说明目标、状态流转、工具权限、失败处理与完成判据，展示能复现的代码和测试。区分自己实现、框架能力和课程示例；如果只有实验项目就明确其范围，不补造真实用户、线上规模或商业效果。

<details data-knowledge-key="java-thread-pool">
<summary>（10）Java 线程池有哪些参数，线程数怎样确定？</summary>
</details>

ThreadPoolExecutor 的核心参数是核心/最大线程数、空闲保留时间及单位、队列、线程工厂和拒绝处理器。线程数需结合可用 CPU、阻塞比例、下游容量和延迟目标测量；有界队列与拒绝策略一起决定饱和时的行为。

<details data-knowledge-key="java-thread-pool">
<summary>（11）CPU 密集型任务为什么常有人说线程数是核数加一？</summary>
</details>

“核数加一”是经验启发，可能试图覆盖偶发阻塞，并非 JDK 规则或性能保证。纯计算通常接近实际可用 CPU 并行度；多一个线程也可能只增加切换和争用。应在容器限额、其他负载及真实任务下测吞吐与尾延迟。

<details data-knowledge-key="java-thread-pool">
<summary>（12）四种拒绝策略分别适合什么场景？</summary>
</details>

AbortPolicy 显式抛拒绝异常，CallerRunsPolicy 在未关闭时让提交线程执行，DiscardPolicy 静默丢弃，DiscardOldestPolicy 丢掉队首任务后重试。可靠业务应明确失败与补偿；丢弃只适合已定义可损失任务，不能让等待 Future 的调用方永久无结果。

<details data-knowledge-key="java-thread-pool">
<summary>（13）CallerRunsPolicy 里的“主线程”究竟是什么？</summary>
</details>

它指调用 execute 的提交线程，不一定是进程 main 线程；可能是请求线程、生产者或事件循环线程。线程池关闭后该策略会丢弃任务，所以不能用它保证每项任务一定完成。

<details data-knowledge-key="java-thread-pool">
<summary>（14）CallerRunsPolicy 在什么场景有用，会不会压住提交线程？</summary>
</details>

允许提交者同步变慢时，它能形成简单反馈背压，例如受控后台生产者。但任务的耗时直接占用提交线程；放到 UI 或网络事件循环可能阻塞整个处理链。要先确认线程职责、延迟预算以及关闭行为。

<details data-knowledge-key="java-thread-pool">
<summary>（15）把压力转移到提交线程后，如何解决？</summary>
</details>

先限制入口、队列和并发，按容量显式拒绝、延后或降级，并给等待与执行设置预算；可持久化的任务进入有容量规划的后台队列。不能靠无限增加线程、无界队列或另开同样无界的线程池消除持续过载。

<details data-knowledge-key="java-value-semantics">
<summary>（16）Java 方法参数是值传递还是引用传递？</summary>
</details>

Java 传递的是实参值的副本：基本类型复制数值，对象类型复制引用值。方法内重绑参数不改变调用方变量，但通过复制来的引用修改同一可变对象，调用方可观察到；这仍然是值传递。

<details data-knowledge-key="algorithm-hash">
<summary>（17）遍历 HashMap 时怎样正确删除元素？</summary>
</details>

单线程遍历时可使用迭代器自身的 remove，或集合视图的 removeIf；不要在增强 for 遍历期间直接结构性 map.remove。HashMap 的 fail-fast 是尽力检测错误，不能用来保证并发安全；多线程要选择正确的同步或并发集合语义。

<details data-knowledge-key="java-value-semantics">
<summary>（18）Java 用 + 拼接 String 有什么问题？</summary>
</details>

String 不可变，循环反复构造越来越长的前缀可能产生较多临时对象和拷贝，可考虑 StringBuilder。编译期常量和单个表达式可能被编译器优化，不能说每个 + 都慢或总等同于创建 StringBuilder；最后仍要测实际工作负载。

<details data-knowledge-key="java-value-semantics">
<summary>（19）try 和 finally 都有 return，会返回哪个？</summary>
</details>

先执行 try 的返回表达式，再执行 finally；如果 finally 自己 return 或抛出异常，它的异常完成会覆盖原来的返回或异常。finally 正常完成才保留原返回，因此清理代码通常应避免 return，不能笼统说 finally 永远不影响结果。

<details data-knowledge-key="java-value-semantics">
<summary>（20）Java 的 equals 和 == 怎样区分？</summary>
</details>

基本数值的 == 比较经适用转换后的数值，引用的 == 比较是否指向同一对象；equals 的含义由类型实现决定。String.equals 比较字符内容，包装类的引用比较可能受缓存影响；可用 Objects.equals 做空值安全比较，但不同数值包装类型也不自动等值。

<details data-knowledge-key="algorithm-loop">
<summary>（21）手写“目标和”题，应该先明确什么？</summary>
</details>

原记录只有题名，应先确认是否每个数都选正负号、输入是否非负、要方案数还是一组方案，以及空输入和数值范围。若采用教学中的“给每项加正负号并计数”契约，可用状态 (位置,当前和) 的记忆化搜索，或非负输入下的子集计数 DP；这不是对原帖完整题面的补写。

## 候选人反问（原记录）

<details data-knowledge-key="agent-role-landscape">
<summary>（22）反问：校招生应该走全栈还是 Agent 方向？</summary>
</details>

按目标团队的实际工作比较工程基础、模型应用任务、可获得的指导和岗位要求；两者可以有交集。原记录未给出现场答案，这里只提供决策依据，不承诺某条路线一定更好或更容易获得录用。

## 参考资料

以下资料用于核对教学短答，滚动文档核验于 2026-10-03；不作为候选人现场作答的证据。

- [JDK 21：ThreadPoolExecutor](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html)
- [JDK 21：HashMap](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html)
- [JLS 21：表达式](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html)
- [JLS 21：try/finally](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.20.2)
