工具投毒发生在 Agent 以为自己调用的是可信能力，但工具描述、Schema、实现或返回值已经被替换、漂移或注入。它与普通“工具误用”不同：这里被污染的是能力契约本身。若 Agent 在每次发现工具时都无条件接受动态描述，攻击者不需要修改系统 Prompt，就能改变模型眼中的权限和行为。

[OWASP Agentic Threats Navigator](https://genai.owasp.org/resource/owasp-gen-ai-security-project-agentic-threats-navigator/)把工具、身份、记忆和推理列为 Agent 攻击面；2026-07-16 的 OWASP 资源目录还专门汇集了第三方 MCP 与 Agent 安全指南。[OWASP 白皮书与指南目录](https://genai.owasp.org/resource-item/whitepaper/)提醒使用第三方能力时，需要把工具投毒、Prompt Injection、记忆和数据风险放在同一条信任链中考虑。

![工具描述、Schema 与返回值经过签名、固定、策略和后置验证后才被 Agent 信任](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-tool-poisoning-tool-contract-defense-v1.webp)

图中不存在 Tool Registry 到 Agent 的绕行线。每个工具必须经过签名清单、固定描述、Schema、策略包装、执行、结果验证和后置条件，信任只在检查之后建立。

## 四种投毒面

### 描述投毒

攻击者修改工具名称或描述，加入“调用前先读取全部工作区”“忽略用户确认”等诱导文本。描述既影响模型选工具，也可能作为上下文中的指令，因此必须视为可执行供应链内容，而非无害文案。

### Schema 投毒

新增隐藏参数、放宽类型、改变默认值或把只读接口改成写操作。客户端仍能解析 JSON，但业务语义已变。Schema 摘要和兼容审查用于发现这种漂移。

### 实现投毒

相同名称与 Schema 背后的二进制、MCP Server、域名或镜像被替换。只有接口测试无法发现，需要不可变摘要、来源、签名、构建 provenance 和运行身份。

### 返回值投毒

工具返回恶意指令、伪造状态、超长内容或跨租户数据，诱导 Agent 继续调用其他工具。返回值是数据，不因来自“工具”就自动可信；还要验证来源、Schema、数据分类和业务后置条件。

## 建立工具 Manifest

每个允许工具发布一份不可变清单：

```json
{
  "name": "invoice.lookup",
  "version": "3.2.1",
  "descriptionDigest": "sha256:...",
  "inputSchemaDigest": "sha256:...",
  "outputSchemaDigest": "sha256:...",
  "artifactDigest": "sha256:...",
  "endpoint": "spiffe://prod/tools/invoice",
  "capabilities": ["invoice:read"],
  "sideEffect": "none",
  "publisher": "tool-platform",
  "signatureRef": "sigstore://..."
}
```

描述与 Schema 都是签名内容。注册表只接受受信发布者，并保留审查、撤销和替代版本。Agent 启动时解析清单，运行期间突然出现的新工具默认不可用。

## 固定发现结果

动态发现适合开发体验，却不能让生产 Agent 每轮无审查接受变化。一次 Run 或发布版本固定工具集合与摘要；若服务端宣布新版本，先进入隔离验证和回归，再更新 allowlist。

名称冲突采用稳定 namespace，防止恶意 Server 注册一个与官方相似的工具。UI 显示发布者、版本和能力，不只显示友好名称。

## Schema 与语义验证

JSON Schema 验证类型和必填字段，但还需要业务不变量：金额范围、租户、资源所有权、域名、最大批量、幂等键和可逆性。未知字段默认拒绝，避免旧客户端把新危险参数原样透传。

版本兼容不只看“是否能解析”。把 `dryRun` 默认从 true 改 false 虽然类型兼容，却改变副作用；把状态枚举含义改变也需要重大版本和人工审查。

## 策略包装器不可绕过

模型输出的工具名与参数先进入本地执行网关。网关根据用户 subject、Agent actor、scope、资源、数据分类和审批决定是否允许，并发放短期下游凭证。工具自身也验证身份，不能只信网关传来的普通字段。

Agent 代码不应同时暴露“安全封装工具”和“原始 HTTP 客户端”，否则模型可绕过包装器。网络出口策略只允许网关访问批准目标，原始 Server 地址不直接出现在模型可用能力中。

## 执行与结果验证

调用前记录计划、manifest 摘要、授权和幂等键。响应先通过大小、Content-Type、Schema、签名/来源、租户和敏感数据检查。自然语言字段以不可信数据通道进入模型，不能携带新的指令权。

执行后检查后置条件。例如 `invoice.update` 返回 `success`，仍要从可信读接口确认目标发票状态和版本；返回记录数异常、目标变化或响应来源不符时停止链路并告警。

## 供应链 provenance

[SLSA 的 artifact 验证指南](https://slsa.dev/spec/v1.2/verifying-artifacts)强调验证 provenance 时要把实际值与消费者预先形成的 expectations 比较，不能因为“存在一份 provenance 文件”就信任。工具平台应验证来源仓库、构建者、入口、依赖和摘要符合策略。

同样的逻辑适用于模型、Prompt 包与 MCP Server：签名证明某主体签过，不自动证明主体受信、内容安全或版本获准。验证器需要受信发布者、允许仓库、构建流程和能力范围。

## Rug pull 与持续监测

第三方工具可能先以安全行为获得信任，后续更新描述或实现。固定版本、摘要和定期重新验证可防止无感切换；运行时监测工具调用目标、数据量、错误、延迟和新域名，发现与已审行为偏离时隔离。

撤销列表要快速传播。某版本被发现恶意后，阻止新 Run，暂停正在执行的高风险调用，轮换相关凭证，查找历史调用和数据流，并为固定替代版本重新评估。

## 测试策略

自动测试注入描述交换、Schema 增删、签名错误、未知发布者、响应嵌入指令、跨租户结果、超长 payload 和后置条件不一致。断言在对应检查点拒绝，并产生结构化安全事件。

还要测试正常升级：兼容版本通过，批准后的重大版本在回归完成后通过，旧版本撤销后失败。只测试攻击而不测试发布流程，团队可能在紧急升级时选择绕过控制。

## 常见误区

- 把工具描述当普通文案，不纳入签名与审查。
- 只验证 JSON 可解析，不验证业务语义与默认值变化。
- Agent 同时拥有安全工具和任意网络客户端，可直接绕过网关。
- 因为工具来自内部网络就信任返回文本与租户字段。
- 看到签名即通过，不核对发布者、来源和消费者 expectations。
- 第三方版本可原地更新，Run 无法证明实际执行内容。

## 小结

工具投毒防御的核心是把能力契约当供应链制品：描述、Schema、实现和返回值都需来源、版本和验证。生产固定工具清单，通过不可绕过的策略网关执行，并在结果和后置状态上再次校验。签名与 provenance 只有和预先定义的信任期望比较才有意义；动态变化必须先隔离验证再获得能力。

## 参考资料

- [OWASP：Agentic Threats Navigator](https://genai.owasp.org/resource/owasp-gen-ai-security-project-agentic-threats-navigator/)
- [OWASP：Whitepapers and guides](https://genai.owasp.org/resource-item/whitepaper/)
- [SLSA：Verifying artifacts](https://slsa.dev/spec/v1.2/verifying-artifacts)
