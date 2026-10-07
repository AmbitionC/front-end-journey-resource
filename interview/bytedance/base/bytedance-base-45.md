以下原题或题目类别依据候选人的公开自述整理，经历、实现效果与面试结果未经独立证明。每题后的短答是独立教学归纳，不是作者现场回答；未记录的追问不补写。

仅核对可见文字，可能折叠内容是否展开仍未确认。原帖“React”所指需澄清。

<details data-knowledge-key="agent-resume-interview">
<summary>（1）简单做一下自我介绍。</summary>
</details>

介绍与岗位最相关的项目、自己的职责和一项能复现的改进。作者履历没有独立核实，短答仅给表达方法，不提供虚构经历。

<details data-knowledge-key="react-hooks">
<summary>（2）讲一下对React的理解。</summary>
</details>

先澄清原帖的 React 是 UI 库还是 Agent 语境中的 ReAct。前者用组件与状态描述界面，后者交替行动和观察；两个名称接近，机制完全不同。

<details data-knowledge-key="agent-run-loop">
<summary>（3）描述一下最简单的 Agent Loop 是什么样子。</summary>
</details>

最小循环是读取任务与状态、调用模型决定下一步、校验并执行工具、记录观察，再判断终止。设置次数、时间和费用上限，不能让“继续思考”成为无限循环。

<details data-knowledge-key="agent-tool-timeout">
<summary>（4）一个 Agent 任务耗时很长、用户等不及了，怎样停止这个任务？</summary>
</details>

写入取消请求并把信号传到模型与工具，执行器在安全点停止后续动作。前端断流不代表后端已停；已发生的副作用要查询或补偿，并区分取消中与已取消。

<details data-knowledge-key="agent-tool-timeout">
<summary>（5）这个取消机制你实际尝试过吗？</summary>
</details>

说明真实测试覆盖了哪个阶段，展示模型等待、工具执行和已提交副作用下的结果。没有实践时应明确只做设计，不能把协作取消误说成强制撤销一切效果。

<details data-knowledge-key="llm-api-basics">
<summary>（6）Agent 运行中不断交互的 message 大致有几类？分别是什么？</summary>
</details>

常见消息包含指令、用户输入、模型响应和工具结果，具体角色名称随供应商而异。每条工具结果应能关联对应调用，权限和原始数据可信度不能由角色标签自动保证。

<details data-knowledge-key="rag-pipeline">
<summary>（7）用过 RAG 吗？</summary>
</details>

回答是否做过后，讲清离线解析与索引、在线检索与排序、证据组装和生成。用错误样例说明召回或生成瓶颈，别只背组件名单。

<details data-knowledge-key="agent-memory-architecture">
<summary>（8）怎样做上下文窗口和 Memory 管理？分别说短期 Memory、长期 Memory。</summary>
</details>

短期状态保存当前任务与近期对话，长期记忆保存获准的跨会话事实；按预算选择、检索和摘要。记忆要有来源、时间、权限及更新规则，摘要不应覆盖原始证据。

<details data-knowledge-key="java-thread-local">
<summary>（9）ThreadLocal 是线程安全的吗？</summary>
</details>

ThreadLocal 隔离线程的变量绑定，不使被绑定对象自动线程安全。如果多个线程绑定同一可变对象，仍需同步；异步切换线程也不会自动带走原上下文。

<details data-knowledge-key="java-thread-local">
<summary>（10）使用 ThreadLocal 有哪些注意点？是否有内存泄漏风险？</summary>
</details>

请求结束用 finally.remove，避免线程池复用污染后续任务。Entry 的弱 key 回收后，强 value 可能仍被长寿命线程持有，不能依赖 GC 自动及时清理。

<details data-knowledge-key="java-thread-local">
<summary>（11）ThreadLocal 在 Java 中的设计和底层数据结构是什么？</summary>
</details>

OpenJDK 21 中线程持有 ThreadLocalMap，Entry 使用 ThreadLocal 弱引用作 key、强引用保存 value，冲突用开放寻址处理。它不是 ThreadLocal 对象内部存一张线程到值的大表。

<details data-knowledge-key="spring-container">
<summary>（12）BeanFactory 和 ApplicationContext 有什么差异？</summary>
</details>

BeanFactory 定义取得和管理 Bean 的基础合同；ApplicationContext 经子接口扩展工厂能力，并提供资源、事件、国际化及环境入口。初始化时机取决于容器和配置，不能简化成绝对懒加载对绝对立即加载。

<details data-knowledge-key="spring-container">
<summary>（13）ApplicationContext、BeanFactory 的接口继承关系是什么？ApplicationContext 还继承哪些接口？</summary>
</details>

ApplicationContext 直接扩展 EnvironmentCapable、ListableBeanFactory、HierarchicalBeanFactory、MessageSource、ApplicationEventPublisher、ResourcePatternResolver；后两类工厂接口再关联 BeanFactory，资源接口关联 ResourceLoader。

<details data-knowledge-key="redis-distributed-lock">
<summary>（14）项目里的分布式锁基于什么实现？</summary>
</details>

先说明实际实现；Redis 常见租约锁以 NX 加随机持有者 token 和过期时间取得锁。释放必须原子校验持有者再删除，多节点故障下仍需说明一致性边界。

<details data-knowledge-key="redis-distributed-lock">
<summary>（15）Redis 加锁和释放锁的原理、注意事项是什么？</summary>
</details>

加锁用原子 SET NX PX，解锁用 Lua 等原子比较 token 后删除，避免删掉别人续接的锁。业务超出租约或节点切换可能失去排他性，重要写入需版本或 fencing 校验。

<details data-knowledge-key="redis-distributed-lock">
<summary>（16）业务还没执行完而锁即将过期时，锁续期如何实现？</summary>
</details>

持有者在租约有效时周期续期，并原子检查 token。续期失败或暂停过久应停止受保护写入；watchdog 不能保证旧持有者不再运行，所以资源端仍需识别过期执行者。

<details data-knowledge-key="async-job-queue">
<summary>（17）RocketMQ 能做延时消息吗？原理是什么？</summary>
</details>

RocketMQ 5 延时消息先保存在定时存储，到指定时间转为可投递状态。它约束的是投递时机，不保证消费瞬间执行，也不是周期任务；具体上限以部署版本和配置核对。

<details data-knowledge-key="async-job-queue">
<summary>（18）不使用 RocketMQ，怎样实现延时消息？</summary>
</details>

可用持久任务表的 nextRunAt 配合定时扫描、租约和幂等执行；小规模可用内存时间堆但需恢复机制。TTL 加死信有队头等限制，不能当作精确计时器。

<details data-knowledge-key="redis-data-structure">
<summary>（19）Redis 是单线程还是多线程？</summary>
</details>

常见命令执行主要由主线程顺序处理，网络 I/O 和后台任务可能使用其他线程，取决于版本与配置。不能把 Redis 说成整个进程只有一个线程，也不应笼统说所有命令并行。

<details data-knowledge-key="redis-data-structure">
<summary>（20）Redis 为什么能支撑很高并发 / 高 QPS？</summary>
</details>

高并发来自内存数据、低开销命令和事件驱动网络处理，也受客户端批量请求与部署影响。应看具体命令、数据大小和尾延迟，慢命令或热点会阻塞关键处理。

<details data-knowledge-key="java-nio-reactor">
<summary>（21）最简单的 I/O 多路复用怎么实现？原理是什么？</summary>
</details>

把多个连接注册到多路复用器，等待哪些描述符可读写，再执行非阻塞读写。就绪不等于读到了完整消息，仍需处理部分读取、协议分帧与连接关闭。

<details data-knowledge-key="java-nio-reactor">
<summary>（22）做过 NIO 开发吗？了解 Reactor 模式吗？</summary>
</details>

Reactor 用事件循环处理 I/O 就绪，必要时把耗时业务交给工作线程，再把结果送回所属循环。说明自己是否做过，避免把 NIO 就绪通知当成真正异步完成通知。

<details data-knowledge-key="spring-external-config">
<summary>（23）Spring 应用中，怎样让自建配置中心的配置优先级高于环境变量、application.yml、Spring Cloud 配置和命令行配置？</summary>
</details>

在属性被读取前，将自建 PropertySource 放到目标 Environment 的最前，并核对后续扩展是否再次插入更高优先级源。仅改远端配置不能保证覆盖，最终应检查实际解析来源。

<details data-knowledge-key="spring-external-config">
<summary>（24）配置中心通过 @Value 注入后，运行期间配置值变化，应用怎样感知并更新？</summary>
</details>

普通 @Value 在 Bean 创建时注入，替换 Environment 的属性源不等于字段自动重注入。可选择显式可更新配置对象或框架支持的刷新机制，并处理并发读到不同版本的问题。

<details data-knowledge-key="spring-external-config">
<summary>（25）PropertySource 是启动时一次加载的；配置变化后怎样刷新内存中的配置？</summary>
</details>

收到带版本的完整配置后先解析校验，再原子替换快照和属性源；业务通过一致入口读取。更新 PropertySource 与更新已注入对象是两个动作，不能只完成前者。

<details data-knowledge-key="spring-external-config">
<summary>（26）如果监听配置变更失败，配置中心与应用内存中的值不一致，怎么处理？</summary>
</details>

监听通知只是加速信号，还需周期对账或版本拉取，发现缺口重新取快照。保留已验证版本、监控滞后并告警，不能因为没收到事件就认为没有变化。

<details data-knowledge-key="spring-external-config">
<summary>（27）如果配置中心宕机或连不上，怎样保证应用不挂？</summary>
</details>

启动可使用事先定义的可信缓存或默认配置，运行中保留最后有效版本并重试。关键安全配置可选择拒绝启动或停止相关业务，不能笼统承诺所有故障都继续运行。

<details data-knowledge-key="sql-window-function">
<summary>（28）SQL：两张表：Employee(employee_number, department_number)、Salary(employee_number, salary)。查询每个部门工资最高的员工，返回 department_number、employee_number、salary；并列最高的员工也要全部返回。</summary>
</details>

先关联员工与薪资，再用 DENSE_RANK() OVER(PARTITION BY department_number ORDER BY salary DESC) 排名并筛 rank=1，保留并列最高。明确薪资表是否一人一行，以及 NULL 与多期工资的处理口径。

<details data-knowledge-key="algorithm-heap">
<summary>（29）三维接雨水：力扣 407. 接雨水 II。只讲一下思路。</summary>
</details>

LC407 是二维高度网格的积水体积：把边界放入最小堆，每次从最低有效边界向内扩展，新增水量为 max(0,边界高−邻格高)，再以两者最大值入堆。入队时标记，避免重复计算。

<details data-knowledge-key="agent-concurrency">
<summary>（30）JUC：实现执行器 submit(String key, Runnable task)。相同 key 的任务按提交顺序串行执行；不同 key 的任务可以并行执行；先不用处理总并发数 N 的限制。需要考虑 submit 与 worker 执行期间队列的线程安全。</summary>
</details>

每个 key 维护 FIFO 队列和一个运行标志，在同一同步边界内入队与决定启动 worker。worker 出队和清除运行标志也须协调，防止丢唤醒；任务异常不能阻止后续任务执行。

<details data-knowledge-key="agent-resume-interview">
<summary>（31）反问</summary>
</details>

可询问团队的 Agent 使用场景、交付标准和入职后的任务边界。对方实际回答未在短答中验证，不替公司承诺职责或流程。
