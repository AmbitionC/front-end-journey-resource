Agent 会把用户内容送入模型、工具、记忆、日志和评估系统，数据副本比普通表单应用更多。隐私保护必须覆盖收集、使用、共享、保存和删除整个生命周期；在日志末端做一次正则脱敏远远不够。

## 先画数据流

列出数据主体、字段类别、来源、用途、接收方、存储位置、保留期和删除路径。典型类别包括身份信息、对话内容、位置、财务/健康数据、凭证、商业秘密、文件元数据和模型派生标签。派生摘要可能仍能识别个人，也属于治理范围。

[NIST Privacy Framework](https://www.nist.gov/privacy-framework)提供以风险为基础识别、治理、控制、沟通和保护隐私的组织框架。具体法律义务按地区和业务判断；工程系统至少要知道数据在哪里、为何处理、谁能访问、何时删除。

![敏感数据从收集进入上下文、工具、记忆、遥测、保留与删除阶段；最小化发生在采集前，允许列表、脱敏、哈希、截断、访问控制和加密分层保护，删除传播到索引、缓存、追踪和备份策略](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-data-privacy-data-lifecycle-v1.webp)
*图：Audit 记录数据 owner 与 purpose，不复制敏感原文。*

## 数据最小化优先于脱敏

[OpenTelemetry 的敏感数据指南](https://opentelemetry.io/docs/security/handling-sensitive-data/)明确指出，避免收集不必要敏感数据是最好的保护；框架无法自动知道特定应用中哪些字段敏感，实现者必须负责。

在采集点使用 allowlist：只取完成任务所需字段。不要把完整用户对象、整封邮件或整个环境变量传给模型。查询可以在数据源侧投影/聚合；凭证使用短期句柄，模型只看到“credential available”，看不到 token。

## 上下文与工具

构造模型上下文前按 purpose 过滤，标记来源和敏感级别。系统提示、示例和外部文档分离；秘密不作为“提醒模型保密”的文本注入。调用工具时只传必要字段，工具结果先清洗再返回 Agent。

跨供应商/区域时记录处理者、模型配置、数据使用选项和传输边界。不要假设“API”天然不留存；以当前合同与配置为准，并版本化证据。

## 日志与遥测

默认记录事件和引用，不记录完整 prompt/response。允许字段清单优于黑名单。OpenTelemetry 指南列出 attribute/filter/redaction/transform 等处理手段，可删除、哈希或截断字段；[日志脱敏示例](https://opentelemetry.io/docs/languages/dotnet/logs/redaction/)展示字段/模式/部分脱敏思路，但具体实现不必限定 .NET。

哈希并非匿名：低熵邮箱/电话可被字典反查。需要关联时使用带密钥的 HMAC 或受控 tokenization；截断 IP、降低日期精度、聚合指标能减少可识别性。错误堆栈、URL query、文件名和 tool arguments 也是泄露源。

## 记忆与向量索引

长期记忆写入前检查用户预期、同意、用途和敏感性。个人记忆按 tenant/user namespace 和访问控制隔离，向量数据库不能只靠相似度过滤。embedding 和摘要可能泄露原内容，按原数据级别保护。

每条记录保留 source、purpose、retention、consent/version 和派生关系。用户删除源数据时，能找到摘要、embedding、缓存与评估样本。程序记忆不能从不可信文档吸收秘密或指令。

## 保留与删除

按数据类别设置 TTL：实时音频可能短期，审计 metadata 更长，长期偏好需用户控制。保留期到达后自动过期并验证删除，不靠人工清理。Legal hold 或安全事件例外由治理系统管理，Agent 不能自行决定。

删除请求校验身份与范围，发出幂等 deletion event，传播主库、索引、缓存、trace、导出和分析副本。备份按生命周期到期；恢复后重新应用 deletion log。只删聊天 UI 不算完成。

## 权限、加密与密钥

传输和静态加密是基线，密钥与数据分离、轮换并审计。更关键的是细粒度授权：支持人员、开发、评估和 Agent runtime 只访问其用途所需数据。生产数据不自动进入测试；需要评估时先抽样、脱敏和审批。

[NIST Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)把生成式 AI 风险治理放进完整的 govern/map/measure/manage 生命周期。隐私不是一次上线检查，模型、工具和数据源变化后要重新 map 与 measure。

## 用户控制与透明度

告诉用户哪些信息会用于当前回答、哪些可能形成长期记忆，提供查看、更正、导出、关闭记忆和删除入口。确认提示使用具体字段和用途，不用模糊“提升体验”。拒绝长期记忆不应阻止完成本次必要处理，除非服务本身确需保存并清楚说明。

模型推断的敏感属性单独标记 inferred，不展示为事实，也不用于高影响决策。用户更正后传播到派生记录，避免旧推断反复出现。

## 测试与监控

测试跨租户检索、日志注入秘密、工具错误回显、删除传播、同意撤回、备份恢复、调试开关、导出和第三方超时。使用 synthetic secrets/canary 检查是否出现在 prompt、trace、对象存储和告警。

指标包括敏感字段采集量、redaction 命中、未分类数据、保留超期、删除 SLA、跨区域/第三方传输、访问拒绝和 canary 泄露。监控也遵循最小化，不能为了检测隐私风险再建立一份无限期原始数据仓库。

## 小结

Agent 隐私保护从数据流和 purpose 开始：能不收集就不收集，进入上下文与工具前最小化，记忆和遥测按分类隔离/脱敏，访问最小授权，保留有 TTL，删除覆盖所有派生副本。日志 redaction 只是其中一层，真正目标是让每份数据都有可解释的用途、owner 和生命周期。

## 参考资料

- [NIST — Privacy Framework](https://www.nist.gov/privacy-framework)
- [OpenTelemetry — Handling sensitive data](https://opentelemetry.io/docs/security/handling-sensitive-data/)
- [OpenTelemetry — Log redaction](https://opentelemetry.io/docs/languages/dotnet/logs/redaction/)
- [NIST — AI RMF Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)
