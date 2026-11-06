公司为美团，岗位方向为 AI 全栈开发，场景为日常实习一面。记录发布时间为 2026 年 4 月 14 日，实际面试日期未注明。以下短答与例子是编辑教学整理，不代表原作者的现场回答、实际架构或某个未说明版本的产品行为；演示过程未记录的具体追问保持待补。

<details data-binding-status="pending_semantic_verification"><summary>（1）项目拷打（具体题目未记录）</summary>
<span>关联知识点待核实。</span>
</details>
<p>项目事实待补：原文只写“项目拷打”，没有具体问题、业务架构、个人贡献或现场回答，不能替作者补出项目经历。原文另提到共享屏幕展示架构、功能、代码和 Cursor 对话记录，但未列出后续追问；这些只作为过程背景，不扩写成额外题目。</p>

<details data-knowledge-key="agent-memory"><summary>（2）短期记忆、长期记忆与搜索场景是什么关系？</summary>
</details>
<p>短期与长期主要区分信息的用途、作用域和生命周期，检索则是把相关内容取回当前任务的一种操作；长期记忆并不必然等于向量库，短期恢复状态也不必只存在进程内存。教学例子是把当前任务约束留在工作上下文，经授权保存的稳定偏好按需检索回来，再核对来源与有效期；记忆保存和本轮实际读取应分开。 <a href="../../../knowledge/llm/agent/agent-memory.md">知识详解</a></p>

<details data-binding-status="pending_semantic_verification"><summary>（3）“龙虾”的记忆机制和项目中的机制有什么区别？</summary>
<span>关联知识点待核实。</span>
</details>
<p>比较对象待补：原文未明确“龙虾”所指产品、版本或配置，也没有给出作者实现，因此无法作可核验的产品对比。编辑教学上可按保存内容、存储与索引、召回、写回删除和权限逐项比较；不能凭昵称认定某个文件布局、数据库或自动记忆行为。</p>

<details data-binding-status="pending_semantic_verification"><summary>（4）剥离“龙虾”的工具后，只比较记忆和检索，有什么区别？</summary>
<span>关联知识点待核实。</span>
</details>
<p>去掉工具接口并不足以确定两套系统的存储和召回机制，原文仍缺产品版本与项目定义。通用编辑区分是：记忆管理信息的保留、更新和有效性，检索按任务从可访问数据中选择候选；例如文件可以保存事实并另外建立索引，但这不是对某一“龙虾”版本的描述。</p>

<details data-binding-status="pending_semantic_verification"><summary>（5）做过哪些智能体项目，是否用到 MCP？</summary>
<span>关联知识点待核实。</span>
</details>
<p>经历待补：原文没有给出具体项目清单、MCP 服务、协议版本或调用证据，不能把编辑熟悉的工具补成作者用过的工具。实际作答应选真实项目，解释一条模型提出调用、宿主校验和服务返回结果的链路，并区分只看过文档与真正接入；这里不据通用知识补写个人事实。</p>

<details data-knowledge-key="agent-skill-design"><summary>（6）Skill 为什么需要渐进式披露？</summary>
</details>
<p>把全部 Skill 正文预先塞进上下文会增加开销、无关信息和选择干扰，渐进式披露先提供用途等元信息，选中后才读正文，再按需取参考或脚本。教学例子是导出任务只加载匹配的报表 Skill，而不预读所有运营手册；目录本身仍占预算，需检查误触发、漏触发与真实任务效果。 <a href="../../../knowledge/llm/agent/agent-skill-design.md">知识详解</a> · <a href="https://agentskills.io/specification">格式规范</a></p>

<details data-knowledge-key="agent-skill-design"><summary>（7）这里所说的 Skill 与 MCP 有什么区别？</summary>
</details>
<p>Skill 组织一类任务的做法、边界与按需资源，MCP 规范宿主和服务之间的能力发现与调用；二者可以组合，不能互相替代业务授权。教学例子是一个 Skill 指导先检索规则，再调用某个获准的 MCP 工具，执行端仍校验主体、资源和参数；不由“加载了 Skill”推断已经获得权限。 <a href="../../../knowledge/llm/agent/agent-skill-design.md">知识详解</a> · <a href="https://agentskills.io/specification">格式规范</a></p>

<details data-knowledge-key="agent-skill-design"><summary>（8）Skill 的渐进式披露怎样实现？</summary>
</details>
<p>按 Agent Skills 格式，可先发现名称和描述等元信息，任务命中后加载对应 SKILL.md，引用的说明、模板或脚本再按需要读取。教学实现还应固定选中版本与内容指纹，限制资源路径和执行权限，并记录加载与调用轨迹；例如发现阶段只登记脚本，不因目录里有脚本就自动运行，具体宿主行为需另核。 <a href="../../../knowledge/llm/agent/agent-skill-design.md">知识详解</a> · <a href="https://agentskills.io/specification">格式规范</a></p>

<details data-knowledge-key="algorithm-linked-list"><summary>（9）LeetCode 21：怎样合并两个有序链表？</summary>
</details>
<p>两条非降序单链表可用哑节点和尾指针合并：每次连接两路较小表头，只推进被选中的一路，最后接上未耗尽余段。教学合同允许改写互不共享、无环输入节点的 next，相等时先取第一路，以保留确定的稳定次序；例如 [1a,2a] 与 [1b,3b] 得 [1a,1b,2a,3b]。时间 O(m+n)、额外空间 O(1)，复用原节点会改变输入拓扑；若要求保留两条原链，应另建结果节点。 <a href="../../../knowledge/cs/algorithm/algorithm-linked-list.md">知识详解</a></p>

<details data-binding-status="pending_semantic_verification"><summary>（10）AI Coding 题（题面未记录）</summary>
<span>关联知识点待核实。</span>
</details>
<p>题面待补：原文只提到还有一道 AI Coding 题，没有需求、输入输出、代码或验收标准，不能借用另一篇面经的题目，也不能把项目演示当作这道题的完整要求。取得题面后再讨论需求澄清、实现与验证；本项暂不补代码、不关联知识或计热。</p>

## 技术核对资料

- [Agent Skills：格式与渐进式披露](https://agentskills.io/specification)
- [MCP 2025-11-25：传输层与能力交互边界](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
