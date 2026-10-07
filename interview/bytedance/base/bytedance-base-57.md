作者自述为同一个秋招流程的三轮技术面，轮次日期写为 9 月 2 日、9 月 8 日和 9 月 15 日，年份未明示；发帖日期为 2026 年 10 月 7 日。三轮按一个流程归档，部门、经历和结果均未获企业独立认证。

以下短答由编辑独立整理，供学习与准备使用，并非作者现场回答或企业标准答案。个人经历按本人事实作答；省略、推断、反问和反馈均明确标注，不冒充完整面试官原题。

## 一面

### A. 开场、经历与求职方向

<details><summary>（1）请做一个简单的自我介绍。</summary></details>

按本人事实介绍背景、相关经历、承担的技术任务和求职目标；原帖未给出作者具体回答。

<details><summary>（2）你第一段实习在哪里，所在团队和主要工作是什么？</summary></details>

说清本人真实团队、职责、输入输出和个人贡献；不要补写未公开的实习信息。

<details><summary>（3）未在原实习团队转正的已确认原因与时间线是什么？</summary></details>

区分 HC、业务安排和个人反馈，说明已确认的时间线；原帖没有作者回答，不能代猜原因。

<details><summary>（4）这次求职主要倾向什么方向？</summary></details>

用实际兴趣、项目经验和岗位任务说明方向选择，避免套用他人的求职经历。

<details><summary>（5）你平时主要使用 AI 工具，还是也学习大模型和 Agent 的基础知识？</summary></details>

区分日常工具使用与原理学习，并给出本人做过的实验和验证记录；原帖没有具体回答。

<details><summary>（6）舆情分析 Agent 是学校项目还是个人兴趣项目？项目定位是什么？</summary></details>

明确本人项目来源、目标用户、任务范围和验收标准；原帖未公开该项目定位。

### B. MySQL、B+ 树与订单索引设计

<details data-knowledge-key="mysql-index"><summary>（7）MySQL 索引通常是什么结构？InnoDB 中应怎样设计索引？</summary></details>

InnoDB 普通索引采用 B+ 树；先围绕高频 WHERE、ORDER BY 和返回列设计主键及二级索引，再用执行计划和真实负载验证。

<details data-knowledge-key="mysql-index"><summary>（8）为什么数据库索引常用 B+ 树，而不是二叉搜索树、红黑树或 B 树？</summary></details>

B+ 树分叉多、树高低，减少页访问；叶节点按序连接利于范围扫描。与二叉树相比更适合按页存储，但收益仍取决于缓存和数据分布。

<details data-knowledge-key="mysql-index"><summary>（9）B+ 树与平衡二叉搜索树的查找复杂度有什么区别？</summary></details>

两者查找阶数都可写 O(log n)，B+ 树的底数由页内扇出决定；数据库更关心访问多少页，不能声称它在渐进阶数上变成 O(1)。

<details><summary>（10）作者推断（不计原题频次）：给定一个订单表和高频查询，这个表与查询的索引应怎样设计？</summary></details>

作者明确标注题面缺失。只有拿到字段、过滤、排序、返回列和数据分布后才能给具体索引；保留重建说明，不计现场原题频次。

<details data-knowledge-key="mysql-index"><summary>（11）联合索引为什么通常先放等值过滤列？什么是最左前缀原则？</summary></details>

复合索引按列顺序形成字典序，常把等值过滤放在排序/范围列前。最左前缀描述可利用的连续键前缀；范围后的列仍可能参与覆盖或索引条件下推。

<details data-knowledge-key="mysql-index"><summary>（12）查询要返回 id 和 amount 时，哪些列应放进联合索引？怎样权衡覆盖索引与索引体积？</summary></details>

将过滤、排序及必要投影列纳入同一索引；InnoDB 二级索引已携带主键。amount 是否追加，要权衡避免回表的收益、索引大小和写入成本。

<details data-knowledge-key="mysql-index"><summary>（13）InnoDB 的主键索引和非主键索引有什么区别？</summary></details>

聚簇索引叶子存整行，二级索引叶子存索引列与主键；二级索引不覆盖查询时通常再按主键取行。

<details data-knowledge-key="mysql-index"><summary>（14）查询包含 ORDER BY created_at 时，联合索引应怎样设计？一定要写 DESC 吗？</summary></details>

等值条件列之后接 created_at，并按需要加唯一 id 保证稳定顺序。同方向倒序可反向扫描升序索引；混合方向、范围条件等需检查计划，不能一律要求 DESC。

<details data-knowledge-key="mysql-index"><summary>（15）建立两个独立索引后，底层是一棵 B+ 树还是两棵 B+ 树？</summary></details>

两个独立普通索引各有自己的 B+ 树，键顺序不同；它们不是一棵把两列一起排序的联合索引。

<details data-knowledge-key="mysql-index"><summary>（16）两个独立索引怎样参与查询？为什么它们通常不能同时高效完成过滤和排序？</summary></details>

优化器可选一个索引或进行 Index Merge，但独立索引合并结果通常不提供所需全局排序；过滤与排序同时优化时应验证匹配查询的复合索引。

<details data-knowledge-key="mysql-index"><summary>（17）对于“按订单和状态过滤、按创建时间取最新若干条”的查询，最终联合索引和查询过程是什么？</summary></details>

若条件确为 order_id、status 等值，可先测试 (order_id,status,created_at,id)；定位等值前缀后按时间/id 扫描取少量记录。字段顺序与覆盖列仍需实际 SQL 验证。

<details data-knowledge-key="api-pagination-filtering"><summary>（18）使用 LIMIT offset, size 扫描百万或上亿行数据有什么性能问题？</summary></details>

OFFSET 越大，通常需要读取并跳过越多记录，回表还可能放大开销。可用匹配索引、keyset 分页或分段导出；优化前先看实际扫描行数。

<details data-knowledge-key="api-pagination-filtering"><summary>（19）怎样使用游标分页优化深分页？游标为什么要包含唯一键？</summary></details>

以最后一条 (created_at,id) 作为下一页边界，并保持同样的过滤和排序。唯一键处理相同时间的并列；要求一致导出时另加快照，游标本身不保证快照。

<details data-knowledge-key="async-job-queue"><summary>（20）如果一个订单有一亿条子订单，需要逐批调用 RPC 并更新状态，怎样设计可靠的离线处理任务？</summary></details>

分片按稳定游标扫描，持久化任务进度；RPC 设置超时、幂等和有界重试，结果落库后再推进检查点。失败可恢复，并限制并发、速率及积压。

### C. MySQL、Redis 与并发控制

<details data-knowledge-key="redis-data-structure"><summary>（21）Redis 有没有类似数据库二级索引的能力？</summary></details>

基础 Redis KV 类型不会像关系库那样自动维护 SQL 二级索引；可显式维护 Set/ZSet 等派生索引，或选支持索引查询的组件，同时处理更新一致性。

<details data-knowledge-key="redis-cache"><summary>（22）Redis 和 MySQL 各有什么优缺点？什么场景分别选择它们？</summary></details>

MySQL 适合关系、事务和权威数据；Redis 适合低延迟缓存、计数与临时状态。Redis 的持久化和复制边界需要单独设计，不能仅凭快就替代交易数据源。

<details data-knowledge-key="db-transaction-lock"><summary>（23）MVCC 是做什么的？它怎样服务于事务隔离？</summary></details>

InnoDB 用版本链与可见性规则实现一致性非锁定读，减少读写冲突；RC 通常每语句取新读视图，RR 的一致性读通常沿用事务快照，当前读另论。

<details data-knowledge-key="redis-data-structure"><summary>（24）Redis 有事务吗？它与 MySQL 事务有什么区别？</summary></details>

MULTI/EXEC 顺序执行一批命令，WATCH 可做乐观冲突检测；Redis 不提供与 MySQL 同样的回滚机制，执行期某命令出错不会自动撤销其他已执行命令。

<details data-knowledge-key="redis-data-structure"><summary>（25）Redis 命令大体串行执行，为什么业务上仍然会出现并发问题？</summary></details>

单条命令原子不等于跨客户端多条命令原子。读、计算、写之间可能插入别人的操作，应使用原子命令、Lua 或符合需求的事务/乐观校验。

<details data-knowledge-key="redis-data-structure"><summary>（26）Redis 6 引入 I/O 多线程后，是否变成多个线程并发修改同一个 Key？</summary></details>

Redis 6 的 I/O 线程主要处理网络读写，并不意味着多个线程同时执行普通键命令。跨请求的多步骤竞争仍然存在；其他版本/组件须按实际实现区分。

<details data-knowledge-key="redis-data-structure"><summary>（27）请举一个 Redis 多步骤操作并发不安全的具体例子。</summary></details>

两个客户端都 GET 到计数 0，再各自 SET 1，会丢一次更新；单个 INCR，或把读取与条件更新封进短 Lua 脚本，才能把所需操作边界原子化。

<details data-knowledge-key="redis-distributed-lock"><summary>（28）为什么不能先 GET 判断锁不存在，再执行 SET？SET NX 解决了什么问题？</summary></details>

GET 与 SET 之间存在竞争窗口，两个客户端都可能认为获得锁；SET NX 将不存在判断与写入合并为一条原子操作，租约还需要过期时间。

<details data-knowledge-key="redis-distributed-lock"><summary>（29）一个基本正确的 Redis 分布式锁应怎样获取？</summary></details>

单实例基本租约可用 SET key 唯一持有者值 NX PX ttl；释放时原子比对持有者再删。有效期、续租、故障模型和必要 fencing 必须明确，不能泛称绝对互斥。

<details data-knowledge-key="redis-distributed-lock"><summary>（30）已经使用 SET NX，为什么释放锁还需要 Lua？为什么不能直接 DEL？</summary></details>

旧持有者过期后，新持有者可能已获得同名锁，直接 DEL 会删掉别人的锁。Lua 原子检查值相等后再删，避免比对和删除之间再次出现竞争。

<details data-knowledge-key="redis-distributed-lock"><summary>（31）如果业务没有执行完锁就过期了，怎样处理？</summary></details>

按持有者身份受控续租；续租失败或租约失效后停止受保护写入。暂停/网络异常仍可能产生陈旧持有者，关键资源应校验 fencing token 或使用更强一致协调。

<details data-knowledge-key="redis-data-structure"><summary>（32）Pipeline 和 Lua 分别解决什么问题？Pipeline 中的一批命令是原子的吗？</summary></details>

Pipeline 把多条命令批量发送以减少往返，不自动提供原子性；Lua 在服务端原子执行受支持命令，但脚本会占用执行线程，应限制耗时和工作量。

### D. 缓存淘汰与 LRU 算法

<details data-knowledge-key="redis-cache"><summary>（33）Redis 内存达到上限时有哪些淘汰策略？</summary></details>

noeviction 达上限时拒绝会增加内存的写入；allkeys/volatile 可搭配 LRU、LFU、随机淘汰，volatile-ttl 优先短 TTL。实际选项取决于版本和配置，LRU/LFU 通常是近似策略。

<details data-knowledge-key="redis-cache"><summary>（34）除了 LRU，还了解哪些缓存替换算法？</summary></details>

LFU 按访问频率、FIFO 按进入顺序，随机替换实现简单；它们适应的访问模式不同。应结合热点变化、维护成本和命中率评估，不能无条件认为某种更优。

<details data-knowledge-key="algorithm-linked-list"><summary>（35）LRU 的核心原理和数据结构是什么？get、put 的复杂度是多少？</summary></details>

哈希表定位节点，双向链表维护最近访问顺序；访问/更新后移到头部，容量超限删尾并同步删哈希表。平均 get/put 为 O(1)，哈希表最坏情况另算。

<details data-knowledge-key="algorithm-linked-list"><summary>（36）请使用你熟悉的语言实现支持构造、get 和 put 的 LRU Cache。</summary></details>

构造哈希表及头尾哨兵；get 命中移到头并返回，put 更新或插入头部，超容量删尾。实现时检查容量 0、重复更新、哨兵连接与哈希表同步。

### E. 候选人反问与面试反馈

<details><summary>（37）候选人反问：该抖音电商团队主要负责什么业务？</summary></details>

这是候选人反问；原帖未公开团队完整职责，保留为反问，不计面试官出题频次。

<details><summary>（38）反馈与复盘：怎样理解面试官对本场表现的建议，后续应怎样改进？</summary></details>

将真实反馈转成可验证改进行动；原帖未给具体反馈内容，不补写结论。

## 二面

### A. 自我介绍与风控实习项目

<details><summary>（39）请简单做一下自我介绍。</summary></details>

结合本轮岗位介绍本人背景、项目和贡献；不编造作者现场回答。

原文将本轮实习产出深挖的 2—10 号范围合并省略，未给出具体问题；这里不补写，也不把这个范围拆成九道题。

### B. AI Coding 过程与技术方案评审

<details><summary>（40）是否收到面试前的 AI Coding 题？目前完成得怎么样？</summary></details>

如实报告已完成、未完成和可运行部分，并展示测试证据；原帖未公开实际完成度。

<details data-knowledge-key="agent-coding"><summary>（41）展示一下完成合同审核题的过程，你是怎样使用 AI 开发的？</summary></details>

展示需求拆解、AI 对话、关键代码修改和验证过程，说明哪些判断由本人完成；可运行结果与验收证据应对应。

<details data-knowledge-key="agent-coding"><summary>（42）你对 AI 生成的技术方案提了哪些修改？具体说一两个点。</summary></details>

围绕真实 diff 说明修改原因，例如输入边界、状态设计和失败处理，并给出前后验证；具体修改属于本人项目，不能冒充作者的实现。

<details data-knowledge-key="agent-coding"><summary>（43）AI 给出的技术方案很长，人应该怎样 Review、抓重点和做取舍？</summary></details>

先核对任务范围、输入输出和验收，再检查关键数据流、失败路径及高成本依赖；让 AI 列假设与取舍，逐项用代码和实验核验。

<details><summary>（44）除了主要流程，Review 和开发时还关注哪些点？</summary></details>

按项目真实验收要求检查错误路径、数据边界、测试和运维约束，并说明取舍依据；原题没有点名具体机制，不能把这些准备方向当成面试官明确考点。

<details data-knowledge-key="agent-deterministic-workflow"><summary>（45）当前实现处于什么阶段？不接模型的 baseline 能做什么？</summary></details>

先区分项目真实状态与设计建议；无模型 baseline 可验证解析、规则、关系结构和报告格式，不能替代语义质量评估。

### C. 输入歧义、不确定性与模型分工

<details data-knowledge-key="llm-capability-boundaries"><summary>（46）报告前面提示了一些歧义和问题，你怎样看待这些问题？</summary></details>

记录歧义所在片段、冲突和缺失条件；输出允许“不确定/需确认”，避免默认补事实。先明确业务规则，再验证处理行为。

<details data-knowledge-key="rag-citation-grounding"><summary>（47）输入有歧义时，下面输出的关系是怎么得出的？有歧义就不建立关系吗？</summary></details>

关系需绑定原文证据和判定规则；证据不足时标疑似或不建立确定关系，并记录待确认条件，不能把缺失信息推成肯定结论。

<details data-knowledge-key="llm-capability-boundaries"><summary>（48）原始信息不完整、不确定时，所谓“默认结果”应如何处理？结论会不会也有问题？</summary></details>

默认值仅适用于已获确认的规则，不等于现实事实；保留缺失字段、假设和不确定状态，重要结论转人工确认。

<details data-knowledge-key="agent-coding"><summary>（49）开发时是否给 AI 明确说明过这些边界情况？是否确认过它的处理逻辑？</summary></details>

把边界写成明确输入输出契约和反例；检查实际代码并运行缺字段、冲突、歧义用例，不能只相信 AI 口头承诺。

<details><summary>（50）这道 AI Coding 题实际花了多长时间？</summary></details>

以本人计时记录回答，区分开发、等待和验证；原帖没有作者实际耗时，不补数字。

<details data-knowledge-key="agent-coding"><summary>（51）如果时间更充足，你会怎样继续优化，并怎样和 AI 交互？</summary></details>

先固定失败样本和验收标准，再按影响定位模块，让 AI 做小步修改并跑回归；最终保留 diff、结果和限制。

<details><summary>（52）没有产品同学可以确认需求时，遇到模糊信息怎么办？</summary></details>

列出已知事实、假设和待确认项，用可回退的最小方案验证；关键业务规则找有责任的人确认，不替作者或产品方编造决定。

<details data-knowledge-key="rag-citation-grounding"><summary>（53）两个条款名称很相似，怎样确认它们是不是同一个条款？能否直接制定一个判断逻辑？</summary></details>

名称相似只用于候选召回；结合定义、范围、编号和原文证据判断是否同一条款，阈值用样本校准，冲突或缺证留待确认。

<details><summary>（54）如果产品同学也是新人，也不知道正确答案，怎么办？</summary></details>

回到业务规范、可核验样本和责任人，记录仍未知的条件；讨论形成候选方案后再验证，不能因产品方也不确定就把猜测当事实。

<details data-knowledge-key="llm-capability-boundaries"><summary>（55）最终报告怎样区分确定的关系和疑似关系？置信度应怎样处理？</summary></details>

分别呈现已证实、疑似和缺证关系，并附原文定位；模型自报置信度不等于真实正确率，应以带标签样本校准和外部验证。

<details><summary>（56）如果给你两天时间，最应该优先优化哪些模块？</summary></details>

按验收价值、风险和依赖排列改动，先做能用失败样本验证收益的最小修复；原帖没有给项目完整状态，不能替作者断言具体模块最优先。

<details data-knowledge-key="agent-deterministic-workflow"><summary>（57）是否需要引入大模型？哪些部分交给模型，哪些部分交给代码规则？</summary></details>

解析、校验、权限和明确业务规则交给代码；语义理解等难写稳定规则的部分可交模型，但结果仍需证据与确定性验证。

<details data-knowledge-key="agent-deterministic-workflow"><summary>（58）判断一个任务适合模型还是规则，有什么通用标准？</summary></details>

比较规则可定义程度、输入歧义、可验证性、错误代价与成本；路径稳定且硬约束明确优先代码，模型承担受控语义判断。

### D. 质量评估与 AI 辅助迭代

<details data-knowledge-key="agent-eval-framework"><summary>（59）怎样判断最终报告的质量，确认输出的关系是否正确？</summary></details>

固定标注集和判定规则，分别测关系 precision/recall、证据正确率、缺失覆盖及不确定性处理；开放语义样本可人工复核，不能只比字符串。

<details data-knowledge-key="agent-eval-framework"><summary>（60）将报告与人工标准答案比较后，发现差异应如何迭代？</summary></details>

先区分标注问题、解析/检索/推断问题，再做最小修复；把每个已确认差异加入独立回归集，防止只适配当前示例。

<details data-knowledge-key="agent-eval-framework"><summary>（61）差异一定要人工逐个分析吗？这个过程怎样利用 AI？</summary></details>

可让 AI 聚类差异、提出原因和补丁候选；关键分类与事实证据需要抽样/人工核验，不能用同一个模型自评代替验收。

<details data-knowledge-key="agent-debugging"><summary>（62）让 AI 分析差异、辅助修复，需要提供哪些信息？</summary></details>

提供可复现输入、期望输出、实际输出、代码/配置版本及失败轨迹；隐去敏感信息，用最小示例定位原因和验证修复。

<details data-knowledge-key="agent-coding"><summary>（63）只知道正确答案，不知道最佳实现策略时，怎样让 AI 帮忙？</summary></details>

给输入、期望输出、约束和失败样本，让 AI 比较候选方案；通过隐藏用例和基准验证，而非仅让它复述答案。

<details data-knowledge-key="agent-coding"><summary>（64）告诉 AI 自己设想的实现策略，还是提供输入和正确输出让它推导，哪种更好？</summary></details>

都可以作为输入；明确区分硬约束与本人假设，让 AI 比较替代方案，再用独立验收选择，避免预设策略绑死实现。

<details data-knowledge-key="agent-coding"><summary>（65）是否实践过把测试用例交给 AI，让它验证、发现偏差并自行迭代？</summary></details>

个人是否实践需按事实回答；工程上可采用改动—测试—分析—再修复闭环，但保留隐藏测试、次数上限与人工审查。

### E. 长文档与上下文工程

<details data-knowledge-key="llm-token-context"><summary>（66）合同变成一两百页，超过 Agent 上下文窗口时怎么办？</summary></details>

先用匹配 tokenizer 预算指令、证据与输出；按文档结构分块并保留引用，分阶段处理，汇总时控制预算并允许按需取回原文。上下文变长不自动保证每处信息都被正确使用。

<details data-knowledge-key="rag-chunking"><summary>（67）文档具体怎样切分？如何处理切分边界和块大小？</summary></details>

优先按标题、条款和语义边界切分，保留文档 ID、位置与版本；块大小按 token 预算评估，适度重叠减少跨边界遗漏，不把重叠当全局理解。

<details data-knowledge-key="rag-citation-grounding"><summary>（68）文档切分以后，怎样得到最终答案？</summary></details>

各块产出结构化候选关系和证据位置，合并去重后做跨块校验；缺证关系留待补检索，最终答案必须可回到原文。

<details data-knowledge-key="agent-subagents"><summary>（69）不同子 Agent 分别处理文档块之后，怎样汇总结果？</summary></details>

子 Agent 返回结构化结论、证据位置、未完成项和限制；父任务按稳定对象身份去重、检查冲突并验证出处，不能只把各段摘要拼接后视作事实。

<details data-knowledge-key="rag-context-compression"><summary>（70）汇总后的结果又超出上下文怎么办？如何让 300 页合同的处理链路真正跑通？</summary></details>

使用分层摘要/关系索引和按需取原文，将大文档留在持久存储；每层设预算、检查点和覆盖账本，验证关键跨块关系没有被压掉。

<details data-knowledge-key="rag-context-compression"><summary>（71）压缩或丢弃信息时，怎样判断哪些信息无效？</summary></details>

按任务相关性、证据价值和未完成约束选择；保留来源引用、异常与待办，用回归样本验证压缩前后答案/覆盖，避免只凭模型判断“没用”。

<details data-knowledge-key="rag-context-compression"><summary>（72）渐进式披露在这个合同场景中具体怎样落地？</summary></details>

先给目录、条款摘要和可访问引用，只有遇到某关系或争议才加载相关条款原文；这是按需披露文档内容，不自动等于定义了 Skill。

### F. 幻觉与事实约束

<details data-knowledge-key="rag-citation-grounding"><summary>（73）如果业务强约束 AI 不能基于虚构信息得出关系和结论，工程上怎样设计？</summary></details>

先建立原文证据账本，关系必须附可解析位置；校验引用存在、字段范围和业务约束，缺证拒答/复核。工程约束能降低错误，不能保证模型绝无幻觉。

<details data-knowledge-key="agent-eval-framework"><summary>（74）用另一个 Agent 评估结果，但评估 Agent 本身也有幻觉，怎么办？</summary></details>

评估 Agent 只给辅助信号；加入确定性断言、标注基准和人工抽检，测 judge 偏差与一致性，重要事实回到原始证据。

<details data-knowledge-key="rag-citation-grounding"><summary>（75）判断结论是否基于事实，一定要经过 AI 吗？怎样把非 AI 校验纳入工程链路？</summary></details>

结构、引用位置、数值、对象身份和业务约束可由代码或权威数据核对；语义支持不清时保留不确定并复核，不以另一个模型的自信替代事实验证。

### G. 求职经历、学习方法与工具选型

<details><summary>（76）为什么未继续在原团队实习？</summary></details>

按本人已确认事实说明离开与转正安排；原帖没有具体原因，不替作者推测。

<details><summary>（77）实习期间怎样学习 AI？从哪里获取信息？</summary></details>

列出本人使用的官方文档、论文、工程实践和做过的验证；原帖未给具体学习来源。

<details><summary>（78）信息很多时优先关注什么？关注之后有什么实践动作？</summary></details>

结合岗位任务确定优先级，用小实验和评测检验知识是否有用；具体行动需本人事实支持。

<details><summary>（79）学到的新知识有没有用到实习开发中？</summary></details>

用本人真实改动、测试和收益证据回答；原帖未公开实习落地细节。

<details><summary>（80）除了辅助开发，AI 是否用于实际业务场景？</summary></details>

需基于已获准公开的真实业务例子回答；原帖未给风控应用内容，不能扩写业务或关联技术知识。

<details data-knowledge-key="mcp-protocol"><summary>（81）怎样理解 CLI 和 MCP Tool，它们有什么区别？</summary></details>

CLI 是通过命令行调用能力的接口；MCP 规范 Host/Client/Server 间工具等能力发现和调用。二者可包装同一业务能力，不能当作相互替代的全部架构。

<details><summary>（82）作者推断（不计原题频次）：什么场景使用 MCP，什么场景使用 CLI，什么场景需要 Skill？</summary></details>

作者明确按对话推断涉及 Skill，原题边界不足；不补造现场题目，不绑定或增加题频。CLI、MCP 与 Skill 的进一步比较应另按实际合同学习。

<details data-knowledge-key="mcp-protocol"><summary>（83）同一项能力支持多种接入方式时怎样选择？自己的业务能力如何开放给 Agent？</summary></details>

先把业务做成有 schema、权限、超时和错误契约的受控接口，再按运行环境提供 CLI/MCP 等适配；接入方式不应绕过同一授权与副作用控制。

<details data-knowledge-key="mcp-protocol"><summary>（84）如果重点追求性能和低延迟，CLI、MCP、Skill 应怎样选型和设计？</summary></details>

按调用链实测启动、传输、鉴权和业务耗时；复用连接/进程、缩小往返负载并设超时。Skill 是做法封装，不能凭名称断言 CLI 或 MCP 必然更快。 相关上下文中关于 Skill 的题意存在作者推断，Skill 出题频次待确认；本组只关联明确的 MCP 接入与传输问题。

### H. 反问与面试反馈

<details><summary>（85）候选人反问：本轮没有算法题吗？</summary></details>

候选人询问本轮算法安排，原帖没有答复；不算面试官算法原题。

<details><summary>（86）上一轮做了什么算法题？平时是否比较擅长算法题？</summary></details>

如实说明上一轮做过的题目和解题过程；当前这一问未给新增算法题，不能额外扩出题源。

<details><summary>（87）候选人反问：对这场面试或后续学习有什么建议？</summary></details>

属于候选人反问；保留原文，不补写面试官建议。

<details><summary>（88）你自己对这场面试有什么感受？</summary></details>

按本人现场感受和证据回答，区分主观判断与结果；原帖未公开回答。

<details><summary>（89）反馈与复盘：怎样理解新概念的核心差异、出现原因、解决的问题及带来的新问题？</summary></details>

可用“问题、机制、边界、代价、验证”学习新概念；这是反馈引导，不能算新增明确技术原题。

## 三面

### A. 开场与实习经历

<details><summary>（90）请做一下自我介绍。</summary></details>

按本人真实背景、项目和贡献作简要介绍；不编造作者经历。

<details><summary>（91）是否获得原实习团队的转正机会？怎样说明选择与反馈？</summary></details>

如实说明已确认的转正安排与原因；原帖未给作者具体回答。

<details><summary>（92）介绍一件实习期间能体现个人技术成长和能力的事情。</summary></details>

挑一个本人真实案例说明问题、选择、实现、验证与复盘；原帖没有公开该案例内容。

### B. 实习产出A

<details><summary>（93）实习产出 A 深挖（具体原题缺失）</summary></details>

原帖仅写“字节实习产出 A 拷打”，未公开具体问题或回答，无法补真实原题。

### C. 实习产出B

<details><summary>（94）实习产出 B 深挖（具体原题缺失）</summary></details>

原帖仅写“字节实习产出 B 拷打”，未公开具体问题或回答，无法补真实原题。

### D. 实习产出C

<details><summary>（95）实习产出 C 深挖（具体原题缺失）</summary></details>

原帖仅写“字节实习产出 C 拷打”，未公开具体问题或回答，无法补真实原题。

### E. 舆情分析 Agent 项目

<details><summary>（96）可以现场演示一下舆情分析 Agent 产品吗？</summary></details>

用本人真实环境演示输入、执行过程与结果，必要时展示错误恢复；原帖没有演示内容，不编造功能。

<details><summary>（97）这个项目是否已经上线并被真实用户使用？</summary></details>

区分上线状态、使用量和验收证据，如实报告；原帖未公开用户与上线信息。

<details><summary>（98）没有上线的话，本地直接运行这个项目吧。</summary></details>

按照项目真实运行步骤启动并展示结果；原帖没有命令、配置或运行证据，不能补写。

<details><summary>（99）项目的目录结构是什么，为什么这样设计？</summary></details>

解释本人目录的职责、依赖方向和变更边界，并用代码实例说明；原帖未给目录，不能复原作者的项目结构。

<details><summary>（100）你认为项目中最关键的代码和技术方案是什么？</summary></details>

选本人实际贡献的关键代码，说明输入输出、失败路径、取舍和验证；原帖未展示实现，不能猜作者最核心的技术方案。

<details data-knowledge-key="build-agent-framework"><summary>（101）为什么自己实现这套流程，而不是直接使用成熟的开源 Agent 框架？</summary></details>

先比较需求、可控性、维护成本和成熟框架差距；仅对确实缺失的能力自研，并保留评测。学习目的与生产选型要分开说明。

<details data-knowledge-key="agent-state-storage"><summary>（102）为什么要持久化任务、工具调用和执行过程数据？</summary></details>

持久化任务状态、调用标识、结果与检查点，支持故障恢复、审计和回放；回放决策不能重复执行真实副作用，写操作仍需幂等。

### F. 算法题

<details data-knowledge-key="algorithm-sorting"><summary>（103）实现「最短无序连续子数组」。给定一个无序的数组，找到最短的连续覆盖区间，对区间内的元素递增排序，使得数组整体递增。</summary></details>

按标准题的非降序合同，可用排序副本比较首尾差异作 O(n log n) 基线；从左记最大值定位右边界、从右记最小值定位左边界，可 O(n) 时间、O(1) 空间。重复值与严格递增要求先澄清。

### G. 候选人反问与反馈

<details><summary>（104）候选人反问：商品 AI 主要服务哪一类用户？</summary></details>

候选人反问商品 AI 用户范围；原帖没有具体答案，不扩写业务。

<details><summary>（105）反馈与复盘：商品 AI 想解决什么问题、达到什么业务效果？面试官对本场有什么建议？</summary></details>

这是候选人询问业务目标及反馈，原帖没有答案；不计面试官技术出题频次。
