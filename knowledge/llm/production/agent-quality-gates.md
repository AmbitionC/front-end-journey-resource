发布质量门禁把“评估结果”变成明确动作：通过、人工复核、阻断、灰度或回滚。它不是 CI 页面上一排绿色图标，而是一套版本化策略，说明使用哪些证据、阈值和样本，谁有权例外，例外何时失效。没有门禁，Benchmark 只是报告；门禁设计错误，团队则会被不可信分数阻塞或放行风险。

[NIST AI TEVV](https://www.nist.gov/ai-test-evaluation-validation-and-verification-tevv)指出，可信 AI 依赖可靠的测量与评估，并需要任务、测试床、数据集和方法说明。门禁必须引用这些可追溯证据，而不是把“跑过一个评分脚本”当成质量证明。

![Agent 变更从静态检查、离线评估到灰度生产的发布证据阶梯](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-quality-gates-release-ladder-v1.webp)

图中的阶梯表达两个原则：越接近生产，证据越贴近真实环境、成本越高；前层失败不能被后层好成绩抵消。Canary 与 Production 还必须保留 Rollback 路径，因为上线后证据可能推翻发布前判断。

## 门禁对象是什么

Agent 版本不是只有一段代码。一个可发布单元通常包含：代码镜像、系统 Prompt、模型不可变版本或路由策略、工具注册表与 Schema、权限策略、检索索引、评分器和配置。门禁输入先生成 manifest 与摘要，确保评估对象等于待发布对象。

若评估用 `model-v17`，发布却配置 `latest`；或测试的工具 Schema 与注册表不同，绿色结果没有证明生产候选。所有步骤读取同一候选清单，任何内容变化都使旧证据失效并重新评估。

## 第一层：静态与确定性检查

最快门禁覆盖格式、依赖、Schema、敏感字段、策略编译、工具清单和配置不变量。例如：

- Prompt 模板无占位符和本地路径；
- 工具描述与 JSON Schema 可解析且版本固定；
- 写工具声明幂等、审批和后置条件；
- 默认权限没有扩大；
- 日志 Schema 不允许密钥、token 和未知自由字段；
- 依赖摘要、签名和来源符合策略。

这些失败应直接 Block，不需要模型评分器投票。确定性错误交给确定性控制，反馈快、解释清楚。

## 第二层：单元与契约

运行 Agent 状态机、授权、工具适配器、重试、取消、幂等和数据分类测试。高风险规则要求全过；不稳定用例不能靠重跑变绿。工具供应商的测试环境可做契约探针，但结果与本地模拟分开，避免外部短暂故障阻断所有提交而没有处置路径。

门禁保存用例集版本、通过/失败/跳过数量、失败 Trace 和执行环境。被隔离的用例属于风险债务，必须有责任人和到期时间，不能从分母悄悄消失。

## 第三层：离线评估

在固定任务集上比较基线与候选，使用相同 Harness、评分器和运行次数。质量报告包含主指标、置信范围、失败切片、长尾成本和基础设施错误。候选必须满足绝对底线与相对退化限制，例如：

```yaml
gate: offline-quality
metric: qualified_task_success
absolute_min: 0.90
max_regression: 0.01
min_cases: 1000
required_slices:
  high_risk: {absolute_min: 1.0}
  zh_cn: {max_regression: 0.02}
on_insufficient_sample: review
```

样本不足返回 Review 或 Inconclusive，不应默认 Pass。平均改善也不能掩盖关键切片退化。

## 第四层：安全评估

运行固定对抗集、权限矩阵、间接注入、工具/记忆投毒、数据外泄和供应链验证。关键安全不变量采用零容忍；“99% 安全通过率”若剩余 1% 是跨租户写入，仍然阻断。

[NIST AI RMF Generative AI Profile](https://doi.org/10.6028/NIST.AI.600-1)把红队、评估和持续风险管理放在具体使用情境中。安全门禁因此按风险分层：低风险表达问题可进入 Review，高影响越权、泄露和不可逆副作用直接 Block 并创建事故。

## 第五层：Canary

候选只接收小比例、低风险或内部流量，使用短期版本固定和快速回滚。Canary 观察质量代理、可靠性、p95 延迟、单位合格结果成本、安全事件和人工接管，并与同时段基线比较。

Canary 不是把 5% 用户当实验动物。仍需资格、隐私、权限和停止规则；高风险功能可从影子流量或只读模式开始。指标异常先自动停止扩量，严重事件立即回滚，不能等待例会解释。

## 第六层：生产与持续验证

全量发布后继续监控 SLO、在线评估、漂移、事故和用户反馈。发布门禁证明的是“在已有证据下可接受”，不是永久认证。数据分布、工具和模型供应商变化都可能让结论失效。

生产验证保存发布版本、策略版本、流量阶段和回滚目标。每次扩量都是一个可审计状态转移，只有上一阶段观察窗口满足条件才继续。

## 门禁策略合同

每条策略至少包含：

```yaml
id: release-agent-safety-v8
applies_to: agent_bundle
evidence: redteam-suite@12
metric: critical_violation_count
operator: equals
threshold: 0
sample: all_critical_cases
owner: security-agent
exception_approvers: [security_lead, product_owner]
exception_expiry: 7d
on_fail: block
```

阈值有来源：法规/安全不变量、历史基线、用户承诺、容量预算或实验功效。不要因为候选没通过就临时降低阈值；若策略确实不合理，单独修改、审查、说明影响，并对所有候选一致重跑。

## Pass、Review 与 Block

二元门禁会把“证据不足”和“明确失败”混在一起。至少区分：

- **Pass**：证据完整且满足策略；
- **Review**：样本不足、轻微边界退化或需要领域判断；
- **Block**：确定性规则、关键阈值或安全不变量失败；
- **Error**：评估基础设施失败，不能解释为候选失败或通过。

Review 队列有 SLA、所需角色和决策模板。人工批准记录理由、范围、补偿控制和到期时间，而不是一个永不失效的“忽略检查”。

## 例外与风险接受

紧急修复可能需要有限例外，但例外不能删除证据。记录失败项、业务理由、批准人、允许环境/流量、监控、回滚和到期。到期自动恢复门禁；若要延期重新批准。

安全关键项一般不可豁免。即使允许，也采用能力降级、只读、内部用户或短时 Canary，而不是直接全量。风险接受属于治理决策，不应由提交者单人完成。

## 让控制持续可信

[SLSA Source Requirements](https://slsa.dev/spec/v1.2/source-requirements)强调技术控制的持续执行和相应证据。对 Agent 发布，这意味着门禁配置本身受版本控制和审查，受保护分支不能绕过，结果关联到不可变候选，管理员操作可审计。

还要测试门禁：故意提交缺签名工具、越权策略、退化样本和失效凭证，确认系统真的 Block。只测试“好候选能通过”无法发现门禁线路被关闭。

## 常见误区

- 候选评估后又修改 Prompt 或模型路由，仍复用旧绿灯。
- 用综合平均分抵消关键安全失败。
- 样本不足默认通过，不显示不确定性。
- 遇到未通过就临时改阈值，策略围着候选转。
- 人工例外无范围、监控和到期，成为永久绕行。
- CI 显示成功，但门禁不是受保护分支的强制条件。

## 小结

发布质量门禁是一条从确定性检查、契约、离线质量、安全到 Canary 和持续生产验证的证据阶梯。策略固定指标、阈值、样本、动作、责任和例外生命周期，并绑定不可变候选。门禁既要阻止明确风险，也要诚实表达证据不足；它的可信度来自持续强制、可测试和可审计，而不是绿色图标数量。

## 参考资料

- [NIST：AI Test, Evaluation, Validation and Verification](https://www.nist.gov/ai-test-evaluation-validation-and-verification-tevv)
- [NIST：AI RMF Generative AI Profile](https://doi.org/10.6028/NIST.AI.600-1)
- [SLSA：Source requirements](https://slsa.dev/spec/v1.2/source-requirements)
