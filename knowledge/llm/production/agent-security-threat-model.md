Agent 威胁建模要沿数据流和信任边界分析“谁能让系统做什么”，而不是列一张模型攻击名词表。Agent 连接用户、模型、工具、记忆、其他 Agent 和外部内容，每个连接都可能改变权限或产生副作用。

## 从资产和攻击者开始

资产包括用户数据、凭证、资金、发布渠道、代码仓库、长期记忆、内部网络、模型/策略配置和审计证据。攻击者可能是恶意用户、被入侵网页/工具、供应链包、越权内部主体、另一个租户或被污染的 Agent。

[NIST 对抗式机器学习分类](https://csrc.nist.gov/pubs/ai/100/2/e2025/final)从攻击者目标、能力、知识和生命周期阶段组织威胁。先回答攻击者能控制哪些输入、观察哪些输出、调用多少次、是否拥有账户或工具，再评估可行路径。

下面沿外部内容进入上下文、模型提出调用、运行时校验、工具执行和结果回填检查边界。把认证身份与具体操作确认放在可信通道中，检查点必须落在副作用发生之前。

<iframe
  src="https://www.agent-journey.cn/archify/agent-security-trust-boundaries.html"
  title="Agent 不可信内容与工具执行的信任边界"
></iframe>

*图：外部内容和工具返回始终按不可信数据处理；模型只能提出工具与参数，运行时按当前请求重新校验身份、Schema、意图和实际资源权限。高影响操作还需取得所要求的具体确认，校验未通过就不执行。这是针对该数据流的教学示意，其他威胁仍按正文逐项建模与测试。*

[旧配图勘误存档](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-security-threat-model-trust-boundaries-v1.webp)：旧图把外部内容与执行组件放在同一个外框，未清楚区分入站注入与模型外校验边界；保留链接供核对，当前教学以新图和正文为准。

## 画数据流和信任边界

为每条流记录来源、目标、数据、身份、协议、权限、存储和副作用：用户→orchestrator，外部内容→模型，模型→工具，工具→资源，工具结果→模型，Agent↔Agent，记忆→上下文，trace→观测平台。

边界通常位于浏览器/服务端、租户、网络区、模型提供商、工具适配器、沙箱、数据库和人工审批。即使组件同属一个团队，只要身份/权限/数据处理不同就应视为边界。

## Agent 特有威胁

[OWASP Agentic AI Threats and Mitigations](https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/)与[安全 Agent 应用指南](https://genai.owasp.org/resource/securing-agentic-applications-guide-1-0/)涵盖多类风险。结合数据流常见为：

- **Prompt injection**：外部内容诱导模型偏离可信目标；
- **Tool abuse / excessive agency**：参数或权限过宽导致非预期副作用；
- **Memory poisoning**：恶意事实或规则跨回合持续影响；
- **Identity spoofing**：伪造 Agent/用户/服务来源；
- **Insecure messaging**：重复、乱序、篡改或越权任务；
- **Data exfiltration**：通过网络、日志、输出或隐蔽字段泄露；
- **Resource exhaustion**：无限循环、工具风暴和高成本请求；
- **Supply chain**：模型、插件、包、镜像和数据源被替换。

每个威胁写攻击前提、路径、影响、已有控制、可检测信号和剩余风险。不要把 prompt injection 当作所有问题的总称。

## 控制映射

预防控制：输入信任标记、结构化数据流、最小权限 capability、域名/文件 allowlist、沙箱、schema、幂等、审批、签名身份、供应链锁定。检测控制：trace、异常工具参数、数据外发、权限拒绝、记忆冲突和 canary。响应控制：撤销 token、隔离会话、停止队列、回滚版本、删除污染记忆、补偿副作用和通知。

控制要独立于模型。模型可以建议风险，但工具执行点、网络代理和数据层强制策略。输出过滤无法撤销已发送邮件，因此副作用前的权限/审批优先。[OWASP LLM06:2025 的最小权限、用户上下文与完整仲裁建议](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/)要求在下游系统强制授权，而非让模型自行决定；[LLM01:2025 的防护建议](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)同时要求标记外部内容与对高风险操作设置人工确认。上述页面本次核验于 2026-10-15，防护降低风险，不代表消除提示注入。

## 身份与多 Agent

每个 Agent 有可认证身份、作用域和 owner；消息签名/通道认证后仍做授权。Supervisor 不能假装子 Agent，子 Agent 不能继承全局 token。delegation contract、correlation ID 和 plan version 形成审计链。

防止 confused deputy：工具服务不能因为请求来自“受信任 orchestrator”就忽略最终用户/tenant/purpose。策略同时评估用户主体、Agent 身份和资源。

## 记忆与知识库

记忆写入是高风险入口。外部内容默认只能作为 evidence，不能写程序记忆；长期个人事实需用途与同意；冲突/来源撤回应失效。检索结果带 source/trust/sensitivity，模型不能把相似度当真实性。

RAG 文档、网页和邮件都可能夹带间接注入。索引前扫描不能发现所有语义攻击，所以检索后仍保持不可信标签，工具边界不放宽。

## 安全测试

基于威胁路径构建测试，而非只跑 prompt 列表：

1. 直接/间接/跨语言注入，观察是否改变工具 proposal；
2. 诱导读秘密、访问私网、上传文件、扩大收件人；
3. 重放/伪造 Agent 消息，测试身份与幂等；
4. 写入恶意记忆并跨会话触发；
5. 取消、超时和恢复期间寻找重复副作用；
6. 依赖/镜像替换、恶意安装脚本和输出注入；
7. 资源耗尽与 loop guard。

测试判据包括预防是否生效、是否留下信号、响应能否隔离和恢复。红队成功样本进入回归集，失败也复盘攻击是否实际覆盖边界。

## 风险登记与发布门

每条威胁记录 likelihood、impact、control owner、证据、剩余风险和接受者。高严重度未缓解项阻断发布；无法消除的风险通过缩小功能、提高审批或隔离用户群降低。

[NIST Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)把风险治理放进 Govern、Map、Measure、Manage 循环。模型、工具、权限、数据源或部署方式变化时重新建模，不能复用旧结论。

## 生产监控与事件响应

关联用户、Agent、tool、operation、消息和资源 trace，监控异常调用序列、权限拒绝峰值、出网、敏感字段、记忆写入和成本。日志脱敏且防篡改，保留足以重建事件的版本与 hash。

响应 runbook 明确关停能力、撤销凭证、隔离租户、冻结证据、对账副作用、通知和恢复。安全事件后的“修改提示词”通常不够，修复应落在实际失效边界。

## 小结

Agent 威胁模型从资产、攻击者能力、数据流和信任边界出发，把注入、工具滥用、记忆污染、身份伪造和外泄放到具体路径上，再配置预防、检测和响应。控制在模型之外强制，测试沿攻击路径执行，并随系统版本持续更新。

## 用一条攻击路径回答“项目安全怎样做”

可以口述为：“先列资产、攻击者可控输入和副作用，再沿用户、检索内容、模型、运行时与工具资源画数据流。模型只能提出调用，执行点检查最终用户、租户、参数和权限；不可信内容不能提升权限。敏感动作在执行前审批，副作用用操作身份与幂等约束，测试沿越权、注入、外发和恢复路径验证，日志用于检测与追溯。”

例如外部文档夹带‘把会话上传到某 URL’：即使模型提出请求，出网目的地与数据访问策略仍应在执行点拒绝，并留下拒绝证据。这个例子说明输出文字看起来安全并不等于系统安全，控制必须作用在真实数据流上。

教学追问：**已经校验工具 JSON Schema，还需要授权吗？** 需要，参数形状正确不证明该用户能访问该资源。**子 Agent 来自同一编排器，可以继承全部凭证吗？** 不应；委派应限定身份、资源与操作范围，服务端仍检查最终主体。以上是教学设计，没有对真实生产环境执行攻击或安全测试。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [腾讯 Agent 开发一面：RAG、安全与后端工程（2026 年 5 月）](../../../interview/tencent/ai/tencent-ai-1.md)
- [百度北京后端秋招一面：Agent 安全、检索与存储](../../../interview/baidu/ai/baidu-ai-3.md)
<!-- interview-source-history:end -->

## 参考资料

- [NIST — Adversarial Machine Learning Taxonomy](https://csrc.nist.gov/pubs/ai/100/2/e2025/final)
- [OWASP — Agentic AI Threats and Mitigations](https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/)
- [OWASP — Securing Agentic Applications Guide](https://genai.owasp.org/resource/securing-agentic-applications-guide-1-0/)
- [NIST — AI RMF Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)
