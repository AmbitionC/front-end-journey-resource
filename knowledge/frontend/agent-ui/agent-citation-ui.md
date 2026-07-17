引用 UI 的目标不是在回答末尾堆链接，而是让用户知道“哪条主张由哪段证据支持、证据来自何时何处、是否真的蕴含这条主张”。引用存在不等于事实正确；界面必须把模型主张、检索片段和原始来源分开。

![Agent 引用界面中 Claim、Citation、Source 与 Evidence Span 的可追溯关系](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-citation-ui-claim-source-evidence-v1.webp)
*图：一条主张可由多个证据支持，同一来源可支持多条主张；定位、抓取时间和版本属于 provenance。*

## 数据模型先于脚注样式

Claim 是回答中的可验证陈述，保存 claimId 与文本 span；Citation 把 claimId 连接到 evidenceId，并记录 support type/confidence；Evidence 保存 sourceId、locator、retrieved excerpt 和 retrieval time；Source 保存 canonical URL、title、publisher、date 和 content hash。

不要只在 Markdown 里存 `[1]`。编辑、流式插入或重新生成会让字符 offset 漂移，应使用结构化 content part 或稳定 annotation anchor。服务端校验 citation 引用的 evidence 属于当前 run 和用户权限。

## 在主张附近展示

标记放在对应句/段之后，键盘可聚焦，名称如“查看来源 2：PostgreSQL 文档”。点击打开侧栏，先显示来源标题、域名、定位和支持片段，再允许访问原文。移动端用 bottom sheet，关闭后焦点回到标记。

多个来源可折叠为同一标记，但不能只显示数量。不同标记的编号在一条回答内稳定；重新生成是新回答，可有独立编号。复制纯文本时可选择携带脚注和完整 URL。

## Provenance 与链接语义

[RFC 8288 Web Linking](https://www.rfc-editor.org/rfc/rfc8288.html)描述链接上下文、目标和 relation。引用记录应保留 canonical target 与 locator，而不是只信模型生成的显示文字。PDF 记录页码/段落，网页记录 heading/selector 和抓取时间，数据库记录 query/report version。

网页会变化。重要证据保存合规的短 excerpt、content hash 或内部 snapshot 引用，同时仍链接原始来源。显示“检索于 2026-07-17”，帮助用户理解时效；不能把快照伪装成当前页面。

## 支持、冲突与不确定性

retrieval similarity 只说明片段相近，不证明 entailment。pipeline 可把 citation 标记为 supports、partially supports、contradicts 或 background，并在低置信时提示“来源只支持其中一部分”。不要用绿色勾把复杂证据包装成绝对真理。

[PAIR Explainability + Trust](https://pair.withgoogle.com/guidebook-v2/chapter/explainability-trust/)强调解释要帮助用户校准信任、理解限制。高风险结论应让用户直接检查原文，并说明模型可能误读、来源可能过期。找不到证据时明确说未验证，而不是添加无关链接填满版面。

## 来源质量不是单一分数

展示 publisher、文档类型、发布日期和是否一手资料，比一个神秘“可信度 87”更可解释。官方规范适合定义行为，同行评审论文适合研究结论，社区讨论适合经验线索；不同问题的证据层级不同。

多个网页互相转载不算独立来源。通过 canonical/domain/content hash 聚类，尽量追到原始报告。利益冲突或广告内容可显示标签，但 UI 不代替用户判断。

## 权限、隐私与安全

企业检索来源可能用户有权看、旁观者无权看。回答分享或导出时重新检查 source/evidence ACL；不能把受限原文 excerpt 嵌入公开消息。citationId 是引用，不是访问授权。

外链经过安全 URL 策略，显示真实域名，防止同形字符钓鱼；打开新页使用安全 rel。来源页面内容不作为可信 HTML 注入侧栏，只显示编码文本或受控预览。

## 流式与失败状态

文本可以先流出占位 citation annotation，证据元数据随后到达。标记在 resolving 时有可访问状态，完成后稳定，不因编号重排让用户迷失。若来源拉取失败，保留主张但显示“来源暂不可访问”，不要删标记伪装无事。

回答完成后做 coverage audit：可验证的关键主张有无 citation、引用是否指到可定位证据、是否存在孤立 evidence。coverage 是诊断，不鼓励给常识句句加脚注。

## 测试

覆盖一对多、多对一、重复来源、网页更新、locator 失效、受限来源分享、流式 annotation、键盘侧栏、屏幕阅读器名称和打印导出。人工抽查 evidence 是否真的支持 claim，并记录误引率。

优秀引用 UI 不要求用户无条件相信回答，而是把核查路径缩短：从一句话一步到证据，再一步到带上下文的原始来源。

## 参考资料

- [People + AI Guidebook：Explainability + Trust](https://pair.withgoogle.com/guidebook-v2/chapter/explainability-trust/)
- [RFC 8288：Web Linking](https://www.rfc-editor.org/rfc/rfc8288.html)
