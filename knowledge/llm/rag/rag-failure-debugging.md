RAG 给出错误答案时，直接改 Prompt 往往是在最后一层猜原因。一个错误可能来自来源已过期、解析丢表头、索引版本错误、过滤过严、召回缺失、重排截断、上下文噪声或生成未引用。系统化诊断从答案症状开始，沿同一 Trace 逆向检查每个阶段。

## 先冻结可回放现场

记录：query、会话必要状态、用户权限摘要、route、source/index version、候选与分数、rerank、最终 context、Prompt/model、答案和 citation。每个对象用 ID 关联，不在普通日志泄漏全文。

```ts
type RagTrace = {
  traceId: string;
  policyDecisionId: string;
  indexVersion: string;
  route: string[];
  retrievalRunId: string;
  contextHash: string;
  promptVersion: string;
  modelVersion: string;
};
```

没有这些版本，事故复现会误用当前索引和 Prompt，得到“我这里没问题”的假结论。

![从答案症状沿 Generation、Context、Rerank、Recall、Index、Source 逐级逆向检查，Trace ID 连接回放、反事实实验和责任归属](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/rag-failure-debugging-stage-funnel-v1.webp)
*图：最终答案是症状，不是默认根因；示例 Root Cause 可以落在任一阶段。*

## Stage 1：Generation

把最终 context 作为固定输入重放：正确答案是否已经清楚存在？模型是否遗漏、误算、混合来源或忽略引用约束？检查 claim → citation 映射、数值/单位、否定和超出证据的声明。

反事实：用确定性 extractive answer、不同 Prompt 或人工只读 context 回答。若 context 完整而多个生成器都失败，问题偏向生成/Prompt；若人也找不到答案，继续向前。

## Stage 2：Context Assembly

检查进入 Prompt 的最终证据：gold chunk 是否被 token 截断、压缩是否删限定词、同文档重复是否挤掉其他来源、标题/表头是否丢失、顺序是否错误。

反事实：强制插入 gold evidence，保持生成配置不变。答案恢复说明装配或上游选择有问题；仍不恢复再看 generation。

## Stage 3：Rerank

gold evidence 是否在候选中但被重排到截断线以下？保存 reranker 版本、输入文本、候选位置、分数与 top-n。分数不是正确概率，模型升级后阈值可能漂移。

反事实：跳过 rerank、扩大 top-n、把 gold candidate 放第一。若恢复，检查截断、query-document 拼接、长文本尾部、语言和切片。不要在 gold 根本没召回时继续调 rerank。

## Stage 4：Recall

检查原 query、rewrite/multi-query、关键词/向量列表、metadata filter、ACL 和 top-k。相关文档是否进入任何候选？过滤是否错误删除？Query drift 是否丢掉实体或否定？

反事实：使用 gold query、去除非授权之外的可选 filter、分别跑 BM25/向量。注意：绝不为了诊断绕过 ACL；在隔离评测环境用合成权限复现。

## Stage 5：Index

确认目标 source/chunk 是否存在、embedding/关键词字段正确、indexVersion 与 alias 是否匹配、更新/删除是否传播、缓存是否返回旧版本。查 chunk ID、sourceVersion、parser/chunk/model 版本和 freshness watermark。

反事实：直接按 ID 读取、在新旧索引分别查询、重算单条 embedding。若源数据存在但索引无记录，定位 ingestion；若记录存在但不可搜索，检查 mapping、向量维度和过滤字段。

## Stage 6：Source 与 Parser

回到原文确认事实是否存在且当前有效。检查 Loader 下载的版本、解析出的文本/表格/页码、OCR 置信度、ACL 和删除状态。解析器“成功”但空文本或阅读顺序错误，是常见静默失败。

反事实：人工查看原文件、换 parser、对特定页 OCR、对比 source checksum。事实本来不在语料时，正确修复是补数据或 abstain，不是让 Prompt 鼓励模型猜。

## OpenTelemetry 如何连接阶段

[OpenTelemetry Signals](https://opentelemetry.io/docs/concepts/signals/)将 traces、metrics、logs 等作为观察系统活动的不同信号；trace 描述请求路径。[Context Propagation](https://opentelemetry.io/docs/concepts/context-propagation/)让跨服务信号保持因果关联。

为 RAG 定义 stage spans：route、retrieve、rerank、assemble、generate，附版本、候选计数、token 和状态码。敏感 query/evidence 不作为默认属性；用受控链接访问原始调试包。

## Counterfactual Matrix

一次只改变一个变量：

| 实验 | 固定 | 替换 | 说明 |
| --- | --- | --- | --- |
| Gold context | 模型/Prompt | context | 生成还是检索 |
| Gold candidate | reranker | 候选集 | 召回还是重排 |
| No rerank | 召回/context budget | 排名 | 重排增益/退化 |
| Old index | query/Prompt | indexVersion | 数据/模型版本 |
| Alternate parser | 原文件 | parser | 解析根因 |

不要同时换模型、Prompt、索引和 top-k，否则即使恢复也不知道哪项有效。

[RAGAS](https://arxiv.org/abs/2309.15217)把 RAG 评估拆成检索上下文、上下文忠实使用和答案质量等维度；这类分层指标适合与反事实矩阵配合，用于缩小故障阶段，而不是把单一总分当作根因结论。

## 症状到优先检查

- “引用不存在”：citation resolver、context span、source deletion；
- “答案旧”：alias/cache/index watermark、source version；
- “只在某租户失败”：ACL/filter/schema、租户索引；
- “多语言失败”：query rewrite、embedding/rerank 语言；
- “数字错列”：table parser、header/context assembly；
- “偶发超时”：queue、慢分支、retry amplification；
- “流畅但无依据”：context 为空、generation abstain/grounding。

## 事故与责任闭环

每个 stage 有 owner 与 runbook：数据源、ingestion、retrieval、ranking、generation/platform。Trace 自动把异常路由给最可能 stage，但最终根因以反事实证据确认。

事故报告包含影响、版本、时间线、根因、临时缓解、永久修复、回归 case 和监控。把真实失败脱敏后加入 Golden Set，确保同类问题不再发生。

## 小结

RAG 调试是一条逆向证据链：先冻结可回放 trace，从 generation 回看 context、rerank、recall、index 和 source；每层做单变量反事实实验。可观测性连接版本与阶段，Golden Set 固化事故，团队才能从“调 Prompt 试试”转向可验证的根因修复。

## 参考资料

- [OpenTelemetry — Signals](https://opentelemetry.io/docs/concepts/signals/)
- [OpenTelemetry — Context propagation](https://opentelemetry.io/docs/concepts/context-propagation/)
- [Es et al. — RAGAS](https://arxiv.org/abs/2309.15217)
