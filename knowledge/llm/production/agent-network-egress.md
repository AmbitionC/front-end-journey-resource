网络出口决定 Agent 能把请求和数据发送到哪里。默认允许互联网的工作负载一旦被 Prompt Injection、恶意工具或依赖控制，就能访问攻击者域名、云元数据或未知 API。可靠架构让所有出站流量经过统一 egress gateway，逐步验证 DNS、目的地、TLS 身份、工作负载和数据分类，默认拒绝未知路径。

[Kubernetes NetworkPolicy](https://kubernetes.io/docs/concepts/services-networking/network-policies/)可以在支持的网络插件上控制 Pod 的 L3/L4 流量，并明确指出 Pod 默认对 egress 是非隔离的；只有适用 `Egress` 策略后，才只允许规则列出的连接。创建 YAML 但网络插件不执行，策略没有效果。

![Agent Pod 的出站流量经过网关、DNS、目的地、TLS 与数据分类策略](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-network-egress-policy-path-v1.webp)

图中的 Pod 没有直连互联网路径。Unknown Domain、Raw IP、Metadata Endpoint 和 Oversized Payload 在各自检查点进入 Block + Alert；批准流量也写 Audit Log。

## 为什么 IP 与端口不够

允许 TCP 443 只说明使用常见端口，不说明对方是谁；攻击者也能提供 HTTPS。域名可解析到变化 IP，CDN 多租户 IP 同时承载良性和恶意站点；Raw IP 可绕过域名意图。L3/L4 policy 是基础隔离，不是完整应用层授权。

因此策略组合：工作负载身份、规范化域名、DNS 解析、端口/协议、TLS 服务身份、HTTP 方法/路径、数据分类、payload 限额和速率。并非每次都要深度检查全部内容，但高风险 Agent 不能只靠一个 allow 443 规则。

## 默认拒绝基线

工作负载没有声明需求就不能出站。首先允许必要基础设施：受控 DNS、时间、遥测、身份/Secret Manager；再按 Agent 能力添加模型供应商、工具 API 和对象存储。每项规则有所有者、用途、数据等级、环境和到期复审。

测试、预发和生产使用独立策略。开发环境的宽松互联网不能复制到生产；生产凭证也不出现在开发。临时开放自动到期，避免事故排查留下永久例外。

## 强制经过 Egress Gateway

路由、网络策略或 service mesh 保证 Pod 只能连接网关，网关拥有外部解析与 TLS。防止应用使用自定义 DNS、DoH、代理、IPv6 或 Raw IP 绕过。节点元数据地址、集群控制面和私网 CIDR 单独默认阻断。

[Kubernetes securing a cluster](https://kubernetes.io/docs/tasks/administer-cluster/securing-a-cluster/)建议限制实例凭证、用网络策略阻止 Pod 访问元数据 API，并避免通过 provisioning data 传递秘密。云元数据是高价值目标，即使不属于“互联网”，也要显式控制。

## DNS 与域名允许列表

规则存规范化完整域名或受控后缀，谨慎使用通配符。`*.example.com` 是否包含根域、国际化域名、尾点、大小写和 CNAME 链要定义一致。解析器验证响应，记录最终 IP 与 TTL，防止 DNS rebinding 将允许域名指向私网。

应用不能直接信任 URL 中的用户名、重定向和编码。每次重定向重新做策略，限制次数；URL parser 使用标准库，避免 `allowed.example@evil.invalid` 等混淆。

## TLS 与服务身份

DNS 允许不等于连接的是预期服务。验证证书链、主机名、有效期和必要的私有 CA；高风险内部工具使用 mTLS/工作负载身份。禁止“排障时关闭证书校验”进入生产配置。

代理终止 TLS 时，代理成为可信数据处理者，需要保护明文、日志与密钥，并向上游重新建立受验证 TLS。若端到端加密不可检查 payload，仍可用身份、域名、数据分类和调用网关做策略。

## 数据分类与目的绑定

出口请求携带数据等级、租户、用途和目标服务。Public 可走更广路径，Restricted 只能到批准服务/区域，Secrets 永不进入模型或任意工具。读权限不自动授予外发权限。

模型和工具 SDK 通过策略 API 请求出站，模型本身不能决定数据分类。网关按 Schema/元数据和 DLP 信号验证；未知分类采用更严格策略。

## 请求限制

限制方法、路径、Content-Type、body 大小、上传数量和速率。一个获准域名可能有危险管理接口，允许整个 host 仍过宽。对固定工具优先通过内部 tool gateway 封装具体操作，而不是让 Agent 任意构造 HTTP。

响应也受限：大小、类型、压缩比、下载文件、重定向和超时，防止资源耗尽或恶意内容进入后续 Prompt。文件先隔离扫描，再由解析器处理。

## 模型、工具与浏览器的不同路径

模型 API 路径按供应商、区域和数据等级；工具路径按具体 capability 与用户授权；浏览器路径面对开放 Web，采用更强隔离、只读默认、下载限制和不可信内容标记。不要给三者同一个“互联网访问”权限。

Browser Agent 需要访问任意用户指定站点时，可使用隔离浏览器服务，工作负载只与浏览器服务通信；浏览器服务执行 URL 策略、私网阻断、下载隔离和会话清理。写工具仍走独立受控通道。

## 审计与检测

记录 workload、Agent/Run/Trace、subject、域名、解析 IP、TLS 身份、方法、数据分类、字节数、策略版本和结果，不记录敏感 body。检测首次域名、Raw IP、私网、DNS 高频变化、异常体积、编码隧道、失败后换域名和出站速率激增。

批准流量也需要审计。泄露可能发生在允许供应商或被接管工具上；基线偏差和供应链身份变化同样重要。

## 失败模式与降级

策略服务不可用时，高风险出口 fail closed；只读低风险服务可按缓存策略短时运行，但记录降级。DNS、证书或网关失败返回结构化错误，Agent 不应自行改用未知域名或关闭 TLS。

允许列表更新采用双阶段：预览将被影响的服务和流量，再发布；回滚保留上一版本。规则变更触发测试：批准域名成功，未知/Raw IP/元数据/重定向失败，数据等级生效。

## 事件响应

发现可疑出口时，隔离工作负载、阻断目标、撤销凭证、保存网络与 Run 证据，查找同域名/摘要/工具的历史调用，评估数据量和分类。若允许域名被接管，更新供应链信任和 TLS/身份，不只加黑一个 IP。

[NIST AI RMF Generative AI Profile](https://doi.org/10.6028/NIST.AI.600-1)把信息安全、数据隐私和持续监测纳入生成式 AI 风险管理。新增模型、工具、MCP Server 或数据源时，网络出口与数据流应共同复审。

## 常见误区

- 写了 NetworkPolicy，但所用插件不支持或没有验证执行效果。
- 允许所有 443，认为 HTTPS 等于可信目标。
- 域名允许后不重新检查重定向、DNS rebinding 和私网地址。
- Agent 为“恢复”失败自动换 Raw IP 或关闭证书验证。
- 模型、工具和浏览器共用一个宽松互联网权限。
- 只记录被阻断流量，不审计已批准的数据量与身份。

## 小结

Agent 网络出口从默认拒绝开始，强制经网关，依次校验工作负载、DNS/域名、IP/端口、TLS 身份、应用操作和数据分类。Kubernetes NetworkPolicy 提供 L3/L4 基线，但域名、服务身份和 payload 需要更高层策略。所有路径可审计、可到期、可回滚，即使模型或工具受影响，也没有直接 Pod-to-Internet 通道。

## 参考资料

- [Kubernetes：Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- [Kubernetes：Securing a Cluster](https://kubernetes.io/docs/tasks/administer-cluster/securing-a-cluster/)
- [NIST：AI RMF Generative AI Profile](https://doi.org/10.6028/NIST.AI.600-1)
