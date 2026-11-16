记录自述为字节后端 / Agent 开发秋招二面，形式为线上技术面试与在线 Coding，时长约 54 分钟。面试具体日期未公开。内容围绕本体平台、确定性校验、可取消延迟任务、学习习惯和注意力机制展开。

本页仅依据已见文字整理，原帖图片未核验，不据图片补充问题或条件；组合总和缺少完整题目条件，保留待补。以下短答是编辑整理的复习思路，不代表当事人的现场回答、实际实现或已取得的效果。

## 本体平台与能力开放

<details data-knowledge-key="agent-ontology-modeling"><summary>（1）怎样介绍 Ontology 平台的技术实践与建设细节？</summary></details>
<p>先明确领域对象、关系、业务语义与适用上下文，再说明 Action 的输入、权限、副作用和结果如何关联到底层能力。用真实映射和失败案例解释实现取舍；原文没有披露完整架构，不能把通用设计当成作者实际方案。</p>

<details data-knowledge-key="agent-ontology-modeling"><summary>（2）16 个业务本体、30 多个 Action 的元数据用什么管理？</summary></details>
<p>可从对象标识、关系、字段含义及 Action 合同的版本管理讲起，说明谁维护、如何校验、怎样发布和回滚。数量不决定技术选型；原文未给出管理平台名称，不代填数据库或产品。</p>

<details data-knowledge-key="agent-ontology-modeling"><summary>（3）本体和 Action 注册后，前端或 Agent 怎样消费元数据？</summary></details>
<p>先解释消费者如何发现已发布版本，再按对象语义和 Action 合同构建查询、展示或调用。执行端仍须检查权限、状态和参数，注册成功不等于可无条件执行；原文未披露实际注册和消费协议。</p>

<details data-binding-status="pending_semantic_verification"><summary>（4）什么叫“HTTP 到 JSF RPC 的柔性调用链”？</summary><p>关联知识点待核实。</p></details>
<p>可先向面试官确认“柔性”的具体含义，再说明外部请求与内部服务之间的参数映射、路由、错误和超时如何衔接。原文没有定义 JSF 接口、映射机制或运行时约束，暂不能确认它对应哪一种实现，也不把 JSF 等同于 gRPC。</p>

<details data-knowledge-key="agent-metrics"><summary>（5）怎样衡量 Ontology 平台的效果？</summary></details>
<p>先区分任务质量、技术可靠性、延迟、成本和业务结果，再固定分子分母、样本、版本与比较窗口。接口收敛数量只能作为建设过程指标，不能代替任务是否正确完成及业务是否受益的证据。</p>

<details data-knowledge-key="agent-project-evaluation"><summary>（6）从业务视角看，Ontology 平台有什么收益？</summary></details>
<p>选择可比较的真实业务流程，核对完成质量、人工处理时间、错误损失与使用负担，再扣除建设、推理、维护和审核成本。应说明基线与证据范围；原文没有业务结果数字，不能编造降本增效幅度。</p>

<details data-knowledge-key="agent-ontology-modeling"><summary>（7）Ontology 是较早的概念，为什么在 AI 背景下重新受到关注？</summary></details>
<p>可从跨系统对象和术语不一致、模型需要稳定业务含义、工具调用需要明确 Action 合同三个需求分析。领域语义、能力合同与调用协议各有职责；这是需求与方案的适配解释，不能把采用本体本身当成效果证明。</p>

## 确定性校验与实习经历

<details data-knowledge-key="prompt-structured-output"><summary>（8）前置 JSON Schema 强校验和后置规则断言，具体怎么做？</summary></details>
<p>前置先解析并检查类型、必填、枚举和范围，执行前独立验证权限与业务前提；后置再按权威数据和目标状态验证结果。结构合法不等于事实正确，校验失败应明确拒绝、有限修复或降级，不能静默放行。</p>

<details data-knowledge-key="prompt-structured-output"><summary>（9）确定性规则和 LLM 怎样分工？</summary></details>
<p>让模型处理需要语义理解的候选判断或生成，让程序落实结构、权限、状态与业务不变量。模型产生的字段和置信度都不授予执行权；结果还要回到证据或权威系统核验。</p>

<details data-binding-status="pending_semantic_verification"><summary>（10）实习什么时候结束？三个多月做了哪些事情？</summary><p>关联知识点待核实。</p></details>
<p>按真实时间线区分参与范围、本人交付、团队已有能力和仍在计划中的事项，并用脱敏产物说明贡献。原文没有提供结束时间或完整工作清单，这些信息须由当事人补充。</p>

## 高 QPS、可取消的延迟任务

<details data-knowledge-key="async-job-queue"><summary>（11）每秒约一万个任务提交，怎样设计提交与取消接口？要求不直接使用成熟框架。</summary></details>
<p>先确认延迟范围、到期误差、任务存续量、故障丢失容忍度与取消语义，再设计任务记录、到期索引和有界调度。提交率不等于到期执行率；多实例通过条件状态更新获取执行权，副作用还需幂等和可查询结果。</p>

<details data-knowledge-key="async-job-queue"><summary>（12）延迟任务的取消接口怎么实现？</summary></details>
<p>取消与开始执行须竞争同一权威状态：尚未开始时，以条件更新把任务转为已取消；运行中则记录取消请求并在安全点协作停止。只删除时间索引不能证明 Worker 没拿到任务，已经发生的副作用也不能被取消请求抹去。</p>

<details data-knowledge-key="async-job-queue"><summary>（13）如何组织任务的时间索引、参数与状态？</summary></details>
<p>以 jobId 关联到期时间、参数引用、所有者、状态、版本和租约，按到期时间建立有界查询索引。索引负责找到候选任务，权威记录决定能否执行；大参数可单独存储，不能把内存索引当作持久业务事实。</p>

<details data-knowledge-key="async-job-queue"><summary>（14）是否需要循环扫描到期任务？</summary></details>
<p>需要某种到期触发机制，但不必每次扫描全部任务；可以范围读取到期索引，并按最早到期时间与最大等待间隔安排下一次唤醒。仍要有恢复或补偿扫描处理漏唤醒与过期租约，具体机制由精度和故障要求决定。</p>

<details data-knowledge-key="async-job-queue"><summary>（15）QPS 较高时怎样轮询，每次拉多少，轮询频率怎么定？</summary></details>
<p>批量上限和轮询间隔先按到期速率、可用 Worker 容量、到期误差预算与存储成本估算，再用最老到期延迟和积压验证。避免无界一次拉全量或空转忙轮询，遇到同一时刻集中到期还要限流、分片与背压，不能凭提交 QPS 给固定参数。</p>

<details data-knowledge-key="async-job-queue"><summary>（16）多个实例都读到同一批任务时，怎样避免重复执行？</summary></details>
<p>读到任务不代表拥有执行权，要以状态、版本和租约的原子条件更新确定当前持有者，并限制过期 Worker 写回。租约过期或网络故障仍可能产生重试，业务副作用还需稳定操作 ID 与幂等或对账，不能只靠抢占承诺端到端恰好一次。</p>

<details data-knowledge-key="async-job-queue"><summary>（17）延迟任务是否需要外部数据库持久化？</summary></details>
<p>若要求受理后跨进程重启恢复、结果可查或长期保留，就需要满足持久化合同的外部事实源；它不必只是一种关系数据库。仅可丢失、可重建且范围受限的任务才可能使用纯内存方案，还须明确故障后语义。</p>

<details data-knowledge-key="async-job-queue"><summary>（18）从哪些维度决定延迟任务是否引入数据库？</summary></details>
<p>比较任务存续量、延迟跨度、丢失容忍度、恢复目标、取消与并发一致性、查询审计需求以及存储和运维成本。每秒提交量只是其中一项，不能单凭 QPS 决定用数据库或 Redis，也不能认为用了某种存储就自动达到耐久性要求。</p>

## 个人作品与学习习惯

<details data-binding-status="pending_semantic_verification"><summary>（19）博客什么时候搭建的，为什么最早文章的时间更早？</summary><p>关联知识点待核实。</p></details>
<p>应分别说明内容最初创作时间、迁移或建站时间以及日期字段的含义，并用真实记录核对。原文没有解释差异，不能替作者推定文章迁移、补录或建站经历。</p>

<details data-binding-status="pending_semantic_verification"><summary>（20）怎样介绍自己关于平衡课程、项目和持续输出的文章？</summary><p>关联知识点待核实。</p></details>
<p>按真实文章概括要解决的冲突、安排方法、一个实际例子与方法局限，区分已实践经验和建议。当前材料没有该文章正文，不能代写作者的经历、结论或时间安排。</p>

<details data-binding-status="pending_semantic_verification"><summary>（21）文章中的课程项目是个人项目、学校项目，还是实习项目？</summary><p>关联知识点待核实。</p></details>
<p>先说明项目所属场景和责任边界，再区分学校要求、个人练习与实习交付，以及自己的贡献。原文未确认项目类别，应由当事人澄清，不用通用项目案例补齐。</p>

<details data-knowledge-key="agent-learning-roadmap"><summary>（22）AI 前沿知识从哪些渠道获取，学习路径是什么？</summary></details>
<p>可围绕目标任务先补编程、模型、工具与评测依赖，再用官方文档、原始论文和版本化实现核对信息。每一步保留最小实践、失败案例与结果记录，用能否解释和修复问题验证掌握程度；原文未列出作者真实渠道。</p>

<details data-knowledge-key="agent-learning-roadmap"><summary>（23）是否有持续阅读论文的习惯？</summary></details>
<p>如实说明阅读频率、近期实际读过的论文和仍不理解的部分，再用问题、方法、实验条件与局限说明收获。准备时可复现一个小机制或对照实验，把读过和验证过分开；不替作者补造阅读清单或频率。</p>

## Transformer 与多头注意力

<details data-knowledge-key="transformer-arch"><summary>（24）怎样介绍《Attention Is All You Need》的主要亮点？</summary></details>
<p>从原始 Encoder-Decoder 结构讲清自注意力、多头注意力、位置编码和逐位置前馈网络，说明它如何减少递归的顺序依赖并让已知序列训练并行。不要把现代 Decoder-only 的组件全部归给原论文，自回归生成仍依赖先前已生成的 Token。</p>

<details data-knowledge-key="transformer-arch"><summary>（25）什么是多头注意力？</summary></details>
<p>多个头用各自的线性投影在不同子空间计算注意力，再拼接各头结果并做输出投影。不同头可能学到不同关系，但不存在保证固定语法或语义分工；头数也不是越多越好，需要同时考虑每头维度和实现成本。</p>

## 在线 Coding（条件待补）

<details data-binding-status="pending_semantic_verification"><summary>（26）组合总和：怎样编写可运行程序并测试？</summary><p>关联知识点待核实。</p></details>
<p>当前文字没有给出候选集合、目标值、候选是否可重复使用、结果去重和输出要求，暂不能确定是哪一种组合总和题。先补齐完整题目和样例，再选择算法与边界测试，本页暂不绑定算法知识点。</p>

<details data-binding-status="pending_semantic_verification"><summary>（27）这道组合总和题的时间复杂度是多少，N 表示什么？</summary><p>关联知识点待核实。</p></details>
<p>先补齐题目、所用算法与参数定义，明确 N 指候选数、输入长度还是其他规模，并区分搜索开销与输出规模。当前条件不足，不能给固定复杂度或替作者指定递归深度。</p>
