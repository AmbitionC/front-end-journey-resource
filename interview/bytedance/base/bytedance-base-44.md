### 字节全栈：预请求、列表复用与 ThreadLocal

字节飞书 AI 全栈岗的一场面试，从实习项目问起，主线是一个很实际的性能优化：**预请求**，连问了 6 题。接着问跨端框架里数据怎么驱动 UI 刷新、列表复用的坑，最后用 Java 线程池和 ThreadLocal 收尾。下面每题先给一段能直接说出口的回答。

<details data-knowledge-key="agent-resume-interview">
<summary>（1）实习期的那个项目，要不简单介绍一下</summary>
</details>

我会先用一句话说清项目给谁用、解决什么问题，再说我负责哪一块，然后挑一次具体的优化展开：当时的问题是什么、我怎么定位的、改了什么、用什么指标验证、提升了多少。最后提一句还没解决的问题，比只讲成果更可信。

<details data-binding-status="pending_semantic_verification">
<summary>（2）讲一下实习期业务线的整体链路</summary>
<p>关联知识点待核实。</p>
</details>

按一次用户操作的路径讲：用户在页面上做了什么，客户端发什么请求，经过网关和哪些后端服务，数据从哪里取，返回后客户端怎么解析、怎么渲染。讲的时候顺带标出哪一段最慢、哪一段最容易出错，以及我负责的是哪一段，面试官后面的问题基本会从这里追。

<details data-binding-status="pending_semantic_verification">
<summary>（3）正式请求和预请求的区别</summary>
<p>关联知识点待核实。</p>
</details>

预请求是在用户真正需要数据之前，根据可预测的意图提前把数据拉回来，比如列表页就提前请求详情页的数据；正式请求是用户真正进入页面或点击时发起的请求。两者的关键区别是：预请求是猜测，可能用不上；正式请求要以当前最新的条件为准。所以预请求的结果只有在参数、登录态和数据版本都对得上时才能复用，而且只能用于读，不能有副作用。

<details data-binding-status="pending_semantic_verification">
<summary>（4）为什么要做预请求</summary>
<p>关联知识点待核实。</p>
</details>

为了把等待提前。用户点进详情页时，如果数据已经在路上甚至已经回来了，首屏就能直接渲染，体感上快一截。代价是会浪费一些流量和服务端资源，所以要看数据：预请求命中率多少、首屏时间降了多少、有多少预请求最后没用上被丢掉，划不来就收窄触发范围。

<details data-binding-status="pending_semantic_verification">
<summary>（5）预请求的参数哪是哪些</summary>
<p>关联知识点待核实。</p>
</details>

预请求的参数要和正式请求用同一套查询条件，比如商品 ID、用户选择的规格、分页参数，这样才能判断结果能不能复用；一般会把这些参数拼成缓存 key。登录态走正常的鉴权，不用额外传。拿不到的参数不要猜，宁可不发预请求。

<details data-binding-status="pending_semantic_verification">
<summary>（6）发起预请求的时机</summary>
<p>关联知识点待核实。</p>
</details>

在用户意图比较明确、而且网络和设备有余力的时候发。比如列表项在屏幕上停留超过一段时间、手指按下还没抬起、或者即将跳转的页面已经确定。要控制并发数，用户滑走了就取消已经过时的预请求，避免抢正式请求的带宽。

<details data-binding-status="pending_semantic_verification">
<summary>（7）正是请求的时机</summary>
<p>关联知识点待核实。</p>
</details>

正式请求在用户真正进入页面或点击时发起。发之前先查有没有对得上的预请求结果：已经回来就直接用，还在路上就等它而不是重复发，没有或对不上就正常请求。下单、支付这类写操作永远走正式请求，不能复用预请求。

<details data-binding-status="pending_semantic_verification">
<summary>（8）返回数据有啥差别</summary>
<p>关联知识点待核实。</p>
</details>

理想情况下两者返回的数据结构一样，区别在新鲜度：预请求的数据是早一点拿的，可能已经过时，比如价格或库存变了。所以复用前要看数据的时间或版本，超过有效期就重新请求；对价格、库存这类敏感字段，进入页面后可以再发一次轻量的校验请求。

<details data-knowledge-key="design-state">
<summary>（9）项目里有native，lynx，开耐特，分别是啥</summary>
</details>

Native 指的是 iOS、Android 的原生开发，用平台自己的 UI 组件；Lynx 是字节开源的跨端框架，用前端写法写页面，再由它自己的引擎渲染成原生视图。「开耐特」原帖是按读音记的，没法确定是哪个框架，回答时直接说清你项目里实际用的是什么、各自负责哪部分页面就好。

<details data-knowledge-key="design-state">
<summary>（10）数据下发到ui渲染的一个过程</summary>
</details>

服务端下发数据后，客户端先解析和校验，转成页面需要的数据结构，写进状态。状态变化触发框架重新计算哪些组件受影响，生成新的界面描述，和旧的对比出差异，最后只更新变化的那部分，再经过布局和绘制显示出来。要注意两点：列表项要有稳定的 key，否则会错位复用；异步回来的旧响应不能覆盖新状态。

<details data-knowledge-key="design-state">
<summary>（11）有什么架构支持这种数据变化导致UI去刷新的这种逻辑</summary>
</details>

这就是响应式或者说数据驱动的 UI 架构。一种是像 React 那样，调用 setState 显式告诉框架状态变了，框架重新渲染并做 diff；另一种是像 Vue 那样，用 Proxy 之类的手段追踪组件读了哪些数据，数据一变就只通知依赖它的组件。不管哪种，核心都是：状态有唯一的所有者，界面是状态的函数。

<details data-knowledge-key="design-state">
<summary>（12）你的数据会存在内存还是磁盘里</summary>
</details>

看数据的用途。页面临时状态，比如列表滚动位置、展开收起，放内存就行，退出就丢；需要下次打开还在的，比如草稿、缓存的首屏数据，才写磁盘，并且要设过期时间。登录凭证这类敏感数据要用系统提供的安全存储，不能明文写文件。

<details data-knowledge-key="design-components">
<summary>（13）你的项目用的是recycleview，那么比如说啊，我第一个卡片是顶部的圆角嘛，然后我第一台滚动到屏幕外之后，它可能就会进入一个回收池复用池里面，然后后面的底部的卡片可能到某个时机，他会就他会就他就会去复用顶部的卡片。那这个时候他复用的卡片是不是也是带圆角带顶部圆角的</summary>
</details>

会带。RecyclerView 复用的是 ViewHolder 这个视图对象，它上次被设置成什么样就还是什么样。所以在 onBindViewHolder 里绑定新数据时，要把所有可能变化的外观都重新设置一遍：是第一个就设顶部圆角，不是就要显式把圆角去掉。只在 if 里设、else 里不管，就会出现中间的卡片莫名其妙带圆角。更稳的做法是给不同样式设不同的 viewType，RecyclerView 会按 viewType 分开复用，顶部卡片只会复用给顶部卡片。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（14）搜索中间页的时候，怎么防范每输入一个字发起一次请求</summary>
</details>

用防抖：用户停止输入一小段时间，比如 300 毫秒，再发请求。同时要处理两件事：一是新请求发出时取消旧请求，或者给请求编号，只认最后一次的结果，避免慢的旧结果覆盖新结果；二是中文输入法拼音还没确定时不发请求，等 compositionend 之后再算。用户按回车就立即搜索，不用等防抖。

<details data-knowledge-key="java-thread-pool">
<summary>（15）java线程池有啥参数</summary>
</details>

七个参数：核心线程数、最大线程数、空闲线程存活时间和它的时间单位、任务队列、线程工厂、拒绝策略。提交任务时，线程数没到核心数就新建线程；到了就放进队列；队列满了才继续建线程直到最大线程数；再满就执行拒绝策略。注意如果用的是无界队列（比如不指定容量的 LinkedBlockingQueue），队列永远不会满，线程数就不会超过核心线程数，最大线程数等于没用。参数怎么设看任务类型，CPU 密集型线程数接近核数，I/O 密集型可以多一些，最终靠压测定。

<details data-knowledge-key="java-thread-local">
<summary>（16）threadlocal的原理</summary>
</details>

每个 Thread 对象里有一个 ThreadLocalMap，key 是 ThreadLocal 对象，value 是这个线程存的值。调用 get 时，先拿到当前线程的 map，再用这个 ThreadLocal 去查，所以不同线程互不干扰。map 的 key 是弱引用，value 是强引用，如果线程一直不结束（比如线程池里的线程），value 就可能一直留着造成内存泄漏，所以用完要在 finally 里调用 remove。

<details data-knowledge-key="java-thread-local">
<summary>（17）threadlocal怎么保证每一个线程只有一个对象</summary>
</details>

因为值是存在各自线程的 ThreadLocalMap 里的。一个线程第一次 get 时，如果之前没 set 过，就调用 initialValue（用 withInitial 创建时就是传入的那个函数）给自己初始化一份；先 set 过的就不会再调用。之后 set 会替换这份值，remove 之后再 get 会重新初始化。但要注意它保证的是「每个线程拿到自己绑定的那个值」，如果你给每个线程 set 的是同一个对象，那它们共享的还是同一个对象，照样需要同步。

> 题目来自候选人的面经自述；参考回答由 Agent Journey 整理，供备考参考。
