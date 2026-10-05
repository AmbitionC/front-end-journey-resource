字节跳动 · 抖音相关 Agent 开发 · 一面。部门与经历为作者自述，招聘阶段未明确；以下整理真实记录的问题，回答为教学归纳。题目里的产品预设会单独澄清，不据此认定厂商停止某项技术。

<details data-knowledge-key="agent-resume-interview">
<summary>（1）怎样做自我介绍？</summary>
</details>

围绕目标岗位说明背景、职责和可验证的工程实践，保留能解释的技术边界。不能把一次模型调用或跟随教程的示例夸大为完整生产 Agent。

<details data-knowledge-key="agent-project-portfolio">
<summary>（2）怎样介绍项目并应对深挖？</summary>
</details>

从任务、输入输出、完成判据讲到运行状态、工具权限、失败与回归测试，区分个人设计和依赖框架。记录未列出深挖的逐项问法，不能追加假想问题冒充原题。

<details data-knowledge-key="agent-run-loop">
<summary>（3）开发 Agent 时采用什么流程，为什么这样设计？</summary>
</details>

说明观察状态、选择下一步、校验并执行工具、接收结果与判断终态的循环，再解释何处使用确定工作流、何处允许模型规划。停止条件、错误恢复和预算要落到运行时，不能仅用框架名称解释流程。

<details data-knowledge-key="agent-project-portfolio">
<summary>（4）项目设计借鉴过哪些产品，怎样说明？</summary>
</details>

如实列出参考的产品行为或公开实现，讲清借鉴了哪种机制、为何适合当前任务以及自己如何验证。相似界面不证明架构相同，不能声称复刻了未公开的内部系统。

<details data-knowledge-key="agent-architecture">
<summary>（5）模型与 Agent 有什么区别？</summary>
</details>

模型根据输入产生文本或结构化请求；Agent 系统还管理任务状态、工具执行、权限、反馈和停止条件。模型提出调用不代表已经执行，Agent 的能力来自模型与运行时及环境的组合，也不必总采用多 Agent。

<details data-knowledge-key="agent-skill-design">
<summary>（6）本地工具、MCP 工具与 Skill 分别是什么？</summary>
</details>

本地工具是运行时直接提供的能力，MCP 通过标准协议发现和调用服务器能力，Skill 是按需加载的任务说明与资源组织方式。Skill 可以指导使用本地或 MCP 工具，但它本身不授予权限；三者可以组合而不是互相替代。

<details data-knowledge-key="agent-skill-design">
<summary>（7）“Anthropic 不继续做 MCP 而转向 Skill”这个说法如何判断？</summary>
</details>

原问题含未经证实的前提。当前官方 Claude Code 文档同时提供 MCP 接入和 Skill 机制，不能据此说 MCP 已被放弃；协议连接能力与任务知识组织解决不同问题。讨论演进应引用具体版本或官方公告，不能把采用 Skill 等同于停止 MCP。

<details data-knowledge-key="agent-skill-design">
<summary>（8）Skill 中可以包含工具吗？</summary>
</details>

Skill 可附脚本与其他资源，也能指导调用现有工具；可执行脚本仍由运行时选择、检查并执行。附带脚本不自动获得执行权，工具清单、输入和副作用应遵守宿主的权限规则。

<details data-knowledge-key="agent-memory-architecture">
<summary>（9）Claude Code 的记忆怎么组织，上下文等于记忆吗？</summary>
</details>

当前文档区分 CLAUDE.md 中的项目指令与自动记忆文件，自动记忆用索引及按需读取的主题文件组织。只有实际加载的部分进入本轮上下文；外部持久文件、会话状态和当前上下文不是同一对象。目录及加载限制随版本变化，应以当前官方说明为准。

<details data-knowledge-key="rag-code-retrieval">
<summary>（10）为什么 Claude Code 不用 RAG 而用 grep，这个前提成立吗？</summary>
</details>

原题“不用 RAG”的前提应按具体版本与官方说明核验，不能假定永久成立。精确符号、报错和文件名适合词法检索，直接搜索还减少预建索引的更新与同步成本；语义模糊查询则可能需要其他召回方式。不能把“使用 grep”写成某产品永远不用任何检索增强，也不能把 RAG 仅定义为向量数据库。

<details data-knowledge-key="agent-memory-architecture">
<summary>（11）怎样回答“有没有了解最新的记忆设计”？</summary>
</details>

给出自己确实读过的方案与日期，比较写入规则、检索、更新、权限和评测，不列一串名称冒充理解。“最新”不是稳定结论；可用 checkpoint、审阅过的事实文件和按需证据检索说明不同层如何组合，但不虚构项目已采用。

<details data-knowledge-key="agent-skill-design">
<summary>（12）手写题：按 .agents/skills 下 YAML 配置与 scripts/*.js 实现注册、发现和调用，怎样设计？</summary>
</details>

这是题目指定的自定义目录契约，不是官方 Skill 格式。扫描并解析 YAML，校验唯一 ID、说明和脚本路径后建注册表；发现返回能力描述，调用再按 ID 验证输入与权限，选择受控脚本执行并记录结果。不要 eval 配置或仅凭路径字符串执行任意文件，异常与版本冲突须明确返回。

## 参考资料

以下资料用于核对教学短答，滚动文档核验于 2026-10-03；不作为候选人现场作答的证据。

- [Claude Code：Memory](https://code.claude.com/docs/en/memory)
- [Claude Code：Skills](https://code.claude.com/docs/en/skills)
- [Claude Code：MCP](https://code.claude.com/docs/en/mcp)
- [Claude Code：Best practices](https://code.claude.com/docs/en/best-practices)
