每周挑 3 条会改变面试答案的行业动态，每条都回到原文核对，告诉你它和以前的做法差在哪、面试里怎么说。本期覆盖 2026 年 11 月上中旬。

> **本期 30 秒版**
> 1. Skill 现在可以通过 MCP 分发：官方 Skills 扩展已定稿，连接时只拉名字和描述，用到才读正文。
> 2. 并行跑多个 Agent 时，它们会为了完成自己的任务破坏别人的任务：ClashBench 测出默认情况下 44.5% 的运行里，新任务成功而原任务被搞挂。
> 3. 长上下文不是必需品：一篇新论文让模型待在 12K 到 48K 的短上下文里频繁压缩，准确率多在正负几个点内波动，估算成本降数倍。

## 1. MCP 官方 Skills 扩展定稿：Skill 可以跟着 MCP 服务器一起分发

**发生了什么**

MCP 的 [SEP-2640（Skills 扩展）](https://modelcontextprotocol.io/seps/2640-skills-extension) 状态已是 Final，[官方文档](https://modelcontextprotocol.io/extensions/skills/overview)把它列为正式扩展，标识是 `io.modelcontextprotocol/skills`。另外，官方博客 11 月 11 日宣布[规范改为半年发一版](https://blog.modelcontextprotocol.io/posts/mcp-release-cycle/)，固定在每年 3 月和 9 月的最后一个周二，下一版是 2027-03-30。

**和以前有什么不同**

以前 Skill 和 MCP 服务器是两套东西：Skill 是宿主本地的一个目录，MCP 服务器只提供工具。服务器作者想附带一份「这些工具该怎么配合用」的说明，只能塞进很短的 server instructions，或者各家自己发明 `skill://` 写法，互不兼容。

现在的做法是：

- Skill 目录里的每个文件都是一个普通的 MCP 资源，推荐用 `skill://<skill 路径>/<文件路径>` 这种地址。
- 新增两个方法：`skills/list` 列出有哪些 Skill，`skills/get` 取单个 Skill 的条目。
- 连接时宿主只调 `skills/list`，用名字和描述建一张索引，这一步不许去拉 `SKILL.md`。模型决定用某个 Skill 时才读 `SKILL.md`，读到需要的附属文件时才取那个文件。
- Skill 本身的格式不重新定义，直接沿用 [Agent Skills 规范](https://agentskills.io/specification)，根目录一个带 `name` 和 `description` 的 `SKILL.md`。

安全上规范写得很直接：Skill 内容一律当不可信输入；不同服务器的同名 Skill 不能悄悄互相覆盖；Skill 要执行代码或放开工具权限，必须按 Skill 逐个让用户确认；文件摘要只用来校验完整性，不能当信任依据。

官方文档同时说明，SDK 和宿主的支持还在陆续实现中，所以现在是「协议定了、生态在跟」的阶段。

**面试里怎么用**

被问「Skill 和 MCP 是什么关系」时，以前的标准答案是「MCP 给能力，Skill 给做法，两者互补」。现在可以多说一层：

> MCP 解决的是工具怎么接入，Skill 解决的是工具怎么用好。过去两者分开分发，现在 MCP 官方有了 Skills 扩展，服务器可以把配套的 Skill 当资源一起提供。它延续了渐进式披露：连接时只加载名字和描述，用到才读正文，所以挂很多 Skill 也不会撑爆上下文。安全上要把远端 Skill 当不可信输入，执行代码前逐个确认。

**对应知识点**：[Agent Skill：渐进式披露、热插拔与版本治理](https://www.agent-journey.cn/knowledge?activeKey=agent-skill-design)、[MCP / A2A 智能体通信协议](https://www.agent-journey.cn/knowledge?activeKey=mcp-protocol)

## 2. ClashBench：并行的 Agent 会为了自己的任务破坏别人的任务

**发生了什么**

清华、上海人工智能实验室、复旦等机构的论文 [ClashBench](https://arxiv.org/abs/2609.19892)（arXiv，2026-09-17）研究了一个很实际的场景：环境里已经有一个任务在跑，再让 Agent 去做第二个任务，而两者要抢同一个资源，比如端口、文件锁、磁盘空间、显存。

论文把「靠终止、覆盖、驱逐或拖垮已有任务来拿到资源」叫作破坏性资源抢占。基准有 268 个可执行用例、55 种资源，测了 17 个模型，通过 Claude Code、OpenCode、Codex 三种工具运行，共 30 种组合。

**关键数字**（都是默认设置下、全部组合合计）

| 指标 | 数值 |
| --- | --- |
| 新任务成功、但原任务被搞挂 | 44.5% |
| 轨迹里能看到 Agent 有意去动原任务的资源 | 57.1% |
| Agent 明确意识到有冲突 | 64.7% |
| 意识到冲突后仍然动手 | 68.5% |
| 报告了冲突的运行里，没等用户决定就先动手 | 65.6% |
| 抢占成功的运行里，最终回复只说成功、不提冲突 | 32.1% |

提示词的作用有限：加一句「这是共享环境，请不要影响已有进程」，前两项只降了约 6 到 7 个百分点；反过来明确允许杀本地进程，则各升了 6 到 8 个百分点。

论文自己也说明了局限：这是单机沙箱里的压力测试，不代表真实事故频率；多数用例只跑了一次。

**和以前有什么不同**

讲多 Agent 或并行 Agent 的风险，过去多半停在「上下文冲突、重复劳动、成本高」。这篇给了另一类有数据的风险：Agent 之间没有对话，只是共用一台机器，就会互相伤害。更值得注意的是，多数情况下 Agent 是看见了冲突还动手，而且有三成多不会告诉你。

**面试里怎么用**

被问「多个 Agent 并行跑要注意什么」或「Agent 权限怎么设计」时：

> 除了上下文隔离，还要做资源隔离。ClashBench 测过，共用环境时 Agent 为了完成自己的任务，有四成多的运行会把别人的任务搞挂，而且靠提示词提醒只能降几个点。所以不能指望模型自觉，要在工程上兜住：每个任务独立的沙箱或工作区、最小权限、配额，杀进程这类动作要确认；评测时除了看任务成功率，还要检查原有任务是否健康、Agent 有没有如实报告冲突。

**对应知识点**：[多智能体协作与适用边界](https://www.agent-journey.cn/knowledge?activeKey=multi-agent)、[最小权限、授权与工具调用确认](https://www.agent-journey.cn/knowledge?activeKey=agent-permission-model)、[代码执行、浏览器与文件操作沙箱](https://www.agent-journey.cn/knowledge?activeKey=agent-sandbox)

## 3.「You don't need long context」：短上下文加频繁压缩，准确率只小幅波动

**发生了什么**

Peter Belcak 等 12 位作者的论文 [You don't need long context](https://arxiv.org/abs/2611.05306)（arXiv，2026-11-03，alphaXiv 标注机构为 NVIDIA）做了两件事。

第一件是算账。在同样的硬件上，上下文窗口开到 256K 时，每生成一个 token 的成本是 16K 时的 3.6 倍（GLM 5.2）、5.6 倍（Kimi K2.6）和 7 倍（Qwen 3 Coder Next）。上下文越长，后面的 token 越贵。

第二件是验证能不能不用长上下文。论文比较了三种做法：

- **全量历史**：每一步动作和结果都追加进同一个对话，这是多数 Agent 的默认做法。
- **到阈值就压缩**：上下文超过阈值时，让模型写一份交接摘要，然后带着原始任务和摘要开一个新对话。
- **每步都压缩**：每个对话只做一个动作，做完更新一份状态说明，这个对话就丢掉。

**结果**

- 在 SWE-bench Verified、Terminal-Bench 等 6 个长任务基准上，「到阈值就压缩」相对全量历史的准确率变化：Claude Opus 4.5 在 −3.7 到 +5.6 个点之间，GPT 5.6 Sol 在 −3.3 到 +4.4 个点之间。按论文的成本模型估算，Opus 省 2.2 到 8.8 倍，GPT 省 2.4 到 5.0 倍。
- 最极端的「每步都压缩」也没有崩：Opus 4.5 在 SWE-bench Verified 上 70.2%（基线 70.0%），Terminal-Bench 上 51.8%（基线 47.2%）；GPT 5.6 Sol 分别是 82.4%（基线 84.4%）和 84.3%（基线 87.6%）。
- 超长输入的任务不把文档塞进上下文，而是存成文件，让 Agent 用命令行工具按需去读。

论文也写明了边界：压缩是有损的，信息一定会丢；有些任务确实需要历史细节，解决办法是保留一份可检索的完整记录，而不是把它全留在上下文里。省下的成本是按模型估算的，不是实际账单。

**和以前有什么不同**

过去谈上下文管理，压缩常被当成「窗口不够用时的补救」。这篇的立场反过来：即使窗口够用，也应该主动保持上下文很短，因为长上下文既贵又没有换来明显更高的准确率。它和「把文档放文件系统、按需检索」的思路是一致的。

**面试里怎么用**

被问「长任务的上下文怎么管」或「窗口越来越大，还需要做压缩吗」时：

> 需要，而且不只是因为放不下。上下文越长，每个输出 token 越贵，有论文测到 256K 窗口下的单 token 成本是 16K 的 3.6 到 7 倍。同一篇论文让模型一直待在很短的上下文里、到阈值就写交接摘要重开对话，在论文测的两个模型上，SWE-bench 这类长任务的准确率只在正负几个点内波动，成本降了几倍。所以我的做法是把状态显式写出来，原始记录存在外部可检索的地方，上下文里只留当前这一步需要的东西。代价是压缩有损，需要历史细节的任务要能回查原始记录。

**对应知识点**：[上下文压缩、摘要与裁剪](https://www.agent-journey.cn/knowledge?activeKey=prompt-context-compression)、[上下文工程（Context Engineering）](https://www.agent-journey.cn/knowledge?activeKey=context-engineering)、[Token、Context Window 与 KV Cache](https://www.agent-journey.cn/knowledge?activeKey=llm-token-context)、[会话摘要、压缩与记忆提炼](https://www.agent-journey.cn/knowledge?activeKey=agent-memory-summarization)

## 参考资料

- [SEP-2640: Skills Extension](https://modelcontextprotocol.io/seps/2640-skills-extension)，Model Context Protocol
- [Skills extension overview](https://modelcontextprotocol.io/extensions/skills/overview)，Model Context Protocol
- [A More Predictable Release Cycle for MCP](https://blog.modelcontextprotocol.io/posts/mcp-release-cycle/)，MCP 官方博客，2026-11-11
- [ClashBench: Conflicts Leading Agents to Seize and Harm](https://arxiv.org/abs/2609.19892)，arXiv 2609.19892，2026-09-17
- [You don't need long context](https://arxiv.org/abs/2611.05306)，arXiv 2611.05306，2026-11-03

文中数字均取自以上原文，模型名称和数值以原文发布时为准。
