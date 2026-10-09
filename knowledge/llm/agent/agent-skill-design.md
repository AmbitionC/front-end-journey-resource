Skill 是把「某类任务该怎么做」固化下来、供 Agent 按需加载的能力封装。它既不是一次性的提示词，也不是工具协议：提示词工程设计指令、示例、输出格式与上下文，Skill可以封装并复用其中的做法，MCP 解决工具怎么接进来，而 Skill 解决**做法本身的复用与治理**——可版本化、可组合、可评测。

## Skill、提示词工程、MCP 与 RAG 的分工

四个概念常被混谈，但各自解决不同层面的问题：

| 概念 | 解决的问题 | 作用层面 |
|---|---|---|
| 提示词工程 | 怎样设计指令、示例、格式与上下文 | 可用于一次或一类任务的交互设计 |
| **Skill** | **这类任务该怎么做，且能复用** | 一类任务的做法沉淀 |
| MCP | 外部工具与数据怎么标准化接入 | 连接与发现协议 |
| RAG | 私域事实从哪来、如何接地 | 上下文的事实供给 |

一句话概括：**MCP 管「怎么连」，Skill 管「怎么做」，RAG 管「拿什么事实」，提示词工程管「怎样设计交互」**。它们可以叠加——一个 Skill 完全可以规定「先用 RAG 查内部规范，再调某个 MCP 工具落库」。

与[上下文工程](context-engineering.md)的关系：上下文工程关心「窗口里放什么」，Skill 是其中一种**可寻址、可按需调入**的内容单元。

## 渐进式披露：让上下文预算与 Skill 数量解耦

朴素做法是把所有 Skill 正文都塞进 System Prompt，Skill 一多上下文就爆。渐进式披露（progressive disclosure）把加载拆成层次，用多少读多少：

1. **元信息层（常驻）**：只加载每个 Skill 的名称 + 描述，几十 token，作为「目录」供模型判断要不要用。
2. **正文层（命中后）**：确定使用后才加载完整说明书——步骤、规范、判断标准。
3. **资源层（按需）**：正文引用的参考文件、脚本、模板，真正需要时才读取或执行。

效果是**常驻开销 ∝ Skill 数量 × 一行描述**，而非 × 整篇正文；挂 100 个 Skill 仍然可控。这与上下文工程里的 JIT 加载是同一思想在「能力」维度的应用。

### 懒加载的可执行链路

“按需加载”不能只停在把正文晚一点读。一次可审计链路包含：

1. **发现**：从受信任注册表读取 `skill_id`、描述、版本、入口、权限与内容哈希；
2. **候选召回**：先用规则、标签或检索得到小候选集，禁止模型凭空指定未注册 Skill；
3. **精排与阈值**：结合任务、当前状态和冲突项选择；低置信时澄清或不用 Skill；
4. **正文加载**：只读取命中版本的主说明，引用资源继续按需加载；
5. **完整性与来源校验**：校验版本、hash、签名/发布者、依赖和许可证，拒绝运行期被替换的内容；
6. **权限绑定**：Skill 只能请求声明过的工具，真正授权仍由执行层按用户和资源判断；
7. **记录与评测**：Trace 保存候选、选择原因、最终版本、读取资源和结果，便于回归与回滚。

缓存元信息时用 registry revision 或 ETag 失效；正文缓存键包含 `skill_id@version + contentHash`。常规兼容更新后，在途 Run 可固定旧版本，新 Run 才看到新索引；紧急安全撤销则按策略暂停或取消相关任务并核对已产生的副作用，避免一半流程使用旧规则、一半使用新规则。

## 热插拔：不重启地新增、更新与下线

热插拔的关键在于**索引与正文分离**——只有索引常驻，所以增删改代价小且可回滚：

1. **发现**：扫描 skill 目录或注册中心，读取清单（名称、描述、版本、入口、依赖）。
2. **校验**：schema 校验，检查名称唯一、版本合法、依赖可满足；不合法直接拒绝装载，不影响已有 Skill。
3. **注册**：把元信息写入路由索引，正文不加载。
4. **生效**：原子替换索引条目（要么成功要么回滚）；常规升级可让在途任务使用已绑定旧版本，新任务使用新版本。
5. **卸载**：从索引移除；常规下线可等待在途任务结束后释放，紧急安全撤销须另按策略暂停或取消并核对副作用。

## 版本治理：升级不破坏历史任务

动态 Skill 最大的风险是「今天改了说明书，昨天的任务无法复现」。做法是**不可变版本 + 显式绑定**：

- 语义化版本，**已发布版本不可变**，升级即发布新版本而非原地覆盖。
- 任务开始时记录所用 `skill_id@version` 并在整个运行期 pin 住，以锁定制品这一项变量；模型、依赖、数据和外部工具状态也需记录，不能因此保证整个任务可复现。
- 保持向后兼容契约：名称、描述语义、输入输出结构不随意改；破坏性变更升 major 并保留旧版一段时间。
- 灰度放量 + 秒级回滚；升级前跑路由评测与端到端回归。

依赖同理：在清单中**显式声明**依赖的工具、其它 Skill 及版本范围，装载时做依赖解析与环检测，缺依赖即拒绝装载。设计上倾向扁平、少依赖——Skill 之间尽量通过明确的输入输出协作，而非深度耦合的调用链。

## 什么样的 Skill 算高质量

- **描述具判别性**：一句话说清「什么时候用、什么时候不用」。这是路由准确率最大的杠杆——多数选不对的问题，根因都在描述写得不够可区分。
- **单一职责**：一个 Skill 只解决一类任务；大而全既难路由又难维护。
- **步骤可执行**：给出明确流程与判断标准，而不是笼统建议。
- **边界清晰**：写明前置条件、不适用场景、失败时的处理。
- **可评测**：配套用例，能量化回答「这次改动让它变好了吗」。
- **上下文经济**：正文精炼，重资料下沉到资源层按需读取。

规模化后如何提升选中率（召回、准确、F1），属于路由问题，见[工具发现、选择与路由](agent-tool-selection.md)——Skill 选择与工具选择在工程上是同一套两段式检索 + 精排方法。

## SkillHub 的发布与运行门禁

当 Skill 从团队内文件扩展成可共享的 SkillHub 资产，治理对象就不只是说明书，还包括它能执行的代码、依赖与权限。一个可落地的发布链路可以分成三道门：

1. **不可变制品**：发布包携带 `skill_id`、版本、内容哈希、作者、许可证、依赖、工具和权限声明；相同版本不允许覆盖，便于复现与追责。
2. **发布前验证**：先做 schema、依赖闭包、许可证和危险调用静态检查，再在隔离环境运行一组正常、越权与失败恢复用例；只有输出契约和安全策略同时通过才进入仓库。
3. **运行时约束**：任务启动时固定制品哈希，按最小权限授予工具，记录调用审计；常规升级可让已开始任务继续使用原制品，避免混用版本；紧急安全撤销要按策略暂停或取消在途任务并核对副作用，不能一概继续。

这套机制把“能找到一个 Skill”和“敢在生产环境运行它”分开：前者由检索与路由解决，后者由供应链校验、沙箱执行、权限控制和审计共同保证。

## MCP 与 Skill 可同时存在

MCP 组织宿主与服务器的能力发现和调用，Skill 组织按需加载的任务知识、说明及资源。当前官方 Claude Code 文档同时提供[MCP 接入](https://code.claude.com/docs/en/mcp)与[Skill 扩展](https://code.claude.com/docs/en/skills)（2026-10-03实际核验），因此不能把“转向 Skill”推成“已停止 MCP”。厂商是否停止项目需要具体公告，机制分工本身不证明产品战略。

## 自定义 YAML 注册表不等于官方格式

若教学手写题指定 .agents/skills/<id>/ 下 YAML 和 scripts/*.js，就按题目建立一个自定义系统：解析配置、校验唯一 ID 与描述、限定可用脚本，再生成注册表；发现阶段提供元数据，调用阶段才检查输入和执行权限。官方 Claude Code Skill 以其文档规定的 SKILL.md 与资源组织为准，不能把自定义 YAML 标成官方必要格式。

路径字符串拼接不能代替边界检查：脚本实际目标需留在允许目录，符号链接不能悄悄跳到外部，未知 ID、重复 ID、缺失资源和解析错误应显式失败。不要 eval YAML 或以 shell 拼接方式执行任意配置；受控执行还需限时、退出状态和副作用记录。Skill 可以指导使用工具或附带脚本，却不能授予宿主尚未授权的能力。

教学追问：发现时是否应该执行全部脚本？通常只加载元数据，避免发现动作产生副作用；同名 Skill 更新时旧任务该用哪版？应绑定任务开始时的版本；配置把脚本路径指向仓库外怎么办？拒绝或走明确的独立授权，不能仅凭配置已被解析就执行。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [阿里云 Agent 开发秋招一面（2026 年 8 月）](../../../interview/alibaba/ai/alibaba-ai-1.md)
- [蚂蚁 Code Agent 与 Agent 应用两轮面试（2026 年 4 月）](../../../interview/antfin/ai/antfin-ai-2.md)
- [腾讯 AI 应用开发面试：跨会话记忆与多 Agent（2026 年 4 月）](../../../interview/tencent/ai/tencent-ai-4.md)
- [OPPO IT 开发一面：ReAct、MCP 与智能问数（2026 年 8 月）](../../../interview/oppo/ai/oppo-ai-3.md)
- [小红书部分（小红书与百度合并记录）：LangGraph、Skill 与工程校验（2026 年 8 月发帖）](../../../interview/redbook/ai/redbook-ai-2.md)
- [字节 Managed Agent 校招一面：评测、运行链路与后端基础（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-26.md)
- [蚂蚁智能体与大模型应用一面：幻觉、Skill 与 RAG（2026 年 5 月）](../../../interview/antfin/ai/antfin-ai-5.md)
- [大疆创新 AI Agent 开发面经：容错、Token 与后端基础（2026 年 8 月）](../../../interview/dji/ai/dji-ai-1.md)
- [字节 Agent 开发一面：上下文工程、协作与编程基础（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-19.md)
- [腾讯后端 AI 开发实习面试（2026 年 4 月）](../../../interview/tencent/ai/tencent-ai-3.md)
- [字节 Agent 暑期实习一面：摘要、工具预算与链表（2026 年 7 月）](../../../interview/bytedance/base/bytedance-base-27.md)
- [字节 Agent Infra 校招：运行时、MySQL 与 LRU（2026 年 9 月）](../../../interview/bytedance/base/bytedance-base-25.md)
- [腾讯 Agent 项目二面：记忆、RAG 与 MCP（2026 年 5 月）](../../../interview/tencent/ai/tencent-ai-2.md)
- [蚂蚁 AI 开发一面：协作式 Agent、交付门禁与后端基础（2026 年 8 月）](../../../interview/antfin/ai/antfin-ai-4.md)
- [OPPO AI 全栈一面：AI Coding、Skill 与数据结构（2026 年 8 月）](../../../interview/oppo/ai/oppo-ai-1.md)
- [深信服 Agent 开发一面：MCP、多 Agent、安全与网络（2026 年 8 月）](../../../interview/sangfor/ai/sangfor-ai-1.md)
- [快手主站 SRE 一二三面：Agent Skill、性能排障与数据链路（2026 年 4 月）](../../../interview/kuaishou/ai/kuaishou-ai-5.md)
- [字节 Agent 开发一面：Skill、MCP 与后端基础（2026 年 7 月）](../../../interview/bytedance/base/bytedance-base-15.md)
- [蚂蚁后端 AI 开发一面：Agent、Redis 与短链系统（2026 年 4 月）](../../../interview/antfin/ai/antfin-ai-3.md)
- [快手大模型应用 Java 实习一面：Agent、SkillHub 与 Vibe Coding（2026 年 8 月）](../../../interview/kuaishou/ai/kuaishou-ai-1.md)
- [腾讯 Agent 实习一面：RAG、工具与通信（2026 年 3 月发帖）](../../../interview/tencent/ai/tencent-ai-10.md)
- [字节剪映 AI 前端一面：Agent 运行时、MCP 与性能](../../../interview/bytedance/base/bytedance-base-30.md)
- [字节 AI 应用一、二面：MySQL、Redis 与编程基础](../../../interview/bytedance/base/bytedance-base-36.md)
- [字节抖音Agent一面：Skill、MCP与记忆](../../../interview/bytedance/base/bytedance-base-39.md)
- [字节 Agent 实习：异步消息、上下文与容器隔离](../../../interview/bytedance/base/bytedance-base-41.md)
- [字节 AI 全栈实习：记忆提炼、群聊搜索与 AI Coding](../../../interview/bytedance/base/bytedance-base-48.md)
- [字节 Agent：AI Coding、技能设计与模型工程](../../../interview/bytedance/base/bytedance-base-49.md)
<!-- interview-source-history:end -->

## 参考资料

- [Anthropic — Agent Skills](https://www.anthropic.com/news/skills)
- [Model Context Protocol — Specification](https://modelcontextprotocol.io/specification/2025-11-25)
- [Anthropic Engineering — Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
