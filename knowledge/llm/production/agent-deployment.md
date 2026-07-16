部署 Agent 不是只发布一段服务代码。行为由模型、prompt、工具 schema、策略、检索索引、运行时和评估集共同决定；这些组件必须形成可追踪、可回滚的版本单元，并通过离线评估、影子和金丝雀逐步放量。

## Versioned Bundle

```json
{
  "release": "agent-2026.07.16.3",
  "code": "sha256:...",
  "model": "provider/model@snapshot-or-config",
  "prompt": "sha256:...",
  "tools": "schema-v12",
  "policy": "policy-v8",
  "retrievalIndex": "index-2026-07-15",
  "evalSet": "eval-v21"
}
```

把 bundle ID 注入每个 trace 和结果。只记录“模型名”不足以复现：provider routing、temperature、system prompt、工具描述和政策变化都会改变行为。[NIST Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)强调对生成式 AI 风险进行治理、映射、测量与管理，版本证据是闭环基础。

![模型、Prompt、工具 Schema、策略与评估集组成版本包，经构建、离线评估、影子、5% 金丝雀、25% 放量到全量；质量、安全、延迟、成本和错误率门控，异常暂停并回滚](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-deployment-versioned-rollout-v1.webp)
*图：Startup、Readiness、Liveness 分别处理启动、接流量和重启；队列与并发驱动扩缩容。*

## 构建与离线门

构建产物固定依赖、镜像 digest、SBOM 和配置 schema，签名后进入制品库。部署前运行单元/集成、安全、回归和任务 eval；比较当前生产基线，按功能、安全、成本和延迟切片，而不是只看总分。

工具契约与策略做兼容性检查。新 prompt 调用旧工具不存在字段时，离线测试就应失败。数据库/记忆 schema 迁移采用 expand-contract，先让新旧版本都能读写，再收缩。

## Shadow 与 Canary

Shadow 复制脱敏、获准的生产请求给候选版本，但不让候选产生真实副作用；写工具替换为模拟器或 dry-run。比较路由、工具 proposal、质量、延迟和成本。影子不能覆盖所有实时交互与外部状态，仍需 canary。

Canary 先给小比例真实流量，按用户/会话粘性路由，防止同一会话在两个版本间跳。高风险写操作可以更晚开启或保持人工审批。门槛连续满足观察窗口后逐步放量；不要因短时平均好就立即全量。

## Kubernetes 发布语义

[Kubernetes Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)管理声明式副本和 rollout history，并支持回滚；[滚动更新教程](https://kubernetes.io/docs/tasks/run-application/update-deployment-rolling/)说明 `maxUnavailable`、`maxSurge`、rollout status、pause/resume 等机制。它们控制容器版本替换，不替你做 Agent 语义评估。

模型/外部工具可能有冷启动和连接预热。滚动期间旧/新版本都存在，状态必须外置或版本兼容。长任务绑定 bundle version；不要在执行中途悄悄换 prompt/工具策略。

## Startup、Readiness、Liveness

[Kubernetes probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/)区分：startup 允许慢启动完成；readiness 决定是否接流量；liveness 判断是否需要重启。把“下游模型暂时慢”写进 liveness 会在高负载时集体重启，造成级联故障。

Readiness 检查关键配置、策略、模型凭证和必要依赖，但不要因非关键可降级依赖阻塞所有流量。Liveness 只检测进程不可恢复状态。业务质量由外部指标和发布控制器判断，不塞进探针。

## 扩缩容与队列

Agent 请求耗时和成本差异大，CPU 不是唯一指标。结合队列深度、最老任务年龄、并发 tool calls、模型 rate limit、token/秒和长任务数扩缩容。每实例设置并发上限和 backpressure，防止扩容把下游 API 打爆。

异步任务使用可恢复队列和 visibility timeout，消费者 crash 后安全重放。写操作携带 operation/idempotency key。缩容时先停止接新任务，等待或 checkpoint 正在运行任务，不能直接 kill。

## 观测与 SLO

[OpenTelemetry traces](https://opentelemetry.io/docs/concepts/signals/traces/)可用 span 关联 Agent、模型、tool、queue 和外部服务。每个 span 带 release bundle、tenant/route（脱敏）、task type、attempt 和结果类别。日志与 prompt 使用受控引用。

SLO 包括任务成功、工具正确、安全违规、首响应/完成延迟、成本、人工介入和队列年龄。发布比较按版本与流量切片。只监控 5xx 会漏掉“HTTP 成功但 Agent 做错事”。

## Pause、Rollback 与 Forward Fix

超过错误、安全、质量、成本或延迟阈值先 pause 流量扩张，再判断 rollback。回滚恢复完整 bundle，不只换镜像。若新版本已经写入不兼容数据或发出外部副作用，容器 rollback 不能撤销；需要数据兼容、补偿和事件处理。

保持上一稳定版本和回滚演练。重大安全问题立即切断危险工具能力，可比整体回滚更快。所有自动回滚记录触发指标、窗口和实际执行结果。

## 测试发布系统

演练模型/工具超时、rate limit、探针误配、节点终止、队列重放、配置缺失、回滚、旧版本读新状态、区域故障和流量尖峰。game day 断言任务不丢、不重复副作用、流量只给 ready 实例、bundle 能追踪。

## 小结

Agent 发布以版本包为原子单位，把代码、模型、prompt、工具、策略、索引和 eval 绑定。候选先离线、影子和金丝雀，Kubernetes 负责实例 rollout 与探针，业务门控根据质量、安全、延迟、成本和错误率决定放量。状态外置、任务绑定版本、回滚与补偿分开，才能可靠升级。

## 参考资料

- [NIST — AI RMF Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)
- [Kubernetes — Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Kubernetes — Update a Deployment](https://kubernetes.io/docs/tasks/run-application/update-deployment-rolling/)
- [Kubernetes — Liveness, Readiness and Startup Probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/)
- [OpenTelemetry — Traces](https://opentelemetry.io/docs/concepts/signals/traces/)
