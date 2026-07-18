Web 攻击的共同根因，是不可信数据跨过边界后被某个解释器当成代码、路径、查询结构或授权意图。安全设计应先画数据流和信任边界，再把控制放在正确的解释器入口。

![不可信输入分别进入 HTML、SQL、请求授权与浏览器脚本边界，经过编码、参数化、CSRF 校验和 CSP 纵深防御](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/web-security-xss-csrf-csp-boundaries-v1.webp)
*图：XSS 控制输出上下文，CSRF 验证请求意图；CSP 位于脚本执行层作为纵深防线，不能替代前两者。*

---

## 先识别最终解释器

同一个字符串进入 HTML text、attribute、URL、JavaScript、CSS、SQL 或 shell，所需防御完全不同。安全审查至少记录：数据来源、解码/规范化步骤、最终 sink、执行身份与失败影响。

SQL 注入通过输入改变查询结构；参数化查询把 SQL 与参数分离。动态表名、排序字段等不能作为普通参数时，使用固定映射 allowlist。数据库账号再采用最小权限，避免一次注入直接拥有管理能力。

命令执行尽量使用不经过 shell 的参数数组 API。路径访问先解析到规范路径，再验证结果仍位于允许根目录内，并考虑符号链接；只删除字符串里的 `../` 会被编码与组合路径绕过。

## XSS：按上下文编码

[OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)区分不同输出上下文、安全 sink 与 sanitization。模板默认转义通常保护 HTML 文本，但不自动让数据安全进入 `innerHTML`、事件属性、`javascript:` URL 或拼接脚本。

优先使用 `textContent`、属性 setter 等安全 DOM API。确实要接收富文本时，使用持续维护的 sanitizer，限制元素、属性和 URL scheme，并在服务端保存前与客户端显示前明确同一策略。

```javascript
// 安全地把用户输入当文本，而不是 HTML。
output.textContent = userInput;
```

框架的 escape hatch（例如 raw HTML）应封装在少数审计组件中，而不是分散在业务代码。

## CSRF：验证请求来自用户意图

CSRF 利用浏览器自动携带 Cookie 等凭据，让受害者跨站发出状态变更请求。[OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)建议组合使用：

- SameSite Cookie；
- 与会话绑定、不可预测的 CSRF token；
- Origin/Referer 校验；
- 自定义请求头与正确的 CORS 策略；
- 不用 GET 执行状态变更。

XSS 往往能以同源脚本身份绕过页面内的 CSRF 交互，因此不能用“已经有 CSRF token”降低 XSS 修复优先级。

## CSP 是纵深防御

[Content Security Policy Level 3](https://www.w3.org/TR/CSP3/)定义 source list、nonce/hash 与脚本执行模型。严格 CSP 可让页面只执行带正确 nonce/hash 的脚本，并通过 report-only/报告端点发现违规。

CSP 不能替代上下文编码和 sanitization。宽泛的 `unsafe-inline`、可控第三方源、把 nonce 泄漏到可注入模板，都会削弱效果。迁移时先用 Report-Only 收集真实依赖，再逐步去掉内联脚本和过宽来源。

## 其他常见边界

### SSRF

服务端根据用户 URL 发请求时，攻击者可能访问 metadata、内网管理接口或本机服务。控制包括目标 allowlist、解析后检查 IP、重定向每跳重验、禁止非预期 scheme、网络出口策略与响应大小/超时限制。只检查字符串前缀无法覆盖 DNS 重绑定和多种地址写法。

### 文件上传

扩展名和客户端 Content-Type 都不可信。服务端限制大小与数量、验证真实格式、随机化存储名、放在不可执行域/对象存储，并对需要公开的内容做病毒或内容扫描。图片重编码能减少部分隐藏载荷，但不是通用安全证明。

### 开放重定向与头部注入

重定向目标使用站内路径或固定 allowlist，不能直接回显完整 URL。响应头值拒绝 CR/LF，并使用框架提供的 header API；日志同样要处理换行和敏感字段，避免伪造日志行或泄漏 token。

## 防御与验证矩阵

| 风险 | 主要控制 | 验证 |
| --- | --- | --- |
| XSS | 上下文编码、安全 sink、富文本清洗 | 注入 corpus + 浏览器测试 |
| CSRF | SameSite、token、Origin 校验 | 跨站表单/请求用例 |
| SQL 注入 | 参数化、标识符 allowlist、最小权限 | 数据访问层测试与 SAST |
| 路径遍历 | 规范化后验证根目录 | 编码变体、绝对路径、符号链接 |
| SSRF | 目标策略、解析后 IP、出口控制 | 重定向、内网地址、DNS 变化 |

安全测试覆盖多层编码、重复参数、大小写、Unicode、重定向链和错误路径。日志保留 request ID、规则命中和最小必要上下文，不复制 secret 或完整恶意载荷到多个系统。

## 参考资料

- [OWASP Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP Cross-Site Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Content Security Policy Level 3](https://www.w3.org/TR/CSP3/)
