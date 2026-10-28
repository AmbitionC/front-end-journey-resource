用户的一句话往往同时缺少目标、对象、约束或授权范围。意图澄清不是把问题“问得更长”，而是先判断当前信息能否支撑一个可验证、可撤销且安全的下一步；不能时，用最小问题把不确定性降到可行动的程度。

![意图树将用户输入拆为目标、对象、约束和授权；高置信度路径直接执行，低置信度或高风险路径进入澄清与确认，再进入路由和评估](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-intent-clarification-routing-v1.svg)
*图：置信度只决定“是否值得继续问”，风险与授权范围共同决定“是否允许执行”。*

## 概览：先决定能不能行动

把一次输入写成四元组会更容易发现缺口：`intent = (goal, subject, constraints, authority)`。例如“把上周的异常订单处理掉”至少存在三种解释：导出清单、标记异常，或实际退款；它们的副作用和所需权限不同。

澄清的目标不是预测到唯一正确标签，而是把系统从“多种行动都看似合理”推进到“某一类下一步有足够证据且通过策略”。可只读的低风险检索可以先做；发送消息、修改数据、付款等副作用动作则要更高的证据和明确确认。

## 核心模型：意图树、置信度与风险分开看

将请求解析为一棵从粗到细的意图树：

1. **域和任务类型**：查询、创建、修改、审批、排障等；
2. **槽位（slots）**：对象、时间范围、筛选条件、输出格式和成功标准；
3. **行动计划**：候选工具、参数、是否有副作用；
4. **策略结果**：当前身份是否有权限，是否需要审批或二次确认。

模型可以为每个候选意图给出分数，但该分数不是事实概率，也不能单独授权操作。工程上最好把它当成排序信号，再组合确定性规则：缺少必填槽位、候选差距很小、输入自相矛盾、涉及敏感资源、或动作不可逆，都应提高澄清或确认级别。

可以把决策写成：

```text
clarify = !completeSlots || marginTooSmall || confidence < threshold
escalate = !policyAllows || irreversibleHighRisk
confirm = !clarify && !escalate && sideEffect && !confirmed
execute = !clarify && !escalate && (!sideEffect || confirmed)
```

四个分支应按“策略阻断 → 信息澄清 → 副作用确认 → 执行”的优先级求值，避免一个有副作用的请求同时命中确认和执行。`marginTooSmall` 比“第一名分数高不高”更有用：两个候选任务都像时，系统知道自己处在分叉处。OpenAI Agents SDK 将工具调用、handoff、guardrail 等事件放在可追踪的运行记录中；同样地，应用应记录自己的候选、缺槽、策略决定与最终路由，而非只保存一段解释文本。[Tracing 文档](https://openai.github.io/openai-agents-python/tracing/)说明了 trace/span 的端到端工作流结构。

## 实现方法：最小澄清循环

### 1. 先提取，再验证

先让模型输出受 JSON Schema 约束的候选结构，字段包括 `intent`、`slots`、`missingSlots`、`alternatives` 和 `confidence`。随后由服务端校验枚举、时间格式、资源存在性和权限；不要把模型生成的工具名、账号或过滤条件直接当可信参数。

```ts
type Interpretation = {
  intent: 'search_orders' | 'export_orders' | 'refund_orders';
  slots: { timeRange?: string; orderIds?: string[]; amountLimit?: number };
  missingSlots: string[];
  confidence: number;
  alternatives: Array<{ intent: string; score: number }>;
};

function nextStep(
  x: Interpretation,
  risk: 'read' | 'write' | 'money',
  policyAllows: boolean,
  confirmed = false,
) {
  // 比较当前选定意图与最强备选；若备选更高，margin 为负，必须澄清。
  const bestAlternative = Math.max(0, ...x.alternatives.map(item => item.score));
  const margin = x.confidence - bestAlternative;

  if (!policyAllows) return { kind: 'escalate', reason: 'policy_denied' };
  if (x.missingSlots.length) return { kind: 'clarify', field: x.missingSlots[0] };
  if (x.confidence < 0.75 || margin < 0.15) {
    return { kind: 'clarify', field: 'intent', alternatives: x.alternatives };
  }
  if (risk !== 'read' && !confirmed) return { kind: 'confirm', preview: x.slots };
  return { kind: 'route', intent: x.intent };
}
```

示例中的 `0.75` 和 `0.15` 仅演示分支，不是通用生产阈值；应按标注集、风险和错误成本校准后配置。输入分数还需先校验为有限且合法的数值。若当前候选分数为 0.80、备选为 0.99，差值是 -0.19，应返回澄清，不能先排序后只看两个最高分的绝对差。

### 2. 一次只问能改变决策的问题

高质量问题应消除一个明确分叉，并给出用户易懂的选项：

> 你想先导出上周异常订单供核对，还是要对已确认的订单发起退款？

不要问“请详细说明”。若系统已知对象而只缺时间范围，就询问时间范围；若有默认值，说明默认值并允许修改。把已确认信息回显，避免用户重复输入，也避免在多轮中悄悄改变含义。

### 3. 确认与执行必须是两步

对有副作用的行动，确认页应展示将要影响的对象、数量、关键参数与可撤销性。确认的是**具体计划**，不是“你确定吗”的空壳。执行后写入操作回执；失败、超时或部分成功都应如实返回，不能用模型的自然语言总结替代系统事实。

### 4. 用离线集与线上 trace 评估

构造带有期望路由、必填槽位、风险等级和允许澄清问题的用例集。分别度量：路由准确率、槽位完整率、无谓澄清率、澄清后成功率、错误执行率、确认绕过率和用户放弃率。SDK 的测试工具支持用固定模型步骤检查编排、工具、handoff、guardrail 和重试等应用拥有的行为；模型本身仍应在代表性样本上单独评测。[Testing 文档](https://openai.github.io/openai-agents-python/testing/)对此边界有明确说明。

## 一句话含多个意图时不要只取最高分

“查明天的天气，并按预算推荐出行方式”包含请求集合，还可能存在结果依赖。先为每个意图保存目标、槽位、成功条件与所需权限，确认是同时要做，还是相互竞争的解释。前者拆成多个明确任务，后者需要澄清，不能混作一个分类置信度问题。

相互独立且被授权的只读分支可受控并行；依赖天气结果的推荐等待对应证据。写入或下单逐项核对参数和已有授权，模型生成了标签不等于用户批准全部副作用。汇总时列出各分支完成、失败、取消和待澄清状态；一项失败是否终止其他分支由业务合同决定，不用一个“整体成功”掩盖部分失败。

保存意图集合及依赖图版本，用户改需求时撤销过期计划并对已发生动作对账。这是把前述澄清与策略模型扩展到请求集合的工程方法，应以多意图、冲突约束、重复动作和取消场景评测。

## 失败边界：不确定时不要伪装确定

- **置信度校准失真**：模型说“很确定”不等于正确。用分桶校准图和按任务类型的错误样本调阈值，不把单一全局阈值用于所有动作。
- **澄清循环**：连续两次没有减少缺槽，或用户回答仍与原问题冲突时，给出可选路径、转人工或允许安全退出；设置轮数预算。
- **隐式授权扩大**：用户要求“处理”并不等于允许删除、付款或对外发送。授权必须由策略和明确确认判断。
- **提示注入与脏上下文**：从文件、网页或工具结果读到的文字是数据，不得覆盖系统策略、权限或确认要求。
- **隐私泄露**：trace 对调试很重要，但输入、工具参数和输出可能含敏感数据。按字段脱敏、限制保留期和访问者；SDK 也提醒生成与函数调用 span 可能捕获敏感数据。[敏感 trace 数据说明](https://openai.github.io/openai-agents-python/tracing/)。

## 面试追问

1. **何时直接执行，何时澄清？** 说明信息完整性、候选间隔、动作风险、策略授权四个维度；只读检索和退款不能共用阈值。
2. **怎样避免澄清降低转化？** 用“一个分叉、一个问题”，从已有上下文填槽，记录无效问题并用样本回归测试。
3. **如何证明系统没有误执行？** 展示意图—计划—确认—回执的审计链，并以错误执行率和确认绕过率作为硬指标。
4. **如果分类器和 LLM 分歧？** 两者都只是候选证据；将分歧路由到澄清或低风险只读路径，而不是盲从任一模型。

## 小结

意图澄清的可靠实现是一个受策略约束的决策过程：先把目标与槽位显式化，再用置信度和候选差距决定是否提问，用风险与权限决定是否确认，最后用可追踪证据评估。系统真正要优化的不是“少问一句”，而是在不误执行的前提下尽快得到可行动的信息。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [网易云全栈一面：评估闭环、异步任务与数据查询](../../../interview/netease/fullstack/netease-fullstack-1.md)
- [字节全栈：多智能体导购、客户端与系统评测](../../../interview/bytedance/base/bytedance-base-43.md)
- [字节 Agent 后端实习一面：LangGraph、评测集与混合检索](../../../interview/bytedance/base/bytedance-base-22.md)
- [快手 AI 应用开发一面：意图澄清、评测与 MCP 故障处理](../../../interview/kuaishou/ai/kuaishou-ai-3.md)
<!-- interview-source-history:end -->

## 参考资料

- [OpenAI Agents SDK：Tracing](https://openai.github.io/openai-agents-python/tracing/)
- [OpenAI Agents SDK：Running agents](https://openai.github.io/openai-agents-python/running_agents/)
- [OpenAI Agents SDK：Testing](https://openai.github.io/openai-agents-python/testing/)
