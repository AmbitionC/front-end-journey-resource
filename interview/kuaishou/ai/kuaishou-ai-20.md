根据标题及问题记录整理，背景为快手 AI 全栈研发秋招一面；面试日期和年份未确认。下方均为编辑整理的复习思路，不代表当事人的现场回答。

本页依据已保存的可见文字整理，未确认完整现场题面或全部网页图文。原记录部分题目条件未给全：二叉树还原缺输入编码与约束，内部组件未命名，图片异步转存未列实际状态。相关题保留待核实。

<details data-binding-status="pending_semantic_verification"><summary>（1）从先序遍历还原二叉树（hard）？</summary><p>关联知识点待核实。</p></details>
<p>先补齐输入编码、空节点表示和节点约束，再判断能否唯一重建；仅有先序节点值序列一般不足以确定二叉树。原文没有给出这些条件，暂不对应具体题号或补写实现。</p>

<details data-knowledge-key="redis-distributed-lock"><summary>（2）分布式锁和异步线程池是如何设计的？</summary></details>
<p>先分别定义锁要保护的共享资源、线程池要承接的异步任务，再说明两者如何衔接。锁需考虑资源键、所有权、租约与失效后的资源端约束；线程池需有容量、排队、拒绝和任务失败协议，不能把拿锁或提交成功等同业务已完成。</p>

<details data-knowledge-key="redis-distributed-lock"><summary>（3）分布式锁的 Key 和 TTL 怎么设计的？是使用开源组件还是公司内部封装的组件？</summary></details>
<p>Key 应围绕实际互斥资源确定粒度，必要时纳入业务命名空间，避免不同资源误冲突或同一资源漏互斥。TTL 结合任务耗时与故障恢复窗口制定，释放时校验所有权；选开源库还是内部组件，要据真实版本、续期和异常契约说明，原文未披露实际选型。</p>

<details data-binding-status="pending_semantic_verification"><summary>（4）公司内部封装的组件的底层实现了解吗？</summary><p>关联知识点待核实。</p></details>
<p>先补齐组件名称、版本、接口与它负责的边界，再依据公开文档或有权限阅读的实现解释原子性、续期和故障处理。不能因后文提到 Redisson，就断定未命名的内部组件一定以它实现。</p>

<details data-knowledge-key="redis-distributed-lock"><summary>（5）如果用 Redisson，如何解决业务逻辑未完成但锁过期的问题？</summary></details>
<p>先核对所用 Redisson API 是否显式指定 leaseTime，再判断是固定租约还是 Watchdog 续期。续期仍可能因暂停、网络或进程故障失败，业务应设超时与取消路径，并用资源端版本或 fencing 防止过期持有者的陈旧写入；这不是无限延长 TTL 就能保证的。</p>

<details data-knowledge-key="redis-distributed-lock"><summary>（6）如果不设置过期时间，Redisson 是怎样处理的？</summary></details>
<p>对启用 Watchdog 的 RLock 获取方式，未显式给出 leaseTime 通常进入有期限并自动续期的模式，并不表示 Redis 键永久不过期。客户端失联后续期停止，租约到期才释放；确切行为仍需按调用方法、配置和部署版本核对，不能套到所有 Redisson 锁类型。</p>

<details data-knowledge-key="redis-distributed-lock"><summary>（7）如果 Redis 集群主从复制时，服务宕机导致锁丢失，原来的主节点重启后被降级为从节点，应该如何处理？</summary></details>
<p>先还原锁写入、复制、主节点故障和从节点提升的时间线，确认是否出现两个客户端都认为自己持锁的窗口。旧主重启降为副本并不能追溯撤销客户端已经发出的操作，业务仍需在权威资源端做版本或 fencing 检查，并对不确定结果核对；高一致性需求应重新评估协调方案。</p>

<details data-knowledge-key="java-thread-pool"><summary>（8）线程池的工作流程是怎样的？</summary></details>
<p>以 JDK 21 ThreadPoolExecutor 的通常运行路径说明：少于核心线程数先尝试建线程，达到核心数后先入队，队列满才在最大线程数内尝试扩容，仍无法接纳或已经关闭则执行拒绝策略。并发关闭会再次校验状态，不能把这个顺序理解成无竞争的一次原子操作。</p>

<details data-knowledge-key="java-thread-pool"><summary>（9）异步线程池的参数怎么设计的？业务的 QPS 如何？属于 I/O 密集型还是 CPU 密集型？</summary></details>
<p>先测任务到达速率、执行与等待耗时，再结合 CPU 限额、I/O 阻塞和下游连接容量确定并发预算。核心数、最大数、队列和拒绝必须一起压测，关注排队、尾延迟与拒绝率；原文没有真实 QPS 或参数，不能用固定公式补成作者配置。</p>

<details data-knowledge-key="java-thread-local"><summary>（10）线程池怎么做上下文透传的？做完透传要做什么处理防止上下文串用？</summary></details>
<p>提交时捕获最小必要且适合传播的上下文，执行时在工作线程绑定，并在 finally 中清理或恢复原有绑定。普通 ThreadLocal 不会自动跨线程传播，InheritableThreadLocal 也不等于每次提交时复制；嵌套作用域应恢复外层值，避免线程复用后读到上次任务的信息。</p>

<details data-knowledge-key="async-job-queue"><summary>（11）如果异步线程池处理期间服务宕机，任务怎么处理？</summary></details>
<p>先区分只在进程内队列中的任务与已保存到持久任务系统的任务，内存线程池本身不能保证宕机后恢复。需要恢复时，以持久状态、稳定任务身份和有界重试重新调度；业务提交后再确认，结果未知时先查询或对账，不能直接假设重试不会重复副作用。</p>

<details data-binding-status="pending_semantic_verification"><summary>（12）图片异步转存有哪些状态流转？分别如何处理？</summary><p>关联知识点待核实。</p></details>
<p>原文没有给出实际状态、触发事件、重试及终态定义，暂不能还原该项目的图片转存状态机。复习时可先列出受理、执行、结果确认与失败恢复需要哪些事实，再向项目实现核对，不把通用示例写成现场方案。</p>

<details data-knowledge-key="agent-coding"><summary>（13）使用 AI 编码的工作流是怎样的？</summary></details>
<p>先明确需求、仓库约束与验收标准，再让 AI 检索相关代码、提出可审查计划并生成范围有限的改动。随后运行适当的类型、测试与构建检查，审查 diff 和失败路径，最后记录实际验证结果；生成代码或一次测试通过都不能代替完整验收。</p>

<details data-knowledge-key="context-engineering"><summary>（14）AI 编码时，团队是怎么沉淀业务背景和改动内容的？</summary></details>
<p>可把稳定的业务术语、约束和接口事实保存在可版本管理的团队资料中，任务中再按需读取；把本次决定、改动范围、验证证据和遗留问题写成可追溯记录。经验进入共享规则前需脱敏、复核与验证，过期信息要更新；这是编辑整理的协作思路，原文没有说明团队实际用了什么工具。</p>

## 延伸复习

[Redis 分布式锁](../../../knowledge/backend/database/redis-distributed-lock.md) · [Java 线程池](../../../knowledge/backend/java/java-thread-pool.md) · [ThreadLocal](../../../knowledge/backend/java/java-thread-local.md) · [异步任务](../../../knowledge/backend/api/async-job-queue.md) · [Coding Agent](../../../knowledge/llm/agent/agent-coding.md) · [上下文工程](../../../knowledge/llm/agent/context-engineering.md)
