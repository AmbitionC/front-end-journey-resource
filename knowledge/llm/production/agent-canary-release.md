Agent 发布的行为单元不是一个容器镜像，而是模型、Prompt、工具 Schema、策略、检索索引和运行时配置的组合。只给“模型版本”打标签，发生质量回退时就无法知道究竟是哪一部分改变。Canary 发布的目标，是让完整行为 bundle 在少量、代表性流量上接受可归因评估，再逐级扩大。

[Google SRE Workbook 的 Canarying Releases](https://sre.google/workbook/canarying-releases/)把 Canary 定义为在完整发布前，将变更部署到部分生产环境并评估结果。小流量本身不构成安全；必须有对照、观察窗口、门禁和可执行回滚。

![完整发布 bundle 先固定版本，控制组与 5% Canary 在质量、安全、延迟和成本上比较，通过门禁后逐步扩至 25%、50% 和 100%，失败立即回滚](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-canary-release-progressive-rollout-v1.webp)
*图：每一级都有绝对 SLO 与相对差异门禁，不能只看“Canary 比昨天好”。*

## 不可变 Release Bundle

一次发布生成不可变 releaseId，指向：

~~~text
workflow_version
model_provider / model_revision / parameters
prompt_template_version
tool_contract_versions
safety_policy_version
retrieval_index_version
runtime_image_digest
feature_flags and routing_policy
evaluation_dataset_version
~~~

请求、Trace、日志和产物都记录 releaseId。回滚是把新流量路由回旧 bundle，而不是临时改几项配置后继续使用同一个版本号。状态存储还要能被旧 bundle 读取；破坏兼容的迁移需双读写或向前修复路径。

## 流量选择要有代表性

最简单的随机 5% 可能没有覆盖高价值租户、长上下文、特定语言、工具任务和风险场景。按 tenant 或 thread 稳定哈希分桶，保证同一对话不在版本间跳动；再按任务类型、地区、模型能力和风险层分层采样。

高风险写操作先用 shadow 或离线 replay，不能让新 Agent 同时真实执行。Shadow 结果不提交副作用，只比较计划、工具参数和输出；但它无法完全模拟真实用户反馈、排队与外部状态，因此不能替代有限真实 Canary。

控制组必须在相同时间、相近流量和共享依赖下运行。若 Canary 独占新区域或只接简单请求，比较会被污染。记录分桶原因与排除条件，避免指标变差时通过更改流量组成“修好”大盘。

## 门禁指标

指标至少分四组：

- 质量：任务完成、结构化输出合法、人工评分、用户纠正和回退；
- 安全：越权工具、敏感数据、错误拒绝、策略拦截与严重事件；
- 可靠性：技术成功、超时、重试、fallback、队列和取消；
- 效率：首 token、端到端延迟、token、工具次数和单位成功成本。

每项同时设置绝对阈值和相对控制差。一个版本错误率从 0.1% 升到 0.4%，可能相对退化 300%，即使仍低于宽松的 1% 绝对线也值得阻断。安全严重事件通常是零容忍单点门禁，不能被平均质量抵消。

[NIST AI RMF 1.0](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10)强调持续治理、测量与风险管理。把安全、质量和受影响人群纳入发布评估，而不是只看服务 5xx，是 Agent Canary 对该框架的具体落实。

## 样本量与观察窗口

流量少时，零错误不代表安全；流量大时，极小差异可能统计显著但无业务意义。发布计划预先定义最小样本、最小观察时间、实际重要差异和置信规则。长任务要覆盖完整生命周期，不能任务刚入队就升到下一档。

周期性行为也要覆盖，例如工作日高峰、夜间批处理和特定地区。紧急安全修复可以缩短窗口，但要提高人工监督、限制功能和准备快速回退，不能假装普通门禁已经充分验证。

## 逐级扩流与自动回滚

常见阶梯为内部 → 1% → 5% → 25% → 50% → 100%，实际比例取决于容量与风险。每一级重新检查样本、SLO、相对差异和依赖健康；扩流动作有 cooldown，避免指标延迟到达前连续跳级。

自动回滚只依赖低噪声、高置信信号，例如严重安全事件、错误率或延迟快速越线。模糊质量指标触发暂停与人工判断。回滚必须经过演练，并能同时恢复路由、Prompt、工具和策略；只换回模型但继续使用新 Schema 可能仍然失败。

## 可观测性与归因

每个 Span 注入 releaseId、controlOrCanary、modelRevision、promptVersion、toolVersion 和 routeDecision。大盘按任务与租户切片，查看总体指标时始终配套样本组成。共享上游故障同时影响控制与 Canary，不能误判为版本无差异；需要独立健康信号和时间线。

发布期间冻结不相关的大变更，或至少保证所有同时变更可独立标识。[Google SRE 的 Release Engineering](https://sre.google/sre-book/release-engineering/)强调一致、可重复、自动化的构建和发布流程；不可变产物与可重现配置正是可靠归因的基础。

## 验证与演练

上线前用固定评测集、历史 Trace replay、恶意输入和工具模拟器验证。生产演练覆盖指标延迟、控制组污染、依赖故障、错误自动回滚、回滚后 Schema 兼容和分桶粘性。断言同一 thread 不跨版本，副作用只由一个组提交，审计能还原每次扩流决策。

## 小结

Canary 是“完整行为 bundle + 代表性流量 + 可归因对照 + 绝对门禁 + 分级扩流 + 可演练回滚”。它不是把 5% 用户当测试员。只有版本、状态兼容和指标都能对应到同一个发布单元，Agent 团队才能在扩大影响面之前发现质量、安全和成本回退。

## 参考资料

- [Google SRE Workbook：Canarying Releases](https://sre.google/workbook/canarying-releases/)
- [Google SRE：Release Engineering](https://sre.google/sre-book/release-engineering/)
- [NIST：Artificial Intelligence Risk Management Framework 1.0](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10)
