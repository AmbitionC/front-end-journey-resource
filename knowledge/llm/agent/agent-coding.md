Claude Code、Codex、Cursor 这类 Coding Agent 已经是很多团队的日常工具，站内整理的多篇面试自述也涉及「你怎么用 AI 写代码」「Coding Agent 是怎么工作的」等问题。这篇把它拆开讲：一个 Coding Agent 由哪几块组成，每块解决什么问题，面试时怎么讲出深度。

> **30 秒答法**：Coding Agent 就是让模型在一个循环里反复「读代码、改代码、跑命令、看结果」，直到任务完成。它由五块组成：执行循环、工具（读文件、搜索、编辑、执行命令）、项目说明文件（AGENTS.md / CLAUDE.md）、权限与沙箱、验证（测试和 diff 审查）。模型负责决策，运行时负责执行和把关。判断它做得好不好，不看它说没说完成，看测试结果和最终的 diff。

## 一个最小的执行循环

所有 Coding Agent 的核心都是同一个循环，下面是示意代码：

```python
def run(task, tools, max_turns=50):
    messages = [{"role": "user", "content": task}]
    for _ in range(max_turns):
        reply = model.generate(messages, tools=tools.schemas())
        messages.append(reply)
        if not reply.tool_calls:        # 模型不再调用工具，说明它认为任务完成了
            return reply.text
        for call in reply.tool_calls:
            result = tools.run(call)    # 权限检查、超时、输出截断都在这一层
            messages.append(tool_result(call.id, result))
    raise RuntimeError("超过最大轮数，停止并交给人处理")
```

模型每一轮看到完整的对话和工具结果，决定下一步调用哪个工具；运行时负责真正执行，并把结果交回去。出错也作为结果交回，让模型自己看报错决定怎么修，而不是直接终止。

真实产品在这个骨架上加了很多东西，但做的事情可以概括成四步：

1. **读（Inspect）**：先搜索相关代码、调用方和测试，看 `git status` 知道哪些是用户没提交的改动。
2. **计划（Plan）**：想清楚改哪些文件、怎么验证、哪些行为不能变。
3. **改（Edit）**：小步修改，优先复用已有写法，不顺手重构无关代码。
4. **验证（Verify）**：跑类型检查和相关测试，看 diff，失败就回到第 3 步。

![Coding Agent 从任务和验收标准出发，先读仓库、做计划、建检查点，再进入隔离 worktree 打补丁；依次格式化、类型检查、单元测试和集成测试，失败就修复重测，通过后还要做 diff 审查，最后带着实际改动和验证证据交付](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-coding-repo-loop-v2.dark.png)
*图：测试通过后仍要做 Diff 审查；交付时附上实际改动和验证证据。验证失败就回到打补丁，修完重跑全部检查。*

## 工具：为什么编辑用「片段替换」

Coding Agent 的工具集通常很小：读文件、搜索（按文件名和内容）、编辑文件、执行命令，再加上网页抓取等少数扩展。

编辑工具的设计最值得讲。主流做法不是让模型输出整个新文件，而是让它给出「原文中唯一的一段旧代码」和「替换后的新代码」。这样有三个好处：输出短、省 Token；不会因为模型抄漏一行而误删代码；旧片段在文件里找不到或不唯一时直接报错，模型会先重新读文件，避免在过期的内容上修改。

命令执行要有保护：超时、输出截断（几万行日志直接塞回去会撑爆上下文）、危险命令拦截，以及在隔离环境里运行。

## 项目说明文件：AGENTS.md 与 CLAUDE.md

每次会话都从零了解仓库太慢，也容易漏掉团队约定。现在的通行做法是在仓库根目录放一份给 Agent 看的说明文件，会话开始时自动加载。[AGENTS.md](https://agents.md/) 是多家工具（OpenAI Codex、Cursor 等）支持的开放格式；Claude Code 如何加载 [CLAUDE.md 或 AGENTS.md](https://code.claude.com/docs/en/memory)，取决于当前版本、支持可用性和 Project instructions 配置，应按官方说明核对实际加载的文件，不能仅因缺少 CLAUDE.md 就推断 AGENTS.md 已生效。一个最小的例子：

```markdown
# AGENTS.md

## 常用命令
- 安装依赖：pnpm install
- 跑单个测试：pnpm test -- path/to/file.test.ts
- 类型检查：pnpm typecheck

## 约定
- 新接口统一放在 src/api/，返回值用 Result<T> 包装
- 不要修改 src/generated/ 下的文件，它们由脚本生成

## 提交前
- 必须通过 typecheck 和相关测试
```

写什么最有用：怎么构建和跑测试、目录约定、哪些文件不能动、常见的坑。写成命令和规则，而不是长篇介绍，因为它每次都会占用上下文。

## Plan 模式：先想清楚再动手

复杂任务直接让 Agent 改，常见的结果是改了一大片才发现方向错了。Plan 模式让 Agent 先只读不写：搜索代码、理解调用关系，然后输出一份计划（改哪些文件、为什么、怎么验证），人确认后再开始改。计划阶段花几分钟，往往能省掉一轮大返工。

## 子 Agent：什么时候值得拆

子 Agent 有自己独立的上下文。主 Agent 把「在整个仓库里找出所有调用这个函数的地方」这类任务交给它，它自己翻几十个文件，最后只交回一段结论，主 Agent 的上下文不会被大量搜索结果占满。

但子 Agent 不是越多越好。[Anthropic 的架构指南](https://www.anthropic.com/research/building-effective-agents)建议从能满足任务的简单方案开始，只有在任务确实需要时才增加复杂度；拆分独立上下文前，应明确子任务边界，并用实际质量、时延和成本比较收益与协调开销。值得拆的情况主要有三种：上下文太长、效果已经能测出变差；需要并行探索、而且用完就丢的独立上下文；工具太多导致模型选错。多个子 Agent 同时改同一批文件更要避免，冲突很难收拾。

## 权限、沙箱与隔离工作区

Coding Agent 能执行命令，所以权限设计是面试常问的点：

- **三档权限**：读文件、跑测试这类安全操作自动放行；改文件、装依赖要确认或在允许范围内放行；删除、推送、部署默认拒绝或必须人工确认。规则冲突时拒绝优先。
- **沙箱**：命令在受限环境里跑，限制网络、限制能读写的目录，不把 `.env`、SSH 密钥、云凭证暴露给生成的代码。
- **隔离工作区**：用 [git worktree](https://git-scm.com/docs/git-worktree) 给 Agent 一个单独的工作目录，和你正在改的代码互不干扰。
- **用户改动不能碰**：工作区里用户没提交的修改属于用户，`git checkout .`、`git reset --hard` 这类会丢改动的命令必须经过明确同意。
- **外部操作单独授权**：推送、开 PR、合并、部署、发评论都不因为「代码写完了」就自动获得许可。

## 企业项目里，怎样说明 AI 工具的使用边界

被问到“用了哪些工具，公司有什么限制”时，先把工具名称落到实际用途：补全、解释代码、生成补丁、运行命令或辅助审查分别由谁完成。接着核对企业允许的账号、功能、模型和使用入口；同一个品牌的 IDE、CLI 和云端 Agent，权限与数据流可能不同。[GitHub 的企业策略文档](https://docs.github.com/en/copilot/concepts/enterprise/policies)明确说明，策略可以控制功能、Agent 和模型，但并非每项策略都适用于所有入口，不能从“团队买了许可证”推断所有用法都获准。

准备一次真实使用案例时，可以按下面四项说明约束。这是工程核对方法，不代表某家公司的实际制度；只填写自己确认过的内容。

| 要核对的边界 | 回答需要说清什么 |
| --- | --- |
| 输入 | 哪些代码、日志和业务数据允许发送，是否需要脱敏；不能因方便复现就上传密钥或未经授权的客户数据 |
| 数据去向 | 请求发往哪个服务，仓库索引、会话记录和日志怎样保留，谁可以访问；具体约定查实际产品配置和企业政策 |
| 执行 | Agent 可以读写哪些目录、运行哪些命令、访问哪些网络，继承了什么凭据，哪些动作另需授权 |
| 交付 | 谁核对需求、测试和 Diff，哪些发布与合并门禁仍须满足，失败如何停止或回退 |

内容排除规则也不能替代隔离。以 2026-11-22 核验的 [GitHub Copilot 内容排除说明](https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/content-exclusion)为例，它不是文件系统安全边界，间接访问或第三方 MCP 工具仍有局限；敏感文件的访问还要由操作系统权限、受限运行环境和工具授权控制。没有确认某项策略是否覆盖当前入口时，先缩小任务到允许的材料和动作，不能把个人工具的可用性当成企业授权。

### “让代码更高级”应怎样落到质量

把“更高级”改写为能复核的要求：符合现有接口和命名，正常、边界与错误路径行为正确，必要的权限与资源处理明确，并能被下一位维护者理解。比如给一个现有接口补功能，先提供调用方、输入输出约定、已有测试和允许修改的范围，再要求最小补丁及验证结果；新增抽象应解决实际重复或变化点，不能用更多层级代替需求正确。

让模型解释关键取舍，并把建议对照代码与测试核验；本人仍要能说明为什么这样改。[GitHub 的 Agent 使用说明](https://docs.github.com/en/copilot/responsible-use/agents)要求审查和测试生成代码，并提醒生成建议可能不准确或不安全。它支持的是验证责任，不能据此声称 AI 已让某个项目更快、更安全；提效或质量提升仍要有同一任务范围内的实际比较。

## Hooks：在固定时机插入检查

Claude Code 的 [Hooks](https://code.claude.com/docs/en/hooks) 允许在 Agent 生命周期的固定时机运行你自己的脚本，常用的有：

| 事件 | 什么时候触发 | 典型用途 |
| --- | --- | --- |
| `PreToolUse` | 工具执行之前 | 拦截危险命令、禁止改某些目录 |
| `PostToolUse` | 工具成功执行之后 | 改完文件自动跑格式化或 lint，把结果反馈给模型 |
| `Stop` | Agent 准备结束回复时 | 检查测试是否跑过，没跑就让它继续 |

关键区别：想**阻止**某个动作，要在它执行之前拦（`PreToolUse`，或处理权限确认的 `PermissionRequest`）；`PostToolUse` 只能事后检查和反馈，挡不住已经发生的副作用。

## 验证：怎么证明它真的做对了

这是 Coding Agent 最核心的问题，也是面试里最能拉开差距的地方。

- **先复现再修复**：修 bug 先写一个在旧代码上失败的测试，改完它变绿，才算修好。没法复现就如实说明，而不是改到「看起来合理」。
- **分层验证**：格式和静态检查、类型检查、受影响的单元测试、集成测试，按速度从快到慢跑。小改动不必每次跑全量，改公共接口、依赖、配置时要扩大范围。
- **Diff 是第二份交付物**：逐个文件看改了什么，有没有调试日志、密钥、无关的格式化、意外改动的锁文件。
- **不信「完成」二字**：模型说做完了、另一个模型说没问题，都不是证据。测试失败时也不能反复重跑直到偶然通过。
- **交付时附证据**：改了哪些文件、跑了哪些命令、结果如何、还有什么没验证。

如果你也想看这套循环、工具、权限和验证在代码里具体怎么实现，[项目实战：从零手写通用 Agent](https://www.agent-journey.cn/project/general-agent) 用两千多行 Python 把它们完整写了一遍。

## 补全和 Agent 不是一回事

编辑器里的代码补全（比如 Copilot 的灰色提示）是另一类产品：根据光标前后的代码和相关文件，生成一段候选让你按 Tab 采纳。它要的是低延迟，用户继续打字就取消旧请求，所以不会跑测试。Agent 则要自己读仓库、改多个文件、跑命令验证。面试被问到「怎么提高补全准确率」时，答案在**给对上下文**：把相关的类型定义、函数签名、调用方放进去，比塞更多无关文件有效，具体方法见 [代码仓库切分、索引与检索](../rag/rag-code-retrieval.md)。

## 怎么评测一个 Coding Agent

最常引用的基准是 [SWE-bench](https://www.swebench.com/original.html)：从真实 GitHub 项目里取 issue，让 Agent 在对应的代码版本上修复，用项目自己的测试判断是否修好。它的意义在于证明「仓库级任务」和「写一段函数」是两回事，同一句「修复分页」在不同版本、不同依赖下是不同的任务。

团队内部评测自己的 Agent，除了任务成功率，还要看：改动范围是否最小、有没有破坏原有功能、有没有泄露密钥、是否保留了用户的改动、每个成功任务花了多少钱和多长时间。测试用例要覆盖脏工作区、失败的测试、超大日志、网络不可用这类真实情况。测试本身怎么分层，见 [单元、集成、场景与端到端测试](../production/agent-test-pyramid.md)。

## 长任务的交接与恢复

任务做到一半上下文满了，或者换了一个会话接着做，靠模型「回忆」做到哪一步是不可靠的。更稳的做法是维护一份任务记录：目标、已读的关键文件、已做的改动、跑过的命令和结果、下一步。接手时先核对仓库当前状态（HEAD、未提交文件）和记录是否一致，不一致就以仓库为准重新确认，不按旧记录直接重放修改。检查点怎么设计见 [工作流检查点](agent-workflow-state.md)。

## 面试怎么答

| 常见问题 | 回答要点 |
| --- | --- |
| Coding Agent 是怎么工作的 | 执行循环 + 工具 + 项目说明 + 权限 + 验证，模型决策、运行时执行 |
| 怎么保证 AI 写的代码可靠 | 先定验收标准，小步修改，分层测试，审 diff，不信模型自称完成 |
| 编辑工具为什么用片段替换 | 省 Token、不会漏行、找不到旧片段就报错避免改错 |
| 怎么防止 Agent 搞破坏 | 三档权限、沙箱、隔离工作区、用户改动不动、外部操作单独授权 |
| 什么时候用子 Agent | 默认一个主循环；上下文变差、需要并行独立上下文、工具选错时再拆 |
| 怎么评测 Coding Agent | SWE-bench 思路，固定仓库版本用测试判；再看改动范围、回归、成本 |

能讲出一个自己真实用 Agent 的例子会很加分，比如「我让它补测试时发现它把断言写成了和实现一样的逻辑，测试永远通过，后来我要求它先写测试、我确认后再写实现」。

## 小结

Coding Agent 的能力来自三层：模型的推理、运行时的工具与权限、以及验证。前两层决定它能做什么，最后一层决定你能不能信它。面试时把这三层讲清楚，再配一个自己的使用例子，就比只说「我会用 Cursor」强得多。

## 练一练

### 高频考点题 1：开工前先看什么

Coding Agent 接到一个修 bug 的任务，发现工作区里有几个用户还没提交的改动文件。下面哪种做法正确？

- A. 记录基线状态，把这些改动当用户的，不覆盖也不回退
- B. 先执行 `git checkout .` 把工作区清理干净，避免干扰判断
- C. 把用户的改动一起提交，省得之后合并冲突
- D. 忽略工作区状态，直接按 issue 描述改代码

**答案：A。** 仓库状态是输入的一部分，现有修改属于用户。任何会丢失修改的 reset、checkout 或 clean 都需要用户明确批准。

### 高频考点题 2：怎样证明 bug 修好了

下面哪一项最能证明 Coding Agent 修好了一个 bug？

- A. 模型说「已修复」
- B. 改完之后代码看起来更合理
- C. 有一个在旧实现上失败、修改后通过的回归测试，且其他测试没坏
- D. 反复重跑测试，直到出现一次全部通过，说明问题已经修好

**答案：C。** 修复要先有失败证据，再看它变绿。反复重跑到偶然绿是在掩盖 flaky，不是验证。

### 高频考点题 3：Hook 的边界

关于 Claude Code 的 `PostToolUse` Hook，下面哪种说法正确？

- A. 工具成功执行后触发，能检查结果，但拦不住已发生的副作用
- B. 它在工具执行前触发，可以检查参数并阻止危险命令
- C. 它是模型内部思考的一个步骤
- D. 只要配了它，就能证明测试和交付都成功了

**答案：A。** 想在动作发生前拦截要用 `PreToolUse`。事后检查只能反馈和补救，挡不住已经发生的副作用。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [美团 AI 应用开发实习二面：降级、工具调用与 AI Coding](../../../interview/meituan/ai/meituan-ai-9.md)
- [蚂蚁 AI 应用一面：响应延迟、幻觉与 AI Coding](../../../interview/antfin/ai/antfin-ai-12.md)
- [字节 AI 应用一、二面：MySQL、Redis 与编程基础](../../../interview/bytedance/base/bytedance-base-36.md)
- [字节 Agent 一面：会话记忆、并发更新与算法](../../../interview/bytedance/base/bytedance-base-29.md)
- [小红书 AI 应用一面：RAG 评测、Skill 与平方根](../../../interview/redbook/ai/redbook-ai-20.md)
- [字节 Agent 开发一面：RAG、AI Coding 与高并发系统（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-14.md)
- [快手测开二面：Agent 交接、轨迹评测与业务测试](../../../interview/kuaishou/ai/kuaishou-ai-24.md)
- [快手 AI 全栈一面：分布式锁、线程池与 AI 编码](../../../interview/kuaishou/ai/kuaishou-ai-20.md)
- [小红书 AI 全栈业务交叉面与二面：MVP、运行稳定性和视频 Agent](../../../interview/redbook/ai/redbook-ai-5.md)
- [阿里云 AI Infra 一面：FlashAttention 与 AI Coding](../../../interview/alibaba/ai/alibaba-ai-22.md)
- [百度 Agent 秋招二三面：记忆、工具可靠性与运行循环](../../../interview/baidu/ai/baidu-ai-6.md)
- [字节 Agent 日常实习一面：Coding项目与记忆（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-10.md)
- [哔哩哔哩一面：端到端 AI Coding 与生产治理](../../../interview/bilibili/ai/bilibili-ai-2.md)
- [腾讯音乐后台秋招一面：AI 开发交付与多模态 RAG](../../../interview/tencent-music/ai/tme-ai-1.md)
- [阿里云 Agent 开发秋招一面](../../../interview/alibaba/ai/alibaba-ai-1.md)
- [快手 AI 全栈一二面：Harness、沙箱与需求交付](../../../interview/kuaishou/ai/kuaishou-ai-8.md)
- [蚂蚁 Agent 一二面：Code Agent 与应用开发](../../../interview/antfin/ai/antfin-ai-2.md)
- [百度搜索框架 Agent 日常实习一二面：上下文、工程选型与评测](../../../interview/baidu/ai/baidu-ai-14.md)
- [字节 AI 全栈实习：记忆提炼、群聊搜索与 AI Coding](../../../interview/bytedance/base/bytedance-base-48.md)
- [OPPO IT 开发一面：ReAct、MCP 与智能问数](../../../interview/oppo/ai/oppo-ai-3.md)
- [字节全栈：多智能体导购、客户端与系统评测](../../../interview/bytedance/base/bytedance-base-43.md)
- [美团后端暑期二面：AI Coding 复盘、记忆与评估计划](../../../interview/meituan/ai/meituan-ai-15.md)
- [字节 AI 全栈一面：Pipeline 质量、Doris 与消息轮播](../../../interview/bytedance/base/bytedance-base-23.md)
- [小红书与百度 Agent 面试合并记录：LangGraph 子图、Skill 与工程校验](../../../interview/redbook/ai/redbook-ai-2.md)
- [字节 Managed Agent 校招一面：评测、运行链路与后端基础](../../../interview/bytedance/base/bytedance-base-26.md)
- [阿里控股 Agent 开发一面：项目设计、Harness 与会话状态](../../../interview/alibaba/ai/alibaba-ai-34.md)
- [蚂蚁智能体与大模型应用一面：幻觉、Skill 与 RAG](../../../interview/antfin/ai/antfin-ai-5.md)
- [阿里淘天 AI 应用研发一面：RAG、限流 Top-K 与优惠策略](../../../interview/alibaba/ai/alibaba-ai-5.md)
- [VAST 后端一面：可观测性、AI Coding 与节点调度](../../../interview/vast/ai/vast-ai-1.md)
- [阿里 Java 研发一面：Agent 协作、Kafka 与 Redis](../../../interview/alibaba/ai/alibaba-ai-33.md)
- [蚂蚁数字支付 AI 应用研发二面：数据分层、迁移与微调](../../../interview/antfin/ai/antfin-ai-13.md)
- [淘天 AI 应用开发暑期实习二面：RAG 评测、工具与成本控制](../../../interview/alibaba/ai/alibaba-ai-31.md)
- [美团后端 Agent 暑期一面：约束、工作流与 AI 开发验证](../../../interview/meituan/ai/meituan-ai-16.md)
- [字节 Agent 实习：推理、微调与工具编排](../../../interview/bytedance/base/bytedance-base-51.md)
- [拼多多 Agent 复活赛一面：检索权限、上下文与流式协议](../../../interview/pinduoduo/ai/pinduoduo-ai-3.md)
- [快手 Agent 开发二面关联题单：Hooks、锁与设计模式](../../../interview/kuaishou/ai/kuaishou-ai-22.md)
- [字节全栈实习：Session、权限与前端基础](../../../interview/bytedance/base/bytedance-base-46.md)
- [蚂蚁国际 Agent 一面：跨系统 AI 交付与 MCP 工具链](../../../interview/antfin/ai/antfin-ai-7.md)
- [字节财经保险 AI 全栈实习一面：项目设计、AI Coding 与 Diff](../../../interview/bytedance/base/bytedance-base-34.md)
- [百度大模型研发一面：Context、Harness 与 RAG](../../../interview/baidu/ai/baidu-ai-1.md)
- [字节 AI 全栈一面：断点续传与代码回归](../../../interview/bytedance/base/bytedance-base-73.md)
- [商盟支付 Java 开发实习一面：交易去重、并发与消息](../../../interview/shangmeng/ai/shangmeng-ai-1.md)
- [阿里国际 AI 应用研发一面：JDK 8、消息可靠性与 RAG](../../../interview/alibaba/ai/alibaba-ai-25.md)
- [字节 Agent 开发一面：评分、Harness 与任务可靠性](../../../interview/bytedance/base/bytedance-base-57.md)
- [字节生活服务 AI 全栈二面：AI 作业、接口幂等与树题](../../../interview/bytedance/base/bytedance-base-64.md)
- [字节抖音电商 Agent 一至三面：AI Coding、证据校验与长文档](../../../interview/bytedance/base/bytedance-base-63.md)
- [腾讯微信支付后台开发日常实习一面](../../../interview/tencent/ai/tencent-ai-5.md)
- [腾讯搜狗输入法后台二至四面：AI 代码可靠性与测试](../../../interview/tencent/base/tencent-base-1.md)
- [蚂蚁 Agent 一面：代码验收与运行循环](../../../interview/antfin/ai/antfin-ai-9.md)
- [腾讯 AI Agent 应用开发一面：上下文、强化学习与系统基础](../../../interview/tencent/ai/tencent-ai-11.md)
- [小红书 AI 全栈实习二面：工具服务选择与开发闭环](../../../interview/redbook/ai/redbook-ai-12.md)
- [OPPO AI 全栈一面：AI Coding、Skill 与数据结构](../../../interview/oppo/ai/oppo-ai-1.md)
- [蚂蚁暑期面经：线程池、数据来源与多 Agent 评测](../../../interview/antfin/ai/antfin-ai-14.md)
- [阿里国际 Java 二面：RAG 数据评测、微调与代码生成](../../../interview/alibaba/ai/alibaba-ai-26.md)
- [快手 AI 全栈一面：Skill 成本、Agent 链路与开发验收](../../../interview/kuaishou/ai/kuaishou-ai-9.md)
- [美团 AI 全栈二面：AI Coding 复盘与测试边界](../../../interview/meituan/ai/meituan-ai-14.md)
- [滴滴后端二面：CR Agent、Spec 与 AI Coding 场景](../../../interview/didi/ai/didi-ai-1.md)
- [科大讯飞 Java 开发一面：Agent 项目与 AI 编程复盘](../../../interview/iflytek/java/iflytek-java-1.md)
- [腾讯 Agent 实习一面：RAG、工具与通信](../../../interview/tencent/ai/tencent-ai-10.md)
- [字节 Agent：AI Coding、技能设计与模型工程](../../../interview/bytedance/base/bytedance-base-49.md)
- [字节 Agent 一面：生成代码质量与限时 AI Coding](../../../interview/bytedance/base/bytedance-base-67.md)
- [快手商业化 Java 实习一二面：缓存、JVM 与 AI Coding](../../../interview/kuaishou/ai/kuaishou-ai-25.md)
<!-- interview-source-history:end -->

## 参考资料

- [AGENTS.md 开放格式](https://agents.md/)
- [Claude Code：项目记忆与 CLAUDE.md](https://code.claude.com/docs/en/memory)
- [Claude Code：Hooks reference](https://code.claude.com/docs/en/hooks)
- [GitHub：Copilot Agents 的局限与生成内容审查建议](https://docs.github.com/en/copilot/responsible-use/agents)
- [GitHub：企业与组织的 Copilot 策略及生效入口](https://docs.github.com/en/copilot/concepts/enterprise/policies)
- [GitHub：Copilot 内容排除的适用范围与局限](https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/content-exclusion)
- [Jimenez et al. — SWE-bench](https://arxiv.org/abs/2310.06770)
- [SWE-bench — Original benchmark](https://www.swebench.com/original.html)
- [Git — git-worktree](https://git-scm.com/docs/git-worktree)
- [Git — git-diff](https://git-scm.com/docs/git-diff)
- [Git — git-status](https://git-scm.com/docs/git-status)
- [GitHub：Copilot inline suggestions 的过程、局限与评测](https://docs.github.com/en/copilot/responsible-use/inline-suggestions)
- [VS Code：内联补全的文档、位置、上下文与取消接口](https://code.visualstudio.com/api/language-extensions/programmatic-language-features#show-inline-completions)
