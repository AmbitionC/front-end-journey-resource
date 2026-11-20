Coding Agent 的任务不是输出一段看起来合理的代码，而是在指定仓库状态上产生最小、可验证、可审查的变更。它必须理解现有约束、保护用户未提交修改、运行与风险相称的验证，并用 diff 和证据交付。

## 仓库状态是输入的一部分

[SWE-bench 论文](https://arxiv.org/abs/2310.06770)从真实 GitHub issue 与对应代码变更构造仓库级任务，[官方站点](https://www.swebench.com/original.html)强调在给定仓库和执行环境中用测试评估。这揭示了与代码片段题的差异：同一句“修复分页”在不同 commit、依赖和测试下是不同任务。

开始前读取根目录、说明文件、构建配置、相关代码、测试和 `git status`。记录 base commit、当前分支、脏文件、运行时版本和任务验收标准。现有修改属于用户，不能因为影响测试就覆盖。

```ts
type CodingTask = {
  baseCommit: string;
  worktree: string;
  acceptance: string[];
  allowedPaths: string[];
  protectedChanges: { path: string; hash: string }[];
  verification: string[];
};
```

![Coding Agent 从任务和验收标准出发，先读仓库、做计划、建检查点，再进入隔离 worktree 打补丁；依次格式化、类型检查、单元测试和集成测试，失败就修复重测，通过后还要做 diff 审查，最后带着实际改动和验证证据交付](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-coding-repo-loop-v2.dark.png)
*图：测试通过后仍要做 Diff 审查；交付时附上实际改动和验证证据。验证失败就回到打补丁，修完重跑全部检查。*

## Inspect—Plan—Patch—Verify

先用搜索定位符号、调用方和测试，不要从文件名猜实现。理解数据流和错误路径后写短计划：要改哪些文件、为什么、如何验证、哪些行为保持不变。计划大于改动本身时，说明任务可能过度拆解。

补丁保持小而连贯。优先复用现有抽象和风格，避免顺手重构、升级依赖或格式化无关目录。修改公共接口时搜索所有消费者；删除代码前确认没有动态引用、生成步骤或文档契约。

## 端到端与跨模块任务怎样组织

端到端 AI Coding 不是“一次把需求发给模型”。先把仓库快照、需求、允许路径和验收标准固化为任务合同，再用依赖图拆出检索、接口设计、实现、迁移、测试和发布检查。只有没有写冲突、没有前置依赖的节点才并行；跨模块接口先固定 Schema，再让各执行单元分别实现。

DAG 的权威状态不属于聊天窗口，也不应只放在某个子 Agent 的长期记忆中。编排层保存节点状态、输入/输出引用、attempt、checkpoint、负责人和验证证据；子 Agent 获得最小上下文，结束时交付结构化结果。容器重启后从持久状态恢复，不能靠模型“回忆”做到哪一步。

如果平台提供日志、代码搜索或构建等 MCP 工具，Coding Agent 仍需把工具返回当不可信证据：限制结果大小，保存可重取引用，校验路径和版本，并把日志中的自然语言与高权限指令隔离。工具协议解决接入，Harness 负责把任务说明、上下文、工具、反馈、预算与验证器组合成可执行环境。

比较不同 Coding Agent 产品时，不宜用单次演示判断“谁更强”。应固定同一仓库快照和任务集，比较任务成功率、测试质量、补丁范围、恢复能力、权限模型、人工修订、延迟和成本；模型、工具和 Harness 都要锁定版本。产品名只是实现样本，能力合同和评测证据才可迁移。

## 类似 Copilot 的编辑器补全，怎样提高准确度

先限定要做的产品行为：本节讨论在编辑器里生成代码候选、由用户检查后采纳的补全；需要自主修改多文件和运行工具时，再进入前面的 Coding Agent 执行循环。GitHub 的 [Copilot inline suggestions 应用说明](https://docs.github.com/en/copilot/responsible-use/inline-suggestions#6-performance)披露了周围代码与编辑器上下文进入模型、结果作为候选展示并由用户采纳的基本过程。下面是一种类似工具的教学设计，不代表复原其私有模型或完整架构。

一次请求先固定文档身份与版本、语言、光标或选择范围，以及光标前后的必要代码。再按任务取回相关类型、函数签名、调用方、测试和依赖版本，保留路径与版本关系；精确符号适合定义或词法检索，跨文件概念可辅以语义检索，具体方法见[代码仓库切分、索引与检索](../rag/rag-code-retrieval.md)。当前未保存的编辑缓冲区与仓库索引可能不同，装配时要明确谁覆盖谁；多塞无关文件会挤掉关键约束，注释中的指令也不获得执行权限。

编辑器可以在用户停止输入后发起请求，继续输入时取消旧请求。VS Code 的[内联补全接口](https://code.visualstudio.com/api/language-extensions/programmatic-language-features#show-inline-completions)接收文档、位置、上下文与取消信号；应用仍须设计自己的过期结果保护，例如返回时核对请求序号、文档版本和替换范围。仅发送取消不证明远端已停止生成，也不能让迟到候选覆盖新编辑。补全先显示为可检查建议，涉及大范围修改或执行工具时另走明确的变更与权限合同。

准确度首先看“是否符合当前仓库的接口与任务”，再看文本是否流畅。例如教学仓库中的 `saveOrder` 返回 `Promise<SaveResult>`，模型却按 `boolean` 使用；把真实签名纳入上下文可能帮助修复，但仍需类型检查与行为验证。补全响应先做低延迟的范围、格式和结构检查，采纳后按风险运行类型检查、受影响测试和 Diff 审查；不必在每次敲键时跑全仓测试，也不能把编译通过当成业务正确。

离线评测按语言、任务、长短上下文、跨文件依赖和错误恢复分组，固定仓库与依赖快照，并让同源代码或任务变体在训练、调参与最终测试之间隔离。分别记录语法/类型有效、测试与任务成功、回归、人工修订、延迟和成本；真实使用中再看展示、采纳与后续修改。GitHub 的[质量评测说明](https://docs.github.com/en/copilot/responsible-use/inline-suggestions#performance-and-quality-evaluation-methods)同样区分离线正确性与上下文相关性、线上使用指标及运行开销。采纳率是使用信号，不能单独证明候选正确，更不能给没有实测的工具补造“准确率”。

## AI 很快生成大量文档，怎样审阅才有意义

文档数量和阅读时长都不能证明实现正确。先把原需求中的验收条件固定下来，再让生成器给出简短的变更索引：每个条件对应哪些代码、哪些测试、哪份实际结果，哪些仍未验证。索引方便定位，但其中的链接、结论和“已通过”仍须回到当前版本核对。[GitHub 对 Copilot Agents 的使用说明](https://docs.github.com/en/copilot/responsible-use/agents#10-best-practices-and-recommendations)要求审阅和测试生成内容，也说明 AI 代码审查会漏报或误报；下面是将这些原则用于文档审阅的工程方法。

先检查会改变行为的决定，例如工具能执行什么、输入如何校验、失败后是否重试，以及状态如何保存；随后沿真实 diff 和执行证据验证。背景说明可以按需阅读，不能用扫过摘要代替关键路径审查。发现“测试通过”却没有绑定版本的结果，或需求与实现相互矛盾时，停在该项核实，而不是继续点确认。涉及既有授权范围外的动作，另按原权限合同处理。

例如教学任务要求“未知工具名不得执行任何函数”，文档写着支持工具白名单仍不够：应找到实际路由与拒绝分支，运行以未知名称为输入的检查，并确认工具副作用计数为零。若预期和测试都只照抄实现，同一错误可能被同时接受；让第二个模型读同一套材料也不会自动产生独立预期。验收依据仍来自需求与可观察结果，相关方法见 [Agent 测试金字塔](../production/agent-test-pyramid.md)。这只是教学示例，不能据此推断某场面试未公开文档中的具体要求。

## 隔离工作区

[Git worktree](https://git-scm.com/docs/git-worktree)允许同一仓库拥有多个关联工作目录，适合把 Agent 变更与用户主工作区隔离。隔离不等于随意：仍从明确 base 创建分支，避免两个 Agent 写同一 worktree，结束前确认没有遗漏的未跟踪文件。

不能创建隔离工作区时，在当前目录记录初始 status/diff，只触碰授权文件。任何会丢失修改的 reset、checkout 或 clean 都需要用户明确批准。

## 先复现，再修复

Bug 修复先建立失败证据：运行最小相关测试，或添加能在旧实现失败的回归测试。若无法复现，报告环境、假设和缺失信息；不要靠改动后“看起来更合理”证明修复。

对功能任务，验收测试覆盖用户可见行为和边界。测试不能只复制实现逻辑。外部服务使用 fixture/mock 时保留契约，必要时再运行集成验证。

## 验证金字塔

按反馈速度逐层运行：格式化/静态检查、类型检查、受影响单元测试、模块集成测试、构建、端到端或安全检查。小改动不必总跑全仓最慢套件，但高影响公共接口、依赖或配置变更需要扩大范围。

测试命令本身也来自仓库，不自行发明。失败时区分由补丁导致、环境缺失、预存失败或 flaky；保留原始错误摘要和命令。不要反复重跑直到偶然绿。

### 从“能生成”到发布质量门

把验证分成三层：静态门检查格式、类型、依赖和安全规则；行为门运行受影响的单元、集成与端到端测试；交付门审查迁移、权限、可观测性、灰度和回滚。风险越高，越不能由生成代码的同一个模型独自判定通过。

质量门应输出机器可读结果和证据，且绑定 commit SHA、依赖锁文件、测试环境和工具版本。超时、测试缺失或环境不一致都是“未验证”，不能按成功处理。对大仓库先根据依赖图选择最小充分测试，再在合并或发布前运行更广回归。

## Diff 是第二份交付物

[git diff 文档](https://git-scm.com/docs/git-diff)定义了工作树、索引和 commit 间的比较。完成前逐文件审查 diff：是否只改预期路径、是否有调试日志/秘密/生成垃圾、是否破坏错误处理、是否意外改变锁文件、注释和文档是否与实现一致。

[git status](https://git-scm.com/docs/git-status)用于检查已跟踪、未跟踪和暂存状态。测试产生的快照、覆盖率或下载文件不能悄悄进入提交。最终列出变更、验证命令与结果、剩余风险；没有运行的测试也明确说明。

## Claude Code Hooks：在生命周期事件上接入检查

Hooks 是 Claude Code 在特定生命周期事件上调用的扩展处理器，不是模型隐式推理过程中的某个“思考步骤”。常见配置先选事件，再用该事件支持的 matcher 过滤，最后指定处理器；命令型 Hook 执行外部程序，部分其他类型则可借助模型进行判定。以下依据 2026-11-13 核验的[官方 Hooks reference](https://code.claude.com/docs/en/hooks)说明，事件和输出字段会随版本演进，不能把某个版本的配置复制成所有环境的默认行为。

| 事件 | 触发位置 | 适合做什么、不能证明什么 |
| --- | --- | --- |
| `PreToolUse` | 模型已形成工具参数、工具调用处理之前 | 检查候选动作，按事件合同返回拒绝或要求确认等决定；模型提出动作不等于动作已获权 |
| `PostToolUse` | 工具成功执行之后 | 根据实际返回做检查或提供反馈；事后检查不能阻止已经发生的副作用 |
| `PostToolUseFailure` | 工具执行失败之后 | 补充失败反馈，仍需区分可重试、不可重试和外部状态未知 |
| `Stop` | 主 Agent 完成回复时 | 检查是否还有未满足条件；回复结束不证明测试、交付或外部操作成功 |

例如希望编辑之后验证代码，可以在匹配相关工具的事后事件里触发有界检查，再把真实结果交回运行流程。这个设计只说明一种扩展方法：不是每次文件变化都由同一种工具造成，也不能把 Hook 已启动当作验证通过。阻止不允许的动作应发生在执行前，工具服务仍要执行自己的权限与输入校验。[官方 PreToolUse 合同](https://code.claude.com/docs/en/hooks#pretooluse-decision-control)区分 Hook 决定与权限规则；Hook 返回允许也不是绕过所有拒绝、询问规则或外部服务权限的通行证。

命令型 Hook 从标准输入收到事件 JSON，通过退出码、标准输出和标准错误返回结果。退出码 `0` 是成功输出结构化 JSON 的预期路径；`2` 的阻断或反馈含义依事件而定，其他错误也不能一概解释成阻断。需要结构化控制时，仅输出符合该事件 schema 的 JSON；额外日志、无效 JSON、超时与失败策略都会影响结果，不能用“脚本报错了”推断动作一定没执行。具体组合应核对[输入输出与退出码规则](https://code.claude.com/docs/en/hooks#hook-input-and-output)，并在目标版本测试允许、拒绝、处理器失败和重复触发等路径。

Hook 本身也是可执行扩展，配置来源、参数、路径和返回内容都要审查，不能把模型生成的字符串直接拼成高权限命令。只记录必要事件与结果引用，避免复制秘密；用超时、幂等与结果验收控制实际任务。它适合把检查接到明确时机，可靠交付仍需要前文的测试、Diff 审查和证据。


## 外部副作用与工具安全

代码执行、依赖安装和测试脚本都可能不可信，在沙箱或受控工作区运行，限制网络、凭证和资源。不要把仓库 `.env`、SSH agent 或云 token 自动暴露给生成代码。依赖更新检查来源、锁文件和安装脚本。

推送、开 PR、合并、部署和发送评论是外部操作，不因“代码完成”自动获权。若任务授权发布，仍按范围提交、确认分支和 remote，再执行。

## 失败恢复

编译错误通常修补实现；测试暴露设计假设时回到计划；权限/依赖缺失则 blocked；与用户修改冲突时停止并报告。保存小检查点和 diff 方便回滚自己的变更，但绝不回滚不属于本任务的修改。

长任务保持任务账本：已读文件、假设、改动、测试与结论。上下文压缩后从账本恢复，避免重复搜索和重复编辑。

## 交接摘要与实际仓库冲突时

交接包是对某个版本的观察，不能覆盖当前仓库事实。假设交接写“测试通过、可以继续改接口”，但接手时发现分支、工作区或依赖锁文件已变化：先保留原交接与用户改动，再核对 base commit、当前 HEAD、未提交文件、补丁和测试所绑定的版本；不要按摘要直接重放修改或覆盖文件。

[Git status](https://git-scm.com/docs/git-status)区分索引、工作树和未跟踪路径，[Git diff](https://git-scm.com/docs/git-diff)支持工作树、索引与提交之间的比较。它们能证明哪些字节发生变化，不能替代语义判断：接手者还要确认变化是否使旧结论、测试范围或下一步前提失效。旧版本测试通过的记录应保留为旧证据，当前版本需要怎样验证由实际差异和风险决定。

一个最小交接包可以包含目标与允许路径、base/HEAD、改动文件及摘要、产物位置、已执行命令与退出码、已知失败和下一步。对于已经调用外部工具但结果未知的操作，还要传原操作 ID 和查询依据；接手后先核实权威结果，不能以“没有完成记录”推出“没有执行”。这与[工作流检查点](agent-workflow-state.md)的恢复边界相互补充。

发现冲突时先冻结双方版本和不一致项，再判断是旧摘要过期、工作区另有修改，还是验证证据不完整；无法证明下一步前提时保留待核验，而非让模型猜一份更顺畅的摘要。这是通用交接设计，不是在还原任何项目未披露的“三阶段 Handoff”名称或协议。

## 测试 Coding Agent 本身

评估集包含不同语言、单体/多包仓库、脏工作树、失败测试、生成文件、动态配置、恶意 README、超大日志和网络不可用。除了 task success，还测 patch scope、测试质量、回归、秘密泄漏、用户修改保留和命令安全。

Trace 记录搜索、读取、编辑、命令、退出码、diff 统计和验证结论；源代码和日志按敏感性控制，不把整个仓库上传到无关遥测。指标关注一次修复率、无效编辑、测试选择、回滚、人工修订和每个成功任务成本。

## 小结

可靠 Coding Agent 围绕仓库事实工作：冻结 base 和用户修改，检查代码与测试，计划最小补丁，在隔离工作区实施，先复现再验证，最后审查 diff。代码、测试与范围证据共同组成完成定义，发布操作则保持独立授权。

## 练一练

### 高频考点题 1：开工前先看什么

Coding Agent 接到一个修 bug 的任务，发现工作区里有几个用户还没提交的改动文件。下面哪种做法正确？

- A. 记录 base commit 和当前 `git status`，把这些改动当作用户的，不覆盖、不回退，只改授权范围内的文件
- B. 先 `git checkout .` 清理干净，避免干扰
- C. 把用户的改动一起提交，省得之后合并冲突
- D. 忽略工作区状态，直接按 issue 描述改代码

**答案：A。** 仓库状态是输入的一部分，现有修改属于用户。任何会丢失修改的 reset、checkout 或 clean 都需要用户明确批准。

### 高频考点题 2：怎样证明 bug 修好了

下面哪一项最能证明 Coding Agent 修好了一个 bug？

- A. 模型说「已修复」
- B. 改完之后代码看起来更合理
- C. 先写出一个在旧实现上失败的回归测试，改完后它通过，且相关测试没有被破坏
- D. 反复重跑测试直到出现一次全绿

**答案：C。** 修复要先有失败证据，再看它变绿。反复重跑到偶然绿是在掩盖 flaky，不是验证。

### 高频考点题 3：Hook 的边界

关于 Claude Code 的 `PostToolUse` Hook，下面哪种说法正确？

- A. 它在工具成功执行后触发，可以根据实际返回做检查，但不能阻止已经发生的副作用
- B. 它在工具执行前触发，可以阻止危险命令
- C. 它是模型内部思考的一个步骤
- D. 只要配了它，就能证明测试和交付都成功了

**答案：A。** 想在动作发生前拦截要用 `PreToolUse`。事后检查只能反馈和补救，挡不住已经发生的副作用。

### 面试题 4：怎么保证 AI 写代码的输出可靠？

> 出自：[腾讯搜狗输入法后台二至四面：AI 代码可靠性与测试](../../../interview/tencent/base/tencent-base-1.md)

面试官问：你平时做需求用 AI 写代码，怎么保证它的输出是可靠的？

**参考答案：** ①**先给清楚输入**：需求、代码基线、允许改动的范围和验收条件先说清，让模型做小而可审查的改动。②**分层验证**：格式和静态检查、类型检查、针对行为的单元测试、必要的集成测试，按反馈速度逐层跑。③**审 diff**：逐文件看是否只改了预期路径，有没有调试日志、密钥或无关格式化。④**不轻信「完成」**：测试通过、另一个模型说对、模型自称完成，都不能单独证明需求满足；失败就回到具体证据定位，保留命令和结果记录。

### 面试题 5：AI Coding 出错时怎么排查？

> 出自：[字节 AI 全栈开发一面：Agent 项目与算法](../../../interview/bytedance/base/bytedance-base-13.md)

面试官问：用 AI 写代码出了错，你一般怎么排查？

**参考答案：** ①**先定位层次**：用日志、trace、网络面板和最小复现，确认错误出在前端、接口、编排还是模型输出。②**带证据让 AI 修**：把具体报错、复现步骤和相关代码交给模型，而不是让它凭描述猜。③**区分失败类型**：补丁导致的、环境缺失的、原本就失败的、偶发的，分别处理，不反复重跑碰运气。④**修完再验证**：类型检查、相关测试和人工复核都过了才算修好，埋点带上 runId 和阶段，但不记录密钥和隐私数据。

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
- [蚂蚁智能体与大模型应用一面：幻觉、Skill 与 RAG](../../../interview/antfin/ai/antfin-ai-5.md)
- [阿里淘天 AI 应用研发一面：RAG、限流 Top-K 与优惠策略](../../../interview/alibaba/ai/alibaba-ai-5.md)
- [VAST 后端一面：可观测性、AI Coding 与节点调度](../../../interview/vast/ai/vast-ai-1.md)
- [蚂蚁数字支付 AI 应用研发二面：数据分层、迁移与微调](../../../interview/antfin/ai/antfin-ai-13.md)
- [淘天 AI 应用开发暑期实习二面：RAG 评测、工具与成本控制](../../../interview/alibaba/ai/alibaba-ai-31.md)
- [美团后端 Agent 暑期一面：约束、工作流与 AI 开发验证](../../../interview/meituan/ai/meituan-ai-16.md)
- [字节 Agent 实习：推理、微调与工具编排](../../../interview/bytedance/base/bytedance-base-51.md)
- [拼多多 Agent 复活赛一面：检索权限、上下文与流式协议](../../../interview/pinduoduo/ai/pinduoduo-ai-3.md)
- [快手 Agent 开发二面关联题单：Hooks、锁与设计模式](../../../interview/kuaishou/ai/kuaishou-ai-22.md)
- [字节飞书 AI 应用一面：Runtime、评测与后端基础](../../../interview/bytedance/base/bytedance-base-24.md)
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
- [腾讯 Agent 实习一面：RAG、工具与通信](../../../interview/tencent/ai/tencent-ai-10.md)
- [字节 Agent：AI Coding、技能设计与模型工程](../../../interview/bytedance/base/bytedance-base-49.md)
- [字节 Agent 一面：生成代码质量与限时 AI Coding](../../../interview/bytedance/base/bytedance-base-67.md)
- [快手商业化 Java 实习一二面：缓存、JVM 与 AI Coding](../../../interview/kuaishou/ai/kuaishou-ai-25.md)
<!-- interview-source-history:end -->

## 参考资料

- [GitHub：Copilot Agents 的局限与生成内容审查建议](https://docs.github.com/en/copilot/responsible-use/agents)（2026-11-18 核验）。
- [Claude Code：Hooks reference，生命周期、权限与输入输出合同](https://code.claude.com/docs/en/hooks)（2026-11-13 核验，滚动文档）。

- [Jimenez et al. — SWE-bench](https://arxiv.org/abs/2310.06770)
- [SWE-bench — Original benchmark](https://www.swebench.com/original.html)
- [Git — git-worktree](https://git-scm.com/docs/git-worktree)
- [Git — git-diff](https://git-scm.com/docs/git-diff)
- [Git — git-status](https://git-scm.com/docs/git-status)
- [GitHub：Copilot inline suggestions 的过程、局限与评测](https://docs.github.com/en/copilot/responsible-use/inline-suggestions)
- [VS Code：内联补全的文档、位置、上下文与取消接口](https://code.visualstudio.com/api/language-extensions/programmatic-language-features#show-inline-completions)
