字节跳动 · Agent 全栈 · 一面。经历与面试反馈为候选人自述，招聘阶段未明确；以下按记录归纳问题，短答为独立教学整理。原文只给出 utbench 名称，不能据此认定其身份、公开实现或评价规则。

<details data-knowledge-key="agent-resume-interview">
<summary>（1）怎样做自我介绍？</summary>
</details>

用岗位相关背景、项目职责和一个可核验结果建立后续讨论范围，不替团队或他人认领成果。对于未参与的环节，说明知道的机制与自己实际完成的工作之间的边界。

<details data-knowledge-key="agent-eval-framework">
<summary>（2）项目中的 utbench 怎样衡量模型生成效果？</summary>
</details>

先澄清这个项目实际生成什么、样本和环境怎样固定，再检查可执行结果、语义质量与失败切片，必要时用人工校准自动判分。原记录未说明 utbench 的身份或实现，不能从名称推断某个公开基准的指标或替作者补报成绩。

<details data-knowledge-key="mysql-index">
<summary>（3）多表查询和慢 SQL 怎样定位并改善？</summary>
</details>

先拿到实际 SQL、表结构、数据分布和执行计划，检查连接条件、扫描行数、选择性、排序与临时结果，再用相同参数验证索引或查询改写。仅增加索引不保证更快，也不能在未确认语义时删掉连接条件或改变结果。

<details data-knowledge-key="agent-run-loop">
<summary>（4）Agent 怎样调用工具？</summary>
</details>

模型或确定规则先产生结构化调用请求，运行时校验名称、输入、身份和预算，再执行工具并把带状态的结果交回下一步。业务成功还需检查外部结果，不能把模型输出 JSON 或自然语言“完成了”当作执行证据。

<details data-binding-status="pending_semantic_verification">
<summary>（5）Agent 还有哪些工具调用方式？</summary>
<p>关联知识点待核实。</p>
</details>

可直接调用本地适配器，通过 MCP 接服务器，或由确定工作流触发 API、检索和受控脚本。模型 function calling 负责表达请求，传输或适配层负责执行；选型取决于能力发现、部署、权限与可观测性，而不是仅看调用名称。

<details data-knowledge-key="mcp-protocol">
<summary>（6）怎样判断是否需要工具，MCP 解决什么问题？</summary>
</details>

判断现有上下文是否足以回答，是否需要外部事实、计算或动作；调用后仍要验证结果。MCP 标准化宿主/客户端与服务器的能力发现和交互，降低重复适配，但不决定何时调用、不赋予权限，也不保证工具内容可信。

<details data-knowledge-key="prompt-context-compression">
<summary>（7）上下文满了怎样压缩？</summary>
</details>

先区分可删冗余、必须保留的约束与可按需重取的证据，结合截断、摘要、外部存储和检索管理预算。摘要要保留来源、未完成状态、错误和关键参数；压缩不可逆，需回归检查任务是否丢条件，不能默认总结后信息无损。

<details data-knowledge-key="rag-pipeline">
<summary>（8）RAG 的流程是什么？</summary>
</details>

索引侧把资料解析、切分并建立可更新的索引；查询侧检索、权限过滤、重排和组装证据，再生成可追溯回答。索引更新与删除也是流程的一部分，不只是“把向量塞给模型”。

<details data-knowledge-key="embedding-basics">
<summary>（9）Embedding 与向量检索怎样衔接？</summary>
</details>

文档和查询用兼容的 Embedding 表示，索引按设定距离找近邻，再结合元数据过滤和必要重排回到原文。近似索引可能漏候选，相似度也不能代替真实性与权限检查，模型或预处理变更要考虑受影响索引的迁移。

<details data-knowledge-key="agent-memory-architecture">
<summary>（10）Agent 的记忆如何管理，存在哪里？</summary>
</details>

当前任务状态可用 checkpoint，已核事实可保存在受控文件或数据库，大量证据可按需检索。介质由查询、恢复、更新和权限需求决定；写入保留来源与版本，检索先授权，删除需传播到缓存和派生索引。

<details data-knowledge-key="multi-agent">
<summary>（11）多 Agent 怎样协作、管理上下文并传递任务状态？</summary>
</details>

先定义可验证子任务、负责者、依赖和交付物，通过结构化状态事件推进调度；每个 Agent 只接收必要上下文与证据引用。汇合检查版本和结果，明确冲突、失败与取消规则；共享一个不断增长的聊天记录不能代替状态协议。

<details data-knowledge-key="agent-eval-framework">
<summary>（12）怎样量化多 Agent 的流程与生成效果？</summary>
</details>

固定任务、环境和成功判据，分别看最终环境结果与各节点轨迹、交付物、等待、成本和失败。与更简单的单 Agent 或确定工作流在同条件下比较，保留切片和不确定性；Agent 数量及调用次数不能直接当质量。

<details data-knowledge-key="algorithm-interval-scheduling">
<summary>（13）手写：怎样合并所有重叠区间？</summary>
</details>

先按起点排序，维护结果末段；新区间起点不超过末段终点就扩展终点，否则另开一段。原题是闭区间，因此端点相接也合并。排序占 O(n log n)，扫描 O(n)，注意空输入、包含和重复区间；这不同于选择最多不重叠区间。

<details data-knowledge-key="algorithm-linked-list">
<summary>（14）手写：带输入输出的 LRUCache 怎样做到平均 O(1) get/put？</summary>
</details>

用哈希表定位节点、双链表维护最近使用顺序；get 命中和 put 更新都移到最近端，新插入超容量就淘汰最旧节点并删哈希项。输入输出壳应按给定协议解析并保持操作顺序，原文没有说明具体序列化格式，不能自补为某种标准；O(1) 是在哈希平均访问条件下的复杂度。

## 参考资料

以下资料用于核对教学短答，滚动文档核验于 2026-10-03；不作为候选人现场作答的证据。

- [MCP：架构](https://modelcontextprotocol.io/docs/learn/architecture)
- [Claude Code：MCP](https://code.claude.com/docs/en/mcp)
- [LangGraph：Checkpointers](https://docs.langchain.com/oss/python/langgraph/checkpointers)
