RAG 改了 chunk、embedding、top-k 或 Prompt 后，“随机问几个问题感觉不错”无法证明没有退化。测试体系要把确定性单元、检索组件、版本化 Golden Set、端到端答案和线上监控分层连接，并让代表性、困难与对抗切片贯穿每一层。

## Golden Set 是版本化数据产品

每条样本至少包含：

```ts
type GoldenCase = {
  caseId: string;
  question: string;
  conversation?: string[];
  constraints: Record<string, string>;
  relevantEvidence: Array<{ sourceId: string; spanId?: string }>;
  expectedAnswer?: string;
  rubric: string[];
  slice: string[];
  sourceSnapshot: string;
  reviewedAt: string;
};
```

问题、gold docs、gold answer 和来源快照一起版本化。语料更新后，旧题可能不再有唯一答案；不要直接覆盖标签，创建新 dataset version 并保留变更原因。

![单元、组件、Golden Set、端到端与线上监控组成测试金字塔，数据切片贯穿各层，漂移经复核后更新下一版本](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/rag-testing-golden-set-pyramid-v1.webp)
*图：线上监控不会直接写入当前冻结的 Golden Set；Drift Refresh 经复核产生新版本。*

## 样本来源与切片

Golden Set 综合：真实匿名化问题、领域专家编写、历史事故、系统性组合和受控合成。每条记录来源与授权；生产日志先脱敏，不能把秘密或个人数据复制进测试仓库。

三类切片：

- Representative：覆盖真实流量意图与比例；
- Hard：多跳、长文、表格、否定、冲突、低频实体；
- Adversarial：Prompt injection、越权、错误前提、无答案、近重复旧版。

随机切分要按 source 或时间隔离，避免同一文档的相似题同时进入调参与测试。最终 holdout 在发布前才运行。

## 单元测试：确定性契约

不调用模型也能测：规范化、chunk ID、metadata filter、ACL、引用 span、缓存键、删除传播和 JSON schema。固定小文档作为 fixture，断言分块边界与血缘。

模型输出解析器使用录制响应测试成功、缺字段、无效 JSON、重复工具调用和错误分类。随机性不应成为跳过契约测试的理由。

## 组件测试：分开测召回和排名

Retriever 使用 Recall@K、Precision@K；reranker 使用 MRR、nDCG；路由器测 route accuracy 与 abstain。固定查询和索引快照，保存候选与分数分布。

[RAGAS 论文](https://arxiv.org/abs/2309.15217)强调 RAG 评测有多个维度：检索是否找到相关且聚焦的 context、模型是否忠实利用 context，以及生成质量。把它们压成一个总分，会失去诊断价值。

自动 judge 可以扩大覆盖，但需要用人工标注校准，记录 judge model/Prompt，并检查位置偏见和自家模型偏好。

## 端到端：答案与引用一起评

答案正确但引用错误，不合格；引用正确但未回答任务，也不合格。Rubric 包含：事实/数值、完整性、忠实度、引用覆盖、无依据声明、格式与任务完成。

对无答案题，正确行为是说明证据不足，而非“最接近”的回答。权限题还要断言不可见文档没有进入候选、Prompt 或 trace。

端到端保存完整可回放包：query、route、indexVersion、候选、rerank、context、Prompt/模型版本和答案。敏感内容按权限存储。

## 统计比较，不看单次波动

对每个 case 记录旧/新系统配对结果，计算差异和置信区间；按 slice 看退化。可用 bootstrap 估计指标差异，不只比较第三位小数。

模型生成有随机性时，关键样本多次运行，报告成功率和方差。为了可复现，固定温度、模型 snapshot 和外部工具 fixture；真正需要探索随机性的测试另建套件。

## Release Gate

门禁可组合硬约束与统计约束：

- ACL/泄露/删除残留必须为零；
- 关键切片 Recall@K 不低于基线；
- 答案与引用质量达到阈值；
- 无答案/abstain 不退化；
- p95 延迟、成本、错误率在预算内。

失败时输出受影响 case、stage 和版本差异，不允许只用总体平均“抵消”安全或关键业务退化。

## 线上监控与漂移刷新

线上没有完整 gold label，监控 proxy：零结果、低分、fallback、abstain、用户纠正、引用点击、人工升级、延迟和成本。采样人工评审，发现新意图与数据漂移。

线上样本进入候选池，先脱敏、去重、补来源快照和专家标签，再进入 Golden Set 的下一版本。当前测试集保持冻结，防止用生产反馈不断改题导致指标不可比。

[NIST AI TEVV](https://www.nist.gov/ai-test-evaluation-validation-and-verification-tevv)强调可信 AI 依赖可靠测量、评估方法与标准实践；对应到 RAG，就是部署前评测与部署后持续验证形成闭环。

## 常见误区

- 只有 gold answer，没有 gold evidence；
- 用合成题取代真实流量切片；
- 调参和最终测试使用同一集合；
- 只看端到端 judge，无法定位召回或生成；
- 线上流量自动写入当前 Golden Set；
- 只看平均值，忽略越权、否定和多跳切片；
- 模型/judge 升级但 dataset report 不记版本。

## 小结

RAG 测试是一座金字塔：底层确定性契约保证数据与权限，中层分别测召回、排名和路由，版本化 Golden Set 驱动端到端答案与引用回归，线上监控发现漂移，再经复核形成下一版数据。发布决策必须按关键切片、统计差异和风险硬门禁共同做出。

## 参考资料

- [Es et al. — RAGAS](https://arxiv.org/abs/2309.15217)
- [NIST — AI Test, Evaluation, Validation and Verification](https://www.nist.gov/ai-test-evaluation-validation-and-verification-tevv)
