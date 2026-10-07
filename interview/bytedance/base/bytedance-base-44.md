以下原题或题目类别依据候选人的公开自述整理，经历、实现效果与面试结果未经独立证明。每题后的短答是独立教学归纳，不是作者现场回答；未记录的追问不补写。

“开耐特”名称未确定，不根据读音猜产品。

<details data-knowledge-key="agent-project-portfolio">
<summary>（1）实习期的那个项目，要不简单介绍一下</summary>
</details>

先说明项目目的、业务边界与个人负责模块，再选一次改进讲方案和验证。仅有“实习项目”类别记录，不能补造未公开的现场追问。

<details data-knowledge-key="agent-project-requirements">
<summary>（2）讲一下实习期业务线的整体链路</summary>
</details>

从用户操作开始讲请求、服务端处理、数据返回与展示，标出依赖和失败出口。业务细节按实际实现回答，教学示意不能冒充作者所在团队架构。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（3）正式请求和预请求的区别</summary>
</details>

预请求是在用户最终动作之前尝试准备数据；正式请求依当前条件获取或确认结果。只有参数、权限和版本仍匹配时才复用，不能让猜测请求改变业务状态。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（4）为什么要做预请求</summary>
</details>

预请求把可预测的数据等待提前，以减少关键交互时延。代价是浪费带宽与资源，应测命中率、节省时延和取消比例，避免大范围盲目请求。

<details data-binding-status="pending_semantic_verification">
<summary>（5）预请求的参数哪是哪些</summary>
<p>关联知识点待核实。</p>
</details>

参数应包含可确定的查询条件和缓存匹配依据，登录态由正规鉴权机制处理。缺失条件不能猜填，敏感字段也不应为预请求提前暴露。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（6）发起预请求的时机</summary>
</details>

可在有明确意图信号且资源允许时发起预请求，如稳定停留或即将打开页面。要限制并发、取消过时任务，并比较是否真能降低后续关键路径耗时。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（7）正是请求的时机</summary>
</details>

正式请求通常由明确用户操作或页面需求触发，再确认最新查询条件。即便命中预请求缓存，提交、支付等写操作仍需独立校验和明确执行。

<details data-binding-status="pending_semantic_verification">
<summary>（8）返回数据有啥差别</summary>
<p>关联知识点待核实。</p>
</details>

复用结果须比较查询条件、数据版本和新鲜度；不匹配则重新请求。返回结构差异应通过契约定义，不能仅凭“预/正式”标签认定数据相同。

<details data-knowledge-key="design-state">
<summary>（9）项目里有native，lynx，开耐特，分别是啥</summary>
</details>

Native 通常指平台原生实现，Lynx 是跨平台 UI 技术；“开耐特”未能确定名称，需先核对。不同框架有各自状态和渲染机制，不能从读音指定具体产品。

<details data-knowledge-key="design-state">
<summary>（10）数据下发到ui渲染的一个过程</summary>
</details>

数据先经过解析和校验，进入页面状态，再触发组件更新、布局和绘制。必须保留消息或列表项的稳定身份，异步旧响应也要避免覆盖新状态。

<details data-knowledge-key="design-state">
<summary>（11）有什么架构支持这种数据变化导致UI去刷新的这种逻辑</summary>
</details>

响应式系统通过跟踪数据依赖或显式状态更新调度界面变化；实现随框架不同。应说明状态所有者、更新入口和渲染边界，避免把所有数据变化都理解成整页重绘。

<details data-knowledge-key="design-state">
<summary>（12）你的数据会存在内存还是磁盘里</summary>
</details>

先确认运行宿主：临时 UI 状态可留内存，跨启动恢复才使用该平台持久化接口并定义有效期。不能把浏览器 Storage 当原生实现，敏感凭证与权威状态也须单独管理。

<details data-knowledge-key="design-components">
<summary>（13）你的项目用的是recycleview，那么比如说啊，我第一个卡片是顶部的圆角嘛，然后我第一台滚动到屏幕外之后，它可能就会进入一个回收池复用池里面，然后后面的底部的卡片可能到某个时机，他会就他会就他就会去复用顶部的卡片。那这个时候他复用的卡片是不是也是带圆角带顶部圆角的</summary>
</details>

RecyclerView 复用的是视图实例，绑定新数据时必须重设所有外观与状态，包括圆角、可见性和监听器。不能只设置有圆角的分支，否则会泄漏上一次绑定状态。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（14）搜索中间页的时候，怎么防范每输入一个字发起一次请求</summary>
</details>

输入变化可用 debounce 等到短暂稳定后查询，并取消旧请求或按请求版本丢弃旧结果。节流与防抖含义不同，仍需处理回车立即查询和输入法组合阶段。

<details data-knowledge-key="java-thread-pool">
<summary>（15）java线程池有啥参数</summary>
</details>

核心线程数、最大线程数、存活时间及时间单位、队列、线程工厂和拒绝策略共同决定容量。达到核心数后通常先排队，队列满再扩容；参数须由任务性质与压测决定。

<details data-knowledge-key="java-thread-local">
<summary>（16）threadlocal的原理</summary>
</details>

每个线程持有自己的 ThreadLocalMap，同一个 ThreadLocal 作为 key 关联该线程的 value。Entry 的 key 为弱引用、value 为强引用，线程池复用时须在 finally 中 remove。

<details data-knowledge-key="java-thread-local">
<summary>（17）threadlocal怎么保证每一个线程只有一个对象</summary>
</details>

ThreadLocal 提供每线程独立绑定，不保证业务对象永远只有一个：remove 后可重新初始化，set 可替换值。若各线程 set 同一个可变对象，它仍是共享对象并需同步。
