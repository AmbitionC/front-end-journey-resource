记录为字节跳动后端 Agent 二面，原帖发布时间为 2026 年 11 月 4 日，实际面试日期与招聘场景未注明。下文区分原文记下的简短回答与编辑教学思路；没有记录的项目事实、算法条件和运行结果继续待补。

<details data-binding-status="pending_semantic_verification"><summary>（1）项目解决什么问题，方案是什么？</summary>
<span>关联知识点待核实。</span>
</details>
<p>原文只记下提问，没有交代业务问题、输入输出、个人负责范围或方案细节。应先补充真实项目事实，再分析为什么这样设计；不能用通用 Agent 案例代替作者项目。</p>

<details data-binding-status="pending_semantic_verification"><summary>（2）项目使用什么框架实现？</summary>
<span>关联知识点待核实。</span>
</details>
<p>原文回答为没有使用 Agent 框架、采用纯 Python；这不表示只用了标准库，也没有证明完整自研运行时。作为编辑复习，可分别检查模型接口、工具、状态、预算与验证职责，但实际依赖和实现未记录，知识关联保持待核实。 <a href="../../../knowledge/llm/agent/build-agent-framework.md">延伸阅读</a></p>

<details data-binding-status="pending_semantic_verification"><summary>（3）Workflow 里的 Agent 节点具体做什么？</summary>
<span>关联知识点待核实。</span>
</details>
<p>原文标为项目深挖，却没有记录该节点的输入、输出、选择条件和控制范围。教学上可以让工作流固定控制边界、Agent 在其中返回受限的结构化选择，再由代码验证；这是一种设计思路，不能据此还原原项目节点，本项待补。 <a href="../../../knowledge/llm/agent/agent-deterministic-workflow.md">延伸阅读</a></p>

<details data-binding-status="pending_semantic_verification"><summary>（4）Agent 中有哪些工具？</summary>
<span>关联知识点待核实。</span>
</details>
<p>原文列出检索和聚类两类工具。检索取得候选材料，聚类依据表示与规则形成分组；具体接口、参数、权限和调用关系没有记录，不能据工具名称扩写完整治理方案，知识关联待核实。 <a href="../../../knowledge/llm/agent/agent-tool-selection.md">延伸阅读</a></p>

<details data-binding-status="pending_semantic_verification"><summary>（5）文本聚类怎样实现？</summary>
<span>关联知识点待核实。</span>
</details>
<p>原文回答为先做文本 Embedding 向量化，再运行聚类算法；没有给出具体模型、算法或参数。编辑思路是固定表示和距离约定、明确分组规则，再回读代表原文检查分组意义与信息遗漏；原项目的具体实现与效果仍需补充。 <a href="../../../knowledge/llm/rag/embedding-basics.md">延伸阅读</a></p>

<details data-binding-status="pending_semantic_verification"><summary>（6）为什么不把检索结果直接作为上下文交给模型？</summary>
<span>关联知识点待核实。</span>
</details>
<p>原文只解释为当时场景对可用模型有限制，没有说明限制对象、对比方案及结果。需要补充实际约束，才能判断为何选择当前方案；不能把这个原因擅自解释成上下文窗口不足，本项保持待补。</p>

<details data-binding-status="pending_semantic_verification"><summary>（7）实现带 TTL 过期的 LRU（LC146 变体），说明链表、哈希与过期时间怎样配合。</summary>
<span>关联知识点待核实。</span>
</details>
<p>原文只记录了 TTL-LRU 变体、链表加哈希以及节点上的过期时间字段，未给出 TTL 起算、访问或更新是否续期、到期边界、清理规则和完整 API。应先补全合同再实现验证；原文还称现场代码没有运行，不能把被查看过等同通过了边界测试，本项保持待补。 <a href="../../../knowledge/cs/algorithm/algorithm-linked-list.md">延伸阅读</a></p>

## 反问中的业务与选型反馈

原文转述面试官称，工作涉及生图、生视频基础设施，以及基于这些能力的营销、短剧场景开发。这是本次交流中的业务介绍，未披露具体团队、系统架构或招聘口径。

对于“更偏传统后端还是 Agent”的反问，原文答复为二者都有；营销任务有时由工作流调用模型能力，依据场景选择做法。编辑复习可结合[确定性 Workflow 与 Agent 的组合](../../../knowledge/llm/agent/agent-deterministic-workflow.md)理解控制边界与复杂度取舍，不据此假定原团队使用某个框架。

面试反馈强调先认真比较方案优劣，并通过分析、调研乃至实验支持决策。它提供了复盘方向，原项目实际比较过哪些方案、获得什么结果仍未记录；不能替作者补写已经完成的实验。

## 技术核对资料

- [Anthropic：Workflow、Agent 与框架选择的基本区别](https://www.anthropic.com/engineering/building-effective-agents)
- [Sentence-Transformers：文本向量聚类的不同路径](https://www.sbert.net/examples/sentence_transformer/applications/clustering/README.html)
