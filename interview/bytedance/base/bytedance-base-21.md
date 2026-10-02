公司：字节跳动；方向：AI Agent 开发（抖音电商）；轮次：一面。原帖发表于 2026 年 9 月，具体面试日与招聘类别未披露。

原题来自候选人自述，未独立证实；以下按主题归纳。候选人实际作答、教学案例和整理答案分开呈现，整理内容不代表企业标准答案。技术资料核验于 2026-10-02。

## 候选人记录与阅读目标

候选人介绍了自己做过的风控归因 Agent，并称采用三级架构。其记录显示，当时主要用职责清晰解释拆层，用摘要回答上下文交接，用父子文档回答切块，用任务成功率与人工打分回答评测；类型冲突、丢字段、状态隔离及 GRPO/PPO 的追问没有展开好。这些只是作者对现场的回忆，不能据此判断项目的完整实现。

读完本文，应能用同一个任务说明：哪一层需要模型决策，哪些字段必须由程序守住，如何验证最终结果，以及训练信号能解释到哪一级。先理解任务合同、工具执行与终态，再读算法和强化学习部分。

## 贯穿案例：一次只读风控归因怎样跑完

以下是教学设定，不是原题给出的业务数据或候选人项目细节。用户问：“店铺 A 在 10 月 1 日支付金额下降，查原因；排除已退款订单，只读分析。”服务端保存租户 A、明确的 UTC 时间区间、指标版本 `paid_amount_excluding_refunds.v3`、允许工具和数据版本。朴素方案是一个 Agent 调用流量、订单和风险事件查询，再写报告。

示例夹具中，前一日同一时段有 100 次有效访问、10 笔符合口径的付款，每笔 1000 元；当日仍有 100 次访问，只有 8 笔同额付款。因此金额从 10000 元变成 8000 元，下降 20%。这只是手工演算，尚不能证明风控策略导致下降。

1. 主 Agent 持有目标和全局进度，提出“比较流量”和“核对风控事件”两个独立子任务。运行时检查租户、只读权限、时间与预算，才创建专项会话；模型提出查询，外部系统执行后返回结果，角色名称本身没有授予权限。
2. 每个执行者收到同一指标合同和证据引用。流量分支返回“有效访问未下降”；风险分支返回“拦截事件增加”及日志引用。查询结果进入受租户权限约束的证据存储，子 Agent 只返回本分支需要的摘要和引用。
3. 主 Agent 合并证据，程序核对金额、退款排除和来源版本，输出“下降已验证；转化下降是分解结果；风控拦截增加是候选原因；尚缺可支持因果归因的对照证据”。如果数据不完整，输出缺口而不是补一个确定原因。

反例是交接摘要只有“店铺 A 支付下降”，遗漏“排除退款”。子 Agent 用含退款订单的总额，即使 SQL 合法、语言流畅，也完成了另一个任务。后面讨论的摘要校验、benchmark 和隔离，都是在防止这种合同漂移；增加三级 Agent 不会自动修复它。

## 原题导航

| 原帖题目归纳 | 下面的机制说明 |
| --- | --- |
| 三级 Agent 是否必要，编排层为何也要用 Agent | 单体、确定性编排与多 Agent 的比较 |
| 主子上下文怎样交接，摘要丢字段怎么办 | 交接合同与权威状态 |
| 超长上下文、长 query 怎样压缩 | 预算、保留字段与回源 |
| RAG 召回怎样提升，父子索引解决什么 | 检索粒度与回答上下文 |
| 两个多层 JSON 深度合并，异类型冲突怎样处理 | 冲突规则、递归与输入边界 |
| 怎样搭 Agent benchmark | 终态与执行轨迹的判分 |
| 多 Agent 上下文和状态怎样隔离 | 会话范围与业务授权 |
| GRPO/PPO 的奖励归因与 critic 有何区别 | 优势估计与终态信用分配 |

## 架构：三级 Agent 的每一层在决定什么

原题没有规定必须采用三级。先把案例中的依赖画出来：流量与风险查询可以独立进行，但原因报告必须等证据回来。一个 Agent 可以提出并行工具调用，普通程序也能并发执行查询；“能并行”不足以证明中间层还要再放一个模型。

只有某个专项需要自己的多轮探索、专业上下文或明确权限边界时，独立 Agent 才可能有用。例如风险分支先查失败码，再根据结果追查策略版本；这是动态决策。若流程始终是固定三条 SQL、固定合并规则，确定性编排更容易核对。Anthropic 的 [What are agents、Parallelization、Orchestrator-workers](https://www.anthropic.com/engineering/building-effective-agents)区分了这些模式；本文采用其架构机制，不采用旧工具信息。

在相同输入、数据、权限与预算下，比较单 Agent、程序编排加工具、两级以及三级方案。移除中间层后，任务成功率、漏约束率、延迟与成本怎样变化，才是第三层贡献的证据。高依赖分支若频繁交换大量上下文，拆层反而可能重复读取、协调失败；这里没有实际 benchmark，不给出收益数字。

**口述回答：**我不会先承诺三级；先找需要独立决策的分支，再用同任务消融验证层级贡献。固定流程交给代码，拆层收益要覆盖协调成本。

知识导航：[多智能体协作与适用边界](../../../knowledge/llm/agent/multi-agent.md)、[智能体定义、类型、PEAS 与 Agent Loop](../../../knowledge/llm/agent/agent-architecture.md)。

## 上下文：把压缩视图与执行依据分开

主子交接先传目标、不可变约束、精确实体、指标及数据版本、证据引用、未完成项和预算。案例中的租户、退款排除和时间区间应保存在服务端权威状态中；摘要可以帮助理解经过，却不能成为这些字段的唯一副本。收到缺少必填字段的任务时，运行时拒绝执行并回源，不能要求子 Agent 猜“用户大概想要什么”。

压缩也要按用途分配预算：先去无关日志，把大工具结果存成受权限控制的引用，再对旧对话生成工作摘要，保留近期消息及工具调用与结果的配对关系。长 query 先抽取并校验实体、否定、时间、单位和输出要求，再压缩说明性部分；将“不要查店铺 B”压成“查店铺”会直接改变任务。LangGraph 的 [Summarize messages](https://docs.langchain.com/oss/python/langgraph/add-memory#summarize-messages)说明了消息裁剪的信息损失及 summary 状态模式；这里的合同校验是应用设计，不是框架自动保证。

原始记录、结构化事实、工作摘要分别承担回查、精确执行和模型理解。若摘要丢了退款字段，先根据消息或合同恢复，再让任务继续；若原文也没有口径，就应澄清。评估压缩时检查同一任务的约束召回和结果正确性，不能只比较摘要长度。

**交接题口述：**关键字段在权威状态，摘要只提供工作视图；缺字段就阻断并回源，避免上游压缩错误变成下游执行依据。

**压缩题口述：**先裁无关信息和外置大结果，再压缩旧对话；实体、否定和时间有结构化保留合同，压缩后仍要验证任务结果。

知识导航：[会话摘要、压缩与记忆提炼](../../../knowledge/llm/agent/agent-memory-summarization.md)、[上下文工程（Context Engineering）](../../../knowledge/llm/agent/context-engineering.md)、[Agent 工具契约、Schema 与错误语义](../../../knowledge/llm/agent/agent-tool-design.md)。

## 检索：小块定位后为何还要取父块

案例中要查“风控命中后，已退款订单是否还计入支付指标”。短子块可能精确命中“退款排除”，但丢掉它所属的指标版本和适用条件。父子检索先用子块定位，再按父 ID 取对应章节，让生成器看到定义、条件和例外。维护者的 [Parent retriever 机制说明](https://www.langchain.com/blog/implementing-advanced-retrieval-rag-strategies-with-neo4j)展示了这个索引与返回粒度的区别；不代表所有业务召回一定提升。

先查漏召回发生在哪一层：数据有没有采到，解析是否完整，切块是否拆断定义，版本与权限过滤是否正确，查询中的术语能否匹配。评测时固定相关证据标签，分别观察候选覆盖和最终答题正确性。只有“小块找到了、却缺上下文”时，取父块才直接对应故障；数据根本缺失，换父子结构也找不到。

父块读取还要校验同一租户、文档版本与权限，去重并受上下文预算约束。不能从一个可读子块扩大读取到包含其他租户数据的父文档，也不能只返回整份长文而挤掉更关键的证据。

**口述回答：**父子索引把定位粒度与回答上下文分开；先小块召回再取合法父块补条件，适合上下文碎裂，不能解决缺数据或权限错误。

知识导航：[Parent-Child 与 Small-to-Big Retrieval](../../../knowledge/llm/rag/rag-parent-child.md)、[RAG 评估与优化](../../../knowledge/llm/rag/rag-evaluation.md)。

## 手写题：先约定类型冲突，再证明递归会结束

原帖没有给出冲突规则。下面**自行选定教学合同**：只有两个 JSON 对象才递归合并；数组、标量、null 或异类型冲突一律用右值替换；null 表示值，不表示删除。JSON 格式标准没有替应用规定这套 deep merge 语义；[RFC 8259 §3–5](https://www.rfc-editor.org/rfc/rfc8259.html)定义值、对象与数组，§4还提醒重复键的互操作风险。

以下配置输入与输出均为手工推演，未运行代码；不能用这种通用合并覆盖服务端授权字段。

```json
{
  "left": {
    "scope": {"tenant": "A", "filters": {"status": "paid", "exclude_refunded": true}},
    "channels": ["web"],
    "limit": 20,
    "note": "old"
  },
  "right": {
    "scope": {"filters": {"exclude_refunded": false}},
    "channels": {"primary": "app"},
    "limit": {"soft": 10},
    "note": null
  }
}
```

`scope` 两侧都是对象，继续进入 `filters`；`status` 只在左侧，保留；退款开关两侧都是布尔值，取右侧 false。`channels` 是数组与对象冲突，整个右对象替换左数组；`limit` 同理，数字替换为对象；`note` 变为 null。因此预期输出为：

```json
{
  "scope": {"tenant": "A", "filters": {"status": "paid", "exclude_refunded": false}},
  "channels": {"primary": "app"},
  "limit": {"soft": 10},
  "note": null
}
```

下面是接口无关伪代码，未在完整环境运行。输入先验证为有限、无循环、无重复对象键的 JSON 树，限制深度与总大小；对象判断必须排除数组和 null。若落实到 JavaScript 对象，使用安全字典或明确拒绝 `__proto__` 等危险键，不把任意实例当普通 JSON 对象。

```text
merge(left, right):
    if left 和 right 不同时为 JSON 对象:
        return deepClone(right)
    out = 新的安全字典
    for key in 两侧自有键的并集:
        if key 只在 left:  out[key] = deepClone(left[key])
        if key 只在 right: out[key] = deepClone(right[key])
        if key 两侧都有:   out[key] = merge(left[key], right[key])
    return out
```

每次递归下降到子值，有限树最终到达非双对象分支，所以终止。对只出现一侧的子树也深复制，才能让输出与输入没有可修改的共享子对象；仅“不直接改输入”还不够。以节点和字符串等载荷总大小计，在键查找平均常数时间、每棵子树不重复复制的实现中，时间为 `O(S_left + S_right + S_out)`，输出空间为 `O(S_out)`，额外递归栈为最大深度 `O(D)`。过深输入要拒绝或改显式栈，不依赖宿主语言无限递归。

若右侧只给 `channels:["app"]`，本合同输出就是该数组，不能偷偷拼接；若业务要按元素 ID 合并数组，必须另定去重、顺序和冲突规则。危险键、空对象、null、异类型、深度和输入不变性都是实现前要明确的边界。

**口述回答：**先约定双对象递归、其他右侧替换；用有限子树下降证明终止，并深复制保输入边界。数组合并和 null 删除都不是默认标准答案。

知识导航：[递归、分治与搜索](../../../knowledge/data-structure/algorithm/algorithm-loop.md)、[JSON / CSV / Parquet 数据格式](../../../knowledge/data/processing/data-formats.md)。

## 评测与隔离：判分对象是任务完成，范围标识不是授权

benchmark 的最小单位是“输入＋初始环境＋允许动作＋合法终态＋判分规则”。在贯穿案例中，任务成功至少要求租户 A、同一时间与口径、正确金额、只读约束和可追溯证据；不能把“给出原因”一律判成功，因为证据不足时正确行为是报告未知。程序检查这些可确定条件，模型裁判评价说明质量，人工校准模糊案例。Anthropic 的 [Types of graders、能力与回归评测](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)区分了轨迹与结果，以及不同评分器的边界。

冻结模型、提示词、工具、数据和判分版本，按正常、缺字段、跨租户诱导、工具失败等切片重复运行随机系统。比较同一用例的成功、失败变化，再观察成本与延迟；只用成功演示，或把更短答案当更优，都会遗漏任务退化。本文没有搭建或实测 benchmark。

隔离题还要往工具执行边界推进：tenant、thread、run、分支和授权范围进入状态查询、缓存键、证据对象和检查点；租户由可信会话绑定，不能由模型自由改写。共享状态明确可读字段，并发更新用版本校验，恢复时重新验证所有者与当前权限。LangGraph 的 [Checkpointer vs. store](https://docs.langchain.com/oss/python/langgraph/persistence)描述 thread 与跨 thread 的存储范围，它不等于业务授权；[OWASP 每次请求校验权限](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html#validate-the-permissions-on-every-request)支持服务端逐次检查这一原则。

反例：A、B 使用独立 session，但缓存只按“支付金额＋日期”命名，B 仍可能读取 A 的结果。评测应同时构造两个租户，检查查询、缓存、对象读取与恢复的交叉访问；这是建议的验证方案，没有声称已执行。

**benchmark 题口述：**先定义约束内的合法终态，再分开评分环境结果与轨迹；冻结版本、分切片重复比较，人工校准语言裁判。

**隔离题口述：**session 只划会话，授权必须贯穿存储、缓存和工具；租户由服务端绑定，每次读写校验范围，并发恢复也不能漏。

知识导航：[生产级 Agent 评估系统设计](../../../knowledge/llm/production/agent-eval-framework.md)、[Agent Benchmark 的设计与解读](../../../knowledge/llm/production/agent-benchmark.md)、[Agent 会话、检查点与任务状态存储](../../../knowledge/backend/storage/agent-state-storage.md)、[工作流状态、检查点与断点续跑](../../../knowledge/llm/agent/agent-workflow-state.md)、[RAG 数据权限与多租户隔离](../../../knowledge/llm/rag/rag-access-control.md)。

## 强化学习：优势估计不等于找出哪次工具调用立功

先定义两个概念：奖励评价轨迹的结果；优势表示某动作相对基线有多好。PPO 的剪切代理目标负责限制策略更新的优化激励，优势怎样估计是另一件事。原始 [PPO §3、§5，式(7)、(9)–(12)](https://arxiv.org/pdf/1707.06347)给出 actor-critic 式算法、价值损失和 GAE；价值函数预测状态的未来回报，可以与策略共享参数，不能把 PPO 定义为必须另有一个独立大模型。

GAE 用时序差分残差传播后续奖励，简写为：

$$
\delta_t = r_t + \gamma V(s_{t+1}) - V(s_t),\qquad
\hat A_t = \sum_{l=0}^{T-t-1}(\gamma\lambda)^l\delta_{t+l}.
$$

其中 `s_t` 是当前状态，`r_t` 是即时奖励，`gamma` 折扣未来奖励，`lambda` 调节估计方式；终止状态的价值按终止边界处理。critic 提供随状态变化的基线，不是工具调用的因果解释器。

[DeepSeekMath v3 §4.1.1，式(3)；§4.1.2–4.1.3](https://arxiv.org/html/2402.03300v3)则对同一问题采样 G 个输出，用组内奖励取代学习的价值基线。其 outcome supervision 对输出 i 的每个 token 赋相同优势：

$$
\hat A_{i,t} = \frac{R_i-\operatorname{mean}(R_1,\ldots,R_G)}
{\operatorname{std}(R_1,\ldots,R_G)}.
$$

教学上设四条完整归因轨迹奖励为 `[0,0,1,1]`，按总体标准差手算：均值 0.5、标准差 0.5，优势为 `[-1,-1,1,1]`。这不是原题数字，也不规定所有实现的标准差约定。成功轨迹即便包含一次无用查询，其所有 token 在这个优势构造下仍得到同一正值；token 的策略概率比不同，实际梯度也不必相同。由此不能推出“那次查询有贡献”。

GRPO 省掉的是价值函数近似与训练，评分仍需要奖励模型或规则。原论文还单列 process supervision，用步骤奖励构造后续步骤的累积优势；更细信号也不自动成为可靠因果证据。原论文目标保留剪切项及参考策略 KL 正则，不能把组内归一化误认为所有稳定训练机制都可省略。

边界会改变选择：组内奖励完全相同时，零标准差需要实现明确的跳过或数值处理，不能直接套除法；评分噪声会污染组比较；较大 G 增加采样成本，所以省 critic 不保证端到端总成本下降。映射到长工具轨迹时，应先检验终态奖励是否遗漏越权、冗余动作或中间失败，再设计可验证的过程信号。这是从论文机制迁移到案例的分析，不是 DeepSeekMath 已验证的业务 Agent 结论。

**口述回答：**常见 actor-critic 式 PPO 用价值基线与 GAE，原始 GRPO 用同题组奖励形成相对优势，从而不用价值 critic。终态 GRPO 没有分辨单次工具的贡献，奖励质量、零方差和长轨迹归因仍要处理。

知识导航：[Agentic RL：长时序信用分配与策略优化](../../../knowledge/llm/agent/agentic-rl.md)、[RLHF、RLAIF 与 DPO 的差异](../../../knowledge/llm/basics/llm-rlhf-dpo.md)。

## 教学补充／模拟追问

以下三题是为迁移机制而设计，均非原帖题目。

1. **两个分支都只执行已知 SQL，去掉中间 Agent 后结果相同，下一步如何取舍？**保留程序并发与合同校验，按同预算比较延迟、成本和恢复行为；不能为保住“三级”而把固定操作重新交给模型。定位：架构与评测。
2. **会话已隔离，但异步摘要晚到，且右侧 JSON 把 tenant 改成 B，能直接合并吗？**先验证摘要覆盖范围与状态版本，拒绝过期覆盖；授权字段来自服务端，通用深合并不负责授权。JSON 合并“正确”不能抵消任务越权。定位：上下文、手写题与隔离。
3. **四条轨迹都成功，但有的重复查了十次，GRPO 能自动学会省工具吗？**同奖励组没有有效组内优劣信号；须明确成本是否进入奖励及其权衡，并独立验证任务与约束。不能把增加过程奖直接当成可靠归因。定位：优势估计。

## 原帖记录边界与参考资料

原帖还记录了关于团队 RL 与 SFT 使用情况的反问及个人面试感受，未提供可验证的训练配比或招聘标准。案例数据、系统设计、伪代码和追问均为教学补充，未运行完整系统或训练实验。

本次实际采用：PPO 2017 原论文；DeepSeekMath arXiv:2402.03300v3（2024-04-27）；RFC 8259（2017-12）。其余滚动文档与一手工程文章核验于 2026-10-02；仅使用文中所列架构、summary、存储范围、检索和评测章节。

- [Anthropic：Building effective agents，工作流、并行与动态编排](https://www.anthropic.com/engineering/building-effective-agents)
- [LangGraph：Summarize messages](https://docs.langchain.com/oss/python/langgraph/add-memory#summarize-messages)、[Persistence：Checkpointer vs. store](https://docs.langchain.com/oss/python/langgraph/persistence)
- [OWASP：Authorization，最小权限及逐请求校验](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [LangChain：Parent retriever 的小块索引与父块返回机制](https://www.langchain.com/blog/implementing-advanced-retrieval-rag-strategies-with-neo4j)
- [Anthropic：Demystifying evals，评分器与能力/回归评测](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- [RFC 8259：JSON Values、Objects、Arrays 与 Parsers](https://www.rfc-editor.org/rfc/rfc8259.html)
- [PPO 原论文：§3、§5](https://arxiv.org/pdf/1707.06347)
- [DeepSeekMath：§4.1.1–4.1.3](https://arxiv.org/html/2402.03300v3)
