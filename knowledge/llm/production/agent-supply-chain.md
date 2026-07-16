Agent 的供应链不只包含 npm/pip 依赖，还包含模型权重与路由、Prompt 包、工具描述与 Schema、MCP Server、容器、数据与评估器。任何一环被替换，都可能在代码未变时改变 Agent 的能力、权限和数据流。安全目标是让每个运行制品都能追溯来源，并在部署前与消费者的信任期望比较。

[SLSA v1.2](https://slsa.dev/spec/v1.2/)用分层要求描述源代码与构建供应链的安全保证，包括 provenance、受控构建和源控制。它为 Agent 制品提供通用框架，但模型、MCP 与工具还要增加能力、数据和运行时策略。

![模型、工具、MCP 与依赖通过 provenance 和策略验证后进入运行允许列表](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-supply-chain-provenance-map-v1.webp)

图中的 Policy Verifier 不只检查“有签名”，而是将 digest、signature、provenance、SBOM、build ID 与 review 和 Trusted Expectations 比较。未知或不符制品进入 Quarantine，Registry 与 Runtime Allowlist 只接收通过者。

## 建立制品清单

先列出生产 Run 可能加载的全部制品：

- Agent 代码、容器、基础镜像和系统包；
- 直接与传递软件依赖；
- 系统 Prompt、示例、策略和配置包；
- 模型 ID、权重摘要、供应商/区域和路由；
- 工具/MCP 描述、Schema、Server 镜像与端点；
- 检索索引、解析器和嵌入模型；
- 评估 Harness、Scorer 与门禁策略。

每项记录所有者、来源、不可变版本/摘要、签名、构建、依赖、许可证、审查、能力和数据等级。没有所有者或无法固定的制品不能悄悄进入生产。

## 摘要、签名与 provenance

Digest 标识内容，防止下载后无感变化；签名将 digest 与签名主体关联；provenance 描述制品在何处、何时、由什么构建流程和输入产生。三者互补但都不是“安全认证”。

[SLSA 对 provenance 的定义](https://slsa.dev/spec/v1.2/provenance)是可验证地追踪制品从哪里、何时、如何产生的信息。它帮助回答“这个镜像是否来自批准仓库和构建器”，却不证明源码没有漏洞或模型行为符合业务要求，仍需扫描、评估和策略。

## 消费者信任期望

验证器预先配置：允许的源码仓库、分支/标签、构建器身份、签名者、依赖源、模型供应商、MCP 发布者、允许能力与最大风险。验证时将 provenance 字段与这些 expectations 比较。

仅检查 provenance 文件存在，会允许攻击者附上一份描述恶意构建的真实文件。仅检查签名，会允许“一个确实被攻击者自己签名的恶意包”。信任来自“内容摘要 + 受信身份 + 符合预期流程与能力”。

## 模型供应链

固定模型不可变版本、供应商账号、区域、路由和安全配置。`latest` 或自动路由会使行为在仓库无 diff 时变化，应把解析结果记录到每次 Run，并把别名更新视为发布事件。

自托管模型记录权重摘要、格式、转换/量化过程、基础模型、微调数据治理和加载代码。第三方 API 无法验证权重摘要时，至少验证服务身份、账号、模型版本、合同和回归结果，并采用 Canary 与回滚。

## 工具与 MCP 供应链

工具描述和 Schema 影响模型决策，应和 Server 制品一起签名、审查与固定。MCP Server 动态注册新工具或修改描述时，先进入隔离注册表，能力差异触发人工复核和回归。

Endpoint 使用服务身份，不依赖 DNS 名称即信任。运行时只允许 manifest 中的工具与版本，网络出口仅达批准 Server。Server 返回内容仍按不可信数据验证，供应链通过不等于每次输出可信。

## 软件依赖与 SBOM

锁定直接与传递依赖，使用受控 registry、校验摘要和最小安装。SBOM 提供组件库存，用于漏洞和许可证响应；但 SBOM 本身也需要来源与版本，并不能证明构建实际使用相同组件。

依赖更新走自动提议、测试与审查，不允许安装时执行未知脚本或从浮动 Git 分支拉取。构建环境最小权限、隔离、短期凭证和网络限制，防止构建步骤访问不相关秘密。

## 构建与源控制

受保护分支、代码审查、不可变提交和 CI 身份降低未审改动。构建在托管/隔离环境自动产生 provenance，普通提交者不能修改证明。发布者与审核者分权，高风险 Prompt/策略/工具变更需要对应领域审查。

SLSA v1.2 Source Track 还关注连续历史与技术控制。Agent 仓库对 Prompt 和策略也执行同样要求，不能因为是“内容文件”就允许在线控制台无记录修改。

## 注册表与晋级

制品先进入 quarantine/staging，完成签名、provenance、漏洞、许可证、Schema、能力差异和评估后，生成批准记录并晋级可信 Registry。生产只从可信 Registry 拉取，并按 digest 而非 tag 部署。

晋级记录绑定评估证据和策略版本。任何内容变化产生新 digest，旧批准不能沿用。撤销将版本从 Runtime Allowlist 移除，阻止新部署，并评估正在运行实例。

## 运行时持续验证

启动时验证 digest、签名、清单和工作负载身份；工具注册变化、模型路由、未知依赖下载和新域名触发告警。文件完整性与调用遥测检测运行时漂移，网络默认拒绝制品自行下载插件。

[SLSA 的 artifact 验证指南](https://slsa.dev/spec/v1.2/verifying-artifacts)说明 provenance 可在上传、客户端或持续监控中验证，并强调形成 expectations。多层验证是防御纵深：Registry 验证一次，部署控制再验证，运行时监控持续检查。

## 漏洞与撤销响应

收到依赖 CVE、模型供应商事件、MCP 投毒或签名密钥泄露时，用 SBOM/provenance 查询受影响版本、环境与 Run；停止新部署，撤销制品，轮换凭证，回滚到已知版本，并对历史工具调用和数据流做影响分析。

修复版本走完整晋级，不能因为“紧急”从未知来源直接下载。紧急路径可缩短低风险测试，但签名、来源、关键安全门禁和回滚不可省略。

## 评估供应链

评估器和测试集也可能被投毒。固定 Harness/Scorer，保护保留集，记录修改与审查。若攻击者能改评分器让恶意候选通过，生产门禁形同虚设。

门禁策略和 provenance verifier 自身是高价值制品，采用双人审查、受保护发布和测试。定期注入坏签名、未知构建器和能力扩大，验证控制真的拒绝。

## 常见误区

- 只扫描代码依赖，忽略模型、Prompt、工具和评估器。
- 有签名就信任，不检查签名者和来源 expectations。
- 使用浮动 tag/模型别名，无法证明运行的具体内容。
- MCP Server 可在生产动态增加工具，不经过审查和回归。
- SBOM 与实际构建不关联，却用于宣布“供应链透明”。
- 漏洞紧急修复从非批准来源下载，制造新的供应链风险。

## 小结

Agent 供应链安全把模型、工具、MCP、Prompt、软件和评估资产都视为可验证制品。Digest 标识内容，签名标识主体，provenance 描述过程，消费者 expectations 决定是否信任；通过后才进入 Registry 和 Runtime Allowlist。持续验证、撤销和影响分析确保信任不是发布时的一次性印章。

## 参考资料

- [SLSA：Specification v1.2](https://slsa.dev/spec/v1.2/)
- [SLSA：Provenance](https://slsa.dev/spec/v1.2/provenance)
- [SLSA：Verifying artifacts](https://slsa.dev/spec/v1.2/verifying-artifacts)
