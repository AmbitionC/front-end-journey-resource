把 Agent Demo 变成线上服务，差距主要不在再写一个 prompt，而在身份、秘密、持久状态、可观测、容量、发布与事故责任。Agent 还把模型、检索、工具和策略组合成动态执行系统，因此发布与回滚的单位必须是完整兼容 bundle。

![Agent 上线前从身份与状态、观测 SLO、容量安全到 Canary、回滚和事故归属的生产就绪检查](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-project-deployment-production-readiness-v1.webp)
*图：release bundle 同时固定模型、Prompt、索引、工具与 Policy；Canary 指标异常时回到兼容版本和状态。*

## 定义发布 Bundle

bundle 包含应用 commit、模型/provider/参数、system prompt、retrieval corpus/index、embedding model、tool schema/implementation、policy 和 feature flags。生成不可变 releaseId，写入 run、trace、评测与产物。

只回滚代码可能让旧应用读取新 tool result 或新 checkpoint 失败。每次发布声明前后兼容矩阵、状态迁移和最早可回滚版本。Prompt 和知识库也是生产制品，经过 review、评测和签名。

## 身份、权限与秘密

用户身份贯穿检索和工具，服务间用工作负载身份，禁止所有 run 共用管理员 key。授权在服务端按 user/tenant/resource/action 检查，模型提出 tool call 不是权限。

秘密由 secret manager 短期交付，日志、Trace、prompt 和工具结果统一脱敏。开发、预发布和生产隔离账号与数据。每个工具设置 scope、网络 egress、超时、配额和审批策略，sandbox 不等于授权。

## 持久状态与幂等

Thread、Run、Event、Checkpoint、Approval 和 Tool Operation 分开持久化。worker 使用 lease/fencing，重试通过 eventId/operationId 去重。外部副作用写幂等账本，结果未知时先对账。

数据库迁移采用 expand–migrate–contract，旧新实例重叠时都能读写。队列消息与 checkpoint schema 版本化。灾备演练不仅恢复聊天文本，还验证待审批、在途 run 和外部 operation 状态。

## 可观测与 SLO

从用户 request 到 run、model call、retrieval、tool call 和 artifact 关联 traceId/runId。Metrics 包括任务成功、首 token、端到端 p95、tool error、队列年龄、取消传播、模型 token、成本和安全拒绝。日志不保存无必要原文。

SLO 面向用户：例如“99% 合格交互在 30 秒内获得可用草稿”，而不是模型 API 200。告警附 releaseId、影响范围和 runbook。采样 Trace 不能替代持久审计与状态。

## 容量、超时与背压

按并发 run、上下文长度、模型 rate limit、工具连接和队列估算容量。每请求有总 deadline/预算，并向子调用递减；模型、检索和工具分别超时。队列有界，过载时 admission control 或降级，不无限积压。

流式连接占用资源，断开要传播取消。热点租户有配额和公平调度，避免单用户耗尽全局模型额度。压测包含长上下文、慢工具、重试和 provider 限流，不只测短 prompt QPS。

## Production Readiness Review

[Google SRE evolving engagement model](https://sre.google/sre-book/evolving-sre-engagement-model/)讨论 Production Readiness Review 等标准化参与方式。上线前明确 owner/on-call、架构依赖、SLO、容量、备份、监控、运行手册、安全/隐私、降级和事故通信。

高风险工具还要 threat model 与 abuse case。检查数据保留、用户删除、供应商条款、模型变更通知和退出策略。没有 owner 的告警、没有演练的回滚和没有密钥的备份都不算就绪。

## Canary 与回滚

[Google SRE Canarying Releases](https://sre.google/workbook/canarying-releases/)通过限制暴露人群、比较行为降低坏发布成本。先内部/shadow，再按 tenant 或百分比 canary；保持 control，比较任务成功、严重错误、SLO、成本和安全指标，而非只看 5xx。

自动停止条件事先定义。回滚切回完整 bundle，并确保进行中的 run 由原版本完成、迁移或安全取消。工具 schema 破坏性变化需双版本窗口。回滚后保留失败 run 与事件用于调查，不覆盖证据。

## 降级与依赖故障

模型 provider 失败可切备用模型，但须重新评估能力/安全；检索失败可仅在低风险场景提供无来源草稿；工具失败回到人工，不伪装成功。每种降级有 UI 标识、指标和关闭开关。

第三方状态页不能替代自己的 synthetic probe。对 DNS、证书、配额、区域和 SDK 错误分别演练。Chaos 重点验证不会重复副作用、不会越权 fail-open。

## 事故与持续运营

事故按用户结果分级，支持快速禁用某模型、工具、索引或租户。runbook 给查询、止血、回滚和数据修复步骤。事后回顾 detection、blast radius、状态一致性和用户沟通，修复进入测试与门禁。

生产化完成的标准，是团队能在凌晨回答：哪个 bundle 出问题、影响哪些 run、如何停止新伤害、外部动作是否重复、怎样恢复服务与数据，以及谁负责决定恢复流量。

## 参考资料

- [Google SRE Workbook：Canarying Releases](https://sre.google/workbook/canarying-releases/)
- [Google SRE：The Evolving SRE Engagement Model](https://sre.google/sre-book/evolving-sre-engagement-model/)
