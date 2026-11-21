### 字节飞书 AI 应用一面：Runtime、评测与后端基础

字节跳动飞书多维表格方向，AI 应用工程师一面，视频面约 70 分钟，原帖发表于 2026 年 9 月。一道组合枚举算法开场，接着连问 Agent 运行时、记忆压缩、怎么验证 AI 的修改，再落到一个「数据异常分析 Agent」的场景设计，最后用数据库、网络和 Go 收尾。它很能代表现在 AI 应用岗的考法：**Agent 问题要答到工程细节，后端基础一个都不能少**。下面每题先给一段能直接说出口的回答，再补面试官爱追问的点。

<details data-knowledge-key="algorithm-backtracking"><summary>（1）1～N 选 K 个数，枚举所有组合，时间和空间复杂度是多少？</summary></details>
<p>用回溯。路径里的数保持递增，这样 <code>[1,2]</code> 和 <code>[2,1]</code> 不会重复出现；每层选下一个数，递归回来再弹出。再加一个剪枝：还差 r 个数时，起点最大只能到 <code>N-r+1</code>，再往后凑不满 K 个。答案一共 C(N,K) 组，每组要输出 K 个数，所以时间复杂度是 O(K·C(N,K))；递归栈和路径占 O(K)，如果把结果全存下来再加 O(K·C(N,K))。</p>

```python
def combine(n: int, k: int) -> list[list[int]]:
    res, path = [], []
    def dfs(start: int) -> None:
        if len(path) == k:
            res.append(path[:])          # 拷贝一份，path 之后还会被回溯修改
            return
        need = k - len(path)
        for x in range(start, n - need + 2):   # 剪枝：剩下的数不够凑满 k 个就不用试
            path.append(x)
            dfs(x + 1)
            path.pop()
    dfs(1)
    return res

combine(4, 2)  # [[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]
```

**容易丢分的点**：

- 复杂度说成 O(2^N) 或 O(N) 都不准。枚举类题目的成本由**答案数量**决定，这是面试官想听到的那句话。
- 忘了拷贝 `path`，结果里全是同一个被改空的列表。
- 如果只问「有多少组」，直接算组合数就行，不需要枚举。


知识导航：[回溯、剪枝与组合搜索](../../../knowledge/cs/algorithm/algorithm-backtracking.md)、[时间复杂度、空间复杂度与性能估算](../../../knowledge/cs/algorithm/algorithm-complexity.md)

<details data-knowledge-key="build-agent-framework"><summary>（2）为什么不直接用 Claude Code，要自己做 runtime？</summary></details>
<p>先看业务要什么，再决定用现成的、在框架上扩展，还是自建。我们做的是数据分析 Agent，有几件事现成的编码 Agent 管不了：查询必须按租户鉴权、指标口径要固定版本、工具报错要有统一的语义、任务中断后要能从检查点恢复。这些是运行时的职责，所以我们自己写了执行循环和工具层，模型调用这一层仍然复用现成的。如果只是把模型调用包一层，那就没必要自建。</p>

**可以展开的点**：

- Agent 由两部分组成：**决策循环**（模型看任务和观察结果，决定下一步）和**运行时**（校验参数、执行工具、处理超时、保存状态、判断何时停）。自建的价值主要在后者。
- 能用固定流程解决的步骤（比如格式校验、固定查询）不需要每次都问模型。
- 回答时说清楚「哪个缺口是实际碰到的」，比泛泛说「自建更灵活」有说服力得多。


知识导航：[从零构建 Agent 运行时](../../../knowledge/llm/agent/build-agent-framework.md)、[Coding Agent 的架构与执行循环](../../../knowledge/llm/agent/agent-coding.md)

<details data-knowledge-key="agent-memory-summarization"><summary>（3）memory 怎么压缩？同步还是异步？session 总结怎么定制？</summary></details>
<p>我会把记忆分成三类分开存：原始对话和工具结果、精确事实（比如已经确认的指标口径）、工作摘要。压缩只动工作摘要，原文和精确事实不压。同步压缩在下一次调用前完成，能保证这一轮不超窗口，代价是用户要多等一下；异步压缩在后台做，体验好，但要防止旧摘要覆盖新状态，所以摘要要记下「覆盖到第几条消息」，提交时发现中间有新变化就重算。session 总结用来下次接着干活，不会自动变成全局事实；要跨 session 复用的口径，单独存进长期记忆，并带上版本和来源。</p>

**加分点：现在业界的做法**

- 把记忆做成分层的：最底层是原始记录，上面是整理过的笔记，再上面是结构化知识，每次只往上下文里放一个很小的索引，需要时再按索引去取。
- 空闲时做**离线整理**：合并重复、删掉过时的、用原始记录核对有没有记错。Anthropic 在 2026 年的工程分享里把这个过程叫做 dreaming。
- **记得少比记得多好**。记忆越堆越多，模型反而更容易被过时信息带偏。


知识导航：[会话摘要、压缩与记忆提炼](../../../knowledge/llm/agent/agent-memory-summarization.md)、[Agent 会话、检查点与任务状态存储](../../../knowledge/backend/storage/agent-state-storage.md)

<details data-knowledge-key="agent-eval-framework"><summary>（4）怎么验证 AI 的修改？局部指标变好、整体变差怎么办？</summary></details>
<p>先把「做对」定义清楚，再看结果。我会准备两套用例：回归集保护已经能做对的任务，能力集考察新场景。能用程序判断的就用程序判，比如金额对不对、有没有越权；口径模糊的地方人工抽查；只有解释类的内容才交给模型打分。如果某个局部指标涨了，比如 SQL 能跑通的比例从 90% 到 98%，但端到端答对的比例从 85% 降到 80%，这次改动就不能发。上线前先跑影子流量，再灰度，事先写好回滚条件。</p>

**追问时可以补充的点**：

- 「AI 自己说修好了」不算证据，要看测试结果。
- 影子运行不能有真实副作用，写操作的工具要换成模拟的。
- 能写成测试的验收条件，优先用确定性测试判定，比让另一个模型打分稳定；成本也应该算进评测指标，同样的通过率，更省钱的方案更好。


知识导航：[生产级 Agent 评估系统设计](../../../knowledge/llm/production/agent-eval-framework.md)、[发布质量门禁与回归阻断](../../../knowledge/llm/production/agent-quality-gates.md)、[在线评估、抽样与质量监控](../../../knowledge/llm/production/agent-online-eval.md)

<details data-knowledge-key="agent-resume-interview"><summary>（5）你在项目里是什么角色？团队多大？</summary></details>
<p>说清楚哪些是你自己设计、自己实现、自己验证的，哪些是团队原有的能力；最好带一个细节，比如「某个接口超时是我通过 trace 定位到的」。团队人数照实说。面试官问这题，是在判断你前面讲的方案有多少是你自己的。</p>

**常见失误**：把团队的成果说成自己的，追问两层就露馅；或者太谦虚，只说「参与了」。准确的说法是「我负责 X，具体做了 A、B、C，结果是 Y」。


知识导航：[AI / Agent 岗位简历与面试](../../../knowledge/career/agent-resume-interview.md)

<details data-knowledge-key="multi-agent"><summary>（6）设计一个数据异常分析 Agent：memory、context、几个 Agent、整体架构和落地难点？</summary></details>
<p>我会先把问题的口径定死，再让 Agent 去查：哪个租户、比较哪两个时段、指标怎么算、币种是什么。架构上默认一个主 Agent 加几个受限的只读查询工具，权限、参数和结果大小由运行时校验，差值和比例由程序算。上下文只放当前口径、待验证的假设和最近的证据，长期记忆只存验证过的指标定义。落地最难的是口径对不齐、权限、数据延迟和表结构变化。</p>

面试官问得很细：memory 怎么设计、context 放什么、用几个 Agent、整体架构、落地难点在哪。用一个具体例子来答最清楚。

**例子**：老板问「店铺 A 今天的净收款为什么偏高？」

如果直接让模型写 SQL，它很可能拿今天半天和昨天全天比，或者把支付额当成净额。所以第一步是**先把问题定清楚**：哪个租户、比较哪两个时段、净收款怎么算、币种是什么。定好之后再查：

| 同一时段对比 | 昨天 | 今天 |
| --- | ---: | ---: |
| 成功扣款 | 10000 元 | 11000 元 |
| 完成退款 | 2000 元 | 1000 元 |
| 净收款 | 8000 元 | 10000 元 |

净收款涨了 25%，但扣款只涨了 10%，另一半来自退款变少。这就是 Agent 该给出的答案：先确认异常，再拆出构成，最后列出还需要验证的原因。

**参考回答**：

- **架构**：一个主 Agent 加几个受限的查询工具就够了。主 Agent 负责确定口径和提出查询；运行时负责校验租户、只读权限、参数和结果大小；数据库返回聚合结果；差值和比例由程序算，不让模型心算。
- **Agent 数量**：默认一个。只有在三种情况下才拆子 Agent：上下文太长、效果已经可以测出变差；需要并行探索、而且用完就丢的独立上下文；工具太多导致选错。这也是 Anthropic 在 2026 年分享的经验：一个主循环加按需加载的技能，在很多场景里效果和成本都好过一堆子 Agent。
- **context**：只放当前的口径、待验证的假设和最近的证据；大的查询结果存到外面，上下文里只留引用。
- **memory**：长期记忆存的是验证过的指标定义和适用范围，不存「店铺今天多少钱」这种会变的数。
- **落地难点**：口径对不齐、权限、数据延迟，以及下一题要说的表结构变化。


知识导航：[多智能体协作与适用边界](../../../knowledge/llm/agent/multi-agent.md)、[短期记忆、长期记忆与检索](../../../knowledge/llm/agent/agent-memory.md)、[上下文工程（Context Engineering）](../../../knowledge/llm/agent/context-engineering.md)、[表格、数据库与结构化数据检索](../../../knowledge/llm/rag/rag-table-retrieval.md)

<details data-knowledge-key="data-schema-evolution"><summary>（7）表结构改了或者新增了表，怎么处理？</summary></details>
<p>不能只改提示词。表结构变了，要先把指标的含义重新映射到新字段上，核对金额单位、状态值、去重方式和一对多关系，再把新的查询逻辑作为一个新版本发布，并补上回归用例。新表默认不可读，能查哪些表、哪些行由权限系统决定，不由模型决定。运行时发现结构对不上，就停下来刷新元数据，不要在错误的 SQL 上反复重试。</p>

**一个典型的坑**：新的支付事件表里同时有失败尝试和成功扣款。如果全加起来，今天的扣款会从 11000 变成 12000，净收款跟着虚高。另一个坑是订单表和支付、退款明细直接 join 后再 SUM，行数相乘，金额会被重复计算。正确做法是扣款和退款分别聚合，再合并。


知识导航：[数据 Schema 演进与兼容性](../../../knowledge/data/processing/data-schema-evolution.md)、[SQL 注入与参数化查询](../../../knowledge/backend/auth/sql-injection.md)

<details data-knowledge-key="logging-monitoring"><summary>（8）服务突然变慢、CPU 很高，怎么定位？</summary></details>
<p>先缩小范围：什么时候开始慢的、那时有没有发版、成功率和流量有没有变化、慢的是 P50 还是 P99。然后用链路追踪把一次请求拆成排队、查库、传输、解析几段，看时间花在哪。CPU 高就抓 CPU profile 看热点函数，常见的是 JSON 解析、大量分配引起的 GC、或者重试死循环。要注意慢不一定是 CPU 高，等锁、等连接池、等网络都会慢但 CPU 不高，这时要看 goroutine 和阻塞相关的 profile。定位后在相同负载下验证修复效果。</p>

**面试官还问了「有没有实际经历」**：有就按「现象、怎么查、根因、怎么修、后来怎么防」讲；没有就如实说，讲清楚你会怎么查，这比编一个事故强得多。


知识导航：[日志、指标、Tracing 与告警](../../../knowledge/backend/devops/logging-monitoring.md)

<details data-knowledge-key="mysql-index"><summary>（9）索引的底层是什么？最左前缀是什么？什么时候不走索引？</summary></details>
<p>InnoDB 的索引是 B+ 树。主键索引（聚簇索引）的叶子节点存整行数据，二级索引的叶子存主键值，查到之后如果还要别的列，就得回主键索引再查一次，这叫回表。联合索引 <code>(a, b, c)</code> 按 a、b、c 的顺序排序，所以查询要从最左边的列开始用，才能定位到一段连续的区间，这就是最左前缀原则。</p>

**常见的不走索引的情况**：

- 跳过了最左列，比如只按 b 查（MySQL 8.0 起在部分情况下能用 skip scan，但不能指望）。
- 在索引列上做了函数运算或隐式类型转换，比如 `WHERE DATE(paid_at) = ...`、字符串列和数字比较。
- `LIKE '%xx'` 以通配符开头。
- 优化器估算后觉得全表扫描更便宜，比如要取的数据占了大部分。

**加分点**：WHERE 里条件的书写顺序不影响能否用索引，优化器会自己调整；判断到底走没走，用 `EXPLAIN` 看 `type`、`key` 和 `rows`。


知识导航：[数据库索引原理与查询优化](../../../knowledge/backend/database/mysql-index.md)、[索引、执行计划与查询优化](../../../knowledge/data/sql/sql-index-optimize.md)

<details data-knowledge-key="db-transaction-lock"><summary>（10）RC 和 RR 的原理是什么？降到 RC 有什么取舍？</summary></details>
<p>两者都靠 MVCC 实现普通读：通过 undo log 里的旧版本，按事务的读视图判断哪个版本可见。区别在读视图什么时候生成：<strong>RC 每条 SELECT 都生成新的读视图</strong>，所以能读到别的事务刚提交的数据；<strong>RR 在事务里第一次读时生成，之后一直复用</strong>，所以同一事务里多次读结果一致。锁定读（<code>SELECT ... FOR UPDATE</code>）不看快照，读的是最新已提交版本并加锁。</p>

用一个时间线说明最直观（A 开事务，B 中途把金额从 100 改成 120 并提交）：

| A 的操作 | RC | RR |
| --- | ---: | ---: |
| 第一次普通 SELECT（B 提交前） | 100 | 100 |
| B 提交后，再次普通 SELECT | 120 | 100 |
| 改用 SELECT ... FOR UPDATE | 120 | 120 |

**降到 RC 的取舍**：RR 下的普通 SELECT 读快照、不加锁；但范围的锁定读（FOR UPDATE / FOR SHARE）和 UPDATE、DELETE 会加 next-key lock（记录锁加间隙锁）防幻读。RC 基本不加间隙锁（外键和唯一键检查除外），所以锁冲突和死锁更少、并发更好，很多互联网公司就把默认改成了 RC。代价是同一事务里多次读可能不一致。放到分析场景里，如果扣款和退款分成两条 SQL 查，中间正好有退款提交，RC 下算出来的净额就是拼出来的。解决办法是合成一条 SQL，或者用一个短的 RR 只读事务。


知识导航：[事务、隔离级别与锁](../../../knowledge/backend/database/db-transaction-lock.md)

<details data-knowledge-key="tcp-udp"><summary>（11）数据包从网卡到应用的路径是怎样的？TCP 窗口怎么随拥塞调整？</summary></details>
<p>网卡收到数据后通过 DMA 放进内存里的接收队列，触发中断；驱动用 NAPI 轮询把包取出来交给内核协议栈；IP 层判断是发给本机的，TCP 层按序号重组、发 ACK，把数据放进 socket 的接收缓冲区；应用调用 <code>read</code>/<code>recv</code> 把字节读走，再按自己的协议（比如 HTTP）解析。注意 TCP 是字节流，一个包不等于一条业务消息。</p>

窗口有两个，别混在一起：

- **接收窗口 rwnd**：接收方告诉发送方「我还能收多少」，是流量控制。应用读得慢，缓冲区满了，rwnd 就变小。
- **拥塞窗口 cwnd**：发送方自己估计「网络能承受多少」，是拥塞控制。

发送方能发的量取两者的较小值。cwnd 的经典调整过程：**慢启动**阶段每收到一个 ACK 加一个报文段，一个 RTT 大约翻倍；到阈值后进入**拥塞避免**，每个 RTT 只加一个段；**超时**说明拥塞严重，cwnd 降到 1 重新慢启动；**收到三个重复 ACK** 说明只是丢了个别包，走快重传和快恢复，cwnd 减半后继续拥塞避免。

**加分点**：这是 Reno 的经典过程。Linux 默认用 CUBIC，增长曲线不同；BBR 则是按带宽和 RTT 估算来控制，不以丢包为主要信号。


知识导航：[OSI、TCP/IP 与端到端通信](../../../knowledge/network/tcpIp/tcpIp-model.md)、[TCP、UDP 与传输场景](../../../knowledge/network/tcpIp/tcp-udp.md)

<details data-knowledge-key="os-process-thread"><summary>（12）协程和线程有什么区别？G 阻塞了怎么办？一万个 G 会怎样？</summary></details>
<p>Go 用 GMP 模型：G 是 goroutine，M 是操作系统线程，P 是执行 Go 代码需要的处理器资源，数量由 GOMAXPROCS 决定，默认等于可用的 CPU 核数（Go 1.25 起还会考虑容器的 CPU 限额）。G 要绑到 P 上、由 M 来执行。goroutine 切换在用户态完成，只保存几个寄存器，栈初始只有几 KB，所以比线程切换便宜得多。</p>

G 阻塞分两种情况：

| G 在等什么 | 会发生什么 |
| --- | --- |
| 网络 I/O、channel、锁 | G 被挂起，M 和 P 去执行别的 G；就绪后 G 重新排队 |
| 阻塞的系统调用（如部分文件 I/O、cgo） | M 被卡住，P 会被交给另一个 M 继续干活；系统调用返回后 G 再去抢 P |

一万个 G 完全没问题，内存也就几十 MB，大部分时间它们在等 I/O。但同一时刻真正在跑的最多只有 P 个。如果这一万个 G 都在做 CPU 计算，速度不会因为 G 多而变快；如果它们都去打同一个下游，还会把连接池和下游打满，所以要限并发、做背压。


知识导航：[进程、线程与协程](../../../knowledge/cs/os/os-process-thread.md)、[操作系统的用户态、内核态与切换](../../../knowledge/cs/os/os-user-kernel-mode.md)

## 复盘：这场面试透露的三个信号

1. **Agent 题会一路追到工程细节**。只说「用 RAG、加记忆」不够，面试官会问记忆怎么压缩、异步怎么防覆盖、怎么验证改动，答得出版本、权限、回滚这些词的人明显更占优。
2. **场景题考的是先定口径**。数据分析类 Agent，第一步永远是把「问的到底是哪个数」定清楚，这比用几个 Agent 重要得多。
3. **后端基础是硬门槛**。索引、隔离级别、TCP、Go 调度一个没落下，AI 应用岗不是只考 AI。

> 题目来自候选人的面经自述，原帖没有逐题记录作答。参考回答、例子和数字由 Agent Journey 整理，供备考参考。
