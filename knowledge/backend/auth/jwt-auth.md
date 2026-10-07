![JWT 三段结构 header.payload.signature 进入验证管线：固定允许算法→选择受信 key→验签→校验 iss/aud/exp/nbf→授权；把“只解码不验证”和敏感明文 payload 标为危险](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/jwt-validation-trust-boundary-v1.webp)
*图：沿图中的节点与箭头阅读，重点是JWT 与安全 BCP 区分签名、加密、claims 校验、算法固定、密钥轮换、短期访问令牌和撤销边界。*

---

JWT（JSON Web Token）是一种常见的 claims 表示格式，可用于携带访问令牌，但它本身不等同于完整的认证、授权或撤销方案。使用 JWT 时必须同时定义签名算法、受信密钥、claims 校验和令牌生命周期。

## JWT 的结构详解

[RFC 7519](https://www.rfc-editor.org/rfc/rfc7519.html) 定义 JWT 的紧凑 claims 表示及 `iss`、`aud`、`exp`、`nbf` 等注册声明；解析出 payload 并不代表签名和这些声明已经通过验证。


本文图示与后续例子限定为签名 JWT 的 JWS 紧凑形式：header.payload.signature 三段；加密 JWT 可以采用 JWE，不能把三段当作所有 JWT 的定义。下面仅展示结构，不是能通过验签的真实令牌：

```text
base64url(header).base64url(claims).signature_placeholder
```

### Header

声明签名算法与 Token 类型：

```json
{
  "alg": "RS256",
  "typ": "JWT"
}
```

### Payload

承载 Claims（声明），分为三类：

- **Registered Claims**（注册声明）：`iss`（签发方）、`sub`（主题/用户ID）、`exp`（过期时间）、`iat`（签发时间）、`jti`（唯一标识，用于吊销）
- **Public Claims**：按公共注册或抗冲突名称约定的字段；业务里常用的 `role` 不因此自动成为标准声明
- **Private Claims**：业务自定义字段，如 `agentQuota`、`tenantId`

```json
{
  "sub": "user_123",
  "iss": "https://api.example.com",
  "iat": 1716000000,
  "exp": 1716000900,
  "jti": "abc-uuid-xyz",
  "role": "agent_user"
}
```

> 关键提示：Payload 仅做 Base64URL **编码**，并非加密。任何人拿到 Token 就能解码读取内容，因此绝对不能存放密码、银行卡号、密钥等敏感数据。

### Signature

服务端用密钥对 `Base64URL(header) + "." + Base64URL(payload)` 进行签名：

```
RSASHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  privateKey
)
```

签名保证了 Token 的**完整性**：任何对 Header 或 Payload 的篡改都会导致签名验证失败。

## 签名算法对比

三种主流算法在安全性、性能和适用场景上各有侧重：

| 算法 | 类型 | 密钥 | 适用场景 | 安全性 |
|------|------|------|----------|--------|
| HS256 | 对称（HMAC） | 签名和验证用同一密钥 | 单体应用、内部服务 | 密钥泄露全线崩溃 |
| RS256 | 非对称（RSA） | 私钥签名，公钥验证 | 微服务、跨服务鉴权 | 高，私钥只在签发方 |
| ES256 | 非对称（ECDSA） | 私钥签名，公钥验证 | 对性能有要求的场景 | 高，签名较短；性能需按实现测量 |

**多个服务独立验签时可选 RS256 或 ES256**：当多个 Agent Worker 节点需要独立验证 Token 时，只需分发公钥，私钥由 Auth 服务集中管理，大幅降低密钥泄露风险。

## Token 生命周期

JWT 的生命周期包含四个阶段：**签发 → 传输 → 验证 → 刷新/吊销**。

生命周期顺序是：校验登录凭据 → 签发访问令牌并保存刷新会话 → 通过 TLS 传递 → 固定验证规则并检查当前授权 → 按刷新会话策略原子轮换或撤销。网关传递身份还需受保护的内部信任通道；不能接受客户端自行填写的身份头。有效期由产品风险与会话策略确定，15 分钟或 7 天只可能是示例配置。

## Node.js 验证与授权的职责

[jsonwebtoken 的官方 API](https://github.com/auth0/node-jsonwebtoken)提供 algorithms、issuer、audience 等校验选项，但调用方仍须定义并校验必需 claims 的类型、用途和当前授权。下面是刻意使用占位函数的伪代码，用于说明顺序；不是可直接部署的认证模块，未声明已执行验签或端到端安全测试。

```text
verifyAccess(token):
  claims = jwt.verify(token, trustedPublicKey, {
    algorithms: ['RS256'], issuer: expectedIssuer, audience: resourceAudience
  })
  require claims 是对象
  require sub 是非空字符串，exp 是有限的未来 NumericDate
  require token_use == 'access'，必要的业务字段符合当前 schema
  return 服务端构造的身份对象

runAgent(request):
  identity = verifyAccess(extractBearer(request))
  input = parseAllowedFields(request.body)       # 不接收 userId / tenantId 覆盖
  require currentPolicyAllows(identity, input)  # 验签不等于有权执行
  return runTask(input, trustedIdentity=identity)
```

令牌签发方应与验证规则一致地设置用途、受众、发行方、主题和过期时间。不要把 `jwt.decode` 当验证；也不要用 TypeScript 类型断言代替运行时 schema 检查。客户端传来的 key URL 或身份字段不得覆盖受信配置。`kid` 仅能在受信密钥集合中选择，轮换时也要拒绝未知或用途不符的密钥。

失败应终止请求；访问令牌过期可触发受限刷新流程，签名或受众无效不能被刷新重试掩盖。日志记录可用失败类型和会话标识，避免记录完整 bearer 凭据。

## Access Token + Refresh Token 双令牌机制

| 令牌类型 | 有效期 | 存储位置 | 用途 |
|----------|--------|----------|------|
| Access Token | 按资源风险设置的较短期限 | 常见浏览器方案使用内存；脚本可读存储有 XSS 暴露面 | 资源请求入口验证与授权 |
| Refresh Token | 按会话策略设置，不是固定天数标准 | 浏览器方案可用作用域受限的 HttpOnly、Secure Cookie | 仅交给刷新端点，需重放与撤销策略 |

刷新需要服务器维护的会话/族状态。以下为“随机刷新凭据＋轮换”方案的伪代码；原子操作、Cookie 作用域、CSRF 防护和错误恢复由真实服务实现，不能将先读后写替代原子轮换：

```text
refresh(request):
  require 合法请求来源与本方案的 CSRF 校验
  old = extractRefreshCookie(request)
  result = sessionStore.consumeAndRotateAtomically(hash(old))
  # 同时检查有效期、撤销、用途和族关系；旧凭据只消费一次
  if result 表示重放: 按策略撤销对应族，要求重新认证
  if result 失败: 清理刷新 Cookie，返回失败
  setRefreshCookie(result.newCredential, HttpOnly, Secure, configuredSameSiteScope)
  return issueAccessToken(result.subject, currentAuthorization)
```

轮换成功而响应丢失、同一用户多标签页同时刷新等情况，需要明确的重试与并发策略；任意放宽旧凭据重用窗口会影响重放检测，不能悄悄宣称兼得。若刷新凭据也使用 JWT，仍需独立固定算法、issuer、audience、用途和 claims schema 校验，并结合会话状态；仅验签或仅查黑名单不等于完成轮换。

## Token 吊销策略

已签发的 JWT 若只验证密码学与时间条件，就不会获知服务端刚发生的撤销。即时撤销需要检查额外状态；以下是三种取舍：

| 策略 | 实现 | 适用场景 |
|------|------|----------|
| 短过期时间 | 按配置过期后失效；过期前仍可能有效 | 低风险场景，依赖 Refresh Token 续期 |
| Redis 黑名单 | 登出时将 `jti` 存入 Redis，TTL 与 Token 过期一致 | 仅在每次敏感请求查询撤销状态时提供即时效果 |
| Token Version | 用户表存 `tokenVersion`，强制登出时 +1，Payload 携带版本号比对 | 需要批量吊销某用户所有 Token |

## JWT 在 Agent 服务中的应用

AI Agent 服务有其特殊性：一次任务调用可能耗时数十秒乃至数分钟，期间 Access Token 可能过期；同时 Agent 调用链涉及多个微服务，需要在服务间传递身份上下文。

**长任务的身份边界：**

1. 启动时验证并建立任务身份；后续敏感工具调用仍按当前策略检查范围、账号状态和授权，是否允许令牌到期后继续执行由任务协议明确定义。
2. JWT 内的配额和角色可能已经过时；消耗配额或访问高风险资源时，使用服务端当前状态判断，不把旧 claims 当永远有效的额度。
3. 网关先去除外部伪造身份头，再通过经过认证、访问受限的内部通道传递身份；另一选择是下游验证受众与权限范围明确的委托凭据。单纯“解码后加 Header”没有建立可信边界。
4. 回调使用作用域和受众限定的凭据或签名，并检查关联任务、时间与重放条件；独立 Token 本身不能防止同一回调重复提交。

## 常见误区 / 最佳实践 / 面试要点

### 常见误区

- **把敏感数据放 Payload**：Payload 是 Base64URL 编码，不是加密，任何人可解码。只放最小必要字段（userId、role），敏感数据用 `sub` 引用，在服务端按需查询。
- **不验证 `alg` 字段（alg:none 攻击）**：攻击者可将 Header 的 `alg` 改为 `none`，绕过签名验证。**务必在 `jwt.verify` 中显式指定 `algorithms` 白名单**。
- **令牌用途不隔离**：访问与刷新的验证规则要防止交叉接受，明确用途、受众与服务边界；按风险采用分开的密钥也是一种隔离手段，不要求两者必须用不同算法。
- **Token 存 localStorage**：localStorage 可被 XSS 脚本读取；Access Token 存内存，Refresh Token 存 HttpOnly Cookie。

### 最佳实践

[JWT BCP（RFC 8725）](https://www.rfc-editor.org/rfc/rfc8725.html) 要求调用方固定允许的算法、校验密钥与 claims，并防止不同用途的 JWT 被交叉接受。


- 按验证方的信任边界选择算法；非对称方案把签发私钥与验证公钥职责分开
- `jti` + Redis 黑名单实现精准吊销
- 合理设置 `iss` 和 `aud`，防止 Token 在不同服务间被跨站复用
- 密钥轮换策略：支持多公钥（`kid` 字段），平滑过渡

### 面试要点

- **JWT vs Session**：服务端 Session 需管理会话状态；JWT 可在部分场景本地验签，但刷新、即时撤销和授权仍可能有状态。水平扩展取决于这些状态如何共享，不仅由令牌格式决定。
- **HS256 vs RS256**：HS256 对称，所有验证方必须持有同一密钥，密钥泄露风险高；RS256 非对称，私钥仅签发方持有，验证方只需公钥，更适合微服务。
- **如何防篡改**：修改 Payload 后签名验证失败，服务端拒绝请求；前提是 `algorithms` 白名单不包含 `none`。
- **Token 过期怎么处理**：`jwt.verify` 抛 `TokenExpiredError`，返回 401 + `code: TOKEN_EXPIRED`，客户端用 Refresh Token 换新 Access Token，若 Refresh Token 也过期则跳登录。
- **如何实现"踢下线"**：方案一：Redis 黑名单记录 `jti`；方案二：数据库存 `tokenVersion`，Token Payload 携带版本号，不匹配则拒绝。

## 双令牌的边界与并发刷新

访问令牌用于资源请求，刷新令牌交给授权/认证服务换取新访问令牌；刷新令牌可以是不可解释的随机凭据，不要求两者都采用 JWT。服务端会话、单令牌与双令牌是不同设计取舍，不能仅凭令牌数量判断安全。

浏览器方案可以把访问令牌放内存，将刷新凭据置于 HttpOnly、Secure 且适当 SameSite 的 Cookie；HttpOnly 限制脚本读取，却不能阻止 XSS 发起已登录请求，也不单独防 CSRF。[Set-Cookie 契约](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)还要求按域、路径与跨站需求设置作用范围，普通远程爬虫并不会因此自动拿到用户浏览器本地凭据。

[RFC 9700 §2.2.2 与 §4.14](https://www.rfc-editor.org/rfc/rfc9700.html)要求 OAuth 公共客户端采用发送方约束或刷新令牌轮换，不能仅用“有效期较长”保护刷新凭据。轮换在每次刷新后废止旧令牌并保留族关系，以检测重放；重放被检测时还可能迫使正常用户重新授权。非 OAuth 自定义方案也应明确自己的重放与撤销契约，不能冒称已符合该协议。

无感刷新应共享一次在途刷新，令同一上下文的并发过期请求等待它，然后按明确次数重试；不同标签页仍需要协调。失败不能无限刷新，非幂等操作也不能因客户端未收到响应而盲目重发。这里描述一般机制，原面经没有提供其项目实际采用的策略。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 Managed Agent 校招一面：评测、运行链路与后端基础（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-26.md)
- [字节前端全栈实习一面：渲染、Worker与认证](../../../interview/bytedance/base/bytedance-base-38.md)
- [字节 Agent 实习：异步消息、上下文与容器隔离](../../../interview/bytedance/base/bytedance-base-41.md)
- [字节全栈实习：Session、权限与前端基础](../../../interview/bytedance/base/bytedance-base-46.md)
<!-- interview-source-history:end -->

## 参考资料

- [RFC 7519: JSON Web Token](https://www.rfc-editor.org/rfc/rfc7519.html)
- [RFC 8725: JSON Web Token Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725.html)

- [jsonwebtoken 官方文档](https://github.com/auth0/node-jsonwebtoken)（滚动文档，2026-10-03核验）
- [RFC 9700：OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/rfc/rfc9700.html)
- [MDN：Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
