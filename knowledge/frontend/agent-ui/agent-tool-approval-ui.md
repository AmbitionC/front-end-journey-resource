工具审批不是“Agent 要操作，是否允许？”的泛化弹窗。用户需要看到具体动作、规范化参数、目标、数据去向、可逆性和最坏影响，并把批准绑定到这一份不可变请求。任何参数在审批后变化，都必须重新批准。

![工具审批界面从风险分类、参数预览、作用域与副作用说明到绑定批准和执行结果](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-tool-approval-ui-risk-review-state-v1.webp)
*图：读操作、可逆写入和不可逆外部动作使用不同门槛；approval hash 把用户决定绑定到规范化请求。*

## 先按效果分类

工具 schema 除参数外还声明 effects：read、write、delete、external communication、financial、credential use，以及 reversible、idempotent、data destinations。风险由动作、资源敏感度、范围和当前上下文共同决定，不能只按工具名。

读公开网页可自动执行；读私有文件可能泄露数据；发送邮件、合并代码或付款需要明确审批。批量删除比单条删除门槛更高。默认拒绝未知效果，不能因为插件漏标就降为低风险。

## 审批卡必须具体

显示用户语言摘要：“向 `team@example.com` 发送以下邮件”，随后给关键参数、目标账号、附件、数据来源、是否外部可见、预计条数/金额和撤销方式。秘密字段只显示“将使用 GitHub production credential”，不回显值。

原始 JSON 可折叠查看，但摘要不能隐藏 wildcard、路径或过滤器。对 patch 显示 diff，对 SQL 显示影响范围与 read-only/transaction，对邮件显示收件人/正文/附件。高风险默认不勾选“以后允许”。

## 最小权限与作用域

[NIST Least Privilege](https://csrc.nist.gov/glossary/term/least_privilege)要求主体只拥有完成授权任务所需的最小资源与操作。批准应尽可能窄：一次、某个 repo/path、某个收件人、金额上限和短过期时间，而不是“永远允许此工具”。

若支持会话授权，界面展示 scope 和剩余时间，用户能随时撤销。授权服务端强制执行，前端隐藏按钮不是边界。工具执行使用短期 capability，绑定 user、run、tool、resource 和 approvalId。

## 请求规范化与绑定

服务端对 tool name、schema version 和参数 canonicalize，计算 requestHash。审批记录包含 hash、展示摘要版本、用户、时间、scope 和 decision。执行端只接受完全相同 hash，参数补全、重定向目标或数量变化都生成新请求。

这防止“审批时 1 个文件，执行时 glob 展开为 1000 个”或模型在弹窗后改收件人。动态解析结果如 DNS/IP、文件匹配列表若影响风险，应冻结快照或再次确认。

## 状态机与竞态

proposed → awaiting_approval → approved/denied/expired → executing → succeeded/failed/unknown。用户拒绝是正常终态，不应被模型不断重新弹窗。取消审批请求与用户决定竞态时，以服务端版本号决定，过期批准不能执行。

双击批准使用 idempotency key。若执行响应丢失，状态为 unknown，先按 operationId 查询外部系统，不能显示“重试”直接再发邮件或付款。结果页显示实际影响与审计引用。

## 风险沟通而非恐吓

[NIST AI RMF Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/)以 Govern、Map、Measure、Manage 组织风险活动。审批 UI 是 manage 的一环，但不能把所有风险甩给用户。平台先限制危险工具、sandbox、校验参数和最小权限，再让用户决定业务意图。

文案说明具体后果：“这会公开发布 3 条评论，无法自动撤回”，而不是泛化红色警告。风险相同的请求保持一致样式，避免警告疲劳。极高风险可要求二次身份验证或双人批准。

## 数据泄露与提示注入

工具参数可能来自不可信网页指令。审批卡标出哪些字段由用户、模型、检索内容生成，并对外发数据做摘要/预览。禁止把隐藏 system prompt、凭据或不相关文件发送给第三方，即使模型提出。

审批摘要自身由确定性 renderer 从规范化参数生成，不能让模型自由写“安全说明”掩盖真实值。URL 显示最终规范化 host，文件显示真实解析路径。

## 可访问性与测试

对话框有标题、风险描述和初始焦点；Approve 与 Deny 标签具体，危险主按钮不因视觉排序误触。键盘可展开参数和 diff，关闭后回到触发位置。倒计时过期用可访问状态通知而不抢焦点。

测试参数篡改、schema 升级、过期、撤销、双击、执行未知、批量范围、秘密脱敏、提示注入和跨租户 approvalId。审计能回答谁在看到什么摘要后批准了哪一个 hash，以及工具实际产生了什么效果。

## 参考资料

- [NIST：Least Privilege](https://csrc.nist.gov/glossary/term/least_privilege)
- [NIST AI RMF：Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/)
