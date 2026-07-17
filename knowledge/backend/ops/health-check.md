健康检查不是一个统一的“服务还活着吗”布尔值。启动、可接流量、需要重启和准备退出是四种不同状态；如果都塞进 `/health`，短暂依赖抖动可能触发重启风暴，慢启动可能被不断杀死，退出实例也可能继续接收请求。

![服务从启动探测、就绪、运行、失去就绪到优雅终止的状态机](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/health-check-startup-readiness-shutdown-v1.webp)
*图：startup 保护初始化，readiness 控制流量，liveness 只处理不可恢复的本地故障，终止时先摘流量再清理。*

## 四种信号的职责

[Kubernetes Pod 探测文档](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#container-probes)区分 startup、readiness 和 liveness。startup probe 在成功前抑制另外两种探测，适合模型加载、缓存预热或数据库迁移等慢启动；readiness 失败会把 Pod 从服务端点中移除；liveness 失败会导致容器被重启。

因此它们应回答不同问题：

- startup：进程是否在允许时间内完成了必要初始化；
- readiness：此刻把一个新请求交给它是否合理；
- liveness：进程是否陷入只能靠重启恢复的本地状态；
- termination：实例是否已经停止接新工作并完成在途任务。

进程存在不等于健康，依赖不可用也不一定意味着应该重启进程。判断标准是信号的消费者会采取什么动作。

## Startup：给初始化明确预算

启动探测应覆盖服务真正需要的本地初始化，例如配置验证、监听端口、必要文件加载和内部 worker 就绪。它的失败预算由 `failureThreshold × periodSeconds` 决定，要根据最慢但仍正常的启动分布设置，而不是随意给很大值。

不要用 startup 掩盖永久失败。配置缺失、schema 不兼容或模型文件损坏应尽快返回失败并输出低敏诊断；正常的冷启动则在预算内持续报告“尚未完成”。启动耗时、阶段与失败原因需要指标化，才能区分容量不足和代码回归。

## Readiness：表达当前承载能力

readiness 可检查请求处理主路径所需的本地状态和有限依赖。例如线程池已经启动、连接池还能取得连接、关键缓存已经加载。检查必须快速、有严格超时且成本低，不能每几秒执行复杂查询。

是否把外部依赖纳入 readiness，要分析流量效果。如果所有实例都因同一个下游故障变成 unready，负载均衡器会得到零端点，原本可降级的接口也一起消失。更好的方式可能是服务仍 ready，但对依赖功能做熔断和降级；只有实例自身明显无法处理任何有价值请求时才摘流量。

readiness 还可表达过载，但要避免频繁抖动。设置进入/退出阈值、最短保持时间和指标，容量控制更应依赖限流、队列与自动扩缩，而不是让健康探测承担全部背压。

## Liveness：只检测不可恢复的本地故障

[Kubernetes probe 类型说明](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#types-of-probe)表明 liveness 的后果是重启。因此它不应依赖数据库、DNS 或第三方 API；共享依赖出故障时，重启所有实例只会增加连接和启动压力。

合适的检测包括事件循环永久卡死、关键内部 worker 已退出且无法重建、不可恢复的状态机错误。多数应用只需一个极轻的进程内响应。失败阈值应容忍一次 GC pause 或调度延迟，并用独立指标诊断根因。

```text
/startupz  -> 初始化是否完成
/readyz    -> 是否接受新流量
/livez     -> 本地执行循环是否还能推进
```

响应不要泄露依赖地址、凭据或内部堆栈；详细原因写到受控指标和日志。

## 优雅终止是反向启动

[Pod 终止流程](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination-flow)包含终止钩子、`SIGTERM`、宽限期与最终强制停止。应用收到终止信号后应先把 readiness 置为失败，停止从队列领取新任务，然后等待负载均衡和服务发现传播，再完成在途请求、提交 checkpoint、关闭连接并退出。

HTTP 服务定义最大请求时长和 drain deadline；后台 worker 让当前任务完成或安全续租/释放。若在宽限期末仍未退出，记录未完成工作的身份，而不是无限等待。`SIGKILL` 无清理机会，所以关键状态不能只存在于退出钩子。

## 状态机与观测

将实例状态显式建模为 Starting → Ready → NotReady/Draining → Terminated，并记录每次转换原因。核心指标包括启动耗时分位数、ready 实例数、探测失败原因、重启率、drain 时间和强制终止数。告警针对用户容量和异常转换，而不是单次探测失败。

测试慢启动、依赖抖动、事件循环阻塞、Pod 滚动升级、长请求、队列任务、终止信号重复和宽限期耗尽。正确结果是：慢启动不被误杀，共享依赖故障不触发重启风暴，退出实例及时停止接单，在途工作要么完成、要么可被安全接管。

## 参考资料

- [Kubernetes：Container probes](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#container-probes)
- [Kubernetes：Types of probe](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#types-of-probe)
- [Kubernetes：Pod termination flow](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination-flow)
