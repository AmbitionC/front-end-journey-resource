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

## 本地与云端同时覆盖大量设备

端云扩展先回答“任务在哪运行、数据能否离开设备、断网后如何继续”。一个可验证的设计示例是：控制面统一登记设备身份、能力、版本、策略和配额；执行面按数据位置、延迟、算力和获准权限把任务交给设备或云端 Worker。涉及本地文件或不宜外传的数据时优先在设备侧处理，需要云端计算时只传获准的最小数据。这里是设计取舍，不代表所有业务都应采用同一分层。

设备与云端都要在工具执行前验证主体、设备、资源和动作权限，不能因为设备在内网或由企业拥有就默认可信。[NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final)明确区分身份认证与授权，并反对仅凭位置或所有权赋予隐式信任。

设备可能离线、版本落后或在执行后丢失回执。任务因此需要稳定 ID、版本兼容的检查点、租约和幂等操作；连接恢复后先核对已执行动作与状态版本，再重放未完成部分。设备分组灰度、资源上限、取消与回滚沿用下文的发布合同；云端扩容仍受模型与外部工具配额约束。验收时加入断网重连、重复命令、旧设备协议与设备撤权场景，确认不会重复副作用或继续使用已撤销能力。

## 构建与离线门

构建产物固定依赖、镜像 digest、SBOM 和配置 schema，签名后进入制品库。部署前运行单元/集成、安全、回归和任务 eval；比较当前生产基线，按功能、安全、成本和延迟切片，而不是只看总分。

工具契约与策略做兼容性检查。新 prompt 调用旧工具不存在字段时，离线测试就应失败。数据库/记忆 schema 迁移采用 expand-contract，先让新旧版本都能读写，再收缩。

## Shadow 与 Canary

Shadow 复制脱敏、获准的生产请求给候选版本，但不让候选产生真实副作用；写工具替换为模拟器或 dry-run。比较路由、工具 proposal、质量、延迟和成本。影子不能覆盖所有实时交互与外部状态，仍需 canary。

Canary 先给小比例真实流量，按用户/会话粘性路由，防止同一会话在两个版本间跳。高风险写操作可以更晚开启或保持人工审批。门槛连续满足观察窗口后逐步放量；不要因短时平均好就立即全量。

## Kubernetes 发布语义

[Kubernetes Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)管理声明式副本和 rollout history，并支持回滚；[滚动更新教程](https://kubernetes.io/docs/tasks/run-application/update-deployment-rolling/)说明 `maxUnavailable`、`maxSurge`、rollout status、pause/resume 等机制。它们控制容器版本替换，不替你做 Agent 语义评估。

模型/外部工具可能有冷启动和连接预热。滚动期间旧/新版本都存在，状态必须外置或版本兼容。长任务绑定 bundle version；不要在执行中途悄悄换 prompt/工具策略。

## 容器资源需求与专用节点池分别控制什么

先看两个独立合同。resources.requests 告诉调度器这份工作需要多少可分配资源，不是应用的硬使用上限；resources.limits 约束运行时使用。对常见 Linux 容器，CPU limit 通过节流控制，内存超限可能引发 OOM 终止，不是 CPU 式平滑限速。容器可以在节点条件允许时使用超过 request 的资源；不能从 request 数值推断实际负载、性能或物理内存已预分配。本文只讨论常见容器级配置，参见 [Kubernetes 容器资源合同](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)，不推广未核对的集群特性开关。

Deployment 中通常在 spec.template.spec.containers[].resources 声明这些容器字段。先以真实任务的资源和延迟观测选择候选值，再验证调度、节流、重启和任务完成；不要把示例 CPU/memory 数值当线上默认。副本数、Pod 可调度和业务结果是不同检查，Pod Pending 或反复 OOM 时扩副本不能自动解决不合理请求/上限。

专用节点池还需要双向约束：

| 目标 | 机制 | 单独使用时的缺口 |
| --- | --- | --- |
| 本服务只能进入指定池 | 为池设置受控节点标签，Pod 用 nodeSelector 或 requiredDuringSchedulingIgnoredDuringExecution 节点亲和性 | 不会阻止别的 Pod 也进入该池 |
| 指定池拒绝不获准的新 Pod | 节点加 dedicated=agent:NoSchedule 等专用污点，只给获准 Pod 匹配 toleration | 有容忍度的 Pod 仍可调度到其他池，不会被吸引/锁定到专用池 |

所以通常组合必需标签匹配与污点/容忍度。[Dedicated Nodes 的官方说明](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/#example-use-cases)同样组合这两个方向。容忍只表示该污点不再阻挡，不保证调度成功；仍受资源、其他规则和可用节点影响。NoSchedule 不驱逐已经运行的 Pod，必需亲和性的 IgnoredDuringExecution 也不因后来标签变化自动搬迁现有 Pod，见[节点亲和性合同](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#node-affinity)。

排他性还依赖管理边界：限制谁能修改节点标签/污点、谁能给 Pod 加容忍度，以及准入策略怎样约束广泛 Exists 容忍或直接指定 nodeName。官方文档说明 nodeName 可绕过调度器的 NoSchedule 选择，因此不能把常规调度配置称为不受权限影响的安全隔离。已有工作负载和系统组件的特殊容忍需单独检查。调度可行、业务隔离和权限隔离因此需要分别验证。

### 一个容器级教学配置

下面展示字段如何组合，数值、标签和镜像都只是示例，不是业务默认或原项目配置。节点需由受权管理者预先具有 example.com/pool=agent 标签与 dedicated=agent:NoSchedule 污点；Pod 的 selector 限制“去哪里”，toleration 只解除对应污点的阻挡，仍可能因资源或其他规则而 Pending。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agent-worker-example
spec:
  replicas: 1
  selector:
    matchLabels:
      app: agent-worker-example
  template:
    metadata:
      labels:
        app: agent-worker-example
    spec:
      nodeSelector:
        example.com/pool: agent
      tolerations:
        - key: dedicated
          operator: Equal
          value: agent
          effect: NoSchedule
      containers:
        - name: worker
          image: registry.example.com/agent-worker:teaching
          resources:
            requests:
              cpu: 250m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
```

单容器例子避免把 init 容器、开销或未核对的 Pod 级资源特性混入容量计算。验证时既看 Pod 的调度原因，也看运行中的 CPU 节流、内存/重启和任务结果；不要把配置可解析当成已验证真实集群策略。

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

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [小红书 Agent 开发二面：结论正确性、安全边界与本地云端扩展](../../../interview/redbook/ai/redbook-ai-3.md)
- [VAST 后端一面：可观测性、AI Coding 与节点调度](../../../interview/vast/ai/vast-ai-1.md)
- [拼多多服务器开发一面：模型网关、动态鉴权与 Tool 授权](../../../interview/pinduoduo/ai/pinduoduo-ai-4.md)
<!-- interview-source-history:end -->

## 学习阅读（不计专题频次）

本区提供阅读导航；链接不表示原帖问过整个专题，也不计入本专题面经频次。

- [腾讯 AI 应用开发面试：跨会话记忆与多 Agent](../../../interview/tencent/ai/tencent-ai-4.md)：本地运行/配置位置原问的生产部署学习扩展；版本、Kubernetes、探针与灰度不是该原问具体答案。

## 参考资料

- [NIST — Zero Trust Architecture（SP 800-207）](https://csrc.nist.gov/pubs/sp/800/207/final)
- [NIST — AI RMF Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)
- [Kubernetes — Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Kubernetes — Update a Deployment](https://kubernetes.io/docs/tasks/run-application/update-deployment-rolling/)
- [Kubernetes — Liveness, Readiness and Startup Probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/)
- [OpenTelemetry — Traces](https://opentelemetry.io/docs/concepts/signals/traces/)

- [Kubernetes：容器 resources.requests 与 resources.limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
- [Kubernetes：Node selector 与 Node affinity](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/)
- [Kubernetes：Taints、Tolerations 与 Dedicated Nodes](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)
