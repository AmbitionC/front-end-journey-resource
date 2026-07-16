线上反馈闭环不是收集点赞后直接改 prompt，而是把生产信号转换为可复现案例，进入版本化评估集，用离线和人工校准验证候选变更，再通过受控发布观察真实影响。每个箭头都有质量门，才能避免“修一个案例，退化一大片”。

## 收集什么反馈

显式反馈包括评分、原因、纠正和人工接管；隐式信号包括重复提问、用户撤销、工具失败、超时、abstain、投诉和后续修改。隐式信号只能作为候选，不能直接解释为满意/不满意。

生产 trace 关联输入类别、版本包、决策、工具、结果、延迟和成本，内容按隐私策略最小化。[OpenTelemetry traces](https://opentelemetry.io/docs/concepts/signals/traces/)提供跨服务 parent/child span 与事件模型，可用于重建一次 Agent 任务；敏感 prompt 使用受控引用而非普通 span attribute。

![生产 Trace 与用户反馈经分诊和失败分类形成带输入、期望属性、版本和切片的可重放案例，进入评估集；候选变更经过离线评估、人工校准、安全门和金丝雀，回归则回滚并新增案例](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-feedback-loop-eval-flywheel-v1.webp)
*图：工具正确、安全、延迟、成本、拒答和边缘案例分别评分，不用单一总分掩盖退化。*

## 从事件到 Replayable Case

分诊先排除重复、已知外部故障和无法合法保留的数据，再分类：理解、事实、检索、规划、工具选择、参数、权限、恢复、输出或体验。一个案例包含：

```json
{
  "caseId": "eval-2042",
  "inputFixture": "ref://sanitized-input",
  "environmentFixture": "tool-fixture-v7",
  "expectedProperties": ["uses read-only tool", "cites authoritative source"],
  "forbiddenEffects": ["no publish"],
  "sourceRelease": "agent-2026.07.16.3",
  "slices": ["zh-CN", "long-context", "permission-denied"],
  "provenance": "incident-91"
}
```

不要把一次模型输出固定成唯一 golden text，除非任务确需精确字符串。更稳健的是 rubric、结构化字段、工具序列/状态和禁止副作用。外部服务通过可重放 fixture 固定，减少网络波动。

## 评估集治理

[OpenAI evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices)建议 eval 任务具体、数据代表生产、结合人类判断并持续运行。评估集分核心回归、安全红线、近期事故、长尾切片和探索集；每条有 owner、来源、许可、版本和过期/复查日期。

防止泄漏：生产样本脱敏和授权，训练/提示优化与 holdout 分开，候选设计者不能只针对可见答案微调。定期清理重复/过时案例，但安全事故通常长期保留。

## 多维评分

至少分别报告：任务成功、事实/证据、tool selection、参数/后置验证、权限/安全、abstention、延迟、成本和用户修订。按语言、客户、工具、任务风险和上下文长度切片。总平均改善可能掩盖高风险小切片退化。

自动 grader 先与领域专家/人工标注校准，测一致性和偏差。模型 grader 不评自己不具备证据的事实；安全与副作用用确定性日志/状态断言优先。分歧案例进入仲裁并更新 rubric。

## 候选变更实验

一次候选尽量只改变可归因组件：prompt、模型、工具 schema、策略或检索配置。记录完整 bundle。先跑受影响快速集，再全回归和安全集；阈值包含绝对下限与相对非退化，例如安全违规必须为零，成本/延迟不得超过预算。

失败时不要只改 wording 追单例。定位失败阶段，修数据、工具契约、权限或恢复机制。新案例证明旧版本失败、候选通过，并检查相邻切片。

## 人工校准

人工评审提供领域判断、用户意图和可接受边界。双人/仲裁处理高风险案例，记录 rubric 版本和理由。不要把人工改写直接作为“模型必须逐字输出”；提炼可泛化属性。

用户反馈也可能恶意或带偏见。单个用户不能让系统学习新的全局策略；聚合、分层采样并经过治理。隐私请求、删除和安全举报走专门流程。

## 金丝雀和生产判定

离线通过不代表线上成功。候选进入 shadow/canary，按会话粘性分流，比较任务质量、安全、人工介入、延迟、成本和业务 outcome。预先定义观察窗口、最小样本、停止/回滚阈值，避免看到有利波动才结束。

高风险动作保持审批或更小流量。回归触发自动 pause/rollback，同时把 trace 固化成新案例。成功也要监控长期漂移和分群影响。

## 数据与反馈偏差

只有愿意评分的用户不是总体；失败样本更容易被记录，沉默成功可能缺失。使用分层抽样、曝光/任务分母和置信区间，区分用户构成变化与版本效果。不要用点击率单独优化可能伤害安全/真实性的目标。

[NIST Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)强调持续 govern/map/measure/manage。反馈系统也要审计数据来源、测量限制、责任人和剩余风险，而不是让线上指标自动驱动模型行为。

## 运行指标

跟踪 feedback coverage、事件到 case 的延迟、case 去重/通过、评估时长、人工一致性、切片退化、回滚、版本归因缺失和 case 新鲜度。每个事故能回答：哪个版本、哪条路径、哪份证据、为何未被现有 eval 捕获、哪个控制负责修复。

## 小结

持续改进是一条有证据的飞轮：生产 trace 和反馈先分诊，形成脱敏、可重放、带期望属性与切片的案例；评估集经过治理，多维评分与人工校准验证候选；金丝雀再确认真实表现，回归则回滚并补充案例。反馈推动评估，不直接改写生产 Agent。

## 参考资料

- [OpenAI — Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices)
- [OpenTelemetry — Traces](https://opentelemetry.io/docs/concepts/signals/traces/)
- [NIST — AI RMF Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)
