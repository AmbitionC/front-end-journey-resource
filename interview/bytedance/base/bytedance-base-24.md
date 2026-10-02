公司：字节跳动；岗位：AI 应用工程师（飞书多维表格方向）；轮次：一面；形式：视频面；作者记录约 70 分钟。原帖发表于 2026 年 9 月，具体面试日与招聘类别未披露。

原题来自候选人自述，未独立证实；以下按主题归纳。原文没有逐题作答记录，因此本文不补造作者的实现、团队人数或实际事故。教学案例、整理答案和模拟追问均不代表企业标准答案。技术资料核验于 2026-10-02。

## 贯穿案例：先确定“哪个数异常”，再谈 Agent 架构

以下是教学设定。老板问：“店铺 A 今天净收款为什么偏高？”若直接让模型生成 SQL，它可能把今天半天与昨天全天比较，把支付额当净额，或从新表重复统计扣款记录。答案即使看似合理，也没有回答同一个问题。

先冻结分析合同：租户由服务端授权为 A；“今天”解析为 2026-10-01 UTC 00:00–12:00，比较前一日同一时段；指标 `net_receipts.v3` 定义为窗口内成功扣款金额减去窗口内完成退款金额，币种限定 CNY；记录 schema、数据截止点和查询版本。这个净额定义是本例选择的口径，不是所有公司的“净收款”通用定义。

| 同口径教学数据 | 昨日同一时段 | 今日时段 |
| --- | ---: | ---: |
| 成功扣款 | 10000 元 | 11000 元 |
| 完成退款 | 2000 元 | 1000 元 |
| 净收款 | 8000 元 | 10000 元 |

手工演算得到净收款增加 `(10000-8000)/8000=25%`，成功扣款只增加 10%。因此“净额高 25%”不能改写成“销售增长 25%”；退款变化贡献了净额差，但其业务原因仍需证据。

最小系统由一个编排 Agent 和受限查询工具起步。Agent 提议口径与查询；运行时校验租户、表列、只读操作、参数、schema 版本和结果上限；数据库返回聚合值及查询证据；程序计算差额，Agent 给出已确认异常、候选原因和未验证事项。每一步都有持有状态的人和输入输出：服务端持授权及指标合同，数据库持事实，工作上下文持当前调查进度，长期记忆只存带版本与来源的可复用定义。

反例是业务从 schema v5 的订单支付字段迁移到 v6 的支付事件表，后者还包含失败尝试。同一笔 1000 元失败尝试加一次成功扣款，若都相加，会把今日扣款从 11000 算成 12000，净额伪增到 11000。旧摘要“支付金额已核实”不能让这条新查询通过。后面将用这个例子连接 schema 演进、评测、索引、事务和服务诊断。

## 原题导航

| 原帖题目归纳 | 主题 |
| --- | --- |
| 1～N 选 K 个数，枚举答案及时间、空间复杂度 | 组合输出与回溯 |
| 为何不用 Claude Code，是否自建 runtime | 运行时取舍 |
| memory 压缩、同步/异步与 session 总结定制 | 状态与摘要 |
| 如何验证 AI 修改，人工约束、回归、能力评测、灰度、影子 case；局部提升却总体退化 | 迭代判据 |
| 自己承担什么角色，团队规模 | 项目证据边界 |
| 数据异常分析 Agent 的 memory、context、数量、架构与落地难点 | 分析合同 |
| 表结构改变或新增表怎样处理 | 语义与 schema 版本 |
| 服务突然变慢、CPU 高如何定位，是否实际经历 | 诊断路径 |
| 索引底层、最左前缀及“不走索引” | 有序访问与成本 |
| RC/RR 原理与降到 RC 的取舍 | 快照与锁定读 |
| 网卡到应用的包路径，TCP 窗口怎样按拥塞调整 | 接收路径与两种窗口 |
| 协程/线程、阻塞 G、切换、用户态调度与一万个 G | Go 执行资源 |

## 算法：枚举成本首先由答案数量决定

选择顺序不影响组合，所以路径保持递增即可，避免把 `[1,2]` 与 `[2,1]` 输出两次。对 `N=4,K=2`，手工展开得到 `[1,2]、[1,3]、[1,4]、[2,3]、[2,4]、[3,4]`。递归每层选择下一个数，回溯时弹出；若还缺 r 个数，下一个数最多为 `N-r+1`，更大的起点不能完成一组，直接剪掉。

以下伪代码未运行；`emit(copy(path))` 表示输出独立结果，不能让所有答案引用同一条随后被回溯修改的路径。

```text
choose(N, K):
    验证 N、K 为非负整数
    if K > N: return 无结果
    path = []
    dfs(start):
        if len(path) == K:
            emit(copy(path))
            return
        need = K - len(path)
        for x = start ... N - need + 1:
            path.push(x)
            dfs(x + 1)
            path.pop()
    dfs(1)
```

对于 `1 <= K <= N`，答案数是 `C(N,K)`，每组明确输出 K 个整数，光结果复制就需要 `Ω(K·C(N,K))` 工作。上面的剪枝递增搜索可在 `O(K·C(N,K))` 时间内枚举；不能只说 O(N)，也不能忽略输出，把组合数量说成总成本。这个例子是 6 组、12 个整数的输出工作，不是实测耗时。

路径和递归栈占 O(K)；若积存所有结果，另计 `O(K·C(N,K))`。流式消费避免保存全体答案，却不能避免生成和发送答案的时间。K=0 有一组空组合，按 O(1) 处理；K>N 无结果。若只问“有多少组”，就应算组合数而不是枚举，目标操作改变了。

**口述回答：**用递增路径回溯，按剩余数量剪枝；每个答案需输出 K 个数，所以枚举时间含 `K·C(N,K)`，额外搜索空间 O(K)，全结果存储另算。

知识导航：[回溯、剪枝与组合搜索](../../../knowledge/cs/algorithm/algorithm-backtracking.md)、[时间复杂度、空间复杂度与性能估算](../../../knowledge/cs/algorithm/algorithm-complexity.md)。

## 运行时与记忆：需要定制的是哪条执行合同

“为什么不用 Claude Code”先从项目任务说起，而不是宣称自研一定更好。原帖没有给出项目对现成产品的完整需求，本文也不推断 Claude Code 当前功能或限制。针对数据分析案例，比较现成方案、扩展已有框架、自建运行时：能否满足指标/租户合同、工具错误语义、检查点恢复、交互和维护成本。只有实际验证过的缺口才能成为自建理由。

Agent 决策循环接收任务和观察，提出下一步；运行时管理工具校验、执行、超时、状态与终止条件。固定查询或格式校验无需为每一步再增加模型。Anthropic 的 [工作流与 Agent、Orchestrator-workers](https://www.anthropic.com/engineering/building-effective-agents)给出架构区别，但不能代替本业务的选型比较。自建若只是换了一个模型调用包装层，也没有证明解决了执行合同。

memory 压缩要区分事件原文、精确事实、工作摘要。同步压缩在输入超过预算前完成并校验，代价是当前调用等待；异步摘要可以在后台生成，但本例要求冻结消息前缀与合同版本，再用比较版本的方式提交。假设任务 A 总结到事件 20，期间事件 21 将 schema 改为 v6，A 晚到时不得把 v5 当成当前版本；可保存“覆盖至20的视图”并附后续事件，或拒绝旧提交重算。这个版本协议是教学设计，非框架默认。

LangGraph 的 [Summarize messages](https://docs.langchain.com/oss/python/langgraph/add-memory#summarize-messages)展示 summary 状态与历史压缩，[Checkpointer vs. store](https://docs.langchain.com/oss/python/langgraph/persistence)区分线程检查点和跨线程存储。session 总结用于回顾与继续，不自动成为全局业务事实；跨 session 记忆保存已核验指标定义、适用范围和来源，实时金额仍按当前数据合同查询。

**runtime 题口述：**自建要对应已验证的授权、状态或恢复缺口，并与扩展成本比较；层数和灵活性不能单独证明必要性。

**memory 题口述：**摘要是工作视图，原文与精确事实独立保存；同步保证本轮预算，异步冻结范围并校验版本，旧摘要不能覆盖新合同。

知识导航：[从零构建 Agent 运行时](../../../knowledge/llm/agent/build-agent-framework.md)、[Coding Agent 的架构与执行循环](../../../knowledge/llm/agent/agent-coding.md)、[会话摘要、压缩与记忆提炼](../../../knowledge/llm/agent/agent-memory-summarization.md)、[Agent 会话、检查点与任务状态存储](../../../knowledge/backend/storage/agent-state-storage.md)。

## 迭代：局部改正后，用户任务是否仍然正确

在案例中，修正 SQL 后能运行并不等于净额算对：失败扣款可能被计入，租户可能串用，退款被遗漏。先把时间、币种、指标、权限及证据要求固定为验收合同，再用程序验证金额和允许动作，人工核对模糊口径，语言裁判只评价它能胜任的解释部分。[Anthropic 的 Agent 评测说明](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)区分结果、轨迹、评分器以及能力/回归评测；不能让 AI 自报“修复成功”充当 oracle。

回归集保护已支持的任务，能力集考察尚未覆盖的场景。先比较同一数据和版本上的前后结果，再查看新 schema、否定条件、工具失败等切片。教学上，即使 SQL 可执行样例从 90/100 提升至 98/100，若端到端正确任务从 85/100 降到 80/100，也应阻断这次发布；这组数是反例设定，未实际测量。人工指引应落到口径定义、约束和独立判分，不能只精选成功结果。

影子 case 运行与生产分开，写操作工具不能产生真实副作用；若读取生产数据，仍需授权、资源预算及审计。灰度先设端到端成功、权限错误和关键切片的停止条件，保留回滚。离线通过后在线结果仍可能退化，因此局部提优不能抵消业务约束失败；这些是建议的门禁方案，不是某框架自动行为。

项目职责则按真实证据拆成自己设计、实现、验证的部分和团队已有能力，说明一个接口或失败怎样被定位。原帖只记录团队规模问题，没有公布人数；作者是否做过线上事故也没有答案。复习可以借本文案例说明“会如何做”，面试中不能把它讲成“曾经做过”。

**评测题口述：**先用同合同验证端到端，再查局部与困难切片；局部分数涨而业务成功降就阻断，影子隔离副作用，灰度保留停止和回滚。

**职责题口述：**给出自己实际负责的设计、代码与验证证据，团队数字只报真实值；方法推演与亲历经验分别说明。

知识导航：[生产级 Agent 评估系统设计](../../../knowledge/llm/production/agent-eval-framework.md)、[发布质量门禁与回归阻断](../../../knowledge/llm/production/agent-quality-gates.md)、[在线评估、抽样与质量监控](../../../knowledge/llm/production/agent-online-eval.md)、[AI / Agent 岗位简历与面试](../../../knowledge/career/agent-resume-interview.md)。

## 场景落地：指标、权限和 schema 分别由谁负责

先验证异常：对照时段与币种相同，确认数据截止点、迟到事件及指标定义；再分解金额的构成，按渠道等维度提出候选原因。案例中 2000 元净额差由 1000 元扣款增加和 1000 元退款减少组成，但“为什么退款减少”还需要业务事件或对照分析，不能把分解关系直接变成因果结论。

一个编排器加受限工具已可跑完最小闭环。只有某分支需要反复探索大量独立上下文，或不同角色有不同授权时，才引入专项 Agent，并用同任务评测其贡献。工具结果用引用外置，当前上下文保留合同、待查假设和最近证据；长期记忆保存版本化口径与核验结论，不缓存“店铺今天金额”为永久事实。这是本文方案，具体 Agent 数量要随依赖变化。

schema v5→v6 不能只更新模型提示词。先将指标语义映射到新物理字段，核对金额单位、事件状态、去重身份、退款完成时间和一对多关系，再版本化发布查询适配。新表不是默认可读，表列与行范围仍由授权系统批准；运行时每次校验权限，[OWASP 最小权限、默认拒绝与逐请求校验](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)支持这个边界。

本例成功扣款与完成退款分别聚合再合并；不能在订单与多条支付、退款明细做联接后直接 SUM，行数乘积会重复金额。保存语义版本、schema 版本和数据截止点的用途不同：前者说明怎么算，中者说明从哪些字段算，后者说明本次数据看到了何时。旧查询发现 schema 不匹配就停止、刷新元数据并走已验证适配；不要在错误 SQL 上无限重试。失败尝试、重复事件、空数据和权限缺失进入回归集，解释结果保留来源及未知项。

**架构场景题口述：**先锁定指标、对照、数据与授权，再查事实、做分解、列候选原因；一个编排器起步，拆 Agent 要有独立探索或权限需求。

**schema 题口述：**结构变更要验证语义映射、单位与基数，并版本化适配和回归；SQL 能运行不等于口径正确，新表可读权限也不能由模型决定。

知识导航：[表格、数据库与结构化数据检索](../../../knowledge/llm/rag/rag-table-retrieval.md)、[多智能体协作与适用边界](../../../knowledge/llm/agent/multi-agent.md)、[短期记忆、长期记忆与检索](../../../knowledge/llm/agent/agent-memory.md)、[上下文工程（Context Engineering）](../../../knowledge/llm/agent/context-engineering.md)、[数据 Schema 演进与兼容性](../../../knowledge/data/processing/data-schema-evolution.md)、[SQL 注入与参数化查询](../../../knowledge/backend/auth/sql-injection.md)。

## 服务诊断：慢在哪一段，决定用哪种证据

先固定变慢时间与发布版本，检查成功率、流量、队列和延迟分位，用 trace 将请求拆成排队、schema 查询、SQL、结果传输、解析与模型等待。若 v6 联接把结果膨胀，慢可能同时来自数据库扫描和应用解析；只看总延迟不能选定修复方向。

CPU 高时用 CPU profile 查看正在消耗 CPU 的路径，再针对 JSON 解析、聚合、GC 或重试循环继续验证；同步等待、连接池排队和网络等待可以很慢而不大量占 CPU。Go 官方 [Diagnostics：Profiling、Tracing](https://go.dev/doc/diagnostics)区分 CPU、goroutine、block、mutex 等证据；锁等待用等待栈或对应 profile 查看，不能由“CPU 高”直接断言锁争用或 GC。

验证时保持请求合同和数据相同，观察瓶颈阶段及端到端变化。已有真实事故就讲触发、证据、修复和后果；没有经历则诚实描述诊断路径。本文没有采集 profile、运行服务或处理真实事故。

**口述回答：**先用指标和 trace 缩小慢阶段，CPU 样本查计算热点，等待用栈与阻塞证据；定位后在同负载验证，不能由一个资源指标猜原因。

知识导航：[日志、指标、Tracing 与告警](../../../knowledge/backend/devops/logging-monitoring.md)。

## 数据库：索引的顺序解决定位，快照决定看到什么

### 索引与最左前缀

以下限定 MySQL 8.4 InnoDB 的普通索引。其 [物理结构](https://dev.mysql.com/doc/refman/8.4/en/innodb-physical-structure.html)使用 B-tree，索引记录在叶页；[聚簇与二级索引](https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html)区分叶页中的行数据和主键引用。二级索引找到候选后，若所需列不在索引中，通常还要按主键读取行，所以“用了索引”不等于只访问少量页。

候选键 `(tenant_id,status,paid_at)` 按键元组排序，先聚集租户，再聚集状态，组内按时间有序。A 与成功状态等值，再给时间范围，就能缩小连续区间；把 WHERE 中时间条件写在前面，不会改变树的排序。[Range Access Method for Multiple-Part Indexes](https://dev.mysql.com/doc/refman/8.4/en/range-optimization.html)解释区间提取与条件顺序无关。

若查询只按 `paid_at`，各租户组中的相关时间段分散，不能照搬前述单一区间定位；但不应绝对说“缺首列必不走索引”，全索引扫描及满足条件的 skip scan 仍可能被选择。过滤不够、取大部分行、回表或排序昂贵时，优化器也可能选择别的路径。查看实际执行计划、扫描行数与排序，再在受控库验证；不把本文未运行的示例当计划证据。

**口述回答：**复合索引的前导等值约束收窄键区间，后列在该范围内才有对应排序；是否被选还看成本与版本，WHERE 书写顺序不是失效原因。

知识导航：[数据库索引原理与查询优化](../../../knowledge/backend/database/mysql-index.md)、[索引、执行计划与查询优化](../../../knowledge/data/sql/sql-index-optimize.md)。

### RC、RR 与锁定读的并发时间线

仍限定 MySQL 8.4 InnoDB。普通一致性 SELECT 根据可见版本读取；[Multi-Versioning](https://dev.mysql.com/doc/refman/8.4/en/innodb-multi-versioning.html)说明更新 undo 可重建旧行。[Consistent Nonlocking Reads](https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html)规定 RC 每次一致性读创建新快照，RR 通常复用事务内首次一致性读的快照；当前事务自身的修改仍可见，不是把整个数据库永远冻结。

下面是手工并发推演，未连接数据库。假设两种隔离级别分别实验：A 开启事务，目标行 id 唯一、金额初值 100，A 不修改该行；B 将其更新为 120 并提交。

| 动作 | A 用 RC | A 用 RR |
| --- | ---: | ---: |
| A 首次普通 SELECT，随后 B 更新并提交 | 100 | 100 |
| A 再次普通 SELECT | 120，新语句快照 | 100，复用首次快照 |
| A 改用 SELECT ... FOR UPDATE | 120，锁定读 | 120，锁定读 |

最后一行用于展示机制，不是建议在分析事务中混用两类读。[Locking Reads](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html)的 FOR UPDATE 读取可锁定的最新数据；B 尚未提交且持有冲突锁时，A 可能等待。它不是“把旧快照中的100加锁”，成功获取锁后也不能把所得结果当作首次报告快照。

锁范围还取决于访问路径。MySQL 8.4 的 [Transaction Isolation Levels](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html)说明：RR 对唯一索引唯一值定位通常锁记录，范围扫描可能用 gap/next-key 锁；RC 一般去掉这类间隙锁，外键和重复键检查仍是例外。因此 RC 不是“没有锁”，RR 的普通读也不是“给读到的所有行上锁”。

回到报告，若扣款和退款分两条语句读，RC 可能把 B 提交前后的状态拼成混合净额。需要多语句同快照时，可选择短只读 RR 事务或明确的不可变数据快照；不要为等待模型解释而长时间持事务，旧版本保留会增加清理压力。若一条聚合 SQL 已能完成，或业务允许每条语句读最新提交，RC 也可能满足需求。决定降级前列出可容忍异常，检查锁等待、事务长度、约束和相关部署行为，再验证并发；不能仅凭隔离级别名称承诺更快。

**口述回答：**InnoDB 的 RC 普通读逐语句换快照，RR 普通读复用首次快照；锁定读走最新可锁定数据。取舍由业务一致性合同和并发证据决定，RC 有锁，RR 也不能覆盖所有读写行为。

知识导航：[事务、隔离级别与锁](../../../knowledge/backend/database/db-transaction-lock.md)。

## 网络：接收路径与发送窗口是两条不同的状态链

以常见 Linux 内核 TCP/socket 路径示意：网卡将帧接收到接收队列，驱动在设备通知后安排接收处理，NAPI 轮询处理队列；协议栈判断包是否送本机，按连接处理 TCP 序号、确认和重组，将可读字节交给 socket 接收缓冲；应用 read/recv 取字节，再由 TLS/HTTP 等所用协议处理，交给业务。Linux [NAPI 的事件处理与调度](https://docs.kernel.org/networking/napi.html)说明中断与轮询关系；它也支持不同执行上下文，本文不是所有驱动的唯一调用序列。

TCP 提供字节流，一个网络包不等于一条 SQL 结果或业务消息，应用必须按自身协议解析。应用读取缓慢会让接收缓冲积压；[RFC 9293 §3.8.6.2.2](https://www.rfc-editor.org/rfc/rfc9293.html#section-3.8.6.2.2)描述接收窗口随可用缓冲和消费变化，而窗口更新也有算法，不能假设读走一字节就立即通告一字节。

`rwnd` 是接收方通告的流量控制窗口，`cwnd` 是发送方维护的拥塞窗口。[RFC 5681 §2–3](https://www.rfc-editor.org/rfc/rfc5681.html)用两者较小值限制在途数据。教学上设 rwnd=64 KiB、cwnd=16 KiB、已在途12 KiB，新发额度近似为 `max(0,min(rwnd,cwnd)-在途量)=4 KiB`；这不是瞬时速率，也省略了恢复、发送缓冲与调度等约束。若应用不消费，rwnd 降到8 KiB，额度为0，增大 cwnd 也不能解除接收端限制。

解释拥塞调整时先限定 RFC 5681 的经典基线：慢启动随确认新数据的 ACK 增长，到阈值转为拥塞避免，后者约每 RTT 增长一个满尺寸段；超时与三个重复 ACK 引出的恢复路径不同。超时把 cwnd 缩到不超过一个满尺寸段再慢启动；快重传/快恢复按另一套状态处理。不能把“遇到拥塞都直接减半”“每个 ACK 都翻倍”或这套轨迹套给所有 CUBIC/BBR 等算法。具体服务器算法与参数本文未核实，也不指定默认值。

**口述回答：**包先经驱动与内核协议栈到 socket，应用读取字节再解析协议；发送在途量同时受 rwnd 和 cwnd 约束，前者反映接收消费，后者按选定拥塞算法处理 ACK 与丢包。

知识导航：[OSI、TCP/IP 与端到端通信](../../../knowledge/network/tcpIp/tcpIp-model.md)、[TCP、UDP 与传输场景](../../../knowledge/network/tcpIp/tcp-udp.md)。

## Go：一万个 goroutine 不代表一万个线程在执行

G 是 goroutine，M 是 OS 线程，P 持有执行 Go 代码所需的调度与分配资源。维护者 [runtime HACKING：Gs、Ms、Ps 与 gopark/goready](https://go.dev/src/runtime/HACKING)定义这些角色；文档提示可能暂时过时，所以具体阻塞路径同时参照下列当前源码。它们是滚动实现资料，核验于 2026-10-02，不能直接替代某个部署版本的源码。

| G 正在做什么 | 等待时谁占着执行资源 | 如何继续 |
| --- | --- | --- |
| 等受 Go 网络轮询支持的 socket 就绪 | G 可以被 park，M/P 可调度其他 G | 网络就绪使 G 重新可运行，等待调度 |
| 阻塞系统调用或部分外部调用 | M 可能仍被调用占用；P 可释放或被重新分配 | 返回后需持有/重新取得 P，否则回到可运行队列 |
| CPU 计算 | 正在运行的 G 使用 M/P | 完成、让出或运行时抢占后再调度 |
| channel 等同步等待 | 运行时可 park G，不必一直占 M/P | 条件满足后进入可运行状态 |

[netpoll.go 的 netpollblock、netpollgoready](https://go.dev/src/runtime/netpoll.go)展示 park 与 ready；[proc.go 的系统调用进入、返回及 P 释放路径](https://go.dev/src/runtime/proc.go)展示 M 阻塞与执行资源重新匹配。不是所有文件 I/O、cgo 或任意自写阻塞调用都能像网络轮询那样只停 G，具体回收时机也随实现变化，不能说“一阻塞就立刻新建线程”。

假设显式设置 GOMAXPROCS=4，这是教学配置而非默认值：运行时此时有4个P，至多4个G同时占用P执行普通 Go 代码；一万个G多数可处在可运行或等待状态，调度器从队列和唤醒事件匹配执行资源。M 的数量不必等于4，阻塞系统调用可以占更多线程；CPU密集任务也不会因G数量多而获得超出CPU资源的并行能力。

同一 M 上切换 G 时，运行时保存/恢复 goroutine 的执行上下文和栈，通常可避免一次 OS 线程调度；线程切换则由内核管理，可能涉及内核调度与缓存影响。这个机制解释某些开销为何可能降低，却不能证明每个任务更快。过多可运行G、锁竞争、分配与GC、下游连接池压力仍可使吞吐下降；配合 profile/trace、限制并发和背压验证，不能仅凭“一万个G创建成功”证明扩展性。

**口述回答：**Go 把 G 调度到有限 M/P 上，网络等待通常 park G，阻塞系统调用仍可能占 M；同线程切换可少一次内核调度，但CPU、锁和下游资源决定实际性能，协程不是普遍加速器。

知识导航：[进程、线程与协程](../../../knowledge/cs/os/os-process-thread.md)、[操作系统的用户态、内核态与切换](../../../knowledge/cs/os/os-user-kernel-mode.md)。

## 教学补充／模拟追问

以下三题不是原帖题目，条件变化用来检验理解。

1. **老板把指标改成全币种，v6 又出现一单多次尝试，旧 SQL 和摘要还能复用吗？**重新定义币种换算和统计时点，检查成功事件与去重、联接基数，更新语义/schema 合同与回归；权限仍逐次校验。定位：贯穿案例、memory 与 schema。
2. **报告两条普通 SELECT 中间有退款提交，换 RC 省了一些范围锁，还能接受吗？**先手推混合快照怎样改变净额，再决定单语句聚合、短 RR 事务或固定数据快照；锁等待减少不能代替报告一致性。定位：RC/RR 时间线。
3. **一万个 G 中九千个等 socket，随后换成 CPU 解析，吞吐能保持吗？同时 rwnd 下降意味着什么？**前者由网络等待转成争用有限P和CPU，须控制并发并采样热点；rwnd 小提示接收方消费或缓冲约束，不能靠调大cwnd解决。定位：诊断、网络与Go。

## 参考资料与适用边界

文中数字、伪代码、并发时间线、系统设计和诊断步骤均为教学推演，未运行数据库、Go 服务、benchmark 或线上实验。原帖中的个人感受只作为面试回忆，不能外推团队真实架构、产品能力或招聘标准。

数据库机制限定 MySQL 8.4 InnoDB，TCP 基线限定 RFC 9293（2022-08）与 RFC 5681（2009-09）。Go、Linux、LangGraph、OWASP 是滚动文档/源码，核验于 2026-10-02；具体部署版本、默认算法和性能仍需在实际环境确认。

- [Anthropic：Building effective agents，工作流与动态编排](https://www.anthropic.com/engineering/building-effective-agents)
- [LangGraph：Summarize messages](https://docs.langchain.com/oss/python/langgraph/add-memory#summarize-messages)、[Persistence](https://docs.langchain.com/oss/python/langgraph/persistence)
- [Anthropic：Demystifying evals，评分器与能力/回归评测](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- [OWASP：Authorization，最小权限与逐请求校验](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [Go：Diagnostics，Profiling 与 Tracing](https://go.dev/doc/diagnostics)
- [MySQL 8.4：索引物理结构](https://dev.mysql.com/doc/refman/8.4/en/innodb-physical-structure.html)、[聚簇与二级索引](https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html)、[范围与 skip scan](https://dev.mysql.com/doc/refman/8.4/en/range-optimization.html)
- [MySQL 8.4：Consistent Nonlocking Reads](https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html)、[Multi-Versioning](https://dev.mysql.com/doc/refman/8.4/en/innodb-multi-versioning.html)、[Locking Reads](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html)、[Transaction Isolation Levels](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html)
- [Linux Kernel：NAPI，事件处理与接收调度](https://docs.kernel.org/networking/napi.html)
- [RFC 9293：TCP 字节流及窗口管理](https://www.rfc-editor.org/rfc/rfc9293.html)、[RFC 5681：拥塞窗口与经典控制算法](https://www.rfc-editor.org/rfc/rfc5681.html)
- [Go Runtime：G/M/P 与 park](https://go.dev/src/runtime/HACKING)、[netpoll.go](https://go.dev/src/runtime/netpoll.go)、[proc.go](https://go.dev/src/runtime/proc.go)
