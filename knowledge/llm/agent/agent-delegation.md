任务委派把一段工作交给另一个执行者，但不会自动转移最终责任。可靠委派要回答五个问题：交付什么、不能做什么、凭什么算完成、结果如何合并、失败后谁决定下一步。缺少这些字段，所谓 delegation 只是把模糊性向下游传递。

## 委派合同

```ts
type Delegation = {
  id: string;
  objective: string;
  scope: { include: string[]; exclude: string[] };
  contextRefs: { uri: string; version: string }[];
  constraints: string[];
  deliverables: string[];
  evidenceRequired: string[];
  doneWhen: string[];
  mergeKey: string;
  owner: string;
};
```

`objective` 描述结果，`scope` 防止专家顺手扩张任务，`doneWhen` 定义验收，`evidenceRequired` 让主 Agent 能独立复核。委派前冻结 context 版本；如果底层资源会变化，规定专家何时重读。

[OpenAI orchestration 文档](https://developers.openai.com/api/docs/guides/agents/orchestration)指出 handoff 会把当前会话控制转给专家，而 manager-as-tools 中管理者仍控制最终回答。两种方式都可以称为协作，但责任链不同。本篇默认“管理者委派、管理者合并”。

![Owner 将带目标、范围、证据与完成条件的合同委派给三个 Worker，结果经过覆盖、冲突与来源审查后合并，最终责任仍归 Owner](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-delegation-responsibility-merge-v1.webp)
*图：fan-out 不等于结果自动可合并；Merge Review 是独立阶段。*

## 分解时保持 MECE，但不迷信完全独立

子任务尽量互斥、合起来覆盖目标。按数据源、领域、工件或验证维度分解都可以，但每种方式都要明确交叉区。例如一个专家研究功能，一个专家研究安全，安全结论仍可能影响功能设计；此时设置共享接口和冲突处理，而不是假装没有依赖。

可以同时执行的任务必须满足：输入快照独立、无写冲突、结果的合并规则已定义。动态工作集适合 orchestrator-worker；固定且独立的维度适合直接并行。[LangGraph 的工作流模式](https://docs.langchain.com/oss/python/langgraph/workflows-agents)把并行化和 orchestrator-worker 分开，提醒我们“同时执行”和“运行时委派”是两个不同问题。

## 责任与授权不能顺着自然语言漂移

主 Agent 拥有目标解释和最终交付责任；委派者拥有合同质量；执行者只对合同范围内的结果和证据负责；策略服务决定实际权限；用户或审批者决定高风险动作。把角色写进状态，而不是只在提示词里说“你负责”。

委派不能扩大权限。专家要发布、付款、删除或发送消息时，执行层仍校验当前主体、资源、参数和批准。若合同参数改变，旧批准失效。

## 设计可合并的结果

每个结果包含 `delegationId`、`baseVersion`、结论、证据、工件、假设、风险、未完成项和建议。相同 merge key 的结果进入 reducer：

1. 校验合同与版本；
2. 以稳定标识去重事实和工件；
3. 检查目标覆盖率；
4. 标出相互矛盾的结论；
5. 按来源、时效和适用范围仲裁；
6. 生成最终结果及 provenance map。

不要让最后返回的专家“覆盖”先前专家。对于文本，可按章节/claim ID 合并；对于代码，按工作树和 diff 合并并重新测试；对于外部状态，以权威 API 读取结果为准。

## 冲突处理

冲突可能来自事实不同、时间边界不同、假设不同或两个写入版本竞争。先把冲突结构化：`claimId`、候选值、来源、时间、置信度和影响。能由权威数据判定就重新读取；无法判定则保留不确定性或请求用户选择。

多数投票不保证正确，尤其当多个专家共享同一错误摘要或同一检索源。真正独立的复核需要不同证据路径，不能只是不同模型实例。

## 失败与重新委派

执行者返回 blocked 时，应给出阻塞类型：缺输入、缺权限、工具故障、证据不足或目标冲突。委派者据此补充合同、缩小范围、换能力匹配的专家或升级给用户。相同合同重试应复用 correlation/idempotency 标识，避免重复副作用。

主 Agent 取消目标时，向所有未完成委派发送取消；但只有执行者确认停止和外部资源清理后才能标记 cancelled。迟到结果带旧 plan version，默认不直接合入。

## 测试与指标

构造缺字段合同、范围诱导、重叠写入、冲突事实、迟到结果、专家越权、证据伪造和取消后返回等场景。断言最终每条结论都有来源，未覆盖项不会消失，冲突不会静默覆盖，高风险操作仍经过审批。

指标包括合同一次通过率、上下文大小、委派成功率、重做率、覆盖率、冲突率、合并耗时、重复工具调用、每次交付成本和最终 owner 的人工修订量。委派越多不代表系统越成熟；协调成本持续超过专业收益时，应合并职责或回到单 Agent。

## 小结

有效委派是一份可以验收和合并的责任合同。主 Agent 冻结目标与范围，执行者在最小权限内产出结构化证据，reducer 处理覆盖、去重与冲突，最终 owner 对交付负责。这样并行工作才能积累成一个可信结果，而不是二十份互不相干的回答。

## 参考资料

- [OpenAI — Orchestrating multiple agents](https://developers.openai.com/api/docs/guides/agents/orchestration)
- [LangGraph — Workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents)
