字节跳动 · AI 前端方向 · 一面。面试经历为候选人自述，未独立证实；问题按主题归纳，短答为独立整理，不代表现场回答或企业标准答案。

<details data-knowledge-key="build-agent-framework">
<summary>（1）为什么自研 Agent 框架，不直接使用 LangGraph？</summary>
</details>

先说明需要控制哪些执行行为，再比较框架已有能力和自研维护成本。小范围学习或特定约束可能适合轻量实现；分支、持久化、调试与恢复复杂时复用框架更有价值。可观察性要用实际追踪和故障定位验证，不能仅凭自研就推定更可控。

<details data-knowledge-key="agent-run-loop">
<summary>（2）ReAct 式循环从用户任务到结束经历什么？</summary>
</details>

应用准备目标、上下文和工具说明，模型提出动作，程序校验后执行，结果记录并反馈，模型再决定下一步。循环还要处理最终输出、预算、取消和错误；完成一次模型生成不等于业务目标成功，工具调用提议也不等于已经执行。 [OpenAI Agents SDK：执行循环](https://openai.github.io/openai-agents-python/running_agents/)。

<details data-knowledge-key="agent-tool-result-validation">
<summary>（3）工具输出不是标准 JSON 怎么办？</summary>
</details>

先区分模型调用参数不合法与工具返回结果不符合约定：分别做输入、输出的结构和语义校验。失败应转换为明确错误，保留调用关联，允许可恢复问题被后续处理；不能随意清洗成看似成功的数据，也不能把致命故障继续隐藏在循环里。

<details data-knowledge-key="multi-agent">
<summary>（4）多 Agent 怎样拆分，子 Agent 预定义还是动态创建？</summary>
</details>

只有任务需要独立决策、专业上下文或工具范围时才考虑拆分，固定操作可由程序编排。预定义角色容易约束，动态创建更灵活但仍须限制工具、权限、并发和预算。用相同任务验证拆分收益，不能默认更便宜或更准确。

<details data-knowledge-key="agent-run-loop">
<summary>（5）超步数熔断一定用固定步数吗？</summary>
</details>

可按模型轮次、总时限或成本限制继续执行，具体阈值由任务和资源预算决定。轮次限制不能让正在等待的调用及时退出，还需超时和取消处理；到达上限应报告未完成及原因，不能把强制结束记为成功。

<details data-knowledge-key="agent-run-loop">
<summary>（6）Agent 未超步数却反复做同一操作怎么办？</summary>
</details>

结合工具、参数、结果和任务目标判断是否有进展，对无进展重复设上限，必要时停止或改变路径。相同调用也可能是合理轮询，所以不能只按字符串去重；加入提示可帮助模型调整，但真正的执行约束仍在程序中。

<details data-knowledge-key="prompt-context-compression">
<summary>（7）怎样避免上下文超限和关键信息被稀释？</summary>
</details>

先保留目标与约束，移除无关重复内容，外置大结果，再按需要摘要历史并保留回源途径。近期窗口、检索记忆和摘要各有用途；频繁出现不等于最重要，截断时也要保住工具调用与结果的合法关联。

<details data-knowledge-key="sse-server">
<summary>（8）SSE 断网后怎样重连？</summary>
</details>

原生 EventSource 支持重连，可用事件 ID 和 Last-Event-ID 请求缺失事件；服务端必须实际保存可重放记录，客户端要去重。若使用 fetch 自行读流，则需实现对应逻辑。重新建立连接不等于重新执行任务，应关联已有 run 并避免重复副作用。 [HTML Standard：EventSource 与 Last-Event-ID](https://html.spec.whatwg.org/multipage/server-sent-events.html)。

<details data-knowledge-key="mcp-protocol">
<summary>（9）MCP Client 和 Server 分别负责什么？</summary>
</details>

Host 管理应用中的客户端与策略，Client 代表 Host 向对应 Server 发现和调用能力，Server 提供工具、资源等实现。具体传输和状态行为要按双方协议版本确认；认证、资源授权和用户许可仍需落实，协议调用不会自动获得业务权限。 [MCP：Host、Client、Server 的职责](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)。

<details data-knowledge-key="agent-skill-design">
<summary>（10）MCP 与 Skill 是什么关系？</summary>
</details>

MCP 规范能力发现与调用接口，Skill 提供任务步骤、材料和可复用执行指导，两者可以组合使用。Skill 不是资源授权，MCP 也不是强制模型正确行动的保证；运行时仍要校验请求、约束执行并检查结果。

<details data-knowledge-key="agent-debugging">
<summary>（11）用户说 Agent 卡住了，怎样排查？</summary>
</details>

用运行标识与阶段事件定位最后成功位置，检查等待中的模型或工具、重复循环、队列、资源和取消状态。能复现时缩小输入与环境；不能复现时比对同版本轨迹。日志保留排查所需关联信息，避免记录凭据和完整隐私数据。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（12）React 页面卡顿有哪些优化方向？</summary>
</details>

先用固定交互和 Performance、Profiler 区分网络、主线程、布局绘制与重复渲染，再对应处理长任务、状态范围、列表规模或资源体积。虚拟列表与图片懒加载解决不同问题，memo 也有比较成本，不能不测量就统一添加。 [Chrome DevTools：性能轨迹分析](https://developer.chrome.com/docs/devtools/performance)。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（13）线上性能怎样监测？</summary>
</details>

真实用户监测按设备、网络和版本采样关键体验及阶段耗时，用运行标识关联异常；实验室测量用于稳定复现和对比。两者条件不同，不能把单次 Lighthouse 得分当作全部用户表现，也不能在埋点中泄露用户内容。

<details data-knowledge-key="event-loop">
<summary>（14）怎样发现掉帧？</summary>
</details>

在 Performance 轨迹中检查长任务、渲染阶段与动画帧；requestAnimationFrame 的时间间隔可辅助观察，但受后台节流和设备刷新率影响。INP 衡量交互响应，不等于 FPS；应把检测信号回到具体阻塞和绘制工作。 [MDN：requestAnimationFrame 的刷新率与后台行为](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（15）除了懒加载和预加载，怎样优化首屏？</summary>
</details>

定位关键资源、服务器响应、主线程与渲染链路，减少不必要脚本，优化图片和字体，并合理缓存。不同网络、设备和业务下瓶颈不同，不能凭换 CDN 或压缩包体就宣称所有场景更快；同条件测量确认收益。

<details data-knowledge-key="server-rendering-hydration">
<summary>（16）SSR 的原理是什么？</summary>
</details>

服务器先生成 HTML，让浏览器能够显示初始内容；需要交互时，客户端再运行脚本并接管已有结构，React 中这一过程称为 hydration。SSR 不自动保证响应更快，仍受服务器成本、缓存与客户端脚本影响，客户端与服务器输出还要一致。 [React：接管服务器生成的 HTML](https://react.dev/reference/react-dom/client/hydrateRoot)。

<details data-knowledge-key="vite-testing">
<summary>（17）怎样防止性能随迭代退化？</summary>
</details>

把代表性页面、设备和网络条件固定为回归场景，为体验、资源体积及关键阶段设置可解释的预算，并在 CI 与线上分别观测。超限要定位变更原因，噪声需重复或统计处理；通过一次构建或单次跑分不能证明长期没有退化。

<details data-knowledge-key="algorithm-linked-list">
<summary>（18）LRU Cache 怎样实现 get 和 put？</summary>
</details>

维护键到节点的哈希表与按访问顺序排列的双向链表，命中或更新时移到最近端，超容量淘汰最旧端。节点移动和查询平均 O(1)，总空间 O(capacity)；要处理已有键更新、空容量和不存在的键，不能把 LRU 当成插入顺序缓存。

## 候选人反问（原帖记录）

<details data-knowledge-key="agent-role-landscape">
<summary>（19）反问：怎样了解团队业务、AI 工具使用和岗位准备重点？</summary>
</details>

围绕服务对象、实际交付、开发与验收流程、工具权限及能力要求询问，再与自己的经验比较。团队政策和招聘建议需要以当前说明为准，不能把一次交流当成所有团队的共同要求；准备时要能解释并验证简历中的技术与代码。

## 参考资料

以下资料用于核对整理短答；滚动文档核验于 2026-10-03。

- [OpenAI Agents SDK：执行循环](https://openai.github.io/openai-agents-python/running_agents/)（滚动文档）
- [HTML Standard：EventSource 与 Last-Event-ID](https://html.spec.whatwg.org/multipage/server-sent-events.html)（Living Standard）
- [MCP：Host、Client、Server 的职责](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)（协议 2026-07-28）
- [Chrome DevTools：性能轨迹分析](https://developer.chrome.com/docs/devtools/performance)（滚动文档）
- [MDN：requestAnimationFrame 的刷新率与后台行为](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)（浏览器 API）
- [React：接管服务器生成的 HTML](https://react.dev/reference/react-dom/client/hydrateRoot)（滚动文档）
