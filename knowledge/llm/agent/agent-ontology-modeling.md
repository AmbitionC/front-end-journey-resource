这里的本体指对特定领域概念、对象、关系及其含义的显式描述。学习目标是区分“对象是什么意思”“可以做什么业务操作”和“如何发现、调用能力”，避免把 Ontology、Action、HTTP 接口与 MCP 当作同一层。

## 从同一个名字的不同含义开始

订单系统的 customerId 与营销系统的 userId 可能指向同一主体，也可能具有不同生命周期。先写清对象标识、业务含义、数据来源、关系与适用上下文，再决定映射。名称相同不证明意义相同，名称不同也不证明对象不同；映射应有规则、版本与反例验证，不能让模型凭词面猜测。

## OWL 能表达什么

[W3C OWL 2 Primer](https://www.w3.org/TR/owl2-primer/)使用类、属性、个体与公理表达领域知识，并通过明确定义的语义支持推理。比如可以声明 PremiumCustomer 是 Customer 的子类，再根据已知事实推出类成员关系。真实工程中“采用本体”不一定采用 OWL，也不意味着已经拥有完整推理机；必须说明所用语言、推理范围与数据更新方式。

OWL 的开放世界假设意味着某事实未记录不等于事实为假。不能因为没有“用户可退款”的三元组就直接推导没有权限，也不能把一致性推理当成输入校验和授权。这些执行约束应由相应业务系统确定。

## Action 是业务能力合同

本文把 Action 用作工程概念：一个有业务意图的操作，例如“申请退款”，应声明输入、前置条件、权限、副作用、成功结果、幂等与错误。它不是 OWL 规定的一种通用执行原语，也不是任一公司的私有 Action 分类。

已有接口可以作为执行适配器，但直接暴露接口往往遗漏对象语义、合法状态、权限来源和未知结果。工具设计应缩窄意图并让执行端检查条件。结构正确的 JSON 不自动拥有执行权，详见[工具契约](agent-tool-design.md)。

![领域语义模型描述对象和关系，Action合同描述操作约束，MCP适配提供发现调用，执行系统独立验证权限与业务状态](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-ontology-modeling-boundaries-v1.png)

## 与 MCP、普通接口有什么关系

| 层次 | 主要问题 | 不能自动提供 |
| --- | --- | --- |
| 本体/领域语义 | 对象、关系、术语是什么意思 | 实际业务写入与权限 |
| Action/工具合同 | 这个动作接受什么，何时能执行，结果是什么 | 底层服务永不失败 |
| MCP | 客户端怎样发现能力并交换调用消息 | 统一所有业务概念与最终授权 |
| HTTP/RPC 适配 | 怎样把请求交给服务 | 业务语义天然一致 |

[MCP 工具规范](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)规定工具的名称、Schema 与调用结果等合同。这里固定引用版本以解释层次，不宣称它是当前唯一版本。一个系统可以用 MCP 暴露其领域动作，也可以用其他接口；本体并不是 MCP 的替代协议，MCP 也不替代领域建模。

## 一个小型教学例子

假设两个服务分别使用“已付款”和“已结算”。先确认二者时间点与资金含义，再建立语义映射；不要只把两个字段都命名为 paid。Action `request_refund` 接受订单标识和原因，执行端检查主体、订单状态与退款上限，并通过稳定操作 ID 处理重试。MCP 只承载该能力的发现和调用，最终退款状态仍向权威系统核验。

页面可以使用共同对象模型呈现状态，但显示一个按钮不授予执行权，前端校验不替代服务端规则。这里是教学设计，没有据此推定任何面试项目的分层、OWL 设计或实际 Action 分类。

## 领域建模与 CLI 加 Skill 怎样组合

本体、Action 与 CLI 加 Skill 并不处在同一个比较轴上。领域模型描述对象和业务含义；Action 描述一项操作的合同；CLI 是能力调用入口，Skill 则封装任务做法、说明和可选资源。[Agent Skills 格式规范](https://agentskills.io/specification)规定了 `SKILL.md` 与可选脚本、参考资料等组织方式，它本身没有替应用统一跨系统的业务概念。

下面是基于这些分工的工程比较，不是某个项目已经测出的效果：

| 起点 | 可能适合的情况 | 仍需付出的成本 |
| --- | --- | --- |
| 先明确领域概念与 Action，再提供调用入口 | 多个系统反复出现同名异义、状态或操作约束不一致，需要复用共同合同 | 领域专家协作、映射版本、适配维护与验证，不宜一开始追求覆盖全域 |
| 复用已有 CLI，用 Skill 组织任务 | 命令已有稳定合同，任务范围有限，能够较快验证一条端到端流程 | 命令参数、权限、副作用和错误仍须核验；把冲突术语写进说明书并不会自动消除冲突 |

两种起点可以汇合：领域 Action 可由 CLI 调用，Skill 可说明如何选择对象和动作；已有 CLI 也可以逐步接入语义适配。要比较的是在具体任务上的成功、错误、维护投入与总成本，不能把“采用本体”或“包装成 Skill”本身当作收益。Skill 的加载与权限边界见[Skill 设计](agent-skill-design.md)。

## 为什么不能只按数据库表决定对象与动作

数据库表反映一种持久化组织，不必然等于使用者理解的业务概念。一个概念可能跨多表，一个表也可能装入多个上下文的字段；若实际语义和生命周期确实一致，可以复用映射，但应有业务证据，而不是因为字段同名就直接合并。[Microsoft 的领域分析说明](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/domain-analysis)强调按业务能力与限界上下文建模，同一实体在不同上下文可以只保留各自需要的属性。

Action 粒度再按一项可验收的业务意图收敛：输入与前置条件是什么，谁有权执行，成功改变什么，失败和未知结果怎样处理。过大的“管理所有对象”难以授权与验收；逐字段写入若暴露了本应一起维护的不变量，又会让调用方承担业务一致性。读写可分离，但涉及原子性的业务变化应由后端合同落实，不能靠 Agent 连续调用就承诺原子成功。具体的窄意图、幂等与错误设计见[工具契约](agent-tool-design.md)。这是一组设计检查方法，不是 OWL 规定的 Action 切分算法。

## 存量系统怎样渐进接入

领域语义改进不要求先重写全部数据库与服务。一种候选做法是在新能力与旧系统之间放置适配层，外侧采用明确的业务模型，内侧继续使用旧接口或 CLI；先限定一个对象、一项能力和可核验的映射，再决定是否扩大范围。[Microsoft 的防腐层模式](https://learn.microsoft.com/en-us/azure/architecture/patterns/anti-corruption-layer)正是通过翻译不同子系统的数据模型与语义支持分阶段集成，并明确指出额外时延、运维、监控及事务和数据一致性成本。

例如，先让只读查询把两个系统中的状态翻译为带来源、时间和映射版本的候选事实；遇到未知值先保留未知并返回校验错误，避免随意归入“已完成”。若再开放写 Action，仍由权威系统检查权限、当前状态与幂等，适配层不能凭字段翻译创造跨系统事务。这是教学设计，不表示原面经项目采用了它。

如果系统间没有显著语义差异，额外适配层可能得不偿失；如果旧接口无法表达所需状态或约束，也不能靠一层包装宣称改造完成。先在小范围核验任务结果、翻译错例、时延与维护成本，说明哪些是已有结果、哪些仍是计划，再据此选择扩展、修改或停止。

## 常见误区与自检

用一张统一字段表就宣称消除了全部语义冲突；把 OWL 开放世界当业务默认放行；认为全部 HTTP 接口包装成工具就天然对 Agent 友好；只换 RPC 协议就宣称完成领域重构。这些说法都跳过了业务合同。检查时找一个同名异义例子、一项高风险动作和一次结果未知的重试，逐层说明谁负责判断。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节后端与 Agent 开发二面：本体平台、延迟任务与注意力](../../../interview/bytedance/base/bytedance-base-81.md)
- [淘天 AI Agent / 大模型应用研发二面：幻觉治理、Action 与轨迹偏好](../../../interview/alibaba/ai/alibaba-ai-30.md)
- [阿里云后端与 Agent 二面：领域建模、训练并行与 Java 基础](../../../interview/alibaba/ai/alibaba-ai-28.md)
- [字节后端与 Agent 开发三面：领域建模、项目评测与基础](../../../interview/bytedance/base/bytedance-base-80.md)
- [美团业务后台综合面：本体建模、Agent 评测与一致性](../../../interview/meituan/ai/meituan-ai-13.md)
<!-- interview-source-history:end -->

## 参考资料

- [W3C：OWL 2 Primer](https://www.w3.org/TR/owl2-primer/)
- [MCP 2025-11-25：Tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
- [Microsoft：领域分析](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/domain-analysis)
- [Agent Skills：格式、说明与资源组织](https://agentskills.io/specification)
- [Microsoft：防腐层模式与分阶段集成](https://learn.microsoft.com/en-us/azure/architecture/patterns/anti-corruption-layer)
