公司：小红书；方向：AI全栈开发实习；轮次：二面。面试日期和部门未披露，不能由其他同岗记录补成暑期招聘。本文选录工具服务选择与AI开发形态两题；答案和案例均为编辑教学补充。

<details data-knowledge-key="mcp-protocol">
<summary>（1）Skill、Tool 和 MCP 有何区别，自建供 AI 调用的服务时怎样选择？</summary>
</details>

Tool是可执行动作及输入输出合同，MCP是宿主与服务发现、调用能力的协议，Skill是某类任务的可复用做法。它们可以组合：服务暴露受控Tool，通过MCP接入，Skill再说明何时怎样使用；不必在三者之间做互斥选择。

[MCP当前架构](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)把Host、Client、Server与tools/resources/prompts分开；[Agent Skills规范](https://agentskills.io/specification)则规定说明文件和可选资源的组织。一个描述任务步骤，另一个约定能力交互，职责不同。

教学例子：内部知识服务实现`search_docs`工具，定义query、允许范围和结果Schema；需要多个宿主标准化接入时，以MCP暴露。另做“基于资料答复”的Skill，规定先检索、再核对版本、证据不足时说明缺口。Skill调用工具，却不能因为正文写了“允许访问”就扩大数据权限。

只有当前应用内部使用的小函数，可以直接作为本地工具集成；需要跨进程、跨宿主发现与互操作时再评估MCP的版本和治理成本。选择依据是调用方、部署、认证和复用需求，而非哪个名字更新。

延伸阅读：[MCP / A2A 智能体通信协议](../../../knowledge/llm/agent/mcp-protocol.md)。

<details data-knowledge-key="agent-coding">
<summary>（2）AI 编程工具开发与网页问答式开发有何区别和好处？</summary>
</details>

关键区别是获得哪些环境信息、能否执行受控工具并读取反馈，而不只是界面在哪里。仅粘贴文本的问答通常由人搬运代码和错误；具备仓库读取、修改与测试能力的Agent可形成检查、打补丁、验证的闭环，但仍需审查改动与权限。

不要把“网页”一概当成没有工具：网页产品也可能连接仓库和执行环境。比较时列出实际能力，再看谁负责把建议变成补丁、谁运行测试、谁检查最终结果。[SWE-bench的任务设置](https://www.swebench.com/original.html)说明仓库状态和可执行测试为何比一段孤立代码更接近真实开发任务。

教学例子：修复分页重复记录时，文本问答可以解释可能原因；带环境的Coding Agent则有机会定位查询、构造重复案例、修改排序并运行测试。好处来自更短的反馈回路，不保证建议一定正确，也不说明某款产品目前就具备全部这些能力。

验收仍看实际diff、原失败样例与回归结果。若工具没有运行权限或环境缺依赖，应报告未验证，不能用模型说“测试通过”替代真实执行记录。

延伸阅读：[Coding Agent 的架构与执行循环](../../../knowledge/llm/agent/agent-coding.md)。

## 参考资料

- [mcp-architecture](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)。
- [mcp-tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)。
- [skill-spec](https://agentskills.io/specification)。
- [swe-bench](https://www.swebench.com/original.html)。
- [evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)。
