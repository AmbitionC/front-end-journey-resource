A/B 测试用于估计“把符合条件的用户随机分配给 Agent A 或 B 后，结果平均改变多少”。它不是同时看两条大盘，也不是上线新版本后与上周比较。可信实验依赖预先定义的假设、随机分配、曝光记录、共同观察窗口、护栏和停止规则。

[NIST 对实验设计的定义](https://itl.nist.gov/div898/handbook/pri/section1/pri11.htm)强调在实验前制定详细计划，有意改变因素并观察响应，以获得有效、客观的结论。Agent 实验也必须先决定目标和分析，再看数据；否则很容易从几十个指标里挑一条“显著”的故事。

![Agent A/B 实验从随机分配、曝光记录到效应估计](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-ab-testing-experiment-funnel-v1.webp)

图中的 Control A 与 Treatment B 使用同一资格规则和结果窗口。只有真正曝光于分配版本的用户才进入相应分析；若分组后又根据结果剔除“麻烦样本”，随机化带来的可比性会被破坏。

## 写预注册实验卡

在开始前冻结：

```yaml
hypothesis: concise planner reduces completion time without lowering quality
population: eligible support sessions, web channel, adults
unit: user_id
allocation: 50/50, sticky for 14 days
control: agent-41
treatment: agent-42
primary_metric: qualified_resolution_rate
secondary: [p95_completion_time, cost_per_success]
guardrails: [safety_violation, escalation_rate, duplicate_side_effect]
minimum_sample: 12000 users
analysis_window: 14 days
stop_rule: fixed_horizon_or_safety_kill
owner: agent-experimentation
```

假设要包含方向与非劣条件，而不是“看看 B 好不好”。主指标只保留少数，次指标用于解释，护栏独立阻断。任何实验中途改变都记录原因和时间，不能悄悄重写计划。

## 选择随机化单位

按消息随机会让同一对话在 A/B 间跳动，状态与记忆污染；按会话随机可能让同一用户在多会话中交叉；按用户随机通常更稳定，但需要处理共享账户。若 Agent 影响团队或组织流程，可能要按团队/租户聚类随机，并在分析中考虑聚类相关。

单位还要匹配干扰范围。如果 Agent B 修改共享知识库，A 组也会受影响，违反“一个单位的处理不影响另一个单位”的直觉。此时采用租户级随机、隔离数据或分阶段设计，而不是假装用户级独立。

## 随机分配与粘性

使用稳定实验 ID、单位 ID 和哈希进行可审计分桶，记录 allocation version。粘性保证同一单位在实验期间维持组别；重新分桶会让用户体验混乱并污染状态。

[NIST 的完全随机设计说明](https://www.itl.nist.gov/div898/handbook/pri/section3/pri331.htm)指出，处理水平随机分配给实验单位，平衡与重复有助于后续比较。上线后先做 Sample Ratio Mismatch 检查：实际 A/B 数量若显著偏离预期，可能是分流、曝光、过滤或客户端故障，应暂停解释结果。

## 分配不等于曝光

用户被分到 B，但请求在到达 Agent 前取消，就没有真正曝光。日志至少记录 assignment、exposure、Agent 版本、Prompt/模型/工具/策略版本和时间。主要分析可采用 intention-to-treat 保留随机化优势，辅助分析再研究实际曝光，但两者不能混称。

不要只在成功响应时记录曝光，否则失败 Run 会从分母消失，B 看起来异常优秀。曝光事件应在确定版本即将处理请求时写入，并能和结果通过实验单位与 Run ID 关联。

## 指标与护栏

主指标应接近产品价值，例如合格解决率或正确完成率。延迟、成本、人工接管、用户投诉帮助解释。安全违规、越权工具、重复副作用和敏感数据泄露不进入加权总分，而是硬护栏。

指标定义固定分子、分母、窗口、排除与版本。对多轮任务，结果可能在会话后几天出现，需要定义归因窗口。若 B 让任务更快结束但提高后续返工，短窗口会误判。

## 样本量与最小可检测效应

样本量由基线、期望检测的最小效应、方差、显著性水平和统计功效共同决定，而不是“跑到有显著为止”。效应小但业务重要时需要更多样本；高风险安全护栏常用零容忍监控和立即停止，不适合等待传统显著性。

[NIST 的实验设计选择指南](https://www.itl.nist.gov/div898/handbook/pri/section3/pri33.htm)说明设计选择取决于实验目标、因素数量、资源以及对错误决策的控制。Agent 的模型、Prompt、工具和策略若同时变化，实验估计的是整个方案包的效应；若要知道哪个因素起作用，需要独立实验或因子设计。

## 观察窗口与新奇效应

用户初次看到新交互可能更好奇或更困惑，短期效果不代表稳定效果。固定最短观察窗口，覆盖工作日/周末和任务周期；对重复使用者观察学习与疲劳。不要每天看一次显著性就随时停止，这会提高假阳性概率。

若业务必须连续决策，可采用事先设计的序贯方法，但边界、最大样本和分析方式要在开始前确定。安全 kill switch 与统计停止是两回事：出现关键伤害时立即停，不等待样本计划。

## 分析与不确定性

报告 A/B 的绝对差、相对差、置信区间、样本量、缺失和分析口径。不要只报 p 值；统计显著不等于产品重要。分层查看任务、语言、设备和风险，但多重比较结果标为探索性，并通过后续实验确认。

分组前属性应平衡。若存在不平衡或缺失，先调查分流与采集；不要立刻用复杂模型“修掉”工程故障。对聚类单位和重复测量使用合适的标准误，避免把同一用户的多次会话当独立样本。

## Agent 特有的污染

长期记忆可能跨版本共享，B 写入的记忆在实验后被 A 读取；工具缓存可能共享不同 Prompt 的结果；人工坐席知道实验组后改变行为；模型路由别名在实验中升级。解决方案是隔离或标记状态、固定不可变版本、记录共享缓存键，并将人工流程纳入实验设计。

外部反馈集也不能只吸收 B 的失败而让 A 保持原样，否则实验期间系统开始自我改变。改进发布走独立版本和新实验，不在原实验中在线学习。

## 决策规则

常见结果有四种：主指标改善且护栏通过，考虑推广；主指标无明确变化但成本/延迟改善，按预注册非劣界判断；主指标改善但护栏失败，不能推广；证据不足，延长到预定上限或结束为不确定。

实验结束保存配置、分配、指标快照、分析代码和结论。推广仍要经过质量门禁、灰度和回滚准备；A/B 成功不证明没有罕见安全风险。

## 常见误区

- 用上线前后对比冒充 A/B，忽略流量与季节变化。
- 按消息随机，导致同一对话跨版本和记忆污染。
- 只记录成功请求的曝光，让失败从分母消失。
- 每天查看显著性并在最好看的时刻停止。
- 同时改五个组件，却宣称“新 Prompt 带来提升”。
- 用平均质量提升抵消一次严重越权或数据泄露。

## 小结

可信 Agent A/B 测试从预注册假设开始，选择匹配干扰范围的随机单位，保持粘性，完整记录分配与曝光，在共同窗口中估计效应并独立监控安全护栏。它回答方案包对真实用户的平均影响；离线评估、红队和发布门禁仍负责能力、长尾与风险验证。

## 参考资料

- [NIST：What is experimental design?](https://itl.nist.gov/div898/handbook/pri/section1/pri11.htm)
- [NIST：Completely randomized designs](https://www.itl.nist.gov/div898/handbook/pri/section3/pri331.htm)
- [NIST：How do you select an experimental design?](https://www.itl.nist.gov/div898/handbook/pri/section3/pri33.htm)
