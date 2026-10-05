岗位为后端开发工程师（AI 大模型开发平台），数据平台方向。面试经历为候选人自述，未独立证实；同主题追问合并归纳为 10 组。短答是独立整理的回答原则，不代表候选人的现场作答。

<details data-knowledge-key="agent-prompt-regression">
<summary>（1）做过哪些 Agent 迭代，怎样衡量效果、发现退化并自动评测？</summary>
</details>

把输入、初始环境、允许动作和期望结果组成版本化任务集，既验收最终产物，也检查意图识别、工具选择及关键调用轨迹；与固定基线按场景比较。明确条件用程序判分，开放质量用经过人工校准的裁判；修好一类错例后，还要跑保留的其他场景，避免只看新增案例。[Agent 的任务、轨迹与结果评测](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)。

<details data-knowledge-key="rag-chunking">
<summary>（2）为什么按标题切分文档，短文档也要切片吗，怎样比较整篇输入与切片？</summary>
</details>

先说明原切分造成了哪些证据或结构问题，再决定是否按标题组织；切片也可能服务于定位、权限和预算，不能只按篇幅判断。用同一任务比较整篇输入、结构切片及检索组合，检查证据覆盖、答案正确性和成本；标题边界有助于保留章节，但仍可能切散跨节条件。[文档分块与合并](https://docs.unstructured.io/open-source/core-functionality/chunking)。

<details data-knowledge-key="agent-project-evaluation">
<summary>（3）线上表现与离线评测有什么差异，有效会话、负反馈和自动标注怎样用于评测？</summary>
</details>

先定义有效会话和失败分类，按任务及版本观察真实分布，再把获准保留的负反馈脱敏、复现、审核，回流到开发集或回归集。线上用户与离线样本不同，负反馈也可能有噪声；自动标注要用人工抽查验证，不能把用户不满意直接当成模型错误。

<details data-knowledge-key="agent-eval-framework">
<summary>（4）Coding Agent 和长程任务与简单问答的评测有什么不同，只看最终结果够吗？</summary>
</details>

复杂任务要检查产物可用性、环境终态、动作权限和关键失败路径，例如代码是否通过相应测试、文件是否真实写入。环境结果用于验收目标，轨迹用于定位失败与发现中途违规；最终文本或单个成功标记不能覆盖这些维度。[长程 Agent 的评测](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)。

<details data-knowledge-key="agent-project-portfolio">
<summary>（5）怎样详细介绍自己的语义检索项目？</summary>
</details>

从用户输入、目标标签或对象、数据来源讲到检索和消歧路径，说明自己实现的部分、验证方法及实际局限。用代表性的歧义输入和失败输入解释设计取舍；只陈述做过并能举证的工作，不用技术名词数量代替项目效果。

<details data-knowledge-key="rag-routing">
<summary>（6）同一查询可能指向成语、电影或歌曲时，怎样判断用户意图？</summary>
</details>

结合已确认的会话上下文、对象类型、元数据和检索候选判断；证据不足时澄清，或呈现可区分的候选。路由把请求送到合适索引，不应悄悄改写实体；按歧义类型检查错路由和澄清成本，而不是只看整体检索分数。

<details data-knowledge-key="build-agent-framework">
<summary>（7）手写循环、图编排与 SDK/Harness 怎样取舍，做过哪些调研、哪些能力自研或复用？</summary>
</details>

按实际版本说明调研结果，以及上下文压缩、工具执行、调试能力的自研与复用边界，再比较状态、分支、持久化和恢复需求。简单路径可以手写，依赖与恢复复杂时复用框架更有价值；用同任务验证选择，没做过的调研如实说明，框架仍需要业务授权和验收逻辑。[Agent 执行循环](https://openai.github.io/openai-agents-python/running_agents/)。

<details data-knowledge-key="agent-benchmark">
<summary>（8）怎样拆分通用 Agent 的评测场景，公平比较无法取得后台数据的竞品，并判断执行耗时是否异常？</summary>
</details>

按问答、文档、创作等任务拆分，使用相同且合规的外部任务、输入和可观察成功标准重复比较，记录版本、预算及限制。看不到后台时只评价实际可见的表现；线上反馈和轨迹用于解释本方失败，耗时阈值应随任务约束设置，时间长本身不等于失败。

<details data-knowledge-key="algorithm-trie">
<summary>（9）怎样实现支持 insert、search 和 startsWith 的 Trie？</summary>
</details>

沿字符边逐层创建或寻找节点，在单词末尾记录终止标记。search 要求路径存在且终止标记成立，startsWith 只要求前缀路径存在；按字符长度计通常为 O(L)，空间取决于共享前缀、字符集及子边表示。

<details data-knowledge-key="algorithm-array">
<summary>（10）怎样在线性时间把两个升序数组合成降序数组？</summary>
</details>

从两个数组的末尾开始比较，每次取较大值写入结果并移动对应指针，最后从剩余数组尾部逐个追加元素。每个元素只处理一次，时间 O(n+m)、结果空间 O(n+m)，n、m 为两数组长度；总输入长度若记为 N，也可写 O(N)。先确认重复元素是否保留、是否允许修改输入。

## 参考资料

以下技术资料用于核对整理短答；滚动文档核验于 2026-10-03。

- [Anthropic：Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- [Unstructured：Chunking](https://docs.unstructured.io/open-source/core-functionality/chunking)
- [OpenAI Agents SDK：Running agents](https://openai.github.io/openai-agents-python/running_agents/)
