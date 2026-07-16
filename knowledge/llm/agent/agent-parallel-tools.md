并行工具调用的核心不是“同时发出更多请求”，而是证明这些调用在当前状态上彼此独立，并为汇合、取消、超时和部分失败定义一致语义。只追求并发数，常见结果是后一步读到旧状态、相同副作用执行两次，或某个失败任务留在后台继续消耗资源。

## 先画依赖图，再谈并行

把一次执行表示为有向无环图（DAG）：节点是可验证任务，边表示数据、状态或权限依赖。只有入度为零、输入已经冻结、且不会竞争同一可变资源的节点，才进入同一批并行执行。

```ts
type ToolTask = {
  id: string;
  dependsOn: string[];
  inputHash: string;
  sideEffect: 'none' | 'idempotent' | 'non-idempotent';
  deadline: number;
  requiredEvidence: string[];
};
```

例如“读取三个独立数据源”可以 fan-out；“用检索结果生成报告”必须等待三个读取完成；“发布报告”还要等待校验和审批。依赖不只来自返回值：两个任务都修改同一文件、共享同一幂等键或争用严格限额，也应串行或经过协调器。

[LangGraph 的工作流文档](https://docs.langchain.com/oss/python/langgraph/workflows-agents)把 parallelization 与 orchestrator-worker 分开：前者适合预先可判断的独立子任务，后者适合运行时才确定的工作集合。这个区分比“是否使用 async”更重要。

![独立工具在任务 DAG 中并行执行，存在依赖的任务等待，所有结果在 Join 后校验，失败受重试预算约束](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-parallel-tools-dependency-dag-v1.webp)
*图：并行只发生在独立分支；Join、Validate 与 Retry Budget 共同定义完成语义。*

## 使用结构化并发

不要创建一组无法追踪的后台 Promise。一次 fan-out 应有共同生命周期：父任务退出前，所有子任务都已成功、失败或确认取消；失败传播和资源清理有统一规则。Python 的 [TaskGroup 文档](https://docs.python.org/3/library/asyncio-task.html#task-groups)展示了结构化并发的典型语义：首个非取消异常会取消同组其他任务，并在退出时集中抛出异常组。

```ts
async function runBatch(tasks: ToolTask[], signal: AbortSignal) {
  const settled = await Promise.allSettled(
    tasks.map(task => runTool(task, { signal, deadline: task.deadline }))
  );
  return settled.map((item, i) => normalizeResult(tasks[i], item));
}
```

`Promise.allSettled` 只是收集机制，不自动提供取消。生产实现还要把父级 AbortSignal、单任务 deadline、连接关闭和队列撤销传入工具适配层。不能取消的远端操作必须使用幂等键，并在超时后进入“结果未知”状态，而不是武断标为失败。

## Join 是一个校验器

汇合器不应只拼接文本。每个分支返回结构化结果：任务 ID、输入 hash、状态、数据、证据、错误类别、尝试次数和完成时间。Join 检查：

- 所有必需分支是否到齐，输入是否仍对应当前计划版本；
- 重复结果是否可去重，迟到结果是否应丢弃或进入下一轮；
- 数据是否满足 schema，证据是否支持声明；
- 部分成功是否允许继续，以及缺失部分如何显式标注；
- 是否出现互相矛盾的结果，需要仲裁而不是多数投票。

LangGraph 的 [Pregel 运行时](https://docs.langchain.com/oss/python/langgraph/pregel)采用 Plan、Execution、Update 三阶段：同一步选中的 actor 并行执行，写入在 Update 屏障后才对下一步可见。即使不使用该框架，这也是避免“边运行边读取半成品”的好心智模型。

## 失败策略要按任务分类

只读、可重试调用可以在抖动后的退避窗口内重试；非幂等写入不能因客户端没收到响应就盲目重发。并行批次通常选择三种策略之一：

1. **All-or-nothing**：任一必需分支失败就取消同组，适合生成发布前的严格校验。
2. **Quorum**：达到明确法定数量即可继续，适合冗余数据源，但不能把相关错误当独立投票。
3. **Best-effort**：返回成功结果并附缺失清单，适合非关键增强信息。

策略必须在执行前写进计划。运行中为“让流程通过”而从 all-or-nothing 改成 best-effort，会悄悄降低验收标准。

## 背压、公平性与预算

并行度由下游容量决定，不由模型一次生成多少调用决定。调度器按租户、工具、域名和风险级别设置 semaphore、速率限制与队列上限。等待时间也属于 deadline；任务还没拿到并发槽就已过期，应直接取消而不是启动后立刻超时。

成本预算同样要在 fan-out 前预留。若三个分支的最坏成本超过剩余额度，先缩小范围、选低成本工具或请求批准。不要启动全部调用后再丢弃昂贵结果。

## 测试与可观测性

测试使用可控工具桩模拟快慢差异、单点失败、迟到响应、取消失效、重复结果和互相矛盾的数据。重点断言：依赖节点绝不提前开始；父任务结束后没有悬挂工作；非幂等调用不被自动重放；部分成功符合声明策略；输出顺序不依赖完成时序。

Trace 至少记录 `planVersion`、`taskId`、`parentId`、依赖集合、排队/执行/汇合耗时、输入 hash、尝试次数、取消原因和 Join 结论。并行优化看的是关键路径耗时，而不是平均单调用耗时；如果 Join 总在等同一个慢分支，应优化或拆分该依赖，而不是继续增加并发。

## 小结

可靠并行是一套依赖与生命周期协议：DAG 决定谁能同时运行，结构化并发保证子任务不逃逸，Join 校验证据和版本，失败策略定义部分结果，背压与预算保护下游。只有当这些条件成立，并行才是可证明的加速，而不是放大竞态。

## 参考资料

- [LangGraph — Workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents)
- [Python — Task groups](https://docs.python.org/3/library/asyncio-task.html#task-groups)
- [LangGraph — Pregel runtime](https://docs.langchain.com/oss/python/langgraph/pregel)
