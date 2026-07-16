Agent Guardrails 是分布在输入、模型决策、工具调用、结果和最终输出上的控制层。它们降低错误与攻击成功的概率，但没有单一过滤器能证明系统安全；可靠设计依赖确定性校验、最小权限、隔离、审批、监控和评估共同工作。

## Guardrail 与授权、沙箱的边界

Guardrail 判断内容或行为是否满足规则；permission model 决定主体是否有权；sandbox 限制即使获权的代码能触达什么；approval 把高影响决定交还给人。四者互补。一个输出分类器说“安全”不能授予写权限，一个允许调用工具的 token 也不证明参数无害。

[OpenAI Guardrails 与 approvals 文档](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals)把 guardrail 放在 input、output 和 tool 等边界，并区分 blocking 与 parallel 模式。Blocking 检查先通过才继续；parallel 可以降低感知延迟，但工作可能在检查完成前已经开始，不能用于不可逆副作用。

![用户输入、Agent、工具调用、不可信工具结果和最终输出依次经过输入验证、注入检测、schema/权限/审批/沙箱、结果验证、输出策略和 PII 脱敏，观测与评估覆盖全链路](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-guardrails-layered-controls-v1.webp)
*图：Block 在副作用前阻断；Alert 负责发现和响应，不能代替预防控制。*

## 输入边界

输入先做长度、编码、文件类型、schema、租户/主体、来源和敏感性检查。外部网页、邮件、文档和工具结果标记为 untrusted，不因出现在上下文里就变成指令。

[OpenAI Agent Builder safety 指南](https://developers.openai.com/api/docs/guides/agent-builder-safety)提醒不要把不可信变量直接插入高权限 developer message，并建议使用结构化输出约束节点间数据流。本文不依赖已弃用的 Agent Builder 产品；这里采用的是通用安全原则。结构化 schema 降低任意指令传播，却不能阻止合法字段中的恶意内容，仍需消费端验证。

## 模型决策边界

系统策略与用户内容分层，模型只提出 action proposal：工具名、参数、意图、风险和预期结果。受信任 orchestrator 校验 proposal，不让模型直接获得底层句柄。模型置信度可用于升级人工，不作为安全许可。

对于拒答、内容安全或领域规则，可组合确定性规则、分类器与模型评审。分类器本身可能误报/漏报，保留版本、阈值、适用范围和降级策略。高风险领域不以单次模型判断结束。

## 工具边界

工具调用依次校验：工具 allowlist、参数 schema、主体/资源/操作授权、风险审批、速率/预算、幂等键和沙箱。工具描述里的“只读”不能替代实现级保证；执行层必须实际限制 HTTP 方法、文件模式或数据库角色。

工具返回也不可信：schema 校验、大小限制、编码规范、恶意文件扫描、来源标签和敏感字段处理。不能把返回文本直接拼回 system prompt。结果如果声称外部写入成功，再读取权威状态验证。

## 输出边界

最终输出检查数据泄露、秘密、个人信息、越权内容、引用与事实证据、危险指令和通道格式。对 Markdown/HTML/终端输出做上下文适当的转义与控制字符处理。输出过滤不能“修复”已发生的外部副作用，所以必须晚于工具边界但早于用户/下游消费。

输出被拦截时保留安全替代：删除敏感字段、要求澄清、转人工或只返回可公开摘要。不要在错误提示里重复被拦截的秘密。

## Prompt Injection 的纵深防御

Prompt injection 是信任边界问题，不是一个关键词列表。对外部内容：隔离其角色，限制可影响字段，禁止写高权限策略，工具最小化，敏感动作审批，输出与网络监控。把秘密从可见上下文移走比要求模型“不要泄露”更可靠。

[OWASP Agentic Applications 指南](https://genai.owasp.org/resource/securing-agentic-applications-guide-1-0/)从身份、权限、工具、记忆和通信等角度给出防御建议；[NIST AML taxonomy](https://csrc.nist.gov/pubs/ai/100/2/e2025/final)则从攻击者目标、能力、知识与生命周期描述对抗风险。Guardrail 设计应来自威胁模型，而不是复制通用清单。

## 状态、失败与恢复

每个 guardrail 返回结构化结论：pass/block/review、规则 ID、版本、理由代码和安全摘要。Block 不自动等于用户恶意，也可能是误报或缺上下文。对可恢复情况请求更窄输入；策略拒绝不应自动重试；需要人工时保存可恢复 state 和 exact action proposal。

Parallel guardrail 失败时必须能取消尚未发生的工作，并确认不可取消工具的状态。若副作用已发生，进入补偿/事件响应，而不是假装阻断成功。

## 测试与观测

测试正常流、边界输入、编码混淆、跨语言注入、网页/文件间接注入、工具参数走私、输出泄密、误报、并发检查竞态和策略版本回滚。安全集不能只含公开固定 prompt，避免针对测试集过拟合。

记录 guardrail 名称/版本、输入类别、结论、延迟、覆盖的 action、人工结果和后续事件，敏感原文使用受控引用。指标包括拦截率、误报/漏报、审批通过、绕过尝试、parallel race、副作用前阻断比例和规则漂移。定期用生产失败更新评估集。

## 小结

Guardrails 是贯穿 Agent 数据与动作路径的控制平面：输入标记信任，模型只提议，工具前做 schema/权限/审批/沙箱，结果重新验证，输出防泄露，观测和评估持续校准。防御有效性来自多层独立边界，而不是某个“安全提示词”。

## 参考资料

- [OpenAI — Guardrails and human approvals](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals)
- [OpenAI — Safety in building agents](https://developers.openai.com/api/docs/guides/agent-builder-safety)
- [OWASP — Securing Agentic Applications Guide](https://genai.owasp.org/resource/securing-agentic-applications-guide-1-0/)
- [NIST — Adversarial Machine Learning Taxonomy](https://csrc.nist.gov/pubs/ai/100/2/e2025/final)
