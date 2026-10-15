### 阿里淘宝闪购 Agent 算法实习一面：框架、记忆与线上排障

原记录为淘宝闪购 Agent 算法工程师 27 届实习一面，约 60 分钟，主要围绕框架选型、人工介入、记忆与工程排障。AUC 92%、89%、62% 是文中 AI Coding 压轴题给定的场景，不作为作者的线上业绩；产品实现与版本细节需另行核查。

<details data-knowledge-key="build-agent-framework">
<summary>（1）为何选用 OpenAI Agents SDK，怎样与其他 Agent 框架比较选型与部署边界？</summary>
</details>

比较实际版本的模型接入、工具编排、状态恢复、部署和数据流向，再看维护成本与依赖审计；SDK、开源许可、模型服务和私有化部署是不同维度。用项目证据说明选择，不从产品名称推断安全或数据不出域。

<details data-knowledge-key="agent-human-in-loop">
<summary>（2）怎样设计 Human-in-the-Loop？</summary>
</details>

在不可逆写入、低置信度决策、权限提升和高金额操作前创建检查点，把计划、参数、证据和影响范围展示给审批人。审批结果要绑定状态版本，避免等待期间环境变化后执行旧动作；拒绝、修改和超时都要有明确分支。模型写下“需要确认”只是提示，真正的暂停必须由编排器和权限层强制执行。

<details data-knowledge-key="agent-human-in-loop">
<summary>（3）是否在 .md 文件里写过强制停止条件，怎样保证运行时执行？</summary>
</details>

Markdown可以表达停止规则，但真正暂停需要运行时在动作前检查确定性条件和取消信号，保存检查点，恢复时重验状态、权限和幂等。说明真实实现，不能只靠模型读到一句停止说明。

<details data-knowledge-key="agent-permission-model">
<summary>（4）高风险在线环境怎样管控 Agent 异常？</summary>
</details>

按只读、可逆写入和不可逆操作划分工具权限，默认最小授权；用参数 Schema、策略引擎和业务校验阻止越权。运行时设置超时、最大步数、失败熔断和费用预算，在沙箱或仿真环境先执行高风险流程。所有动作记录操作者、输入、状态版本、结果与审批证据，便于追责和回放。

<details data-knowledge-key="agent-memory-architecture">
<summary>（5）怎样说明 Token 用量，并管理间隔数周后继续的长周期会话？</summary>
</details>

先说明输入、输出、缓存和累计用量的统计口径与预算，再讲近期原文、历史摘要和稳定事实的分层保留。恢复时按当前目标取回有来源和时间的相关记忆，处理冲突与过期；个人用量未独立验证，不补造实际数字。

<details data-knowledge-key="agent-memory-architecture">
<summary>（6）比较 OpenClaw 与 Hermes 的记忆、分层压缩和 .md 文件使用时，应核查哪些维度？</summary>
</details>

先按具体版本核对实际实现，再比较写入触发、记忆载体、压缩与召回、冲突和遗忘、权限及审计。Markdown是可审阅的载体，向量库是检索的一种实现；原记录中的具体分层时间和双索引说法尚未核验，不作为通用产品事实。

<details data-knowledge-key="agent-evaluation">
<summary>（7）Agent 还有哪些优化空间，怎样排优先级？</summary>
</details>

先从真实失败轨迹统计最大损失来源，例如检索遗漏、工具误选、参数错误、循环或结果未验证，再按影响、频率和改造成本排序。能用校验、路由和状态机解决的问题不应立即训练模型。若确实需要反馈学习，也必须先有稳定任务定义、可信奖励和离线评测，避免把线上噪声放大。

<details data-knowledge-key="llm-training-overview">
<summary>（8）怎样回答 SFT 或模型层工作经验？</summary>
</details>

按任务、数据、基座模型、目标函数、训练配置、验证集和部署影响说明。多任务微调要解释不同损失如何加权，防止一个任务压制另一个；同时检查数据泄漏、类别不平衡和过拟合。如果经验只停留在 API 调用，应如实说明，并把工程侧能力与模型训练能力分开。

<details data-knowledge-key="agent-tool-result-validation">
<summary>（9）Agent 工程方案的差异化体现在哪里？</summary>
</details>

模型和框架相同不代表系统效果相同。差异通常来自受控工具集合、严格输入输出校验、任务状态与恢复、权限、安全门禁、领域检索和评测闭环。任何“降低成本”或“减少轮次”的结论都应给出相同任务集、基线、样本量和统计口径，不能用单次演示证明。

<details data-knowledge-key="agent-resume-interview">
<summary>（10）怎样说明区块链方向的真实工作经历？</summary>
</details>

选择真实项目说明目标、约束、本人负责模块、关键决策和可验证结果，区分团队成果与个人贡献；未披露的项目、数字和实现不补造。

<details data-knowledge-key="feature-store">
<summary>（11）AI Coding 压轴题：给定训练 AUC 92%、测试 89%、上线 62%，怎样从数据、标签、Serving 三维给出至少 8 个原因并排序？</summary>
</details>

先核对指标口径与同批请求回放，再列候选：样本选择偏差、特征分布变化、特征泄漏、标签定义变化、标签延迟、标签噪声、模型/特征版本不一致、预处理或缺失填充不一致、推理精度差异。按影响范围、出现频率和可验证性给有条件的排查优先级，并用实验逐项排除；不声称所有业务共享固定根因排名。

#### 延伸阅读

- [Human-in-the-Loop](../../../knowledge/llm/agent/agent-human-in-loop.md)
- [Agent 权限模型](../../../knowledge/llm/production/agent-permission-model.md)
- [Agent 沙箱](../../../knowledge/llm/agent/agent-sandbox.md)
- [Agent 审计日志](../../../knowledge/llm/production/agent-audit-log.md)
- [Agent 记忆架构](../../../knowledge/llm/agent/agent-memory-architecture.md)
- [工具结果校验、解析与反馈](../../../knowledge/llm/agent/agent-tool-result-validation.md)
- [Agent 失败恢复](../../../knowledge/llm/production/agent-failure-recovery.md)
- [Feature Store](../../../knowledge/data/analysis/feature-store.md)
