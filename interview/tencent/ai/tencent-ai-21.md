公司：腾讯；来源标明营销方向、后端一面，未明确面试年份。本文选录 Skill 发现与加载、上下文压缩和多路归并三题，省略与技术问题无关的个人事项。原记录没有给宿主实现、压缩指标或代码，以下答案、方案与算例均为编辑教学补充。

<details data-knowledge-key="agent-skill-design">
<summary>（1）Skill 怎样被发现并按需加载？</summary>
</details>

先让 Agent 看到名称、用途和触发边界等少量元信息，选中后再读取对应版本的正文，引用的资料或脚本继续按需取用。发现、读取说明与执行脚本是不同动作；能够发现一个 Skill，不代表它已经执行，也不代表获得了额外工具权限。

[Agent Skills 规范](https://agentskills.io/specification)以 SKILL.md 的元信息、正文和可选资源组织能力；渐进式披露让正文不必全部常驻上下文。教学例子：一个“按仓库规范审查改动”的 Skill，描述说明适用任务；命中后读检查步骤，需要某种语言规则时再读对应参考文件，不在目录扫描时执行所有脚本。

工程实现还应记录选中的版本与内容指纹，区分“没检索到”“选错”“正文步骤没遵循”和“工具执行失败”。可以用适用任务与近似但不适用的反例分别检查触发和执行质量，不能只以 Skill 数量说明系统有效。

加载正文用哪种消息角色、后续请求是否继续携带、何时压缩，属于宿主和协议的实际设计。原帖没有披露这些实现；本题只讲可复用的发现与按需读取机制，不把某个产品的消息布局当统一标准。

延伸阅读：[Agent Skill：渐进式披露、热插拔与版本治理](../../../knowledge/llm/agent/agent-skill-design.md)。

<details data-knowledge-key="prompt-context-compression">
<summary>（2）长工具结果与历史信息怎样压缩，同时保留按需回读能力？</summary>
</details>

完整原文保存在受访问控制的证据记录中，工作上下文只保留继续任务所需的精确字段、摘要和可定位引用。压缩前保护否定、金额单位、时间顺序、未完成动作与授权状态，压缩后逐项核验；需要原话或证据不够时按引用回读，不能靠摘要猜回丢失内容。

例如工具返回很多订单，只问其中某笔的退款状态：可在上下文保存订单 ID、状态、金额单位、来源版本和结果引用，其余记录按需查询。若只剩“订单处理成功”，就会把“查询成功”和“退款已完成”混为一谈；机器需要的状态和操作 ID 应独立保存，不能交给自由摘要改写。

[Anthropic 的上下文工程文章](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)讨论用轻量标识在运行时取回内容，也提醒过度压缩会丢失后来才显得重要的细节。这里的证据记录、版本和保真门是教学设计，不保证任一产品默认如此实现。

历史摘要应标明覆盖范围与来源，用户更正后的值要使旧值失效；后续消息仍保留在未压缩尾部。验证时比较压缩前后继续完成同一任务的事实、约束和引用，而不只计算短了多少。摘要生成与失败重试也消耗资源；没有真实用量和质量对比时，不给节省百分比。

延伸阅读：[上下文压缩、摘要与裁剪](../../../knowledge/llm/prompt/prompt-context-compression.md)。

<details data-knowledge-key="algorithm-heap">
<summary>（3）N 个长度为 M 的升序数组，怎样利用有序性完成归并？</summary>
</details>

用最小堆只保存每一路尚未输出的第一个元素及其路编号、位置。弹出最小头后，只补入同一路的下一项；所有路的后续值都不小于各自当前头，因此下一项必在这些头中。N≥2、M≥1 时通常为 O(NM log N) 时间、O(N) 辅助堆空间；完整输出另占 O(NM)。

若把 L=NM 个元素全放进堆再取出，要做 O(L log L) 的工作并保存 O(L) 个候选，没有利用每路有序。多路归并先收集非空路首项，再线性 heapify；之后堆大小至多为路数，每个元素只引起一次所属路的推进。

教学例子：输入 [1,4] 和 [1,3]，两个 1 都要输出；取出第一路的 1 后补 4，另一条 1 仍在堆里，结果为 [1,1,3,4]。堆条目应保存路与位置，不能只按值去重。[Python 3.13 的 heapq.merge](https://docs.python.org/3.13/library/heapq.html#heapq.merge)也要求各输入已排序并惰性输出；这里讲的是同一归并原理，不要求原题使用 Python。

更完整的复杂度可按初始非空路数 C 写成 O(N+L log(C+1))，另计结果存储；只有一路时仍要花 O(L) 输出，不能把 log 1=0 当成零成本。原帖未规定空输入、稳定顺序或返回形式，这些须在实际接口中明确，不补成原题约束。

延伸阅读：[堆、优先队列与 Top-K](../../../knowledge/cs/algorithm/algorithm-heap.md)。

## 参考资料

- [Agent Skills 规范](https://agentskills.io/specification)。
- [Anthropic：上下文工程、按需取回与压缩](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)。
- [Python 3.13：heapq.merge](https://docs.python.org/3.13/library/heapq.html#heapq.merge)。
- [CPython v3.13.9：heapq.merge 实现](https://raw.githubusercontent.com/python/cpython/v3.13.9/Lib/heapq.py)。
