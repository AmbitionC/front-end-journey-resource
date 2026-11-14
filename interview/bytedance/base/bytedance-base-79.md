记录自述为字节中国交易与广告方向 AI 全栈实习一面，作者表示希望进入二面。帖子发表于 2026 年 11 月 7 日，实际面试日期未注明，经历未获企业独立证实。仅整理已见文字；项目实现、框架版本及 `pi` 的准确身份没有披露，相关问题保留待补。

以下短答是编辑整理的复习思路，不代表当事人的现场回答、实际架构或面试结果。

<details data-binding-status="pending_semantic_verification"><summary>（1）项目整体架构是什么？为什么选择这些技术和框架？Spring AI 和 pi 的职责有什么区别？</summary><span>关联知识点待核实。</span></details>
<p>项目事实与关键词待补：原文没有给出实际架构、依赖版本，也没有说明 pi 是哪个项目或组件，不能替作者分配它与 Spring AI 的职责。应先补充依赖标识、模块输入输出、个人负责范围和选型证据，再比较能力与边界；本组保持未绑定，不以同名产品代填。</p>

<details data-knowledge-key="agent-memory-architecture"><summary>（2）上下文和项目记忆做了哪些建设？多 Agent 之间如何协作？</summary></details>
<p>先区分当前上下文、可恢复任务状态与带来源的长期记忆，按权限和预算选择需要加载的内容。多 Agent 通过明确的任务、输入输出与证据合同协作，共享可变记忆还需版本和冲突处理；原文没有记录实际建设，不能把这套教学设计说成作者项目。 <a href="../../../knowledge/llm/agent/agent-memory-architecture.md">知识详解</a> · <a href="../../../knowledge/llm/agent/multi-agent.md">协作取舍</a></p>

<details data-knowledge-key="mcp-protocol"><summary>（3）MCP 是怎么接入的？MCP 和 A2A 有什么区别？</summary></details>
<p>先固定协议版本与传输，核对服务器身份、实际能力、参数和授权，再验证一次调用及错误处理。MCP 规范工具、资源等外部能力交互，A2A 面向智能体之间的任务协作，远端 Agent 内部也可以使用 MCP；协议名相同不保证版本兼容，原项目接入方式仍未披露。 <a href="../../../knowledge/llm/agent/mcp-protocol.md">知识详解</a></p>

<details data-knowledge-key="agent-tool-selection"><summary>（4）MCP 暴露的工具太多会带来什么问题？能否在工具注册阶段处理？</summary></details>
<p>全部 schema 进入上下文会增加输入量和相似能力的混淆，可在受控注册表保存清晰描述、版本与适用边界，再按当前身份和任务提供少量候选。注册时校验不等于调用时授权，用户、资源和权限变化后仍须重新检查；分层发现与按需加载是宿主设计选择，不能冒充所有 MCP 服务的自动能力。 <a href="../../../knowledge/llm/agent/agent-tool-selection.md">知识详解</a></p>

<details data-knowledge-key="agent-skill-design"><summary>（5）有了 MCP 和 A2A，为什么还需要 Skill？Skill 的实现机制是什么？</summary></details>
<p>MCP 负责外部能力交互，A2A 负责智能体任务互操作，Skill 则封装可复用的任务做法、说明和资源，三者可以组合。以 Agent Skills 格式为教学例子，先发现名称和描述，命中后读 SKILL.md 正文，再按需取参考资料或脚本；加载说明不会自动授予工具权限，也不证明原项目采用该格式。 <a href="../../../knowledge/llm/agent/agent-skill-design.md">知识详解</a></p>

<details data-knowledge-key="agent-skill-design"><summary>（6）如果有几百个 Skill，怎么减少上下文占用？领域划分不清、选错领域或者任务跨领域时怎么办？</summary></details>
<p>让小目录或检索候选先进入上下文，只加载必要正文和资源，并测量目录本身的开销。领域可多标签召回，跨域任务按依赖拆分；初选不适用时保留原目标与已完成动作，在允许目录内有界重选或澄清，避免重复执行。用跨域、错域和无匹配用例同时验证任务成功、token 与延迟，不能只报告压缩比例。 <a href="../../../knowledge/llm/agent/agent-skill-design.md">知识详解</a></p>

<details data-knowledge-key="llm-cost-optimize"><summary>（7）Agent 任务轮次多、Token 消耗大，面对几百上千用户时如何降低成本？</summary></details>
<p>先按任务记录输入、输出、缓存与重试用量，区分单任务耗费和并发总量，再处理无进展循环、重复上下文和过长工具结果。可比较模型路由、稳定前缀缓存、可追溯摘要及适合离线工作的批处理，同时计算检索和摘要的额外成本。所有方案都要在同一任务集检查质量、尾延迟和用户隔离；用户数量本身不能推出固定容量或节省幅度。 <a href="../../../knowledge/llm/production/llm-cost-optimize.md">知识详解</a></p>

<details data-knowledge-key="algorithm-string"><summary>（8）求字符串中最长回文子串的长度，要求 O(N²) 时间复杂度。</summary></details>
<p>枚举每个字符的奇数中心和相邻间隙的偶数中心，在两端相等时向外扩展，更新最大连续子串长度，最坏时间 O(N²)。原题未给字符集、长度范围和空串规则，应先确认计数单位；若教学实现先转 code point 数组，数组额外空间是 O(N)，不能把整个实现说成常数空间，也不能换成最长回文子序列。 <a href="../../../knowledge/data-structure/algorithm/algorithm-string.md">知识详解</a></p>
