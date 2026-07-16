当 Agent 只由提示词和若干 `if` 组成时，“等待工具”“等待审批”“正在恢复”“已经完成”很容易互相覆盖。状态机把这些阶段提升为显式模型：当前状态接收事件，guard 判定是否合法，transition 决定下一个状态，action 执行受控副作用。

## 状态、事件、Guard、Action

四个概念需要分开：

- **State** 表示系统当前允许什么，例如 `planning`、`waiting_tool`；
- **Event** 是已经发生的输入，例如 `TOOL_SUCCEEDED`，不是命令式跳转；
- **Guard** 是无副作用布尔条件，例如结果版本是否匹配；
- **Action** 是迁移触发的记录、调度或副作用。

[W3C SCXML](https://www.w3.org/TR/scxml/)定义了基于事件的状态机语义：transition 可以由事件触发、由条件约束并包含可执行内容。采用某个库并非必须，重要的是迁移规则可枚举、可验证，而不是分散在提示词里。

## 先画状态，再写代码

一个工具型 Agent 可从这些状态开始：

```text
idle -> planning -> waiting_tool -> validating -> planning
                         |              |
                         v              v
                       failed        complete
planning -> waiting_approval -> planning
```

为每条边写三元组：`event [guard] / action`。例如：

```text
waiting_tool + TOOL_RESULT
[event.callId == context.pendingCallId && event.runVersion == context.version]
/ validateAndStore(event.result)
-> validating
```

同名事件在不同状态可以有不同含义；没有合法迁移的事件应被拒绝或记录，而不是偷偷修改 context。[XState transitions 文档](https://stately.ai/docs/transitions)区分目标状态、guard 和 action；这种分解能让迁移表直接成为测试输入。

![Agent 状态机用事件、守卫和动作连接空闲、规划、等待工具、验证、完成与错误状态，并拒绝非法事件](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-state-machine-transition-guards-v1.webp)
*图：工具结果只有在 call ID、状态版本和结果条件通过后，才能推动状态迁移。*

## Guard 必须纯且可重放

guard 不应查询会变化的网络服务或执行写操作，否则同一事件重放可能得到不同结论。外部检查应先作为 activity/tool 产生版本化事实，再以事件携带事实引用，由 guard 检查引用、时间和策略版本。

[XState guards 文档](https://stately.ai/docs/guards)强调 guard 是决定 transition 是否启用的条件。工程上让它保持纯函数，可以对任意 state/event 组合做表格测试，也能安全重放事件日志。

授权不能仅作为 guard 中由模型提供的布尔值。系统要从受信任身份与策略服务得到 decision，并把 decision ID、scope、expiry 写入上下文；执行前仍由工具服务再次校验。

## Context 与状态实例

机器定义描述可能的状态和迁移；运行实例才拥有当前 state 与 context。不要在全局机器定义里保存某个用户的数据。每个 run 有独立 instance、版本号和 event sequence。

context 保存状态所需的最小结构化数据：目标、待处理 call ID、审批引用、预算、已验证证据和资源版本。大文档或原始工具输出放在外部对象存储，context 只保留带完整性校验的引用，防止状态事件无限膨胀。

迁移采用 compare-and-set：事件声明它基于 `version=12`，存储层仅在当前仍为 12 时提交 version 13。两个 worker 同时收到结果时，只有一个成功；另一个成为可观测的 stale event。

## 层级与并行状态

层级状态可以复用规则。例如所有 `active.*` 状态都响应 `CANCEL`，进入 `cancelling`；所有终态都拒绝新工具结果。并行状态适合表示互不替代的维度，如主流程 `running` 与连接健康度 `degraded`，但会增加状态组合数量。

不要为每个布尔值创建并行区域。若两个维度存在强顺序关系，显式串行状态更清楚。并行工具调用则为每个 child 保存独立状态与 join 条件，只有 required children 都满足时才发出聚合事件。

## Action 与副作用一致性

迁移写入和外部副作用无法天然成为同一个数据库事务。常用做法是 outbox：状态迁移在事务中写入新 state 和待发送命令，独立 dispatcher 幂等投递；工具结果以 event ID 去重后再驱动下一迁移。

action 不应直接“先发请求、后写状态”，否则进程在中间崩溃会丢失事实。每个副作用带 operation ID 和幂等键。恢复时查询状态或重发安全命令，而不是猜上次是否成功。

## 非法事件是重要信号

迟到工具结果、重复批准、终态后的新消息和错误状态下的 `RESUME` 都应有策略：ignore with audit、reject、quarantine 或补偿。静默吞掉会掩盖竞态，直接接受则可能破坏不变量。

为每种状态定义允许事件集合、拒绝理由和可恢复方式。未知事件类型默认拒绝；版本升级时通过显式 migration 把旧 context 转成新 schema，而不是让新代码勉强解析。

## 测试方法

状态机天然适合模型测试：遍历状态与事件，断言目标状态、action 和 guard 结果；对事件序列做属性测试，验证终态不可离开、未经批准不能执行、预算不会增加、一个 call 只被接受一次。

再加入故障序列：结果先于“已调度”事件、重复结果、状态写入冲突、审批过期、取消与成功同时发生、重放旧版本。测试最终状态之外，还检查 outbox、审计和幂等记录。

可观测性记录 `runId, machineVersion, from, eventType, guardDecision, to, actionIds, stateVersion`。指标包含非法事件率、guard 拒绝率、各状态停留时间、迁移冲突、恢复次数和卡死实例数。状态驻留时间常比总延迟更能指出瓶颈。

## 常见误区

- 把 state 当日志字符串，没有合法迁移表；
- guard 内做网络 I/O 或写数据库；
- action 执行成功后才保存状态；
- 机器定义和运行实例共享可变 context；
- 所有异常都跳回 planning，形成隐蔽死循环；
- 忽略迟到事件，无法发现竞态；
- 修改机器定义却没有版本与存量状态迁移。

## 小结

状态机让 Agent 行为从“提示词可能这么做”变成“只有这些迁移合法”。事件描述事实，纯 guard 检查条件，action 通过 outbox 和幂等边界执行，版本化实例抵御并发与迟到结果。显式非法事件和状态驻留指标，则让复杂异步流程真正可调试。

## 参考资料

- [W3C — State Chart XML (SCXML)](https://www.w3.org/TR/scxml/)
- [Stately/XState — Transitions](https://stately.ai/docs/transitions)
- [Stately/XState — Guards](https://stately.ai/docs/guards)
