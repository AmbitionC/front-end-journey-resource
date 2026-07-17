Agent 平台的并发问题不是把 Worker 数量调大。一次 Run 可能同时占用模型并发、浏览器、CPU、内存、数据库连接和第三方 API 配额；若只有一个全局 FIFO，大租户或大任务会长期占满资源，短请求饥饿，下游过载后重试又继续放大压力。

可靠的并发控制分为五层：准入、租户配额、调度公平、执行资源隔离和下游背压。每层解决不同问题，不能用一个 semaphore 同时代替。

![多个租户请求先经过配额与准入，再由公平调度器分配到有界 Worker 池，CPU、内存和工具槽位分别隔离，过载通过背压返回入口](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-concurrency-fair-scheduler-v1.webp)
*图：公平不是每个队列轮一次这么简单，还要考虑权重、成本、等待时间和资源类型。*

## 从工作量单位开始

“一个请求”不是稳定成本单位。一次文本分类可能只用一个模型调用，而一次浏览器研究任务会占用数十次工具和几分钟。准入估算至少包含任务类别、最大 token、预计工具次数、内存、deadline 和优先级；估不准时宁可分阶段申请资源，也不要一次承诺无限工作。

为每种资源定义独立许可：

- run slot：同时活跃的任务数；
- model slot：某模型或供应商的并发；
- tool slot：浏览器、代码沙箱或外部 API 并发；
- memory/CPU budget：本地执行隔离；
- cost budget：租户和任务的 token、调用或金额上限。

一个任务只有获得当前阶段所需许可才执行，不要持有模型 slot 等待浏览器，也不要持有数据库事务等待模型返回。固定资源获取顺序或拆分阶段可以减少死锁。

## 准入控制与队列上限

入口先检查全局健康、租户配额、任务预算和队列容量。超出即时容量但仍在可接受等待时间内的任务进入有界队列；超过上限就快速返回 429/503 或明确的排队拒绝。无界队列只是把过载变成更晚的超时，并增加取消、内存和用户不确定性。

[Google SRE 关于过载处理的章节](https://sre.google/sre-book/handling-overload/)强调在过载时丢弃工作、限制请求和保护可用容量。对 Agent 平台尤其重要：当依赖变慢时，每个任务占槽时间变长，队列会在到达率不变的情况下迅速增长。

## 租户配额与资源隔离

配额是一个时间窗口或资源池中的消费上限，隔离则保证运行时不会越界。[Kubernetes Resource Quotas](https://kubernetes.io/docs/concepts/policy/resource-quotas/)展示了命名空间级聚合资源限制；[Linux cgroup v2](https://docs.kernel.org/admin-guide/cgroup-v2.html)提供 CPU、内存、I/O 等运行时分配与限制机制。两者的角色不同：配额决定“最多能申请多少”，cgroup 决定“实际如何被内核约束”。

租户配额可以由基础份额、突发额度和组织预算组成。突发只使用空闲容量，不能侵蚀其他租户的保证份额。对于高风险沙箱任务，按租户或信任等级使用独立 Worker 池和 cgroup；仅在应用内计数无法阻止内存泄漏或恶意进程耗尽节点。

## 公平调度

一个全局 FIFO 在任务成本相差悬殊时并不公平。实用调度器为 tenant × priority × workloadClass 建立 flow，使用加权轮询、Deficit Round Robin 或虚拟完成时间，使大任务按估算成本扣除配额。等待过久可以有限 aging，但不能让低优先级无限提升绕过紧急流量保护。

[Kubernetes API Priority and Fairness](https://kubernetes.io/docs/concepts/cluster-administration/flow-control/)是可参考的实现：请求被分类到 flow schema 和 priority level，再在并发限制内做公平排队。Agent 平台可借鉴思想，但权重、shuffle sharding 和座位成本需要按自身任务建模。

调度决策记录 flow、估算成本、权重、入队时间、开始时间和拒绝原因。否则“平均等待时间很好”可能掩盖一个小租户已经饥饿半小时。

## 有界 Worker 与背压

Worker 池按主要瓶颈分开：CPU 任务、模型协调、浏览器和高内存任务使用不同池。每池设置最大并发与队列，动态扩缩只在下游许可、节点容量和启动时间允许时进行。看到队列变长就扩容，可能把数据库或模型 API 直接压垮。

背压沿调用链向上游传播。下游连接池耗尽时，工具适配器拒绝或延迟新调用；Run 调度器暂停发放新任务；入口减少准入。重试请求低于新用户请求的优先级，并共享同一个全局预算，防止恢复流量挤掉正常流量。

## 长短任务与优先级反转

长任务采用时间片或检查点让出，而不是占住稀缺工具槽直到整条工作流结束。每完成一个可恢复阶段重新排队，使短任务有机会前进。不可抢占的外部调用则设置 deadline，并限制同类调用数量。

优先级反转出现在高优先级任务等待被低优先级任务持有的锁、浏览器或租户内资源。减少跨步骤持锁，必要时使用优先级继承或为控制面预留独立容量。取消任务要及时释放许可；僵尸租约必须由过期扫描回收。

## 指标与容量判断

至少按 tenant、flow 和 resource 观察：

- 到达率、准入率、拒绝率与队列深度；
- 排队时间的分位数、最老任务年龄和饥饿次数；
- active lease、许可使用率和任务持有时长；
- CPU throttle、内存压力、工具槽与连接池；
- 下游 429/503、超时、重试放大和取消；
- 单位成功任务的 token、工具次数与成本。

利用 Little 定律可以粗略检查到达率、在途数与总时长是否自洽，但 Agent 工作量分布常有长尾，容量规划必须保留分位数和任务类型，不能只看平均。

## 验证场景

压测不要只用同样大小的请求。混合多个租户、长短任务、突发流量、慢依赖和重试，验证：每个租户有最小进展；高优先级控制面仍可用；队列有界；取消释放资源；扩容不会超过下游配额；单个内存炸弹被 cgroup 限制；过载恢复时不会发生重试风暴。

## 小结

并发治理是一条资源责任链：入口有界准入，租户配额定义份额，公平调度决定先后，Worker 池与 cgroup 限制真实资源，下游饱和通过背压反馈。把公平、隔离和过载拆开观察，才能避免“系统整体利用率很高，但某些用户永远没有进展”。

## 参考资料

- [Kubernetes：API Priority and Fairness](https://kubernetes.io/docs/concepts/cluster-administration/flow-control/)
- [Kubernetes：Resource Quotas](https://kubernetes.io/docs/concepts/policy/resource-quotas/)
- [Linux Kernel：Control Group v2](https://docs.kernel.org/admin-guide/cgroup-v2.html)
- [Google SRE：Handling Overload](https://sre.google/sre-book/handling-overload/)
