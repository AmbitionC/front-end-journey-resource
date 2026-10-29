### 小红书 AI 开发实习二面：聊天滚动、Markdown 与 Worker

原帖自述为小红书 AI 开发实习二面，题目侧重前端交互；具体部门与面试日期未披露。本页选取聊天滚动、代码块展示与 Worker 三组，其他界面和工程题不在此展开。

面试经历为个人自述，未经独立核实；下列短答和示例为编辑教学整理，不代表当事人的现场回答或项目实现。

<details data-knowledge-key="agent-chat-ui"><summary>（1）AI 聊天界面中新消息到达时，如何平滑滚动到底部？用户正向上查看历史时怎么办？</summary></details>
<p>把是否跟随新消息作为显式状态：用户原本接近底部时，合并内容更新后滚到末尾锚点；用户向上阅读则暂停自动跟随，显示新消息提示，由用户点按恢复。可在新消息到达或用户点击时平滑滚动，持续流式追加避免每个 token 都重复启动动画；滚动不应抢走焦点。</p>

<p>教学示例（非原面试实现）：用户停在中段阅读时，新内容只更新提示计数；点“查看新消息”才回到底部并恢复跟随。向前分页补旧消息时，保留当前可见消息的锚点。</p>

知识导航：[Agent Chat UI、消息模型与会话列表](../../../knowledge/frontend/agent-ui/agent-chat-ui.md)

<details data-knowledge-key="agent-markdown-code-ui"><summary>（2）前端如何处理 Markdown 中的代码块高亮，并支持一键复制？</summary></details>
<p>先把 Markdown 解析为代码节点，语言名经允许列表选择高亮器，代码文本按文本渲染；若高亮器返回 HTML，进入 DOM 前仍需净化。复制读取原始代码，而不是带行号或折叠标记的展示 DOM；在安全上下文中由用户点击调用剪贴板 API，并处理写入失败。未闭合围栏先按代码文本展示，长块按需高亮。</p>

<p>教学示例（非原面试实现）：展示区的行号和“展开”按钮不进入复制结果；模型输出形似 HTML 标签的代码也只显示为文字，不能变成可执行页面元素。</p>

知识导航：[Markdown、代码块、图表与安全渲染](../../../knowledge/frontend/agent-ui/agent-markdown-code-ui.md)

<details data-knowledge-key="browser-worker-tasks"><summary>（3）Web Worker 在 AI 前端应用中有哪些使用场景？</summary></details>
<p>Web Worker 适合把大文本解析、语法分析或可放入 Worker 的推理等 CPU 工作移出主线程，让界面响应输入与渲染。它不能直接操作 DOM，也不会自动让总耗时变短，需要衡量启动和消息传输成本。连续任务带 ID，主线程只提交仍有效的结果；旧结果被忽略不等于旧计算已取消。</p>

<p>教学示例（非原面试实现）：先发分析任务 A，再发 B，即使 A 后完成，也不能覆盖当前 B 的结果。ID 检查只解决结果归属；若要节省 A 的计算，还需可响应的分片取消或终止相应 Worker。</p>

知识导航：[浏览器 Worker：分片、取消与结果归属](../../../knowledge/fe/browser/browser-worker-tasks.md)
