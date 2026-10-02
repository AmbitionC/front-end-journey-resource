多 Agent 的价值来自可验证的分工：不同执行者各自持有任务上下文、调用工具、返回证据，再由协调者合并。增加角色或层级本身不保证效果。读完本文，应能回答“这项工作为何需要独立 Agent，哪些步骤用普通代码更合适”，并设计能证明这一选择的对比实验。

## 从一个数据异常归因任务开始

假设用户问：“店铺 A 在 2026 年 10 月 1 日支付金额下降，查原因，只读分析，不改业务配置。”系统已有订单、流量和支付错误三类查询工具。所有方案都要使用同一数据快照、租户 A 的权限范围和相同截止时间，输出有证据的原因及无法确认之处。

朴素方案是一个 Agent：接收问题，查询三类数据，发现支付错误异常后追查具体渠道，形成报告。这是有效基线。**单 Agent 不等于串行工具调用**：模型可以在同一轮提出多个独立调用，运行时也可以并发执行；有数据依赖的调用仍须等待前置结果。OpenAI 的 [Function calling 文档](https://developers.openai.com/api/docs/guides/function-calling#parallel-function-calling)说明了多调用模式及支持范围（滚动文档，核验于 2026-10-02）。并行执行工具与多个 Agent 分别进行多轮探索，是两个设计维度。

只有当某个分支需要反复观察、改查询、消化大量局部证据时，独立上下文才可能带来额外价值。例如流量分支先按来源拆分，再追踪活动结束；支付分支先按渠道拆分，再查看失败码。两者暂时互不依赖，可以各自探索后汇总。[Anthropic 的研究系统经验](https://www.anthropic.com/engineering/multi-agent-research-system)解释了这种独立上下文与结果压缩的作用，也指出高依赖、需要共享大量上下文的任务不一定适合多 Agent；其研究产品经验不能当成所有业务的收益保证。

## 最小两级系统怎样跑完一次任务

这里的两级是“主 Agent → 专项 Agent”，层级按决策关系计数，工具和确定性校验器不自动算成 Agent。Agent 是能够根据工具反馈继续决定动作的执行循环；固定 SQL、类型检查或结果合并函数是程序步骤。

主 Agent 持有用户目标和全局进度。它提出流量与支付两个子任务；运行时校验任务契约、权限与预算后，才创建独立执行会话。流量 Agent 收到店铺、时间窗口、指标定义、数据快照和输出格式；它请求查询，运行时检查参数并执行，外部系统返回聚合结果。流量 Agent 据此决定下一次查询，最终交回“观察、假设、证据引用、未完成项”。支付 Agent 按相同契约完成另一分支。

主 Agent 收到结果后不能把两段自然语言直接拼成结论。它先检查是否在同一时间窗口和口径上比较；若支付分支说“退款增加”，但原始指标是“支付金额”，还要确认退款是否影响该指标。缺证据的结论退回补查，无法补齐则保留不确定性。最后由运行时检查引用、禁止写操作等不变量，再返回报告。

下面的图适合观察“契约进入独立探索，证据回到汇总，再经过校验”的方向。横向 PARALLEL 虚线表示可并行，不能据此假设 worker 必须互发消息；存储节点负责保存状态，权限仍由运行时校验。

![主智能体派发任务契约给三个专项智能体，各自返回证据后汇总和校验；共享存储与并行关系需要显式规则](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/multi-agent-orchestrator-worker-tradeoffs-v1.webp)
*图：模型提出分工和查询，运行时决定能否执行；只有带来源的结果才进入汇总。图中三个专项节点是结构示意，不规定本例必须用三个。*

## 为什么“三级职责清晰”还不足以证明必要

可以把两级扩展成“主 Agent → 领域负责人 → 执行 Agent”。支付负责人分配银行、钱包等执行分支。这增加一次决策与一次交接，也增加信息压缩、等待和错误传播的机会。

先问中间层是否会做真正的动态决策。如果支付分析每次都固定查三张表、按相同规则合并，那么函数或任务图已经能表达这个流程；让一个 LLM 再复述规则未必有价值。如果不同异常会临时引入不同分支，负责人需要根据局部证据修改计划，且主 Agent 无须读完整支付日志，中间层才有待验证的理由。[Building effective agents 的 Orchestrator-workers 小节](https://www.anthropic.com/engineering/building-effective-agents#workflow-orchestrator-workers)区分了预定义并行与动态拆分；这里的三级选择是基于该区别的工程推论，并非文档推荐的固定层数。

用相同输入和约束比较以下方案，才知道收益来自哪里：

| 方案 | 谁决定下一步 | 要检验的原因 |
| --- | --- | --- |
| 单 Agent + 并行工具 | 一个模型循环；运行时并发独立查询 | 原问题是否本来就能由一个上下文解决 |
| 确定性编排 + 专项调用 | 程序固定分支和合并规则 | 分工、并行是否已经够用，是否需要动态编排 |
| 两级 Agent | 主 Agent 动态派发，专项 Agent 自主探索 | 独立上下文和局部探索是否改善任务成功 |
| 三级 Agent | 中间负责人再动态拆分与收敛 | 多一次决策是否减少主 Agent 负担并弥补交接成本 |

预算要计入所有 Agent 的 token、工具调用、重试和汇总，不能给三级方案更多资源后把收益全归因于层级。先在同模型与同总预算下做比较，再报告各方案达到目标质量需要的资源。按相同用例配对、多次运行，观察结论正确、证据完整、约束遵守、耗时和总成本，并单列复杂支付切片。另做“拿掉中间负责人、保留执行分支”的消融；如果效果不退化，就没有证据支持保留该层。

这些是实验设计，不是本文完成的性能实验。相同数据并不保证相同轨迹，因此还要报告失败样本与波动，不能以一次更快或一句“角色更专业”作为结论。

## 主子上下文怎样避免丢字段和串状态

任务契约最好把机器必须使用的字段与可压缩解释分开。以下是应用层数据示意，未在完整 Agent 环境运行：

```json
{
  "task_id": "pay-analysis-1",
  "parent_task_id": "shop-a-1",
  "tenant_id": "A",
  "snapshot_id": "snapshot-42",
  "time_window": {"start": "2026-10-01T00:00:00Z", "end": "2026-10-02T00:00:00Z"},
  "metric": "paid_amount_before_refund",
  "allowed_actions": ["read"],
  "question": "解释支付金额下降",
  "required_output": ["observations", "evidence_ids", "uncertainties"]
}
```

主 Agent 的摘要只写“查支付下降”，很容易丢掉退款口径、快照版本或只读约束。运行时应检查必填字段、字段值和证据是否可访问，子 Agent 也应在开始前确认口径；缺关键字段时退回补齐，不能猜。JSON Schema 可以限制结构，却不能证明“paid_amount”与用户要的业务含义一致。

独立 session 隔离对话历史，业务隔离还涉及租户数据、缓存键、工作目录、存储命名空间、工具凭证和日志。两个 Agent 使用不同 session ID，却写同一个 `result.json` 或复用跨租户缓存，仍会串状态。只读证据可以共享；可变任务状态宜有明确所有者。worker 返回带任务 ID、快照和版本的结果，由父运行时校验后合并；重复回报按幂等键去重，旧版本不得覆盖新结论。

更多摘要丢字段和迟到覆盖的处理见[会话摘要与证据保真](./agent-memory-summarization.md)。

## 协作范式与终止条件

点对点对话适合两个执行者交换局部问题，但也可能反复讨论而无进展；中央调度适合本例按任务 ID 汇总；固定阶段流水线适合输入输出可预测的流程；状态图适合显式分支、重试和恢复。框架名称不是选型依据，要看它能否表达所需状态、依赖和恢复语义。

多一个评审 Agent 也不自动带来独立验证。如果它只读上游结论，可能重复相同误解；应提供原始证据和独立判据。最大步数、递归深度、每任务超时、总预算和显式完成条件分别限制不同问题。达到上限时返回已确认事实、未完成项和阻断原因；循环计数器只能止损，不能证明任务完成。

本例若每一步都依赖上一条查询，且任务必须在很短延迟内返回，额外交接会成为负担，应优先单体或固定流程。如果新增领域负责人能在大量局部日志中独立决定分支，且受控评测显示同预算下改善任务成功，三级才有保留依据。子任务模型大小也要按切片验证，不能默认“子 Agent 用小模型一定划算”。

## 面试口述短答

“我不会因为三级职责清晰就采用三级。先用能并行工具的单 Agent 和确定性编排做基线；专项 Agent 的理由是独立多轮探索和上下文隔离，中间负责人的理由是证据驱动的动态拆分。所有层都用契约传目标、权限、版本和证据，在同总预算下消融中间层，看任务成功和交接错误。固定流程或强依赖任务没有足够收益时，我会减少层级。”

## 教学补充：改变条件的模拟追问

以下是教学模拟，不代表原面经逐字提问。

1. **三个分支每次查询都固定，只需并行，为什么不让主 Agent 再动态分工？** 要点：确定性编排能保留并行和专用提示，减少不必要决策；只有输入改变导致分支无法预定时再测动态编排。对应“三级必要性”。
2. **三级正确率提高了，但 token 也增加了一倍，能证明层级有效吗？** 要点：先做同总预算对比及拿掉中间层消融；另外报告达到同质量的资源需求，区分多花资源与架构收益。
3. **两个独立 session 的 worker 都更新共享结论，先回来的新证据被旧结果覆盖，怎样修？** 要点：给共享状态设所有者，结果携带版本与快照，运行时做冲突检查和幂等合并；session 隔离不能替代状态一致性。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 AI 全栈开发一面（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-13.md)（cluster-0cfd17469543）
- [小红书 Agent 开发二面：结论正确性、安全边界与本地云端扩展（2026 年 8 月）](../../../interview/redbook/ai/redbook-ai-3.md)（cluster-137857a2ba05）
- [拼多多 AI Agent 岗两轮技术面：RAG、多 Agent 与系统能力（2026 年 8 月）](../../../interview/pinduoduo/ai/pinduoduo-ai-1.md)（cluster-16e49722e8d7）
- [腾讯 TEG 后端一面：RAG 多智能体与分布式 LRU（2026 年 8 月）](../../../interview/tencent/ai/tencent-ai-6.md)（cluster-27070393eae6）
- [腾讯 AI 应用开发面试：跨会话记忆与多 Agent（2026 年 4 月）](../../../interview/tencent/ai/tencent-ai-4.md)（cluster-2fc69bb3d45d）
- [快手商业化效果营销一面：多 Agent 协作、Netty 与限流（2026 年 8 月）](../../../interview/kuaishou/ai/kuaishou-ai-4.md)（cluster-45d2fa7cdacd）
- [OPPO AI 全栈一面：Prompt 到 UI、RAG 与前端性能（2026 年 8 月）](../../../interview/oppo/ai/oppo-ai-2.md)（cluster-4a37152b165a）
- [字节大模型应用开发一面：Agent、RAG 与可靠性（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-16.md)（cluster-605f9ab081a6）
- [字节 Agent 开发一面：上下文工程、协作与编程基础（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-19.md)（cluster-650f7c304b11）
- [小红书 Agent 开发一面：多智能体、Memory 与广告投放优化（2026 年 8 月）](../../../interview/redbook/ai/redbook-ai-1.md)（cluster-7372c3e7fb1e）
- [蚂蚁 AI 开发一面：协作式 Agent、交付门禁与后端基础（2026 年 8 月）](../../../interview/antfin/ai/antfin-ai-4.md)（cluster-910d0b20a897）
- [字节 AI 应用开发一面（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-12.md)（cluster-9e24453f3753）
- [蚂蚁 Agent 开发一面：多 Agent 并发与质量保障（2026 年 4 月）](../../../interview/antfin/ai/antfin-ai-1.md)（cluster-cc9e5dd82505）
<!-- interview-source-history:end -->

## 参考资料

- [Anthropic — Building effective agents，工作流与动态 Agent 的区别](https://www.anthropic.com/engineering/building-effective-agents)（2024-12-19；架构相关小节核验于 2026-10-02）。
- [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)（2025-06-13；核验于 2026-10-02；产品经验不等于本业务基准）。
- [OpenAI — Function calling：执行循环与并行调用](https://developers.openai.com/api/docs/guides/function-calling)（滚动文档，核验于 2026-10-02）。
