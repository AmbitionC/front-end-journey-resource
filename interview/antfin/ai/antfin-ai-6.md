公司：蚂蚁集团；岗位：智能体与大模型应用工程实习；轮次：一面。原文面试日期为 6-09，未在日期文字中注明年份。

以下原题范围来自候选人自述，未独立证实；相近问题合并归纳。答题思路、贯穿例子和教学追问为独立整理，不代表作者实际作答或企业标准答案。本文要解决的是：怎样把缓存、异步订单与 Java Agent 的项目选择，解释为可推演的状态变化和故障边界。

## 先用一个订单串起问题（教学补充）

设租户 t1 的订单 o7 在数据库中为“待支付，版本 v7”。数据库保存权威状态；Redis 是共享缓存 L2，各应用进程的本地缓存是 L1，缓存键都包含租户和订单 ID。AI 助手可以查询 o7、检索订单规则，但无权凭生成文本改变付款事实。这里的版本与步骤是教学设定，未在完整系统运行，也没有性能实测结果。

用户付款后，数据库提交“已支付，v8”，系统再传播失效事件，让 L2 和各 L1 移除旧值。随后一条履约消息驱动消费者：在一个数据库事务里写入去重记录并创建 o7 的履约记录，提交后才确认消息。若消费者在提交后、确认前崩溃，消息可能重新交付，但唯一约束使相同业务动作不再提交一次。缓存失效与消息确认都发生在数据库之外，所以需要分别处理遗漏、重试和恢复；不能用一个“用了 Redis/MQ”概括可靠性。

## 原始提问归纳与答题思路

#### （1）自我介绍与项目追问怎样展开？（原题 1–2）

先给业务目标、自己的职责和实际实现，再用一条请求说明输入、状态、动作与结果。例如真实项目若有订单助手，就从查询 o7 进入：鉴权后读取订单，按权限检索规则，模型组织解释；缓存降低读取成本，订单状态仍由数据库决定。再说明曾处理的一个失败场景和验证方法。这个例子是表达模板，不能把它写成作者或自己的真实经历。

**口述结论：**我会沿一条真实请求说明自己的贡献，因为组件之间的状态变化比技术名词更能证明理解；没有做过或没有测量的部分会明确标出。

知识导航：[AI / Agent 岗位简历与面试](../../../knowledge/career/agent-resume-interview.md)。

#### （2）本地缓存和 Redis 两级缓存用在哪些链路，什么规模值得引入？（原题 3、6）

先测单 key 热度、更新频率、Redis 网络往返与进程数量，再看业务允许的陈旧时间。L1 命中可以省掉网络访问，但每个进程都多一份副本，也多一份失效责任。经常查询且很少更新的规则文本适合评估 L1；o7 的付款状态和权限变更则需要更谨慎的读取策略。用户总数不能直接推出是否需要两层缓存。Redis 官方也把高频访问、合理更新频率、容量限制与失效处理列为客户端缓存的关键条件。[Redis 客户端缓存：What to cache 与失效处理](https://redis.io/docs/latest/develop/reference/client-side-caching/)

在同一业务输入下，若 Redis 已满足延迟目标，增加 L1 的收益可能不足以覆盖失效传播和内存成本；若少数规则 key 占据大量请求且允许短时陈旧，才值得对比引入前后的命中率、回源量和尾延迟。这里提出的是测量口径，没有宣称某个用户量或固定提升倍数。

**口述结论：**我按热点和一致性约束选两级缓存，因为 L1 用额外副本换取减少网络读取；订单状态若要求读到刚提交的值，就应绕过不满足要求的缓存路径。

知识导航：[Redis 缓存策略与一致性](../../../knowledge/backend/database/redis-cache.md)。

#### （3）缓存怎样更新，本地过期时间怎样确定？（原题 4–5）

先推演朴素的“提交数据库后删除缓存”：一个读取请求提前取到 v7，却在 v8 的失效之后才返回并回填，旧值就重新出现。Redis 官方客户端缓存文档也给出了“先收到失效、后收到旧读取响应”的竞态，要求避免把迟到响应放回缓存，并在失效连接断开时清空本地副本。[Redis 客户端缓存：Avoiding race conditions 与断线处理](https://redis.io/docs/latest/develop/reference/client-side-caching/)

本例可为每个 key 记录已观察到的最高失效版本，回填与失效在同一受保护的状态更新中检查：已经观察到 v8 的实例不能接受 v7。版本下界必须保留到相关旧请求都无法回填；若它随缓存删除而消失，检查就失去作用。失效事件本身也要可重试、可对账；实例断线后应清理或重新校验缓存。以上是应用层设计推演，Redis Tracking 并不会自动感知数据库中 o7 的提交。

TTL 限制的是一份缓存项从写入到过期的寿命。若 L1 过期后继续从陈旧 L2 回填，或者旧请求不断重新写入并重置 TTL，**TTL 单独不能界定整体持续陈旧的上界**。要给出上界，必须同时约束旧值来源、读取持续时间、回填与失效传播；关键路径可直接读权威库。TTL 应由允许陈旧时间与负载验证决定，并结合容量限制、热点回源合并和适度抖动，不能随口报固定分钟数。

**口述结论：**我会处理提交后的失效和迟到回填，因为删掉旧值不等于阻止旧值再出现；TTL 是兜底条件之一，只有旧值来源也被约束时才能谈端到端陈旧上界。

知识导航：[Redis 缓存策略与一致性](../../../knowledge/backend/database/redis-cache.md)。

#### （4）MQ 异步订单怎样在本机测试，能否保证消息只接收一次，哪些动作只处理一次？（原题 7–9）

本机可启动实际使用的 broker、数据库与消费者，使用隔离的测试数据重现 o7 的履约流程。需要观察数据库最终状态，而不仅是消费日志：事务提交前崩溃应能重试；提交后、确认前崩溃应重新交付而不重复履约；同时消费、重复发布、乱序和重启也应覆盖。RabbitMQ 文档明确区分发布确认与消费确认，手动确认模式下连接或通道关闭时，未确认消息会重新入队，因此“只收到一次”不能直接承诺。[RabbitMQ 消费确认与自动重新入队](https://www.rabbitmq.com/docs/confirms)

本例让非空的（租户、订单、业务动作）组合受唯一约束保护。在同一数据库事务中，先取得该动作的唯一去重记录，再写履约副作用；冲突时不重复执行，失败时一起回滚，提交后才 ack。这把“允许消息重交付”与“同一数据库目标副作用最多提交一次”分开。唯一约束解决并发重复，事务避免“已经判重但业务没完成”两份状态分裂。[PostgreSQL 18 唯一约束](https://www.postgresql.org/docs/18/ddl-constraints.html#DDL-CONSTRAINTS-UNIQUE-CONSTRAINTS)、[事务原子性](https://www.postgresql.org/docs/18/tutorial-transactions.html)

订单创建、履约、扣款、通知需要分别定义业务键。外部支付或通知不属于这个本地事务，不能据此宣称全链路恰好一次；还要依赖对端幂等接口、可恢复发送记录和结果对账。去重记录也不能在仍可能重交付时提前删除。上述为测试方案与机制推演，本文没有执行这些故障实验。

**口述结论：**我接受 broker 的重复交付，用业务键唯一约束和同事务更新保护履约结果；这个保证只覆盖所声明的数据库副作用，外部扣款要另外处理幂等与未知结果。

知识导航：[消息队列、异步任务与后台 Job](../../../knowledge/backend/api/async-job-queue.md)、[API 幂等键与重复请求处理](../../../knowledge/backend/api/api-idempotency.md)、[Docker Compose 多服务开发环境](../../../knowledge/backend/devops/docker-compose.md)。

#### （5）秒杀 Redis set 的有效期与删除时崩溃怎样处理？（原题 10–11）

先说清集合的含义：活动资格、库存、请求去重是不同状态。若集合只表示本轮活动已请求用户，可以用包含租户和活动版本的 key，使过期旧任务不会删除下一轮活动的数据。若它还承担防重复业务提交的责任，则其过期不能替代数据库的长期业务约束。

临时集合需要在创建流程中落实过期。单独发 SADD 后再发 EXPIRE，应用可能在两条命令间崩溃；可把合法的写入与设置过期安排在同一 Redis 事务或脚本中，并检查执行结果。Redis 事务保证队列中的命令不会被其他客户端插入执行，但执行时某条命令报错不会让已执行命令回滚，所以类型和参数验证仍然必要。[Redis 事务：执行与错误边界](https://redis.io/docs/latest/develop/using-commands/transactions/)

删除前进程崩溃时，TTL 可以回收临时数据，持久化的活动结束状态还可以驱动补偿清理。重复删除同一个旧版本 key 应安全，恢复任务不能只藏在单进程的 finally 中。过期只能回收数据，不能证明业务已正确结束。

**口述结论：**我先定义 set 的业务寿命，再把过期落实到创建路径，用带活动版本的补偿清理应对崩溃；如果 set 用来防重复提交，还必须保留独立的业务约束。

知识导航：[Redis 数据结构与使用场景](../../../knowledge/backend/database/redis-data-structure.md)、[消息队列、异步任务与后台 Job](../../../knowledge/backend/api/async-job-queue.md)。

#### （6）个人订单存 DB 还是 Redis；Redis 持久化能否承担业务真相？（原题 12–14）

Redis 有 RDB 快照与 AOF 日志，不能笼统说它不能持久化。需要回答的是故障后允许丢多少、多久恢复、怎样校验业务约束：RDB 保存时间点快照；AOF 的落盘策略影响故障恢复可保留的写入。开启 AOF 不能等同于零丢失。[Redis 持久化：RDB、AOF 与 fsync](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)

持久化与复制是两件事。Redis 的异步复制存在尚未传到副本的写入，故障切换可能丢失已确认写入；落盘策略也不能独自消除这个边界。[Redis 复制：异步复制与丢失窗口](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/)

本例让关系库保存 o7 的订单、履约和审计约束，Redis 保存可重建视图。这是根据本例约束作出的选择，不是对所有业务的结论。若系统选择 Redis 为主存储，就需要明确持久化、复制、备份、恢复演练及业务约束实现。原帖中的春节活动轶事未经独立证实，不作为技术证据。

**口述结论：**Redis 能持久化，但订单选型要看恢复和约束是否达标；本例用数据库保存权威记录，因为缓存丢失可重建，而订单与履约不能靠缓存命中证明正确。

知识导航：[Redis 缓存策略与一致性](../../../knowledge/backend/database/redis-cache.md)、[数据库备份、恢复与演练](../../../knowledge/backend/ops/backup-restore.md)、[事务、隔离级别与锁](../../../knowledge/backend/database/db-transaction-lock.md)。

#### （7）为什么选 Spring AI 而非 Python 框架，Java 的优势与实现复杂度怎样比较？（原题 15–17）

在同一个“鉴权后查询订单并解释规则”的模块下比较：团队已有语言、认证与事务接入、所需模型和工具支持、超时恢复、观测与部署成本。若订单后端已经使用 Spring，复用已有服务边界与工程能力可以成为选型理由；若依赖特定 Python 数据处理库，也会改变选择。不能从语言名称或 demo 长短推出生产复杂度高低。

当前 Spring AI 参考文档提供 ChatClient 的同步调用选择 call()，以及 stream().content() 返回 Flux<String> 的流式方式。它们是 API 使用方式，不自动证明状态恢复或业务可靠性。本次按滚动文档核验于 2026-10-02；原帖未披露 Spring AI 或 JDK 版本，面试表达应给自己实际使用版本。[Spring AI ChatClient：同步与流式返回](https://docs.spring.io/spring-ai/reference/api/chatclient.html)

**口述结论：**我会用同一业务模块比较集成与维护成本；已有 Spring 能力可减少重复工程，但框架接口方便不等于业务状态和恢复策略已经设计完成。

知识导航：[从零构建 Agent 运行时](../../../knowledge/llm/agent/build-agent-framework.md)、[工作流状态、检查点与断点续跑](../../../knowledge/llm/agent/agent-workflow-state.md)。

#### （8）RAG 怎样设计，BM25 是什么，知识库导入是否另有入口？（原题 18–20）

把原始资料变成可检索索引的是导入链：解析、切块、携带租户与来源元数据、向量化、写索引。问答链收到问题后，先按授权与已发布版本检索，再组织上下文生成带来源的答案。Spring AI 的 ETL 文档把 reader、transformer、writer 分开，说明“导入数据”和“问答取数据”承担不同职责。[Spring AI ETL Pipeline](https://docs.spring.io/spring-ai/reference/api/etl-pipeline.html)

本例可以为订单规则创建新索引版本，导入未完成前继续读旧的完整版本；失败任务返回状态与原因，而非把部分索引当完整规则。权限要随切块保留，并落实到检索层过滤，不能只在提示词里要求模型不要泄露。[Elasticsearch 文档级访问控制](https://www.elastic.co/docs/deploy-manage/users-roles/cluster-or-deployment-auth/controlling-access-at-document-field-level)

BM25 是词法相关性评分，考虑词项频率、区分度与长度归一化等因素，适合保留订单规则编号等精确词项；向量召回可补充改写表达。是否混合要由同一组查询和标注证据检验，不承诺一定优于单路召回。[Elasticsearch BM25 similarity](https://www.elastic.co/docs/reference/elasticsearch/index-settings/similarity)

**口述结论：**我分开导入任务与在线问答，因为索引构建的耗时和失败不能直接变成用户读到的半成品；BM25 补词项匹配，是否混合仍由业务查询验证。

知识导航：[RAG 完整流程实战](../../../knowledge/llm/rag/rag-pipeline.md)、[Hybrid Search 混合检索](../../../knowledge/llm/rag/rag-hybrid-search.md)、[生产级文档解析、索引与增量更新](../../../knowledge/llm/rag/rag-production-ingestion.md)。

#### （9）多轮对话用哪个循环框架，Java 怎样提高 CPU 利用，Spring AI 有什么优势？（原题 21–22）

先给自己实际的循环实现与版本：谁保存会话、何时调用模型、如何执行工具、错误怎样进入下一轮、何时结束。o7 查询需要的订单工具、规则检索和生成步骤由运行时编排，工具结果回来才进入下一步；预算耗尽不能继续无界重试。原帖没披露框架，不替作者填入某个运行时。

再区分瓶颈。如果大部分时间等待远程模型，增加有界的在途调用可能改善吞吐，但连接池、配额与背压必须跟上；不能把 CPU 使用率升高本身当目标。若解析或本地计算占满 CPU，应测热点并调整算法、并行度或执行位置。Oracle JDK 21 文档明确：虚拟线程适合大量等待型任务，不会让代码运行更快，也不面向长时间 CPU 密集操作；这说明的是 JDK 21 的能力边界，不证明原项目用了虚拟线程。[JDK 21 Virtual Threads](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html)

**口述结论：**我先用观测区分 I/O 等待与 CPU 计算，再选择有界并发或计算优化；Spring AI 提供模型调用接口，不能替我消除资源上限或保证 CPU 利用率提高。

知识导航：[Agent Run Loop、轮次与终止条件](../../../knowledge/llm/agent/agent-run-loop.md)、[进程、线程与协程](../../../knowledge/cs/os/os-process-thread.md)、[AI 应用限流、配额与背压](../../../knowledge/llm/production/ai-rate-limiting.md)。

#### （10）项目用了什么模型，国内厂商和模型怎样介绍？（原题 23–24）

只报告自己实际使用的供应商、模型 ID、部署或 API 版本与调用时间，再解释任务质量、成本、延迟和数据治理约束。例如订单规则解释要看引用是否支持结论、工具参数是否正确，不能只列品牌。介绍厂商时还要区分公司、模型系列与具体可调用版本。

原帖没有给出项目所用模型，因此这里不补造型号，也不列一份当前名录替作者作答。准备自己的答案时应重新打开相应供应商文档，核对实际支持的输入、工具与流式接口；没有相同任务评测时不宣称绝对优劣。

**口述结论：**我会给出可复查的实际模型版本与任务依据，因为同一系列不同服务版本也可能不同；未使用、未核验的能力不纳入项目成绩。

知识导航：[模型能力评估与选型](../../../knowledge/llm/basics/llm-model-selection.md)。

#### （11）SDD 哪些步骤需要人工参与？（反问阶段的提问）

原帖未解释 SDD 缩写，也未说明采用的工具，所以先确认讨论的具体方法。若指以规格驱动开发，就按需求确认、设计取舍、实现和验收检查责任边界：AI 可以协助起草与重复实现，但目标冲突、权限、业务不变量与最终验收需要明确责任人。

用 o7 判断更具体：助手可以提出实现方案，责任人仍要确定“付款状态由谁作准”“允许陈旧多久”“哪种重复履约不可接受”，并用故障场景验收。不能因为有一份生成规格就推定这些条件都已被验证，也不推定原帖采用了特定 SDD 产品。

**口述结论：**我会先澄清 SDD 的含义，再把人工参与落到目标、关键取舍和验收责任；可自动化步骤取决于风险与可验证程度，不能仅凭生成了规格就取消判断。

知识导航：[Coding Agent 的架构与执行循环](../../../knowledge/llm/agent/agent-coding.md)、[Human-in-the-loop 审批与人工接管](../../../knowledge/llm/agent/agent-human-in-loop.md)。

## 教学补充：改变条件后的模拟追问

以下不是原帖提问。

1. **o7 状态从允许短时陈旧改为付款后必须立刻读到新值，还保留两级缓存吗？**要点：先界定读己之写还是所有读者的强一致要求；可用本次写入版本校验或直接读权威库满足对应路径，不能只缩短 TTL。检查第（2）–（3）题的迟到回填与失效遗漏。
2. **履约改成调用外部支付服务，本地去重事务还够吗？**要点：本地提交与外部结果不原子；超时后可能已扣款，需要对端幂等键、查询未知结果与对账，不能直接重试后声称全链路一次。对应第（4）题的保证范围。
3. **瓶颈从远程模型等待改为本地文档解析占满 CPU，继续加线程吗？**要点：先测计算热点和可并行部分，限制计算并行度，比较算法或独立执行服务；JDK 21 虚拟线程的等待型优势不等于更多 CPU 算力。对应第（7）–（9）题。

## 原帖记录边界

自述日期保留为 6-09；春节活动的 Redis 轶事未经证实，不纳入技术证据。项目的实际框架、模型、TTL、规模与测试结果均未披露，本文不作补写。本文无可运行代码；案例与故障步骤为教学推演和建议验证方案。

## 参考资料与版本

本文实际使用的官方章节已放在相关论断后。JDK 文档按 21，PostgreSQL 按 18；RabbitMQ 当前文档页标为 4.3，其余引用为滚动文档，核验于 2026-10-02。文档核验日期不作为产品发布日期或原项目版本。

- [Redis 客户端缓存](https://redis.io/docs/latest/develop/reference/client-side-caching/)、[持久化](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)、[复制](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/)、[事务](https://redis.io/docs/latest/develop/using-commands/transactions/)。
- [RabbitMQ 消费确认](https://www.rabbitmq.com/docs/confirms)、[PostgreSQL 18 唯一约束](https://www.postgresql.org/docs/18/ddl-constraints.html)、[事务](https://www.postgresql.org/docs/18/tutorial-transactions.html)。
- [Spring AI ChatClient](https://docs.spring.io/spring-ai/reference/api/chatclient.html)、[ETL](https://docs.spring.io/spring-ai/reference/api/etl-pipeline.html)、[JDK 21 虚拟线程](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html)。
- [Elasticsearch BM25](https://www.elastic.co/docs/reference/elasticsearch/index-settings/similarity)、[文档级访问控制](https://www.elastic.co/docs/deploy-manage/users-roles/cluster-or-deployment-auth/controlling-access-at-document-field-level)。
