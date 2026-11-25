2026 年 11 月是 MCP 发布两周年。11 月 24 日，Anthropic 宣布 Claude 和 Claude Code 支持三项 MCP 能力：服务器可以自带 Skill，可以跑长时间的后台任务，可以在执行中途向用户要信息。放在一起看，MCP 服务器不再只是提供「一问一答」的工具：它能教 Agent 怎么用、能干耗时的活、能停下来问人。

> **本期 30 秒版**
> 1. Skills over MCP 进入公测：MCP 服务器可以把「这些工具该怎么配合用」的说明作为 Skill 一起提供，连接时只加载名字和描述。
> 2. Tasks 对 Pro、Max、Ultra 正式可用：一次工具调用可以变成一个后台任务，服务器先返回任务编号，客户端之后轮询或订阅结果，任务中途还能回头向用户要输入。
> 3. Elicitation 对 Pro、Max、Ultra 正式可用：服务器可以在执行中向用户提问，分表单和跳转链接两种方式。密码、密钥、支付信息不许走表单，必须走链接。

## 1. Skills over MCP：服务器自带使用说明

**发生了什么**

Anthropic 的公告 [MCP servers can now ship skills, run tasks, and more with Claude](https://claude.com/resources/articles/skills-over-mcp-tasks-and-more)（2026-11-24）里，Skills over MCP 在 Claude 和 Claude Code 进入公测，Pro、Max、Ultra 套餐默认开启，Team 套餐需要管理员打开，Enterprise 标注为即将支持。

公告解释了为什么需要它：工具的名字和描述只能告诉模型「这个服务器能做什么」，说不清「遇到某类具体场景该怎么做」。Skill 补的就是后一半。

协议层面，它是 MCP 的一个官方扩展，标识为 `io.modelcontextprotocol/skills`，对应的提案 SEP-2640 已定稿。[扩展文档](https://modelcontextprotocol.io/extensions/skills/overview)里几条关键规则：

- 服务器实现 `skills/list` 和 `skills/get` 两个方法，Skill 里的文件通过读取资源的方式获取。
- 宿主不许提前拉取用不到的文件。读了 `SKILL.md` 不等于激活了这个 Skill。
- Skill 内容一律当不可信输入。Skill 要在宿主执行代码或放开工具权限，必须按 Skill 逐个取得用户同意。
- 用户的同意绑定在这个 Skill 的整组文件和摘要上，文件一有增删改，同意就失效。文档特别说明，摘要只保证内容和服务器清单一致，不代表内容可信。
- 建议单个 Skill 不超过 512 个文件、16 MiB。

文档同时说明，各家 SDK 和宿主的支持还在陆续实现中。

**和以前有什么不同**

以前 Skill 是装在本地的目录，和 MCP 服务器分开分发。服务器作者想告诉模型「先调 A 再调 B」，只能写进很短的服务器说明或工具描述里。现在 Skill 可以跟着服务器走，更新也由服务器控制。

**面试里怎么用**

被问「MCP 工具很多，模型不会用怎么办」时：

> 工具描述只能说清每个工具是干什么的，说不清多个工具怎么配合。现在 MCP 有了官方的 Skills 扩展，服务器可以把使用流程写成 Skill 一起提供，Claude 已经公测支持。它是渐进式披露的：连接时只拉名字和描述，用到才读正文，所以不会撑爆上下文。安全上要把远端 Skill 当不可信输入，执行代码或放开权限要逐个让用户确认，而且确认绑定文件摘要，内容一变就要重新确认。

**对应知识点**：[Agent Skill：渐进式披露、热插拔与版本治理](https://www.agent-journey.cn/knowledge?activeKey=agent-skill-design)、[MCP / A2A 智能体通信协议](https://www.agent-journey.cn/knowledge?activeKey=mcp-protocol)

## 2. Tasks：把一次工具调用变成后台任务

**发生了什么**

同一份公告里，Tasks 在 Claude 和 Claude Code 对 Pro、Max、Ultra 套餐正式可用，Team 和 Enterprise 在陆续开放。

它也是一个 MCP 扩展，标识为 `io.modelcontextprotocol/tasks`。按[扩展文档](https://modelcontextprotocol.io/extensions/tasks/overview)，流程是这样的：

1. 客户端在请求里声明自己支持这个扩展。文档强调，不要给没有声明支持的客户端返回任务。
2. 对一个耗时的请求，服务器不直接给结果，而是返回一个任务：任务编号、当前状态、有效期、建议的轮询间隔。任务在响应发出前就已经持久化。
3. 客户端用 `tasks/get` 轮询。轮询是默认方式，也可以选择订阅通知。
4. 任务有五种状态：进行中、需要输入、已完成、失败、已取消。后三种是终态。
5. 状态变成「需要输入」时，客户端通过 `tasks/update` 把用户的回答交回去，不需要另开连接。
6. `tasks/cancel` 可以请求取消，但取消是协作式的：服务器收到意图，不保证真的停下。

文档列的适用场景包括 CI 流水线、批处理、审批、对接外部作业系统、网络不稳定的环境。

**和以前有什么不同**

以前 MCP 的工具调用基本是同步的：发出请求，一直等到结果回来，连接断了就可能前功尽弃（2025 年 11 月的规范里有过实验性的任务支持）。耗时几分钟以上的操作，要么超时，要么服务器作者自己发明一套「先返回编号再查询」的工具。现在这套模式有了标准写法，Agent 可以先去做别的，之后回来取结果。

**面试里怎么用**

被问「Agent 调用的工具要跑很久怎么办」时：

> 不要让 Agent 同步等。标准做法是把调用变成一个任务：服务器先持久化任务并返回编号和轮询间隔，Agent 继续做别的，之后轮询或订阅状态。MCP 现在有官方的 Tasks 扩展，状态分进行中、需要输入、完成、失败、取消，中途需要用户确认时走「需要输入」状态，把回答提交回去就能继续。要注意两点：任务带有效期，要在有效期内把结果取走；取消只是请求，服务端不保证停，所以有副作用的操作要自己做幂等和补偿。

**对应知识点**：[MCP / A2A 智能体通信协议](https://www.agent-journey.cn/knowledge?activeKey=mcp-protocol)、[事件驱动 Agent 与异步编排](https://www.agent-journey.cn/knowledge?activeKey=agent-event-driven)、[工作流状态、检查点与断点续跑](https://www.agent-journey.cn/knowledge?activeKey=agent-workflow-state)

## 3. Elicitation：执行到一半向用户要信息

**发生了什么**

Elicitation 同样对 Pro、Max、Ultra 套餐正式可用。它不是扩展，是 MCP 核心规范的一部分，作用是让服务器在执行中途向用户要信息或确认。

按[规范](https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation)，它有两种方式：

| 方式 | 怎么做 | 适合什么 |
| --- | --- | --- |
| 表单 | 服务器给出一份字段定义，客户端渲染成表单让用户填 | 选项、数量、日期这类普通信息 |
| 链接 | 把用户带到一个外部网址去完成操作，客户端看不到用户在那边填了什么 | 登录授权、支付、任何敏感信息 |

规范里的硬性要求值得记：

- 服务器不许用表单方式索取密码、API 密钥、访问令牌、支付凭证，这些必须走链接方式。
- 表单的字段只能是扁平的基本类型（字符串、数字、布尔、枚举，枚举可以多选），不支持复杂的嵌套结构。
- 客户端必须显示是哪个服务器在提问，必须提供明确的拒绝和取消选项；跳转前必须显示目标域名和完整网址并取得同意，不许预先加载或自动打开链接。
- 用户的回应分接受、拒绝、取消三种。链接方式下，「接受」只表示用户同意去操作，不表示操作已经完成。
- 服务器要核实打开链接的人就是发起请求的那个用户，防止钓鱼。

**和以前有什么不同**

以前工具缺参数或需要确认时，只能返回一段文字让模型转述给用户，再由模型把用户的回答重新组织成参数。这条路经过模型两次，既可能转述错，也让敏感信息进了上下文。Elicitation 让服务器通过客户端的界面直接问用户，敏感内容走链接方式，不经过客户端和模型。

**面试里怎么用**

被问「工具执行到一半需要用户补充信息或确认，怎么设计」时：

> 我不会让模型来回转述。MCP 的 Elicitation 允许服务器在执行中直接向用户提问，分两种：普通信息用表单，客户端按字段定义渲染；敏感信息比如登录和支付，必须用跳转链接，在服务方自己的页面完成，客户端和模型都看不到内容。客户端这边要标明是谁在问、给出拒绝选项、跳转前显示域名。这样既减少了模型转述出错，也避免了密钥进上下文。

**对应知识点**：[MCP / A2A 智能体通信协议](https://www.agent-journey.cn/knowledge?activeKey=mcp-protocol)、[Human-in-the-loop 审批与人工接管](https://www.agent-journey.cn/knowledge?activeKey=agent-human-in-loop)、[最小权限、授权与工具调用确认](https://www.agent-journey.cn/knowledge?activeKey=agent-permission-model)

## 还要知道的几件事

- 公告里还预告了文件上传：把 PDF、表格、图片直接交给服务器，不经过上下文窗口。它在 Claude 里是「即将开放」；MCP 两周年文章的说法是，工作组正在为文件上传和下载的扩展做原型。
- Anthropic 在公告里说，这些能力属于开放的 MCP 规范及其扩展，支持它们的服务器在任何兼容的客户端里都能用，不限于 Claude。
- MCP 官方博客的[两周年文章](https://blog.modelcontextprotocol.io/posts/mcp-turns-two/)给了规模和计划：SDK 累计下载刚过 50 亿次，其中超过 45 亿次来自最近一年，下一版规范计划在 2027 年 3 月发布。Anthropic 公告另称，SDK 月下载超过 7 亿次，Claude 可用的 MCP 连接器超过 1 万个。

之前 Skills 扩展刚定稿时的介绍见 [MCP 与上下文：Skill 进了 MCP、并行 Agent 抢资源、短上下文也够用](https://www.agent-journey.cn/knowledge?activeKey=frontier-weekly-2026-11-25)。

## 练一练

### 高频考点题 1：Skill 的加载时机

按 MCP 的 Skills 扩展，宿主连接到一个提供 Skill 的服务器时，应该怎么做？

- A. 把所有 Skill 的全部文件一次性下载，再放进上下文里备用
- B. 自动执行每个 Skill 里附带的脚本，提前验证它能不能正常跑
- C. 先拿到 Skill 的名字和描述等信息，用到时再读正文和附属文件
- D. 把 Skill 的内容视为可信的系统指令，和系统提示词同等对待

**答案：C。** 扩展要求渐进式披露，宿主不许提前拉取用不到的文件。Skill 内容要当作不可信输入处理，执行代码或放开权限必须逐个取得用户同意，所以既不能一次性全量加载，也不能自动执行或默认信任。

### 高频考点题 2：任务的取消

在 MCP 的 Tasks 扩展里，客户端发出取消请求后，下面哪种理解正确？

- A. 取消是协作式的，服务器收到意图但不保证一定停下
- B. 取消是强制的，服务器必须立刻终止并回滚所有副作用
- C. 取消只是暂停，等待一段时间之后任务会自动重新开始
- D. 取消只对已经完成的任务有效，进行中的任务不能取消

**答案：A。** 扩展文档写明取消是协作式的，服务器确认收到意图，但没有义务真的停止工作。所以有副作用的长任务要自己设计幂等和补偿，不能指望取消来兜底。

### 高频考点题 3：敏感信息怎么收集

MCP 服务器在执行中需要用户完成登录授权。按 Elicitation 规范应该怎么做？

- A. 用表单方式让用户填写密码，由客户端渲染后交回给服务器
- B. 让模型在对话里询问用户的密码，拿到之后再转交给服务器
- C. 把预先认证好的访问令牌直接写在链接里，用户点开就能用
- D. 用链接方式带用户到外部页面完成，客户端看不到填写的内容

**答案：D。** 规范禁止用表单方式索取密码、密钥、令牌和支付凭证，这类信息必须走链接方式，在服务方的页面上完成。链接里也不许带用户的敏感信息或预先认证的凭证。

## 参考资料

- [MCP servers can now ship skills, run tasks, and more with Claude](https://claude.com/resources/articles/skills-over-mcp-tasks-and-more)，Anthropic，2026-11-24
- [Two Years of MCP Builders](https://blog.modelcontextprotocol.io/posts/mcp-turns-two/)，MCP 官方博客，2026-11-24
- [Skills extension overview](https://modelcontextprotocol.io/extensions/skills/overview)，Model Context Protocol
- [Tasks extension overview](https://modelcontextprotocol.io/extensions/tasks/overview)，Model Context Protocol
- [Elicitation](https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation)，Model Context Protocol 规范

文中数字均取自以上原文，模型名称和数值以原文发布时为准。
