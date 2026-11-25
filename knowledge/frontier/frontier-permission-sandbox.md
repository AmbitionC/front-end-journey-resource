本期专题是 Agent 的权限与沙箱。三条都来自厂商自己写的工程文章，讲的是同一件事：让 Agent 少打扰人，同时不闯祸，到底靠什么。

> **本期 30 秒版**
> 1. 权限弹窗挡不住风险：Anthropic 统计用户会点同意 93% 的弹窗。Claude Code 的 auto mode 改用一个分类器逐个审动作，误拦率 0.4%，但真实的「过度热心」危险动作仍漏掉 17%。
> 2. 隔离强度要跟人能盯多紧匹配：Anthropic 三个产品分别用容器、系统级沙箱和整台虚拟机，并且被第三方报告过「文件可以借出网白名单外传」的漏洞。
> 3. 执行环境和凭证要分开：OpenAI Agents SDK 把循环和沙箱拆开，凭证不进跑模型生成代码的环境。

## 1. Claude Code auto mode：用分类器代替逐条确认

**发生了什么**

Anthropic 在 2026 年 3 月 25 日发文讲了 [Claude Code auto mode 的设计](https://www.anthropic.com/research/claude-code-auto-mode)。出发点是一个数字：用户会同意 93% 的权限弹窗。弹窗多了人就不看了，等于没有确认。

**做法**

动作分三档处理：

- 内置的安全工具和用户自己放行的规则，直接过。进入 auto mode 时，那些等于「允许执行任意代码」的宽规则会被去掉。
- 项目目录内的文件写入和编辑，直接过。
- 其余动作交给一个分类器判断。

分类器分两步：先用一个只回答是或否的快速过滤，倾向于拦；被拦下的再用带推理的第二步复核。它只看用户说过的话和 Agent 要发起的工具调用，**故意不看** Agent 自己的解释和工具返回的内容。这样网页、文件里藏的指令影响不到它，Agent 也没法用一段漂亮的理由说服它。工具返回的内容另有一层注入检测，在进入上下文之前扫描。

被拦之后，拒绝理由作为工具结果返回给 Agent，让它换一条更安全的路。连续 3 次或累计 20 次被拦，就停下来找人。

**效果和局限**

| 测试集 | 指标 | 完整流程 |
| --- | --- | --- |
| 真实流量 1 万条 | 误拦率 | 0.4% |
| 真实的过度热心危险动作 52 条 | 漏放率 | 17% |
| 合成的数据外传 1000 条 | 漏放率 | 5.7% |

文章自己把 17% 叫作「诚实的数字」，并明确说它不能替代高风险基础设施上的人工审查。

**和以前有什么不同**

以前讲 Agent 权限，答案通常是「危险操作让人确认」。这篇说明了两点：确认太多等于没确认；审动作的那一方应该和干活的那一方信息隔离，不听它的解释。

**面试里怎么用**

被问「Agent 的工具调用怎么做权限控制」时：

> 我会分层。只读和项目内的改动直接放行，其余动作过一道独立的审查，高风险的才找人，这样人看到的确认足够少，才会认真看。审查方只看用户的原始要求和将要执行的动作，不看 Agent 的解释和工具返回，避免被注入内容或 Agent 自己的理由带偏。Anthropic 公布过这种做法的数据，误拦率 0.4%，但危险动作仍有 17% 漏掉，所以它只是一层，不能替代环境隔离。

**对应知识点**：[最小权限、授权与工具调用确认](https://www.agent-journey.cn/knowledge?activeKey=agent-permission-model)、[Human-in-the-loop 审批与人工接管](https://www.agent-journey.cn/knowledge?activeKey=agent-human-in-loop)、[Prompt Injection 与间接注入防御](https://www.agent-journey.cn/knowledge?activeKey=prompt-injection-defense)

## 2. Anthropic 讲各产品怎么关住 Claude：隔离强度跟着监督能力走

**发生了什么**

Anthropic 2026 年 5 月 25 日的文章 [How we contain Claude across products](https://www.anthropic.com/research/how-we-contain-claude) 把三个产品的隔离方式摆在了一起：

| 产品 | 隔离方式 |
| --- | --- |
| claude.ai 的代码执行 | 独立基础设施上的 gVisor 容器，每个会话一个临时文件系统 |
| Claude Code | 操作系统级沙箱（macOS 用 Seatbelt，Linux 用 bubblewrap），默认不能联网 |
| Claude Cowork | 一整台虚拟机，凭证留在宿主机的钥匙串里，文件挂载分只读、读写、读写但不能删三种 |

文章给的原则有三条：先在环境层做隔离，再靠模型层引导；隔离强度要和用户能盯多紧相匹配；对自己造的定制组件保持警惕。

**几个值得记的数字和教训**

- 给 Claude Code 加上系统级沙箱后，权限弹窗减少了 84%。
- 在 Gray Swan 的 Agent 红队基准上，Claude Opus 4.7 单次攻击成功率约 0.1%，但对手自适应地试 100 次后升到 5% 到 6%。文章的原话是：任何概率性的防御都有非零的漏放率。
- 出网白名单不只是「能访问哪些地址」，它本身就是一种能力授予。第三方向 Anthropic 披露过 Cowork 的一个问题：恶意文件里的隐藏指令可以用攻击者的密钥，经白名单里的 api.anthropic.com 把文件传出去，后来在虚拟机里加了中间代理来修。

**和以前有什么不同**

以前把「沙箱」当成一个开关。这篇把它讲成一个选择题：同样是跑代码，用户看得懂命令、能判断动作的场景可以用轻量沙箱，用户判断不了 Agent 要做什么的场景就要更强的隔离，比如虚拟机。而且网络出口要按「它能被用来做什么」来审，不是按域名是否可信。

**面试里怎么用**

被问「Agent 的沙箱怎么设计」或「怎么防数据外传」时：

> 先看用户能不能看懂并盯住 Agent 的动作。能判断的，可以用系统级沙箱加默认断网；判断不了或无人值守的，要用容器或虚拟机，凭证留在外面。模型层的防注入只能降低概率，对手多试几次成功率就上去了，所以不能当唯一防线。出网白名单要特别小心，白名单里的可信域名也可能被拿来当外传通道，要按能力来审，必要时加代理检查流量。

**对应知识点**：[代码执行、浏览器与文件操作沙箱](https://www.agent-journey.cn/knowledge?activeKey=agent-sandbox)、[沙箱逃逸风险与纵深防御](https://www.agent-journey.cn/knowledge?activeKey=agent-sandbox-escape)、[网页、文件与邮件中的间接 Prompt Injection](https://www.agent-journey.cn/knowledge?activeKey=agent-indirect-injection)

## 3. OpenAI Agents SDK 原生支持沙箱：循环和执行环境分开

**发生了什么**

OpenAI 2026 年 4 月 15 日更新了 [Agents SDK](https://openai.com/index/the-next-evolution-of-the-agents-sdk/)，把沙箱执行做成了内置能力：

- 可以直接接 Blaxel、Cloudflare、Daytona、E2B、Modal、Runloop、Vercel 等沙箱，也可以接自己的。
- 用 `Manifest` 描述 Agent 的工作区：挂哪些本地文件、输出目录在哪、从哪些对象存储取数据。
- 跑循环的部分和执行代码的部分分开。官方给的理由是：这样凭证就不会出现在运行模型生成代码的环境里。文中还写明，Agent 系统应该按「一定会遇到注入和外传尝试」来设计。
- 内置快照和恢复，容器没了可以在新容器里从上一个检查点接着跑。

这些能力先在 Python 版提供，TypeScript 版在计划中。

**和以前有什么不同**

以前很多 Agent 是「一个进程里既跑循环又跑工具」。现在 OpenAI 和 Anthropic 给出的方向一致：决定做什么的部分和真正动手的部分要拆开，凭证不进执行代码的环境，执行环境随时可以丢弃重建。

**面试里怎么用**

被问「你的 Agent 架构里，执行环境怎么放」时：

> 我会把 Agent 循环和代码执行环境拆成两层。执行那层是可丢弃的沙箱，里面尽量不放密钥，凭证放在沙箱外的保险库，需要访问外部服务就通过代理转发；会话状态也存在沙箱外面。这样模型生成的代码即使被注入，也很难拿到凭证；沙箱挂了可以从快照恢复，不丢任务。OpenAI 的 Agents SDK 和 Anthropic 的托管 Agent 都是这个思路。

**对应知识点**：[代码执行、浏览器与文件操作沙箱](https://www.agent-journey.cn/knowledge?activeKey=agent-sandbox)、[工作流状态、检查点与断点续跑](https://www.agent-journey.cn/knowledge?activeKey=agent-workflow-state)、[从零构建 Agent 运行时](https://www.agent-journey.cn/knowledge?activeKey=build-agent-framework)

## 参考资料

- [How we built Claude Code auto mode: a safer way to skip permissions](https://www.anthropic.com/research/claude-code-auto-mode)，Anthropic，2026-03-25
- [How we contain Claude across products](https://www.anthropic.com/research/how-we-contain-claude)，Anthropic，2026-05-25
- [The next evolution of the Agents SDK](https://openai.com/index/the-next-evolution-of-the-agents-sdk/)，OpenAI，2026-04-15

文中数字均取自以上原文，模型名称和数值以原文发布时为准。
