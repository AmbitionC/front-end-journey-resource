证明 Agent 项目价值需要把技术轨迹与业务结果连接起来。离线任务集回答“在可控案例上会不会做”，shadow/canary 回答“在真实流量与系统中怎样表现”，上线监控回答“长期是否持续创造价值”。任何阶段都要与 baseline 比，并同时测质量、安全、延迟和成本。

![Agent 项目从 Baseline、离线评测、Shadow、Canary 到业务指标与持续监控的评价闭环](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-project-evaluation-baseline-metric-loop-v1.webp)
*图：每一阶段回答不同问题；评测集、发布 bundle 与线上反馈通过版本和决策门槛连接。*

## 建立可复现 Baseline

baseline 可以是人工流程、规则系统、搜索或旧模型。用同一批任务和盲审标准比较，记录处理时间、质量、严重错误、成本和覆盖率。若 Agent 只处理简单案例，应把路由后全流程结果计算进去，不能只报被接收子集的高分。

保存 baseline 版本和采集窗口。业务季节性、团队熟练度和输入难度变化都会影响比较，必要时做同期对照。

## 任务集与切片

任务集来自真实分布，同时有专门挑战集覆盖提示注入、权限边界、资料冲突、长上下文、工具失败和少数语言。每条有输入、允许上下文、期望结果/评分 rubric、风险等级和 provenance。

训练、prompt 调试和最终测试分开。反复查看失败并修改 prompt 已经对开发集过拟合；保留 holdout 与新鲜线上抽样。按场景、难度、用户群和工具切片，整体均值会掩盖高风险小群失败。

## 质量指标

结构化任务用 exact/field accuracy；开放回答用事实支持、完整、相关、可执行和语气 rubric；工具任务看最终状态、参数正确、步骤数和副作用。LLM-as-judge 可扩展初筛，但要校准人工、固定 judge/version、随机化答案顺序并监控位置偏差。

报告置信区间和样本量，不把 82.1% 与 82.4% 当确定差异。严重错误单独计数并给上限，不能被大量简单成功平均掉。

## 安全与权限是硬门槛

测越权读取/写入、敏感数据外发、提示注入、审批绕过、未知副作用和拒绝恢复。红队案例与正常质量分开报告，关键违反一例即可阻止上线。记录真实 tool request、policy decision 和 operation ledger，不能只评最终文本。

[NIST AI RMF Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/)强调客观、可重复/可扩展的测试、评估、验证与确认以及不确定性文档。评测流程本身版本化，失败样本保留并分类。

## 系统指标与 SLO

端到端延迟从用户提交到可用结果，另分解 queue、首 token、模型、工具和渲染。成本按成功任务计入模型、检索、工具、重试和人工审核，而非只报单次 API token。

[Google SRE SLO](https://sre.google/sre-book/service-level-objectives/)区分衡量行为的 SLI 与目标 SLO。定义成功率、p95 延迟、freshness 等用户可见目标和窗口；错误预算帮助平衡发布速度与可靠性。Agent “给了文本”不等于任务成功。

## Shadow、Canary 与实验

Shadow 在真实输入上运行但不影响用户，用于看数据、延迟、工具计划和成本；涉及敏感数据仍需授权，外部副作用必须禁用。与人工/旧系统盲比，发现离线集遗漏。

Canary 让少量合格用户真实使用，限制工具和预算，设置自动停止：严重错误、SLO、成本或投诉越线立即回滚。若要证明业务因果，进行适当随机实验；简单前后对比容易受季节和学习效应影响。

## 业务价值公式

价值可拆为节省时间 × 人力成本、增加转化/完成量、减少错误损失，再减模型/基础设施/审核/维护成本。还要看人工修改比例和认知负担：Agent 生成快但审核更难，可能没有净收益。

测 adoption、task completion、time-to-resolution、escalation 和 retention。满意度作为补充，不能替代真实任务结果。报告按用户角色切片，避免价值只来自把工作转给另一团队。

## 持续回归

每个 release bundle 包含 model、prompt、retrieval index、tool schema 和 policy version。离线评测绑定 bundle；上线日志可回放到具体版本。资料、流量和模型漂移时，固定集与新鲜集都要跑。

生产反馈经过分类和隐私处理进入评测候选，不把 thumbs down 自动当正确标签。定期复审指标是否仍对应业务目标，防止团队优化 benchmark 而用户无收益。

## 决策报告

一页报告给出 baseline、关键指标与区间、切片、重大失败、成本、SLO、用户影响、已知限制和 go/hold/no-go 建议。附可复现 run、数据版本和失败样本。

项目价值被证明的标准不是 Demo 惊艳，而是在真实基线下，以有不确定性说明的证据展示任务结果更好，并且风险、可靠性和总成本仍在事先约定的边界内。

## 参考资料

- [NIST AI RMF：Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/)
- [Google SRE：Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
