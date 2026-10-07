以下原题或题目类别依据候选人的公开自述整理，经历、实现效果与面试结果未经独立证明。每题后的短答是独立教学归纳，不是作者现场回答；未记录的追问不补写。

同一作者、同部门及相邻轮次的两份自述保守合为一个流程。调度器代码图和二面输出题图均未取得；600 ms 与打印顺序仅为作者自述，未验证原程序。

## 一面

<details data-knowledge-key="agent-resume-interview">
<summary>（1）自我介绍</summary>
</details>

简述相关能力与一项可复现项目，说明自己的贡献。两轮自述仅保守归为一个流程，不把教学短答写成作者现场表现。

<details data-knowledge-key="agent-learning-roadmap">
<summary>（2）聊一下你最近在学什么东西？</summary>
</details>

用最近一个小实验说明正在学的能力、遇到的问题与验证方法。学习计划应服务真实任务，不只列流行技术名称。

<details data-knowledge-key="design-state">
<summary>（3）我看简历里面提到有用过 Vue 3 的 Composition API，能简单解释一下 Composition API 它是怎么工作的？</summary>
</details>

Vue 3 Composition API 用 ref/reactive、计算属性和生命周期等接口组合逻辑，响应式依赖变化会调度相应更新。它是一组组织与复用逻辑的 API，不等于每次都重绘整个页面。

<details data-knowledge-key="design-components">
<summary>（4）没有它的时候是怎么写的？有它带来什么优势？</summary>
</details>

Options API 按 data、methods、computed 等选项组织；Composition API 可把同一功能的状态与行为放在一起并封装为 composable。两者可共存，选择看代码规模与团队习惯。

<details data-knowledge-key="promise">
<summary>（5）手写并发上限为 2 的异步调度器 Scheduler（原程序图片缺失）。</summary>
</details>

维护任务队列和运行计数，空槽时启动，成功或失败后在 finally 释放槽位并继续调度。必须延迟调用任务函数，已经启动的 Promise 不能靠加入队列限制并发；原图缺失，无法验证原程序输出。

<details data-knowledge-key="promise">
<summary>（6）add 返回 Promise，怎样在对应任务完成时返回结果并测试？</summary>
</details>

add 返回代表该任务的 Promise，保存 resolve/reject 并把任务结果或错误转交给它。要测试结果、异常与并发上限，失败释放槽位，不能只在任务入队时就兑现 Promise。

<details data-knowledge-key="promise">
<summary>（7）我看到有两个地方，第一个是为什么把 while 改成了 if？出于什么考虑？然后会带来哪些变化？</summary>
</details>

while 可一次填满所有空槽，if 每次只启动一个；若后续没有足够触发，可能留下闲置容量。效果取决于完整调度流程，原图缺失时不能断言修改必然等价。

<details data-knowledge-key="event-loop">
<summary>（8）A、B、C、D 程序打印到 D 共耗时多少（原程序图片缺失）？</summary>
</details>

原帖给出 600 ms，但没有原代码与耗时数组，无法独立推导。应画任务启动、完成和补位时间线，并以实际程序验证，不能把作者数字当已验证结论。

<details data-knowledge-key="event-loop">
<summary>（9）两个任务在相同到期时间完成时，谁先打印（原程序图片缺失）？</summary>
</details>

定时器到期只是变为可调度，具体顺序还依赖注册时间、任务源与运行环境。原帖声称 A 先打印但原代码图缺失，因此这里只说明分析方法，不确认原输出。

<details data-knowledge-key="llm-stream-cancel-resume">
<summary>（10）项目中怎样解决 SSE 断线重连的问题？</summary>
</details>

给事件稳定 ID，服务端保留可重放日志，客户端重连携带最后已确认游标并去重。仅重新发送聊天 POST 可能重复生成或执行工具，恢复应绑定原任务。

<details data-knowledge-key="agent-chat-ui">
<summary>（11）你刚刚讲的 TaskID 和 MessageID 是谁分配的？</summary>
</details>

通常由服务端或权威执行入口分配稳定 taskId/messageId，客户端可有临时展示 ID 并映射。明确身份、唯一范围和重试语义，不能用随机变动标识做续传游标。

<details data-knowledge-key="localStorage-sessionStorage">
<summary>（12）前端缓存消息标识有哪些选择？</summary>
</details>

页面内状态适合短期展示，localStorage 可跨刷新保留非敏感标识，IndexedDB 适合较多结构化数据。持久化要带版本和过期，凭证与权威执行状态仍按服务端合同管理。

<details data-knowledge-key="agent-project-portfolio">
<summary>（13）除了重连，还有哪些自己解决的问题？</summary>
</details>

可以选另一个真实问题深入说明复现、方案比较与回归，例如流式参数解析或首屏优化。原文提及这些类别，但没有验证具体实现效果，不能补造收益。

<details data-knowledge-key="llm-sse-streaming">
<summary>（14）你刚刚提到了那个 ToolCall 解决 返回的一个问题对吧？具体是怎么解决的？这个听起来是一个比较 common 的一个问题对吧？应该是大家都很容易遇到这个问题。有调研哪些社区的方案，然后最后是怎么决策，然后怎么解决的？然后讲一下细节嘛。</summary>
</details>

如实交代调研的具体库与版本，比较协议支持、故障处理和维护成本后决定复用或自研。先解析完整 SSE 帧，再按工具调用 ID 累积参数 delta，等待完成后解析与校验 JSON。半截 JSON 可用于预览但不能触发副作用；断流时保留失败或未完成状态。

<details data-knowledge-key="agent-resume-interview">
<summary>（15）反问：相关交易与广告团队的实际业务是什么？</summary>
</details>

可询问团队实际产品、用户与职责边界，以对方回复为准。原帖的业务简称和个人理解不当作已核实的公司介绍。

## 二面

<details data-knowledge-key="agent-resume-interview">
<summary>（16）自我介绍</summary>
</details>

二面介绍可突出第一轮后继续验证的能力，但必须是真实工作。教学内容不补造新的履历或面试结果。

<details data-knowledge-key="agent-project-portfolio">
<summary>（17）请从你的实习经历里面挑一个你认为比较有亮点的项目来介绍一下</summary>
</details>

选择亮点项目说明问题、个人贡献、关键取舍与验证证据，再准备可演示的代码入口。不要只展示最终页面而无法解释状态和异常路径。

<details data-knowledge-key="llm-sse-streaming">
<summary>（18）主要是在对话框那一部分的，包括这种 SSE 对话处理是吧？</summary>
</details>

先确认对话链路中自己负责的是传输解析、消息状态还是渲染，给具体入口与事件协议。SSE 接收成功不代表界面和恢复逻辑都正确。

<details data-knowledge-key="agent-chat-ui">
<summary>（19）就是 SSE 对话续传虚拟列表这部分是吧？</summary>
</details>

SSE 续传与虚拟列表解决不同问题：前者恢复数据流，后者减少 DOM 与渲染负担。需用稳定消息 ID 连接两者，避免重放事件导致列表重复。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（20）虚拟列表的基本原理</summary>
</details>

只渲染可视范围及少量缓冲，利用占位高度模拟完整滚动内容。动态消息高度需测量与修正，流式文本增长时保持滚动锚点，不能简单删掉屏外节点而失去位置。

<details data-knowledge-key="agent-chat-ui">
<summary>（21）那从你的这个场景来看的话，什么情况下会用到虚拟列表？然后你是怎么做的？</summary>
</details>

长对话或大型历史列表可能需要虚拟化，先测 DOM、布局与内存瓶颈再决定。聊天场景还要处理底部跟随、向上阅读和流式高度变化。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（22）你是从前端来去控制的，30 条以上开启虚拟列表的是吗？</summary>
</details>

阈值应由设备、条目高度与测量结果决定，30 条只是作者的具体说法。不能把它当通用标准；可在小列表保持普通渲染，大列表启用虚拟化但保留状态。

<details data-knowledge-key="design-components">
<summary>（23）那你是从前端控制，相当于切换了虚拟列表的组件？</summary>
</details>

切换组件时应保留消息身份、滚动位置、输入与焦点，避免销毁重建造成闪跳。也可使用同一列表实现渐进开启虚拟化，具体方案需验证体验。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（24）未到 v-if 的情况下，那你在 30 条的时候，那不会有一个整体的一个类似于组件切换的这种，对用户体验上应该有感觉吧？</summary>
</details>

若用 v-if 切换两套列表，要保存并恢复滚动锚点与状态，检查是否重复请求或丢失焦点。不能仅靠条目数条件就认为切换无感。

<details data-knowledge-key="agent-chat-ui">
<summary>（25）那就相当于是如果我在 在你整个系统中对话了 30 条以上，也就相当于你根本就是没有这虚拟列表的逻辑，对吧？只有在历史情况下你才会去做一个类似于优先选择或者用户刷新的情况下，才会去走到你这个渲染组件。</summary>
</details>

历史加载与实时消息应明确使用同一还是不同渲染路径，并验证长会话的行为。追问指出的实现边界应以实际代码确认，不能把未虚拟化的实时路径说成已优化。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（26）屏幕区域和那个缓冲区是怎么设置的？</summary>
</details>

可视区由容器尺寸和滚动偏移决定，缓冲区保留上下若干项或像素，减少快速滚动空白。缓冲越大内存和渲染越多，动态高度还需测量校正。

<details data-knowledge-key="llm-stream-cancel-resume">
<summary>（27）那个断点续传是怎么做的？</summary>
</details>

用任务标识绑定执行，用事件序号表示已消费位置，重连只补后续事件。若日志过期，回退到权威快照并明确提示；游标不能证明工具副作用没重复。

<details data-knowledge-key="mcp-protocol">
<summary>（28）二面：Tool Calling、MCP 与原帖“CoI”概念有何区别？</summary>
</details>

Tool Calling 是结构化请求工具能力，MCP 是宿主与工具服务交互的协议。“CoI”在原帖未定义，不能自动改成 CLI；应先澄清缩写，再比较层级与职责。

<details data-knowledge-key="agent-tool-design">
<summary>（29）那什么情况下我应该直接去做这个 Tool Calling，或者是走 Tools？什么情况下你的判断要走到 MCP 呢？</summary>
</details>

少量应用内工具可直接用清晰函数契约；需跨宿主复用、发现和统一交互时可考虑 MCP。无论接入方式，参数校验、授权和失败语义仍由宿主落实。

<details data-knowledge-key="rag-pipeline">
<summary>（30）我看你简历上写了 RAG，然后 LangChain、LangGraph。那如果要搭一个基础的一个 RAG 链路的情况下，你觉得会包含哪些流程？</summary>
</details>

基础链路包括文档解析、分块、Embedding 和索引，在线召回、必要重排、证据组装与生成。保留来源和权限，评测应能定位是召回、排序还是回答失败。

<details data-binding-status="pending_semantic_verification">
<summary>（31）你刚刚提到检索，一般检索策略会怎么做？</summary>
<p>关联知识点待核实。</p>
</details>

可结合关键词、向量与元数据过滤，按任务合并候选并去重。检索策略需要真实测试集比较，不能假设混合召回一定比单路好。

<details data-knowledge-key="rag-reranking">
<summary>（32）OK你提到 Rerank 重排，那这个阶段里面常用的策略有哪些？</summary>
</details>

常见思路是交叉编码模型、学习排序或受控模型评分，重排仅处理已召回候选。根据质量、延迟和成本选择，并用固定样例检查收益。

<details data-knowledge-key="rag-reranking">
<summary>（33）你整个 rerank 是怎么排的？就是你拿到这些片段之后，你怎么认为它的相关性比较高？或者是为什么能够得到一个相对精准的结果？在 rerank 的这个阶段。</summary>
</details>

给查询和候选片段一起评分后排序，分数代表该模型的相关性判断，不是事实概率。校验高分误例与漏召回，避免把模型打分当绝对正确。

<details data-knowledge-key="rag-latency-cost">
<summary>（34）那如果你用模型来拿到一个具体的估分情况下，那你的整个 RAG 链路的成本会不会特别高？怎么解决？</summary>
</details>

先用便宜召回缩小候选，再对有限 top-k 重排，按查询难度选择是否重排，并缓存合适结果。减少候选会影响召回，需同时测成本、尾延迟和质量。

<details data-knowledge-key="build-agent-framework">
<summary>（35）什么情况下适合用 LangChain，什么情况下适合用 LangGraph？</summary>
</details>

集成和较简单组合可用 LangChain；需要显式状态、分支、持久执行与人工中断时考虑 LangGraph。工具生态不能替代业务状态与副作用设计。

<details data-knowledge-key="agent-workflow-state">
<summary>（36）你刚才在说的这种 LangGraph 持久化的逻辑，它具体是怎么实现的？</summary>
</details>

检查点保存执行状态并与线程或会话标识关联，恢复时从持久化状态继续。若重放会重新调用外部工具，仍须幂等或结果对账，检查点不是跨系统事务。

<details data-knowledge-key="event-loop">
<summary>（37）二面：给定代码的输出顺序和结果是什么（图片缺失）？</summary>
</details>

二面此题依赖缺失图片，无法确认代码、输出顺序与结果。拿到代码后逐步分析同步栈、Promise 微任务和任务调度，不能编一个常见题来替代原题。

<details data-knowledge-key="browser-navigation-rendering">
<summary>（38）在这个文档里面，我不希望这个 script 脚本阻塞它的执行，有哪些方法？(说了 defer 和 async)</summary>
</details>

外部经典脚本可根据需要用 defer 或 async，模块脚本也有自身调度语义。选择应看是否依赖 DOM 或其他脚本，不把“异步加载”理解成任意执行顺序。

<details data-knowledge-key="browser-navigation-rendering">
<summary>（39）那它们两个有什么区别？</summary>
</details>

defer 的经典外部脚本通常并行下载、解析后按文档顺序执行；async 下载完成即可执行，顺序不保证。内联脚本与模块需另按标准判断，不能机械套同一规则。

<details data-knowledge-key="browser-navigation-rendering">
<summary>（40）那请你从浏览器渲染的角度来介绍一下，就是这一段 HTML 到浏览器之后，到最终渲染出来像素，它中间分别会经过哪些阶段？</summary>
</details>

浏览器解析 HTML 建 DOM、解析样式、计算布局，再构造绘制与合成结果输出像素；脚本与资源可影响过程。具体引擎阶段可能交错，不能把示意流程当固定的一次串行实现。

<details data-knowledge-key="browser-navigation-rendering">
<summary>（41）stacking context 这个概念有了解过吗？</summary>
</details>

堆叠上下文是一组按自身规则排序并作为整体参与父级排序的元素；z-index 受所属上下文限制。给子元素很大的值，也不能越过父上下文的整体层级。

<details data-knowledge-key="browser-navigation-rendering">
<summary>（42）二面：元素堆叠顺序在浏览器渲染流程中怎样确定？</summary>
</details>

元素的样式与层级关系影响绘制顺序，最终绘制/合成使用这些信息。不能把“Layout 收集、Paint 决定”当所有引擎固定合同；需区分堆叠上下文与合成层。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（43）什么情况下会被提升到合成层？</summary>
</details>

浏览器可能为某些动画、变换或视频等单独合成，但是否提升取决于引擎和资源策略。will-change 是提示，不能保证建层，也不应给所有元素滥用。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（44）什么情况下会出现层爆炸呢？</summary>
</details>

大量独立层会增加显存、纹理上传和管理成本，可能抵消合成收益。用 DevTools 测实际层与帧成本，去掉无必要的提升提示，不按元素数量猜性能。

<details data-knowledge-key="http-message">
<summary>（45）HTTP 3 和 HTTP 2 主要有哪些特性？</summary>
</details>

HTTP/2 使用二进制帧与多路复用，通常承载在 TCP；HTTP/3 把 HTTP 映射到 QUIC。二者都有流与头部压缩机制，收益取决于网络与实现，不能保证所有请求更快。

<details data-knowledge-key="tcp-udp">
<summary>（46）但是如果我 HTTP 2 都二进制分帧呢？就相当于是我的请求数据多路复用加二进制分帧嘛，对吧？你 10 个请求可能都是以帧包的形式依次传过来，那为什么还会有阻塞？你说的阻塞是什么问题？</summary>
</details>

HTTP/2 流可独立交错，但底层 TCP 字节流丢包时需要补齐缺失字节，后续已到的数据可能暂不能交付。阻塞来自传输层有序性，不是 HTTP 帧没有流标识。

<details data-knowledge-key="tcp-udp">
<summary>（47）那 HTTP 3 里面换成了 UDP，UDP 怎么样保证原有 TCP 的可靠传输？</summary>
</details>

QUIC 在 UDP 上实现可靠传输、确认、丢失恢复、流量与拥塞控制及加密握手。不同流通常不因另一流缺失数据而等待交付，但仍共享拥塞预算等资源。

<details data-binding-status="pending_semantic_verification">
<summary>（48）然后继续聊 TCP 吧，TCP 的拥塞控制怎么做的？</summary>
<p>关联知识点待核实。</p>
</details>

TCP 拥塞控制以拥塞窗口限制在途数据，经典过程含慢启动、拥塞避免和丢失后的调整。具体增长与恢复取决于算法，不能认为始终翻倍。

<details data-binding-status="pending_semantic_verification">
<summary>（49）那如果遇见错误了呢？就比如像你刚才说的，它一直翻倍对吧？翻倍完成之后，如果碰见错误了，或者是到达一个实际的拥塞了，之后会怎么样？</summary>
<p>关联知识点待核实。</p>
</details>

检测丢失后降低发送强度，超时与重复确认可能走不同恢复路径；慢启动阈值与窗口按算法更新。网络错误也有多种原因，不是每次错误都完全重置同一数值。

<details data-binding-status="pending_semantic_verification">
<summary>（50）在这个流程里面，快重传和快恢复是什么？</summary>
<p>关联知识点待核实。</p>
</details>

经典快速重传利用重复确认较早重发疑似丢失段，快速恢复避免某些情况下退回最初慢启动。现代实现有不同恢复与拥塞算法，说明 RFC5681 基础机制即可，别当成唯一实现。

<details data-knowledge-key="agent-resume-interview">
<summary>（51）反问</summary>
</details>

可问业务目标、工程质量标准与岗位任务，帮助确认匹配。面经未给完整回复，不补造公司承诺或将结果猜测当事实。
