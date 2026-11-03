原帖自述为腾讯 CDG 金融科技二面，开场涉及自我介绍与实习到岗安排，未说明正式岗位名称、面试日期或结果。以下答题思路为编辑整理，不代表当事人的现场回答；原文重复编号 9，按实际提问顺序保留十四题，语言和系统前提不明确处会明确说明。

<details data-knowledge-key="agent-eval-framework"><summary>（1）Agent 与问答系统有什么区别？如何评估这个 Agent 系统？</summary></details>
<p>先按目标与行动方式比较：问答系统也可以检索或调用工具，Agent 更强调根据环境反馈持续选择行动，不能仅凭聊天界面分类。评估先固定任务、初始环境和成功判据，分别检查环境终态、产物与工具轨迹，再记录成本、延迟和失败类型。确定条件优先用可执行检查，开放质量用经人工校准的评分，按场景和重复执行报告结果。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（2）实习时，公司使用了什么框架？</summary></details>
<p>如实说明实习中接触的框架、实际版本和自己负责的模块，再解释它在系统中承担什么职责。可以用一个真实调用链或问题说明选择与限制，并区分自己实现、团队已有能力和仅了解的部分。原帖没有给出具体框架名称，不能替当事人补成 LangChain 或其他方案。</p>

<details data-knowledge-key="build-agent-framework"><summary>（3）你有没有阅读过 LangChain 的底层代码？</summary></details>
<p>先如实说明是否读过、阅读的语言版本与具体模块，没读过的部分直接说明。若介绍阅读方法，可以从实际入口沿模型调用、工具执行、状态更新和终止条件追踪，用最小示例或调试记录验证理解。当前 LangChain Agent 可运行在 LangGraph 之上，但不能把现行文档当作当事人当时所用版本的源码事实。</p>

<details data-knowledge-key="mysql-index"><summary>（4）LSM Tree 和 B+ 树有什么区别？</summary></details>
<p>先比较更新的接收、持久结构和后台维护；以启用 WAL 的 RocksDB 常规写路径为例，同一批写先追加日志、再更新 MemTable，是否在返回前等待日志同步则要另看配置。缓冲数据随后生成有序 SST，并由 compaction 合并；页式 B+ 树围绕树页维持有序数据，缓冲和日志同样影响实际写入。两者都支持等值和范围查询，应固定缓存、负载和持久性要求比较读写与空间成本。</p>

<details data-knowledge-key="os-virtual-memory"><summary>（5）如何管理内存，尽量避免内存碎片？</summary></details>
<p>先区分用户态分配器的内部、外部碎片与物理页的连续分配问题，再观察对象大小、存活期和实际占用。可按负载评估大小分级池、同生命周期 arena 或容量预留，但整块分配后再切小块仍可能浪费、耗尽或延迟释放。以 C++ 单调内存资源为例，单个释放不回收且默认不提供同步，不能只列堆栈或承诺一种方法消除所有碎片。</p>

<details data-knowledge-key="os-process-thread"><summary>（6）怎样用 C++ 实现协程？请说明思路。</summary></details>
<p>先确认是 C++20 标准协程，还是需要独立栈和上下文切换的库级方案。以 C++20 为例，围绕协程状态、promise、awaiter 和句柄说明挂起、恢复、结果与生命周期，再由库或应用提供 I/O 事件循环和执行器。Go 的 GMP 是另一套运行时调度模型，不能直接当作 C++ 标准协程的实现答案。</p>

<details data-knowledge-key="os-process-thread"><summary>（7）协程数量很多时，可以采用什么调度策略？</summary></details>
<p>先区分大量协程在等待 I/O，还是就绪队列和 CPU 已经积压，再限制任务状态、队列和下游并发。自行设计调度器时可比较轮转、分级队列与避免饥饿，多工作线程负载不均时再考虑工作窃取。若接上题采用协作式 C++20 协程，时间片不会自动在任意指令处抢占，长计算需拆分让出或移到受控工作线程。</p>

<details data-knowledge-key="os-virtual-memory"><summary>（8）异步刷盘失败后应该怎样处理？</summary></details>
<p>先确认失败发生在请求提交、I/O 完成、脏页写回还是同步确认阶段，并检查该接口的完成结果与错误码。容量、配额、设备错误和暂时性中断要分别处理，保留可恢复证据并停止承诺受影响数据已经持久化；一次后续同步成功不能自动证明先前失败数据已经补好。数据库 WAL 只有在日志先持久化且恢复链完整等前提下才支撑恢复，日志自身失败也需要处理，不能用“加 WAL”概括所有故障。</p>

<details data-knowledge-key="os-virtual-memory"><summary>（9）你了解 Page Cache 吗？在讨论 mmap 的过程中，Page Cache 怎样实现异步刷盘？</summary></details>
<p>以 Linux 常见缓冲文件 I/O 为例，普通读写和文件映射可经由 Page Cache，文件修改形成脏页后由内核推进写回。后台 flusher 会受脏数据规模和年龄等条件影响，压力较大时写入方也可能参与或等待，不能承诺前台永不阻塞。mmap 还需区分共享与私有映射，写回、映射同步和崩溃持久性各自按接口合同判断，不能把映射成功或 MS_ASYNC 返回当作落盘确认。</p>

<details data-knowledge-key="logging-monitoring"><summary>（10）遇到问题时怎样排查？有没有进入容器查看，用过哪些命令？</summary></details>
<p>先给出真实故障现象、影响范围和时间线，用请求标识关联日志、指标、追踪和资源证据。以已获准查看的 Docker 容器为教学例，先用限定窗口的 docker logs、只选择 State 字段的 docker inspect 和一次 docker stats 快照收集线索；进入容器的 exec 会新建进程，需有对应授权并选择不改状态的检查。没有实际操作过就如实说明，单次快照、退出码或进入容器都不等于完成根因定位。</p>

<details data-knowledge-key="os-virtual-memory"><summary>（11）内存占用暴涨会产生哪些影响？</summary></details>
<p>先看活跃工作集、可回收缓存、swap 与进程或容器限制，再判断是否出现回收等待、重新读盘、分配失败或 OOM。缺页可能来自合法首次访问、写时复制或换入，不等于申请内存失败后必然发生页面置换。把内存、fault、回收或换页等待及 OOM 证据与延迟对齐，再区分泄漏、缓存增长、并发激增和资源上限。</p>

<details data-knowledge-key="agent-open-source-contribution"><summary>（12）平常关注哪些技术社区？</summary></details>
<p>列出自己真实持续关注的项目或社区，并说明通常跟进哪些问题，而不只是罗列热门名称。选一个近期真实读过的文档、issue、发布变更或讨论，解释学到了什么，以及是否做过复现或小验证。阅读、参与讨论和提交贡献是不同经历，没有参与过的部分如实说明。</p>

<details data-knowledge-key="algorithm-array"><summary>（13）vector 和 slice 有什么区别？（原帖未说明语言与具体类型）</summary></details>
<p>先澄清语言、库和版本，因为 slice 可能指不同类型、视图或操作，不能直接认定为 Go、Rust 或 C++ span。可以先比较存储所有权、是否复制、可变性、长度与容量，以及扩容和生命周期规则。仅作 C++20 教学假设时，vector&lt;int&gt; 管理元素存储，span&lt;int&gt; 借用连续范围且不延长其生命周期，这个例子不代表原题中的 slice 就是 span。</p>

<details data-knowledge-key="algorithm-array"><summary>（14）使用这些标准库类型时，你会考虑哪些因素？</summary></details>
<p>先确认具体语言和类型，再按操作需求检查所有权、复制成本、长度与容量、迭代器或视图失效、错误处理和生命周期。还要确认是否跨异步边界保留引用、是否存在并发修改，以及算法对有序性和索引范围的前提。用实际标准保证与代表性负载判断选择，不能因为属于标准库就承诺自动线程安全或性能最优。</p>
