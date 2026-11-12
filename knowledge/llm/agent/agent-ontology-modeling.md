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

## 常见误区与自检

用一张统一字段表就宣称消除了全部语义冲突；把 OWL 开放世界当业务默认放行；认为全部 HTTP 接口包装成工具就天然对 Agent 友好；只换 RPC 协议就宣称完成领域重构。这些说法都跳过了业务合同。检查时找一个同名异义例子、一项高风险动作和一次结果未知的重试，逐层说明谁负责判断。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [阿里云后端与 Agent 二面：领域建模、训练并行与 Java 基础](../../../interview/alibaba/ai/alibaba-ai-28.md)
- [美团业务后台综合面：本体建模、Agent 评测与一致性](../../../interview/meituan/ai/meituan-ai-13.md)
<!-- interview-source-history:end -->

## 参考资料

- [W3C：OWL 2 Primer](https://www.w3.org/TR/owl2-primer/)
- [MCP 2025-11-25：Tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
- [Microsoft：领域分析](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/domain-analysis)
