字节跳动 · 全栈偏前端 · 实习一面。经历与项目规模为候选人自述，未独立证实；以下问题按记录归纳，短答为教学整理。记录中的不正确解释在短答中澄清，不当作面试官答案。

<details data-knowledge-key="agent-resume-interview">
<summary>（1）怎样做自我介绍？</summary>
</details>

围绕岗位说明相关学习背景、工程经历和承担的职责，用一个可验证结果承接后面的项目讨论。没有做过的部分明确说明，避免把团队工作全算成个人成果。

<details data-knowledge-key="agent-project-portfolio">
<summary>（2）项目来源是什么？</summary>
</details>

说明项目来自课程、开源、实习业务还是自主需求，分别列出复用和独立设计的部分。来源本身不决定质量，能解释取舍、复现行为并提供证据才有助于继续深挖。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（3）怎样讲清双引擎渲染的项目难点？</summary>
</details>

把难点落到同一坐标系下的渲染、交互和数据同步：谁拥有状态，哪层绘制什么，缩放或拖动怎样同步，如何用 trace 与交互指标验证改动。原文没给完整实现，不能替候选人补造架构或收益。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（4）Canvas 与 X6 怎样渲染和分层？</summary>
</details>

先说明项目真实使用的渲染方式，再划分绘制层、可交互图形层和统一数据状态；保持相同坐标变换、层级与命中规则。Canvas 像素绘制与图形库的元素、事件管理不同，X6 的具体行为依版本和配置，不能仅凭库名认定某一实现。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（5）视口裁切为什么有用，怎样用千节点压测验证？</summary>
</details>

只在离屏内容确实占用显著绘制或布局成本时裁切，并为拖动方向保留预加载余量。固定图规模、视口、设备与动作，比较可见对象数、帧耗时和交互延迟，检查快速拖拽是否缺内容；千节点是记录中的测试规模，不是必要裁切的通用阈值。

<details data-knowledge-key="browser-worker-tasks">
<summary>（6）为什么将 CPU 计算放到 Web Worker？</summary>
</details>

Worker 在独立执行环境计算，能减少长计算对页面主线程的阻塞，但不保证总计算更快。数据传输和调度也有成本，Worker 不能直接操作 DOM；普通异步网络等待不需要因为“异步”就搬到 Worker。

<details data-knowledge-key="algorithm-graph">
<summary>（7）业务中的“最小割集”在算什么？</summary>
</details>

先明确业务对象、失效或断开的判定，以及“最小”是包含关系极小还是代价最小；这两个含义不能混用。记录未给出完整业务模型，所以不能直接套某个图算法。若讨论图上的割，应说明删除哪些点或边会破坏目标连通条件。

<details data-knowledge-key="browser-worker-tasks">
<summary>（8）连续提交计算怎样保证最新结果，setTimeout 的 await 如何让出事件循环？</summary>
</details>

给任务递增 ID，只提交仍对应最新 ID 的结果；取消还需 Worker 在分片边界让出 task 并检查标记。await Promise.resolve 只续接微任务，可能继续饿死消息；await new Promise(resolve => setTimeout(resolve, 0)) 先让 timer task 执行 resolve，再由微任务续接 await 后的代码；因此跨过一个 task 边界，但不保证零延迟或每次必绘制。

<details data-knowledge-key="agent-project-requirements">
<summary>（9）个人项目为何做，是否有真实用户？</summary>
</details>

分别说明需求来源、独立承担的范围和是否真实使用，以可核验反馈支持后续改动。原帖只记录这些问题，没有给用户规模；不得把演示、课程练习或朋友试用扩写成稳定线上业务。

<details data-binding-status="pending_semantic_verification">
<summary>（10）Monorepo 的范围是什么？</summary>
<p>关联知识点待核实。</p>
</details>

先列出仓库实际有哪些应用与共享包，以及依赖、构建和测试的边界；单仓库不等于一个部署单元。Workspace 管包间引用，任务图决定哪些包受变更影响；共享代码也需要 API 和版本边界，不能只因为文件在一起就任意互相导入。

<details data-knowledge-key="jwt-auth">
<summary>（11）为什么选择 access token 与 refresh token？</summary>
</details>

访问令牌限制资源访问的生命周期，刷新令牌在允许范围内换取新的访问令牌，以平衡频繁重新登录和泄漏风险。两者用途和接收端不同，不要求都为 JWT；双令牌不是安全保证，服务端会话等方案也可以满足需求。

<details data-knowledge-key="jwt-auth">
<summary>（12）两个 token 怎样获得，存在哪里？</summary>
</details>

认证或授权成功后由可信服务签发，按用途返回。浏览器方案可将访问令牌保存在内存，把刷新凭据放在受限的 HttpOnly、Secure Cookie，并设计 SameSite/CSRF 防护；具体选择取决于跨站需求，HttpOnly 不阻止 XSS 发起已登录请求。

<details data-knowledge-key="jwt-auth">
<summary>（13）刷新时一定会返回新的 refresh token 吗？</summary>
</details>

取决于服务端策略。采用轮换时每次刷新颁发新刷新令牌、废止旧值并保留令牌族关系，用于检测重放；OAuth 公共客户端需要轮换或发送方约束。不能从“双 token”一词推断项目必然实现了轮换。

<details data-knowledge-key="jwt-auth">
<summary>（14）无感刷新怎样处理并发请求？</summary>
</details>

把一次刷新变成共享中的 Promise，过期请求等待同一次刷新完成后再有界重试。刷新失败统一进入重新认证，不能对所有 401 无限刷新；多标签页轮换还需协调，并区分请求失败与非幂等业务操作是否已执行。

<details data-knowledge-key="web-attack">
<summary>（15）单 token 是否可行，“爬虫拿到 refresh token”与 HttpOnly 有什么关系？</summary>
</details>

单令牌或服务端会话可以成立，应按生命周期与撤销需求比较。普通远程爬虫没有理由能直接读取用户浏览器的 Cookie 或 Storage；HttpOnly 主要限制脚本读取 Cookie，却不能阻止 XSS 借浏览器发请求，也不单独防 CSRF，泄漏后的刷新凭据仍需撤销与重放检测。

<details data-knowledge-key="agent-memory-architecture">
<summary>（16）LangGraph checkpoint 如何注册，消息什么时候进入状态？</summary>
</details>

编译图时传入 checkpointer，调用时提供 thread_id；节点返回状态更新，由 reducer 合并。完整快照在 super-step 边界保存，并可记录步内已完成节点的 pending writes；不会因为注册 checkpointer 就自动把任意变量或消息放进上下文。内存 saver 也不等于重启后可恢复的持久存储。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（17）为什么做埋点？</summary>
</details>

先定义要回答的业务或体验问题，例如哪一步被放弃、哪些设备交互变慢，再决定事件和指标。没有决策用途的事件会增加网络、存储和隐私成本；采集范围应最小化，并保留事件语义、版本与去重规则。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（18）PV、UV 和性能指标分别怎样统计？</summary>
</details>

PV 按已定义的页面或路由访问事件计数，UV 在明确时间窗口按允许使用的主体标识去重，不代表精确自然人数。性能指标来自浏览器计时与观测接口；区分 SPA 路由事件、完整文档导航和客户端重发，避免重复计数或上传个人内容。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（19）常见页面性能指标分别表示什么？</summary>
</details>

FCP 描述首次内容绘制，LCP 描述最大内容元素的呈现，CLS 描述意外布局位移，INP 描述交互到下一次呈现的响应。它们测量不同阶段，不能把 FCP 当应用全部可用时间，也不能用单次测试代表真实用户分布。

<details data-knowledge-key="frontend-performance-diagnostics">
<summary>（20）Vue 应用怎样上报 FCP？</summary>
</details>

观察浏览器的 paint 条目并选择 first-contentful-paint，使用 buffered 读取已产生条目，按支持情况降级。FCP 属于文档绘制时间线，不是在 mounted 中现读 performance.now；SPA 每次路由切换也不自动生成新的文档 FCP。上报要去重并避免携带敏感 URL 参数。

<details data-knowledge-key="agent-project-portfolio">
<summary>（21）项目用了 AI 或课程代码吗，怎样说明独立工作？</summary>
</details>

如实标明课程、AI 辅助和复用代码的范围，解释自己承担的需求、验证和修改。能读懂、运行并维护代码比把生成部分包装成全手写更有价值；原文没有给比例，不能补造独立研发程度。

<details data-knowledge-key="promise">
<summary>（22）手写并发任务调度器怎样明确契约？</summary>
</details>

先约定输入是惰性任务函数、并发上限、结果顺序和错误策略，再用共享索引或队列让有限工作者领取任务。任务启动才调用函数，完成后释放槽位；Promise.all 本身不提供限流，取消也需传给底层操作。

<details data-knowledge-key="algorithm-graph">
<summary>（23）怎样把依赖任务分成可并行批次？</summary>
</details>

校验 ID 与依赖后，用入度找当前为零的整批任务；这一批结束才释放出边，下一批再加入新零入度节点。输出不足全部节点说明有环；同批是否真能并行还要检查共享资源和副作用，而不是只看数据依赖。

<details data-knowledge-key="agent-resume-interview">
<summary>（24）实习、课程与入职时间怎样回答？</summary>
</details>

如实说明课程约束、学校要求、可入职时间和能承诺的持续周期，不替自己或学校作未获确认的保证。岗位安排需要双方具体讨论，原文的个人背景不延展成对其他学生的通用要求。

## 候选人反问（原记录）

<details data-knowledge-key="agent-project-requirements">
<summary>（25）反问：团队对实习生三个月的预期产出是什么？</summary>
</details>

原记录只自述回答为“具体产出看个人表现”，未给统一指标。可进一步对齐任务范围、指导方式、验收与阶段反馈；教学建议不是该次面试官已经提出的追加问题。

## 参考资料

以下资料用于核对教学短答，滚动文档核验于 2026-10-03；不作为候选人现场作答的证据。

- [MDN：Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- [RFC 9700：OAuth 安全实践](https://www.rfc-editor.org/rfc/rfc9700.html)
- [MDN：Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
- [LangGraph：Checkpointers](https://docs.langchain.com/oss/python/langgraph/checkpointers)
- [MDN：PerformancePaintTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformancePaintTiming)
- [pnpm：Workspace](https://pnpm.io/workspaces)
