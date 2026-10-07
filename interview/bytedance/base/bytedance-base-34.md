字节跳动 · 财经保险方向 AI／全栈实习 · 一面。面试经历为候选人自述，未独立证实；问题经归纳，回答独立整理，团队工具使用比例和个人结果不作为技术事实。

<details data-knowledge-key="agent-resume-interview">
<summary>（1）自我介绍怎样连接到项目能力？</summary>
</details>

用与岗位相关的经历说明负责内容、关键约束和验证结果，给面试官可继续深挖的技术线索。时间、贡献和数据应可核实，不把团队工作都归为个人，也不把模型生成代码数量当成能力证明。

<details data-knowledge-key="agent-project-requirements">
<summary>（2）为什么做这个项目，功能怎样设计？</summary>
</details>

从用户痛点、现有办法和限制定义目标，再把功能写成输入、输出与验收条件。先验证一条核心使用路径，区分必须能力和后续扩展；不能只用觉得有趣解释技术投入，也不能为技术选择反推需求。

<details data-binding-status="pending_semantic_verification">
<summary>（3）整体模块怎样划分，本地数据怎样存？</summary>
<p>关联知识点待核实。</p>
</details>

按数据所有权与变化路径区分导入、校验、存储和展示，说明哪些操作留在设备、哪些依赖外部服务。统一状态来源并定义更新通知和冲突处理；local-first 不等于完全离线，网络依赖与故障行为仍需明确。

<details data-knowledge-key="rag-loader-parser">
<summary>（4）OCR 怎样调用，识别后如何恢复课表结构？</summary>
</details>

先保存原图与位置，再利用文字、坐标及表格关系映射课程字段，校验时间、重复项和必填信息。低置信或冲突内容交给用户确认，保留回查依据；OCR 输出是可能出错的观测，不能直接当作结构完整的事实。

<details data-knowledge-key="data-formats">
<summary>（5）Excel 和图片导入怎样统一中间格式？</summary>
</details>

不同解析器先转成同一草稿 Schema，统一课程、时间、地点、来源与校验错误，再让用户确认后写入。Schema 约束字段和类型，业务规则另做检查；保留原始来源以便修复，不让展示层承担格式清洗。

<details data-binding-status="pending_semantic_verification">
<summary>（6）怎样判断网站是不是纯静态？</summary>
<p>关联知识点待核实。</p>
</details>

看请求是否直接返回构建好的 HTML、脚本和资源，运行时是否需要服务器渲染或业务 API。静态部署的页面仍可请求动态数据，所以应分别说明部署产物和业务依赖，不能只凭使用某种前端框架判断。 [Vite：构建产物与资源路径](https://vite.dev/guide/build.html)。

<details data-knowledge-key="browser-navigation-rendering">
<summary>（7）输入 URL 后到页面显示经历什么？</summary>
</details>

浏览器结合缓存和网络完成地址解析、连接与 HTTP 请求，接收资源后解析 HTML 和样式，执行脚本并进行布局、绘制与合成。脚本、样式和网络可能影响关键路径；具体请求不一定每次都重做 DNS 和 TCP，缓存、复用及协议都会改变过程。

<details data-binding-status="pending_semantic_verification">
<summary>（8）前端产物是什么，直接从本地打开为什么会缺内容？</summary>
<p>关联知识点待核实。</p>
</details>

常见构建生成 HTML、脚本、样式及静态资产，部署需要正确的资源路径和服务配置。直接用 file URL 打开可能遇到模块、安全来源、相对路径或 API 配置问题；应使用受控本地服务复现，并根据实际网络错误定位。 [Vite：构建产物与资源路径](https://vite.dev/guide/build.html)。

<details data-binding-status="pending_semantic_verification">
<summary>（9）页面动画怎样实现，底层效果如何解释？</summary>
<p>关联知识点待核实。</p>
</details>

先说实际使用的 CSS、Web Animations、Canvas 或渲染库，再说明时间推进和每帧状态怎样转成画面。区分自己实现与复用库，基于 Performance 观察脚本、布局和绘制成本；不能只回答由 AI 写出，也不能把 requestAnimationFrame 视为固定帧率保证。 [MDN：requestAnimationFrame 的刷新率与后台行为](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)。

<details data-knowledge-key="agent-coding">
<summary>（10）重新开发代码修改助手时，怎样与 AI Coding 协作？</summary>
</details>

先确认需求、仓库边界和验收，再检查现有实现、比较方案、完成小范围补丁并验证。把可复现错误和约束反馈给模型，用独立复核检查 diff 和测试；不能仅给大目标后接受整份生成代码，也不应把所有环境故障当代码问题。

<details data-knowledge-key="prompt-structured-output">
<summary>（11）模型输出混入 Markdown 等格式时怎样约束？</summary>
</details>

优先使用所选接口支持的结构化输出，并在程序端解析、Schema 校验和业务校验。格式错误返回明确失败或受限重试；不要用随意删字符把错误变成成功，也不能把合法 JSON 当作内容真实或有权执行的证明。 [OpenAI：工具调用与应用侧执行](https://developers.openai.com/api/docs/guides/function-calling)。

<details data-knowledge-key="algorithm-loop">
<summary>（12）怎样生成 keep、delete、add，让 old 行数组变成 new？</summary>
</details>

先确认是否要求最少操作及相同行的判定。若只允许保留、删除和新增，可用最长公共子序列作为保留骨架，回溯输出删除和新增；常见二维动态规划为 O(nm)，大文件需另选算法。重复行也要按序列位置处理，不能逐行按相同下标比较。

## 候选人反问（原帖记录）

<details data-knowledge-key="agent-skill-map">
<summary>（13）反问：怎样理解学习重点与团队 AI Coding 实践？</summary>
</details>

询问岗位实际交付、代码验收、维护、安全和协作要求，再据此补充原理与工程能力。候选人转述的内部使用比例和个人建议不能当成行业统一事实；准备重点是能解释、验证和维护交付，而不是复述比例。

## 参考资料

以下资料用于核对整理短答；滚动文档核验于 2026-10-03。

- [Vite：构建产物与资源路径](https://vite.dev/guide/build.html)（滚动文档）
- [MDN：requestAnimationFrame 的刷新率与后台行为](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)（浏览器 API）
- [OpenAI：工具调用与应用侧执行](https://developers.openai.com/api/docs/guides/function-calling)（滚动文档）
