阿里 AI 应用开发二面题单，关注项目真实性、后端验证、Coding Agent、多智能体通信及记忆治理。原帖发布于2026年11月25日，未注明实际面试日期。

> 以下短答是编辑整理的备考思路，不是当事人的现场回答。涉及个人经历、项目实现和测量结果时，应按本人事实替换，不据题目反推已实现方案。

## 面试问题与回答思路

<details data-knowledge-key="agent-resume-interview"><summary>（1）做一个完整的个人自我介绍。</summary></details>
<p>可以按当前方向、与岗位相关的一段经历和申请动机组织介绍，再说明自己负责的工作及可核验结果。没有上线、收益或团队职责的事实就不补写，个人信息只保留与岗位有关的部分。这里提供表达框架，具体内容需要换成本人真实经历。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（2）你过往的两个核心项目均为个人独立开发项目吗？</summary></details>
<p>先分别说明两个项目的起点、已有代码、本人完成的模块和获得的帮助，再回答各自是否独立开发。参考教程、复用开源代码、接受评审和团队协作都要如实交代，不能把项目整体成果全部算作个人成果。这里只提供核对框架，是否独立开发须由本人事实决定。</p>

<details data-knowledge-key="agent-project-requirements"><summary>（3）你的项目灵感和需求来源是什么？是否参考了GitHub开源项目？</summary></details>
<p>先说明需求来自哪类真实用户、观察或个人痛点，再用现有做法与最小实验解释为什么值得做。参考GitHub项目时，区分借鉴的方案、复用代码与自己新增的工作，并遵守相应许可。没有做过访谈或真实用户验证就如实说明，不能把开源功能列表当作已证实的业务需求。</p>

<details data-knowledge-key="agent-project-requirements"><summary>（4）你Spring Boot项目的业务需求是如何确定的？</summary></details>
<p>先交代项目要服务谁、原有流程的具体问题和可获得的数据，再把目标收敛为可验证的最小闭环。为接口行为、关键约束、失败处理和验收指标写清合同，再选择Spring Boot等实现手段。个人练习项目可以说明是假设需求和验证练习，不能包装成真实企业访谈或上线收益。</p>

<details data-knowledge-key="agent-test-pyramid"><summary>（5）项目中如何模拟高并发场景，完成性能与数据一致性测试？</summary></details>
<p>先固定测试环境、数据规模、接口比例、缓存冷热和负载模型，分阶段增加压力，观察成功吞吐、尾延迟、错误与资源饱和。性能之外，另用明确的业务不变量验证并发冲突、重复请求和提交后响应丢失，并按请求标识对账权威状态。发压端是否达到计划也要核实，HTTP成功或一次压测曲线不能证明数据一致性。</p>

<details data-knowledge-key="logging-monitoring"><summary>（6）该后端系统的核心性能瓶颈体现在哪里？</summary></details>
<p>先说明项目实际观察到的慢请求、错误和资源信号，再沿排队、应用计算、数据库、缓存和外部调用逐段定位。用同一请求的追踪与同时间窗口指标验证假设，区分CPU、I/O、锁等待、连接池和下游限流等原因。优化后用相同负载复测；若没有证据，应明确尚未确认核心瓶颈。</p>

<details data-knowledge-key="redis-cache"><summary>（7）详细介绍项目整体的缓存架构设计方案。</summary></details>
<p>先说明哪些数据值得缓存、可接受多旧，以及数据库、Redis和进程内缓存各自负责什么。再按读未命中回源、写后失效、TTL、热点重建与故障降级讲完整路径，并处理删除失败和旧请求晚回填。多级缓存要分别治理失效与容量，关键业务决策仍在权威数据上校验；只描述本人实际采用的层级与证据。</p>

<details data-knowledge-key="agent-coding"><summary>（8）你自研的终端AI编程助手具备哪些核心功能？</summary></details>
<p>可以围绕读仓库、搜索与编辑代码、执行受限命令、验证结果和长任务恢复逐项介绍，但只列自己确实实现的能力。挑一条真实任务串起模型决策、工具执行、权限检查和测试反馈，并说明失败时如何停止。功能清单之外，要给出可复现任务、最终改动和未覆盖边界。</p>

<details data-knowledge-key="agent-multi-agent-messaging"><summary>（9）项目中多Agent架构的通信机制是如何设计实现的？</summary></details>
<p>先区分同一运行时的状态传递与跨进程消息，再说明任务标识、消息类型、关联关系和结果结构。收到消息的确认不等于任务完成，重复投递、超时、迟到结果和取消需要独立的状态与幂等处理。共享事实用受控状态或账本维护，消费边界仍检查权限与版本；具体传输方式按实际项目说明。</p>

<details data-knowledge-key="agent-dynamic-workflow"><summary>（10）除固定模式的多Agent协作外，你是否接触或实现过动态工作流场景？</summary></details>
<p>先如实区分自己实现过的固定流程、条件路由和动态规划，没做过的部分只说明理解。动态场景可由模型提出节点、依赖和参数，但候选计划应通过结构、工具能力、权限及预算校验后才执行。运行条件变化时产生新版本重新验证，并保留已完成副作用的状态。</p>

<details data-knowledge-key="agent-memory-summarization"><summary>（11）谈谈你设计的AI助手的上下文压缩与记忆管理整体方案，以及记忆提取逻辑。</summary></details>
<p>先把原始对话与工具证据、带来源的事实和当前模型工作视图分开。上下文按预算裁剪、抽取或摘要，保留目标、约束、关键决定和未完成动作；长期记忆另走候选提取、用途与敏感性检查、去重冲突校验和持久化。摘要保存并核验后才移除已覆盖消息，异步更新还要防旧版本覆盖新状态，并用继续任务的质量验证效果。</p>

<details data-knowledge-key="agent-memory-architecture"><summary>（12）项目中长期记忆的提取规则是什么？哪些关键信息会被留存记录？</summary></details>
<p>可把用户明确希望记住的稳定偏好、经验证的项目事实和有复用价值的任务经验作为候选，记录来源、主体、用途和有效范围。模型负责提出候选，受信任服务检查敏感信息、授权、重复、冲突和质量后决定是否写入。临时要求、秘密和未验证推断不能自动提升为长期事实，具体规则与阈值需要用实际样本验证。</p>

<details data-knowledge-key="agent-memory-forgetting"><summary>（13）你的记忆模块是否设计了遗忘机制？如何实现记忆的更新与淘汰？</summary></details>
<p>先区分降低检索权重、有效期结束、新事实替代旧版本和真正删除，四种动作的条件与结果不同。更新保留来源与版本，召回时检查当前状态、权限和有效期；删除还要传播到向量索引、缓存和派生摘要。用过期召回、冲突、并发更新和删除恢复场景验证，不能把只删主表或降低相似度分数称为完整遗忘。</p>

<details data-knowledge-key="agent-coding"><summary>（14）对比Claude Code、Codex等成熟编程工具，你自研的产品存在哪些差距？</summary></details>
<p>在相同仓库版本和任务集上比较任务完成、回归、改动范围、权限控制、恢复能力、时延与合格任务成本，再谈产品差距。用自己项目可复现的失败案例说明哪些机制不足，以及下一步优先补什么。成熟工具的具体版本和配置需要另行核对，不能凭品牌名称推断能力，也不能用个人体验宣称全面领先或落后。</p>

<details data-knowledge-key="agent-learning-roadmap"><summary>（15）日常你采用什么样的学习方式，如何沉淀技术知识？</summary></details>
<p>可以按真实问题驱动学习：先找所需基础与官方资料，做最小可运行实验，再用失败案例检验理解。沉淀时记录问题、适用条件、来源版本、实现、验证结果和未解决点，并把有代表性的案例留作回归。面试中应配本人真实的一次学习迭代，不能把建议的路线或时间表当作已经完成的经历。</p>

## 关联知识

- [AI / Agent 岗位简历与面试](../../../knowledge/career/agent-resume-interview.md)
- [从真实需求定义 Agent 项目](../../../knowledge/career/agent-project-requirements.md)
- [Agent 单元、集成、场景与端到端测试](../../../knowledge/llm/production/agent-test-pyramid.md)
- [日志、指标、Tracing 与告警](../../../knowledge/backend/devops/logging-monitoring.md)
- [Redis 缓存策略与一致性](../../../knowledge/backend/database/redis-cache.md)
- [Coding Agent 的架构与执行循环](../../../knowledge/llm/agent/agent-coding.md)
- [多智能体消息、协议与状态同步](../../../knowledge/llm/agent/agent-multi-agent-messaging.md)
- [动态工作流生成与执行](../../../knowledge/llm/agent/agent-dynamic-workflow.md)
- [会话摘要、压缩与记忆提炼](../../../knowledge/llm/agent/agent-memory-summarization.md)
- [Agent 记忆系统架构设计](../../../knowledge/llm/agent/agent-memory-architecture.md)
- [遗忘策略、冲突处理与记忆更新](../../../knowledge/llm/agent/agent-memory-forgetting.md)
- [从零到 Agent 工程师的学习路线](../../../knowledge/career/agent-learning-roadmap.md)
