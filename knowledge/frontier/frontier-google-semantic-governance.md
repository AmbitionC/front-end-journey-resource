2026 年 11 月 20 日，Google 在开发者博客介绍了「语义治理策略」（Semantic governance policies），三天后又发了一篇讲它怎么防「意图劫持」并公布了测试数字。它做的事情一句话就能说清：Agent 每次要调用工具之前，先让另一个模型判断「用户要求过这件事吗」，不是就拦下。本期讲它怎么工作、数字怎么读、它自己承认挡不住什么。

> **本期 30 秒版**
> 1. 权限管不住提示注入：权限只规定 Agent 能做什么，判断不了某一次调用是不是用户真想要的。Google 的做法是在网关上拦住每个工具调用，由一个模型裁判对照用户请求和自然语言写的规则来放行或拒绝。
> 2. 公布的数字：在 AgentDojo 基准上，攻击成功率从 48.7% 降到 0.9%，正常任务的完成率下降 2.6 个百分点。
> 3. Google 自己写明的边界：这是一个模型、一种攻击、一个基准上的结果，攻击没有针对这套防护做适配；流式响应不在检查范围内；裁判本身是模型，会判错。

## 1. 它是什么：在网关上判断每一次工具调用

**发生了什么**

Google 的两篇博客分别是 [Check what your AI agents do before they do it](https://developers.googleblog.com/en/check-what-your-ai-agents-do-before-they-do-it-with-semantic-governance-policies/)（2026-11-20）和 [Did the user ask for this?](https://developers.googleblog.com/en/did-the-user-ask-for-this-securing-ai-agents-against-intent-hijacking-with-semantic-governance-policies/)（2026-11-23）。这项功能在 Gemini Enterprise Agent Platform 上处于预览阶段，执行点是 Agent Gateway。

它针对的问题，博客说得很直接：模型可能被说服去违反系统提示词里的规则，说服它的可能是给出了好理由的用户，也可能是一份文档里夹带的指令。后一种就是间接提示注入。而权限系统对此无能为力，因为权限说的是 Agent 能做什么，说不了某一次调用合不合规矩。

**怎么工作**

按[官方文档](https://docs.cloud.google.com/gemini-enterprise-agent-platform/govern/policies/semantic-governance-overview)，分四步：

1. **识别**：Agent 的请求带着身份令牌。
2. **拦截**：模型返回了一个工具调用建议，Agent Gateway 把它截住，按 Agent 的身份取出对应的策略，连同对话历史一起交给策略引擎。
3. **判定**：策略引擎里的模型裁判做两项检查，一是这次调用符不符合用户的意图，二是有没有违反配置的规则。两项都通过才放行。
4. **执行**：被拒绝的话，响应里的工具调用会被换成一条拒绝消息，这次调用不会发生。

几个设计细节：

- 策略用自然语言写，比如「单笔退款不超过多少」，不需要翻译成专门的策略语言。可以作用于整个 Agent，也可以只作用于某一个工具。
- 用户意图检查默认开启，不配置任何策略也能用。
- 判定结果只有放行和拒绝两种。拒绝时会附带一段给人看的理由，所以文档提醒不要在策略里写敏感信息。
- 只含文字、不含工具调用的响应不检查，因为它没有执行任何动作。
- 有试运行模式：只记录本来会拒绝什么，不真的拦。博客建议先用这个模式看一段时间再正式启用。
- 裁判依赖工具描述来理解一次调用，被要求拒绝调用没有描述的工具。

**裁判怎么防自己被注入**

第二篇博客解释了关键的一点：裁判看到的上下文和 Agent 一样，但读法不同。用户的请求和 Agent 的系统提示词被当作可信的；工具返回的结果、文件、消息一律当作数据，不当指令。

博客也老实交代了这条界线的性质：这种区分是靠给裁判的指令实现的，不是一道硬性的技术边界。

**和以前有什么不同**

以前防提示注入主要两条路：在输入端扫描可疑内容，或者靠模型自己抵抗。这个方案换到了动作端：不管输入里藏了什么，只在动作要发生的那一刻问一句「用户要求过吗」。它和 Anthropic 给 Claude Code 做的自动审批分类器是同一个思路，区别是这里放在了网关上，对 Agent 的代码透明，也支持 Gemini 以外的模型。

**面试里怎么用**

被问「怎么防间接提示注入」或「Agent 的工具调用怎么做运行时管控」时：

> 我会在动作端加一层独立的检查。输入端的扫描总有漏的，所以在每次工具调用执行之前，由另一个模型对照用户的原始请求判断这次调用是不是用户想要的，同时检查有没有违反业务规则，不通过就把调用替换成拒绝消息。这层检查要把用户请求和系统提示词当可信来源，把工具返回的内容当数据。Google 最近把这个做成了网关上的功能，规则用自然语言写，上线前可以先用只记录不拦截的模式跑一段时间。它是静态权限之外的补充，不是替代。

**对应知识点**：[Prompt Injection 与间接注入防御](https://www.agent-journey.cn/knowledge?activeKey=prompt-injection-defense)、[网页、文件与邮件中的间接 Prompt Injection](https://www.agent-journey.cn/knowledge?activeKey=agent-indirect-injection)、[最小权限、授权与工具调用确认](https://www.agent-journey.cn/knowledge?activeKey=agent-permission-model)

## 2. 数字怎么读：48.7% 到 0.9%

**测试条件**

第二篇博客和配套的[基准测试文档](https://docs.cloud.google.com/gemini-enterprise-agent-platform/govern/policies/adversarial-benchmarking)给出的设置是：

- 基准是 AgentDojo v1.2.2，97 个用户任务，949 次带攻击的运行，覆盖银行、Slack、旅行、办公四个场景。
- Agent 用的模型是 gemini-2.5-flash，攻击方式是基准自带的一种。
- 只开用户意图检查，没有配置任何策略。也就是说所有拒绝都来自「用户要求过吗」这一项判断。
- 每种配置完整跑 6 次取平均。

**结果**

| 指标 | 不加防护 | 加防护 |
| --- | --- | --- |
| 攻击成功率 | 48.7% | 0.9% |
| 正常任务完成率 | 72.7% | 70.1% |
| 被攻击时的任务完成率 | 35.1% | 25.8% |

- 需要调用工具才能得手的 929 次攻击，6 次运行里一次都没有成功。剩下成功的都发生在旅行场景，是一种只靠文字、不需要调用工具的攻击。
- 误伤方面，博客的说法是 97 个正常任务里有 1 个被意外拦截。

**读这组数字要注意三点**

- 攻击没有针对这套防护做适配。博客自己说，专门设计的攻击可以尝试操纵裁判，比如把注入的请求伪装成用户说的话，而这组结果没有测这种情况。
- 防护不是没有代价。被攻击时的任务完成率从 35.1% 降到 25.8%：拦住了攻击，但原本的任务也更容易做不完。
- 这是一个模型、一种攻击、一个基准上的结果。

## 3. 它挡不住什么

官方文档和博客写明的限制：

- **流式响应不检查**。文档的原意是，策略引擎不支持流式的模型响应，流式响应里的工具调用可能不会被拦，建议把 Agent 配置成不用流式调用模型。
- **裁判会错**。文档写明模型是概率性的，判定可能不准确。
- **只管动作，不管文字**。只靠文字误导用户的攻击不在这层的范围内，需要配合响应过滤之类的手段。
- **流量必须过网关**。Agent 到模型的所有出站流量都要经过 Agent Gateway，绕过去就没有检查。
- **它是补充**。文档写明它和访问控制等机制互补，不覆盖也不替代它们。
- 博客和文档都没有给出每次判定的延迟和价格，只说会把每一轮的 token 消耗记进日志。

**面试里怎么用**

被问「加一层模型来审查 Agent 的动作，够不够」时：

> 不够，但很有用。Google 公布的数据是 AgentDojo 上攻击成功率从 48.7% 降到 0.9%，正常任务只掉 2.6 个点。但要看清条件：攻击是基准自带的固定攻击，没有针对这层防护做适配，而适应性攻击往往能把成功率拉回来不少。这层防护自己也有盲区，比如流式响应不检查，纯文字的误导拦不住，裁判是模型也会错。所以我会把它当成纵深防御里的一层，前面有输入扫描，后面有最小权限和沙箱，高风险动作再加人工确认。

**对应知识点**：[Prompt Injection 与间接注入防御](https://www.agent-journey.cn/knowledge?activeKey=prompt-injection-defense)、[沙箱逃逸风险与纵深防御](https://www.agent-journey.cn/knowledge?activeKey=agent-sandbox-escape)、[Human-in-the-loop 审批与人工接管](https://www.agent-journey.cn/knowledge?activeKey=agent-human-in-loop)

想对照 Anthropic 的做法，可以看 [权限与沙箱专题：分类器代替弹窗、隔离强度、凭证不进沙箱](https://www.agent-journey.cn/knowledge?activeKey=frontier-permission-sandbox) 里的 Claude Code auto mode。两家都选择让一个独立的审查方只看用户请求和将要执行的动作。

## 练一练

### 高频考点题 1：检查发生在哪一步

Google 的语义治理策略在什么时候介入？

- A. 用户输入进入模型之前，扫描其中的可疑内容
- B. 工具执行完成之后，检查返回结果
- C. 模型训练阶段，过滤有害样本
- D. 模型给出工具调用建议之后、调用真正执行之前

**答案：D。** 它在网关上截住模型返回的工具调用建议，由策略引擎判定后再决定放行还是替换成拒绝消息，所以是在动作发生之前介入。输入扫描和结果检查是其他机制的工作，和训练阶段无关。

### 高频考点题 2：裁判信任谁

为了避免裁判自己被注入内容带偏，它把哪些内容当作可信来源？

- A. 工具返回的结果
- B. 用户的请求和 Agent 的系统提示词
- C. 网页和文件里的文字
- D. 对话中出现的所有内容

**答案：B。** 裁判把用户请求和系统提示词当作可信的，把工具结果、文件和消息当作数据而不是指令。博客同时说明，这种区分靠的是给裁判的指令，不是硬性的技术边界。

### 高频考点题 3：数字的适用条件

关于「攻击成功率从 48.7% 降到 0.9%」这组结果，下面哪种说法准确？

- A. 攻击用的是基准自带的固定方式，没有针对这层防护做适配
- B. 它证明这层防护能挡住所有提示注入
- C. 它是在多个模型和多种攻击下的平均结果
- D. 加上防护后正常任务的完成率没有任何变化

**答案：A。** 测试只用了一个模型和基准自带的一种攻击，博客明确说攻击没有针对这套防护调整，专门设计的攻击可能操纵裁判。正常任务完成率也下降了 2.6 个百分点，所以不能说没有代价，更不能说能挡住所有注入。

## 参考资料

- [Check what your AI agents do before they do it, with Semantic governance policies](https://developers.googleblog.com/en/check-what-your-ai-agents-do-before-they-do-it-with-semantic-governance-policies/)，Google Developers Blog，2026-11-20
- [Did the user ask for this? Securing AI agents against intent hijacking with Semantic governance policies](https://developers.googleblog.com/en/did-the-user-ask-for-this-securing-ai-agents-against-intent-hijacking-with-semantic-governance-policies/)，Google Developers Blog，2026-11-23
- [Semantic governance policies overview](https://docs.cloud.google.com/gemini-enterprise-agent-platform/govern/policies/semantic-governance-overview)，Google Cloud 文档
- [Semantic governance policies adversarial benchmarking](https://docs.cloud.google.com/gemini-enterprise-agent-platform/govern/policies/adversarial-benchmarking)，Google Cloud 文档

文中数字均取自以上原文，模型名称和数值以原文发布时为准。
