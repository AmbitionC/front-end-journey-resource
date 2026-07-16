Agent 需要调用模型、数据库和工具，但不应“知道”长期密钥。安全做法是工作负载用自身身份向 Secret Manager 申请面向特定受众、scope 和短有效期的凭证；凭证只在受控客户端内存中使用，永不进入 Prompt、工具参数、日志、Trace 或长期记忆。

[NIST Key Management Guidelines](https://csrc.nist.gov/projects/key-management/key-management-guidelines)把密钥材料的类型、保护要求、生成、使用与生命周期作为系统性管理问题。API token、OAuth 凭证和数据库密码虽不全是同一种密码学密钥，也应采用类似的完整生命周期思维，而非只在部署时“放进环境变量”。

![Agent 工作负载从 Secret Manager 获取短期凭证并完成轮换撤销销毁](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-secrets-management-secret-lifecycle-v1.webp)

图中 Create、Store、Issue、Deliver、Use、Rotate、Revoke、Destroy 和 Audit 是连续生命周期。Rotate 发行替代凭证，Revoke 使旧凭证失效，Destroy 清除材料；三者含义不同。

## 先做秘密清单

盘点所有凭证：模型 API、OAuth client、数据库、对象存储、消息队列、MCP Server、签名密钥和第三方 webhook。每项记录所有者、用途、环境、受众、scope、存储、轮换、最大寿命、撤销方式和依赖服务。

不知道谁使用的长期秘密是高风险债务。通过扫描代码/镜像、云权限、Secret Manager 访问日志和网络调用交叉验证，删除孤儿凭证前先确认无活跃依赖。

## 身份优先，秘密最少

能用工作负载身份与短期 token 的场景，不发长期静态秘密。平台认证工作负载后，Secret Manager/授权服务器按策略签发数分钟有效的目标凭证。攻击者即使读取内存，时间和权限窗口也受限。

模型上下文与工具描述不需要凭证。安全 SDK 在真正网络调用时附加 token，且只向绑定 audience 发送。Agent 规划层只看到“已授权能力”，看不到秘密值。

## 创建与存储

秘密使用安全随机源或标准密钥生成流程，禁止人工可记忆字符串。创建时定义用途、算法/格式、scope、到期和轮换。不同环境、租户和服务不复用同一秘密，避免一次泄露横向扩散。

存储在专用 Secret Manager 或 HSM/KMS 支持的系统中，静态加密、访问控制和审计。应用配置只保存引用。`base64` 是编码不是加密；[Kubernetes Secrets good practices](https://kubernetes.io/docs/concepts/security/secrets-good-practices/)明确说明 Secret 值以 base64 表示且默认在 etcd 中未加密，应配置静态加密与最小 RBAC，必要时使用外部 Secret Store。

## 交付

优先采用短期拉取、工作负载身份和内存/受限文件挂载。环境变量容易出现在进程转储、调试和子进程中，且轮换困难；若必须使用，限制继承和诊断访问。

交付通道使用 TLS，客户端验证服务身份。秘密不通过普通消息队列、日志或模型工具结果传递。Sidecar/agent 注入也要绑定目标进程和权限，避免同 Pod 其他容器读取。

## 使用与内存保护

凭证尽量在最后时刻读取，使用后从缓冲区清除；不缓存超过有效期，不复制到字符串链路。错误信息只显示 token ID 或最后几位摘要，不显示原值。Crash dump、profiling 和 APM 配置排除敏感字段。

请求库防止重定向把 Authorization 头带到新域名；代理和 DNS 变化经过目的地策略。工具参数 Schema 禁止 credential 字段，防止模型“帮忙”把 token 传给工具。

## 轮换

轮换流程支持重叠窗口：发行新版本、消费者刷新、验证新凭证、停止旧发行、撤销旧版本。消费者按版本或 lease 订阅，不能要求全服务同时重启。

测试轮换期间的并发、缓存、长连接和失败恢复。若新凭证有误，回滚发行但不延长已确认泄露的旧秘密；紧急轮换与例行轮换需要不同手册。

## 撤销与销毁

撤销发生在泄露、主体离职、服务下线、权限变化或供应商事件。短期 token 可停止新签发并等待过期，高风险还需主动撤销会话、阻断网络和轮换下游。

销毁删除密钥材料、缓存、备份可恢复副本或按 KMS crypto-shredding 策略处理。保留不含秘密值的审计事件：谁、何时、为什么撤销/销毁，影响哪些凭证。

## 最小权限与受众绑定

每个 Agent/工具拥有独立身份与 scope。读写分开，生产与测试分开，模型供应商与工具供应商分开。凭证绑定 audience，目标服务拒绝发给别人的 token；数据库账户限制表、行/租户和操作。

[RFC 9700](https://www.rfc-editor.org/info/rfc9700/)提供 OAuth 2.0 当前安全最佳实践。Agent 使用 OAuth 时采用安全客户端认证、短期 access token、窄 scope 与受众，并保护 refresh token；不能把刷新令牌交给模型循环。

## 永不记录

应用日志库、HTTP 客户端、错误追踪和 Trace 统一敏感字段规则。对 Header、URL query、工具参数和异常对象执行允许列表；采集器二次扫描。命中 canary secret 立即告警并轮换。

不要在阻断日志中完整回显被检测的秘密，使用类型、指纹和位置。测试代码也禁止真实秘密，CI 用短期测试凭证或假值。

## 审计与检测

记录 Secret Manager 的读取主体、秘密 ID/版本、目的、目标受众、策略结果和 Run/Trace，不记录值。检测异常时间、来源、读取量、失败、首次访问、跨环境和读取后未知域名流量。

审计访问本身受控。能看全部读取模式的人可能推断架构和高价值目标；安全团队按职责查询，并保留不可篡改记录。

## 泄露响应

发现泄露时：隔离相关工作负载，撤销/轮换秘密，阻断可疑出口，查询使用日志，确定暴露时间与资源，更新下游授权，修复根因并加入回归。若秘密进入 Git 历史，仅删除当前文件不够；要轮换并按合规流程处理历史。

泄露源可能是 Prompt、日志、截图、工单、浏览器下载、模型供应商或工具返回。响应同时检查派生副本和缓存，避免只修一个入口。

## 常见误区

- 把 Kubernetes Secret 的 base64 当加密。
- 长期 API Key 放环境变量并让所有 Agent 共用。
- 模型可调用“读取秘密”工具，再期待 Prompt 阻止打印。
- 轮换只能通过全量重启，团队因此长期不轮换。
- 日志脱敏只检查字段名，忽略 Header、URL 和异常对象。
- 发现 Git 泄露只重写历史，不撤销已暴露凭证。

## 小结

Secret 管理覆盖创建、存储、发行、交付、内存使用、轮换、撤销、销毁和审计。工作负载身份换取受众绑定、窄 scope、短期凭证；模型永远不接触秘密值。专用存储、静态/传输加密、最小权限、永不记录和可演练响应共同缩小泄露概率与爆炸半径。

## 参考资料

- [NIST：Key Management Guidelines](https://csrc.nist.gov/projects/key-management/key-management-guidelines)
- [Kubernetes：Good practices for Kubernetes Secrets](https://kubernetes.io/docs/concepts/security/secrets-good-practices/)
- [RFC 9700：Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/info/rfc9700/)
