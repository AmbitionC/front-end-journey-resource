调试 Agent 的核心不是“多打印几行”，而是把一次失败变成可比较的实验：先冻结当时的输入、版本、状态和外部观察，再在隔离环境重放，比较 Trace，形成最小修复，最后把失败固化成回归用例。跳过证据冻结，直接改 Prompt，往往只是在追逐随机波动。

[NIST 的 AI TEVV 工作](https://www.nist.gov/ai-test-evaluation-validation-and-verification-tevv)强调，可靠测量需要定义任务、挑战问题、测试床、数据集和方法局限。Agent 调试也遵循同一原则：没有可描述的失败条件和受控测试环境，就不能判断修复是否真的改变了原因。

![Agent 失败从证据冻结、沙箱重放到回归测试的调试闭环](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-debugging-reproduction-loop-v1.webp)

图中的顺序不能倒置：Capture Failure 之后先 Freeze Inputs 与 Pin Versions，然后才 Replay。若修复前后使用了不同模型别名、工具 Schema 或知识索引，即使输出变好，也无法归因给这次修改。

## 第一步：定义“失败”

失败不应只是一张截图或一句“回答不对”。先把它转成可观察断言：

- 任务结果：发票状态应为 `approved`，实际为 `rejected`；
- 工具行为：不应调用写工具，实际执行了 `invoice.update`；
- 数据边界：不应读取其他租户对象，Trace 显示了越界查询；
- 体验约束：首个可见输出应在 2 秒内，实际 p95 为 8 秒；
- 可靠性：取消后不得继续副作用，实际后台任务仍发送了邮件。

一个失败可以同时包含技术错误、质量错误和安全错误。分类的目的不是贴标签，而是决定证据、负责人和修复验证方式。模型 HTTP 200 但事实错误属于质量失败；工具超时后补偿成功属于已恢复的技术失败；越权尝试即使被拦截，也是一条安全事件。

## 第二步：冻结复现快照

最小快照至少包含：

```yaml
run_id: run_01J...
captured_at: 2026-07-16T12:03:04Z
user_input_ref: evidence://case/381/input
system_prompt_digest: sha256:...
model:
  provider: example
  immutable_version: model-2026-07-01
  parameters: {temperature: 0, top_p: 1}
tools:
  registry_digest: sha256:...
  schemas: [invoice.lookup@3, invoice.update@5]
data:
  index_snapshot: kb-2026-07-15-02
state_snapshot: state://run_01J...
policy_version: policy-41
clock: "2026-07-16T12:03:04Z"
random_seed: 1977
trace_id: 4bf92f...
```

不要把敏感原文直接塞进调试工单。快照使用受权限控制的证据引用、内容摘要和分类；重放者必须具备访问授权并留下审计记录。密钥永不快照，外部凭证使用测试环境重新签发。

版本要尽量不可变。`latest`、`default`、`production`等别名只记录路由意图，不能证明当时实际使用了什么。模型、Prompt、工具 Schema、策略、索引、代码镜像和依赖锁文件都需要可追溯的版本或摘要。

## 第三步：从 Trace 还原因果链

[W3C Trace Context](https://www.w3.org/TR/trace-context/)提供跨组件传播 Trace ID 的标准机制。调查时先从 Run 找到 Trace，再检查父子 Span、时间重叠、重试与异步 Link：哪个决策产生工具调用，工具结果是否到达，重试是否复用了幂等键，取消信号在哪个边界丢失。

不要只按日志到达顺序推理。异步队列、批处理和网络抖动会让 observed time 与 occurred time 不同。Trace 父子关系、消息 ID、事件序号和业务状态版本一起使用，才能区分“数据晚到”和“状态真的倒退”。

一个高效的比较表可以按 Span 对齐：

```text
phase              failed run          replay run
planner.decide     write_tool          read_tool
retrieval.search   snapshot A          snapshot A
model.generate     model v17           model v17
policy.authorize   policy-41 allow     policy-41 deny
tool.execute       update@5            not executed
```

差异从上游向下游解释。若最早差异在 `planner.decide`，后面的工具差异是结果；若计划相同而策略结果不同，应检查输入属性、策略数据或时间条件，而不是先改 Prompt。

## 第四步：在沙箱重放

重放必须隔离副作用：写 API 指向模拟服务或影子数据库，邮件和支付进入捕获器，浏览器只访问测试站点，网络出口默认拒绝。否则“复现一次”可能再次删除数据或通知真实用户。

沙箱应支持三种外部依赖模式：

1. **记录回放**：返回失败发生时捕获的响应，适合确定因果；
2. **契约模拟**：按 Schema 生成成功、超时、限流和错误，适合覆盖边界；
3. **真实测试依赖**：验证集成，但输出可能随数据和时间变化。

先使用记录回放建立稳定复现，再逐步切换真实依赖。若一开始就调用线上实时搜索，无法区分代码修复与世界变化。

## 非确定性怎么处理

固定随机种子与 temperature 可以降低变异，但不能保证所有模型、硬件和服务完全确定。正确做法不是承诺逐字输出，而是定义结构与行为不变量：是否选择正确工具、参数是否满足 Schema、引用是否支持论断、后置条件是否成立、安全规则是否通过。

对概率性失败运行多次，报告通过率和置信范围，并保存失败样本。若 100 次中失败 3 次，单次重放成功不能证明问题消失。修复前后应在相同样本、次数和执行器上比较。

## 第五步：最小化失败案例

真实 Run 上下文很长，直接围绕完整对话修复容易过拟合。可以做 delta debugging：逐步移除无关历史、检索文档、工具和消息，只要失败仍发生就保留简化。最终得到“最小触发输入 + 必要状态 + 期望断言”。

最小化时保持语义而非只删字符。间接注入可能依赖文档来源标签丢失；并发错误可能依赖两个工具的时序；身份问题可能依赖 subject/actor 的组合。删除这些条件会得到另一个看似相似、实际原因不同的案例。

## 第六步：修复一个最早原因

修复应该瞄准最早可控的错误边界。例如：

- 工具参数未校验：增加 Schema 与业务不变量，不只在 Prompt 中提醒；
- 权限上下文丢失：修复 token exchange 与策略输入，不让模型猜权限；
- 重试重复扣款：使用幂等键和操作账本，不仅降低重试次数；
- 检索引用错文档：固定租户过滤和索引版本，不只提高相似度阈值；
- 模型选择错误工具：收窄能力集合、改进描述并增加审批与后置验证。

一次同时改 Prompt、模型、工具和策略，会使结果无法归因。先最小修复并验证，再处理代码整洁或性能优化。

## 第七步：把失败变成回归资产

每个已确认缺陷至少产生：最小输入、环境夹具、期望断言、风险等级、责任人、关联 Trace、修复版本和失效条件。若案例依赖过期法规或外部 API，记录复审日期，避免测试成为永远不更新的历史化石。

回归测试不只断言最终文本。还应断言工具集合、调用顺序约束、授权结果、幂等键、数据边界、最大成本和超时预算。安全案例应在确定性控制处断言“被拦截”，不要依赖模型每次都用相同拒绝措辞。

## 调试工具的四个视图

一个成熟调试台通常需要：

- **时间线视图**：Span、Event、并行、等待、重试和取消；
- **状态视图**：每一步读写的状态版本与差异；
- **版本视图**：Prompt、模型、工具、策略、代码和数据快照；
- **证据视图**：受控输入/输出、评估理由、审批与后置条件。

[OpenTelemetry 事件约定](https://opentelemetry.io/docs/specs/semconv/general/events/)区分了有持续时间的 Span 与点状事件，有助于避免调试界面把“工具运行 3 秒”和“重试被安排”画成同一种节点。工具还要显示采样、截断和脱敏标记，避免调查者把不完整证据当成完整事实。

## 常见误区

- 失败发生后直接改 Prompt，没有冻结模型、工具、状态与数据版本。
- 在生产环境重放写操作，造成二次副作用。
- 用单次重放成功宣布修复概率性问题。
- 只比较最终文本，不比较计划、工具、授权和状态变化。
- 同时升级多个轴，无法判断哪个变化带来改善或退化。
- 把完整敏感上下文复制到工单和聊天群，扩大泄露面。

## 小结

Agent 调试是一门复现实验：定义失败、冻结快照、还原因果、隔离重放、最小化案例、修复最早原因、固化回归。Trace 提供路径，状态与版本提供上下文，沙箱控制副作用，断言证明修复。只有这个闭环形成，团队才会从“凭感觉调 Prompt”升级为可审计的工程方法。

## 参考资料

- [NIST：AI Test, Evaluation, Validation and Verification](https://www.nist.gov/ai-test-evaluation-validation-and-verification-tevv)
- [W3C：Trace Context](https://www.w3.org/TR/trace-context/)
- [OpenTelemetry：Semantic conventions for events](https://opentelemetry.io/docs/specs/semconv/general/events/)
