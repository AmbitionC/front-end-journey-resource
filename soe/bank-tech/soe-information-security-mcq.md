信息安全选择题先问“要保护什么”，再问“攻击跨过了哪个边界”。加密、身份鉴别和访问控制解决的问题不同，任何一个控制都不能自动替代其他控制。本篇用边界对照和 **7 道原创模拟题，均为单选**，练习从题干选择与风险对应的措施，不代表真实考试原题或出题统计。

## 先把安全目标与技术措施分开

机密性、完整性、可用性通常合称 CIA。它们是保护目标，不是三种算法。下表按 [NIST FIPS 199 的安全目标定义](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.199.pdf)区分；例子为本篇自拟。

| 目标 | 主要防止什么 | 题干中的典型现象 |
| --- | --- | --- |
| 机密性 Confidentiality | 未获授权的信息披露 | 内部资料被无权查看的人下载 |
| 完整性 Integrity | 不当修改或破坏 | 交易金额、收款账号被篡改 |
| 可用性 Availability | 访问和使用受到中断 | 正常用户在需要时无法获得服务 |

一场攻击可能同时影响多个目标。题目问“直接体现”时按已给出的事实判断，不能自行补出“攻击者一定还窃取了数据”。

### 原创模拟题 1：三个现象分别破坏什么

某业务系统发生三个独立事件：①未授权人员读取客户地址；②攻击者把订单金额从 80 改为 800；③大量恶意请求耗尽处理容量，正常用户无法查询。依次直接对应哪组目标？

- A. 完整性、机密性、可用性
- B. 机密性、完整性、可用性
- C. 机密性、可用性、完整性
- D. 三者都只能归为机密性

**答案：B。** ①的已知损害是信息被不该看到的人看到；②是数据被不当修改；③是正常服务无法取得。A、C 调换了目标，D 把所有安全问题都缩成泄露。题干没有说明③发生数据外泄，因此不能仅由服务不可用推出机密性也已受损。

## 密码学题：先判断需要保密、摘要还是来源证明

| 工具 | 关键关系 | 不能据此推出什么 |
| --- | --- | --- |
| 对称加密 | 使用共享的秘密密钥进行相应加解密，例如 AES 方案 | 单纯“已加密”不自动保证密文未被篡改，要看是否采用认证加密等完整方案 |
| 非对称密码 | 公钥与私钥配对，各自承担算法规定的操作；在公钥加密方案中，可由接收方公钥加密、相应私钥解密 | 不是每一种非对称算法都同时支持加密和签名 |
| 密码学哈希 | 将数据映射为摘要，不是可用“解密密钥”还原的密文 | 公开摘要不能单独证明发送者身份；也不能说不同输入绝不碰撞 |
| 数字签名 | 签名者用私钥签名，验证者用相应公钥验签；还需可信地确认公钥归属 | 签名本身不隐藏明文，也不自动证明消息新鲜或阻止重放 |

加密模式与密钥职责可核对 [OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)和 [Key Management](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)。哈希的抗原像、抗第二原像与抗碰撞要求见 [NIST 密码学哈希定义](https://csrc.nist.gov/glossary/term/cryptographic_hash_function)；签名提供来源真实性、完整性及抗抵赖支持，其效果依赖实现、密钥和配套制度，不能写成无条件保证。[NIST 数字签名定义](https://csrc.nist.gov/glossary/term/digital_signature)

### 原创模拟题 2：验签成功是否意味着文件保密

系统需要让接收方确认一份通知来自指定发布者，且内容未被替换。攻击者能够替换下载渠道中的文件和公开摘要。下列说法最准确的是哪项？

- A. 把文件和它的普通 SHA-256 摘要放在同一可篡改渠道，就足以证明发布者身份
- B. 发布者用公钥签名、接收方用私钥验签，是数字签名的一般方向
- C. 发布者用私钥签名，接收方用已可信确认归属的公钥验签，可校验来源和完整性；还需要其他措施满足保密或防重放需求
- D. 只要通知带签名，未持有私钥的人就无法读取通知明文

**答案：C。** 攻击者可替换文件并重新计算公开摘要，故 A 没有建立可信来源。B 颠倒了签名与验签的密钥职责。D 把签名当作加密；公开的带签名明文仍可被读取。即使旧通知签名仍有效，也不能因此认定它是本次最新通知，协议还要检查版本、有效期、消息标识等相应的新鲜度条件。签名算法正确只是整体方案的一环。

## 身份鉴别与访问控制：知道是谁之后，仍要判断能做什么

身份鉴别（authentication）验证主体声称的身份；授权（authorization）判断该主体能否对某资源执行某动作；访问控制则把策略落实为允许或拒绝。一个已登录用户可能无权读另一用户的账单；公开页面也可能按策略允许匿名访问。“已认证”与“已获准执行本次操作”不能互换。[OWASP Authorization：身份鉴别与授权的区别](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html#introduction)

对本篇涉及的受保护接口，先从可信会话确定主体，再针对本次资源和动作检查权限。资源归属、租户及角色要使用服务端可信事实，不能直接相信请求里自报的 `ownerId` 或 `role`。图中应注意两处拒绝分支：身份验证失败就不能建立可信主体；身份成立但权限不足，同样不能执行。

![受保护资源请求先验证凭据或会话，再按主体、资源与动作检查权限；身份不成立或无权限都进入拒绝路径，获准后才执行操作](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/soe-information-security-mcq-access-control-v1.png)
*图：身份鉴别与权限校验是两个不同判断。还需核对服务端可信的租户、owner 等资源事实；不能由已登录推导可访问任意资源。*

常见 RBAC 按角色关联权限，ABAC 则按主体、资源、动作和环境等属性评估策略。无论模型叫什么，仍要落实最小权限、默认拒绝和每次请求的权限检查；仅隐藏界面按钮不能阻止用户直接调用接口。[OWASP Authorization：权限检查与控制模型](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html#validate-the-permissions-on-every-request)

### 原创模拟题 3：登录通过之后缺了哪一道检查

系统规则是“员工只能读取自己所属租户内、且分配给自己的报表”。员工甲已通过登录，尝试请求员工乙的报表，并把请求中的 `ownerId` 改成甲。哪项处理正确？

- A. 只要甲登录成功，就允许读取任意报表
- B. 只要前端没有显示乙的报表入口，就无需服务端校验
- C. 仅验证请求中的 `ownerId` 等于甲的用户 ID，即可判定报表归甲
- D. 从可信会话识别甲，从服务端记录读取报表归属，再按租户、分配关系和读取权限决定是否放行

**答案：D。** 登录回答“这是谁”，没有回答“这份报表是否允许他读取”。C 使用了甲自己能修改的归属声明，不能代表真实资源属性。D 把主体身份与资源事实分别取自可信来源，再实施本次访问决策。A 直接扩大权限；B 只控制显示，未控制资源访问。

## 攻击题：把防御放到对应的解释和请求边界

XSS、CSRF 的机制可先复习已有的 [XSS、CSRF、CSP 与 Web 安全基础](../../knowledge/network/security/web-attack.md)。选择题重点是下面三个区别，而非记一份“通用过滤器”：

| 风险 | 关键问题 | 对应防线与边界 |
| --- | --- | --- |
| SQL 注入 | 不可信数据进入 SQL 语法结构 | 数据值使用参数绑定；动态列名、表名或排序方向使用固定映射/允许清单；数据库账号最小权限 |
| XSS | 不可信内容被页面当成可执行内容解释 | 普通文本使用安全输出位置和对应上下文编码；允许富文本时使用维护中的 HTML 清洗方案；CSP 提供纵深防御 |
| CSRF | 浏览器携带用户凭据，发出非用户意图的操作 | 对状态变更请求校验适用的 CSRF 令牌或框架防护，并按方案检查来源、Cookie 属性等条件 |

三个解释器/请求边界的依据分别是 [OWASP SQL 注入防御](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)、[XSS 防御](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)和 [CSRF 防御](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)。参数化不替代业务授权，CSP 不替代正确输出处理，CSRF 校验也不授予原本没有的资源权限。

### 原创模拟题 4：占位符能否代替任意 SQL 片段

一个订单接口允许按 `amount` 或 `created_at` 排序，还接收客户编号。开发者希望保留以下查询结构，但不能信任客户端传来的排序字符串：

```sql
SELECT id FROM orders
WHERE customer_id = ?
ORDER BY <column> <direction>
```

哪种做法最合理？

- A. 客户编号作为绑定参数；排序列和方向映射到服务端固定允许值，再结合资源授权与数据库最小权限
- B. 把客户编号和排序字符串全部拼接进去，只在前端过滤单引号
- C. 将任意列名都当普通数据值绑定到 `ORDER BY ?`，就等价于安全选择该列排序
- D. 使用 ORM 后，所有原始查询字符串自动免疫注入

**答案：A。** 绑定值与选择 SQL 标识符是不同工作。A 让外部数据不能自行改变查询结构；服务端允许映射应产生应用自有的 SQL 片段。B 的前端校验可被绕过，且并未分离代码与数据；C 的占位符不等于标识符替换机制；D 忽略 ORM 的原始查询或查询语言同样可能因拼接而注入。即便查询没有注入，接口仍须确认调用方可以读取相应客户的订单。

### 原创模拟题 5：只需要显示昵称，应该用什么输出方式

页面只需把昵称当普通文本显示，当前实现为：

```javascript
preview.innerHTML = nickname;
```

`nickname` 来自其他用户，哪项改动最直接对应此处风险？

- A. 保留写法，只给会话 Cookie 设置 `HttpOnly`，就能阻止页面运行恶意脚本
- B. 改用 `preview.textContent = nickname`，避免在这个输出位置把昵称解析成 HTML
- C. 只在 SQL 查询中使用参数化，就不再需要处理页面输出
- D. 只加 CSP，任何 HTML 输出位置都可以安全拼接用户输入

**答案：B。** 需求是纯文本，`textContent` 使这处内容按文本呈现。`HttpOnly` 限制脚本读取对应 Cookie，不阻止其他恶意脚本行为；SQL 参数化保护的是数据库解释边界。CSP 有助于限制执行，但不能替代安全输出。若需求变成富文本，就要重新设计允许的 HTML、属性和 URL 清洗规则，不能简单沿用本题的“按文本显示”来满足富文本需求。

### 原创模拟题 6：读不到响应，为什么仍可能 CSRF

某修改收款地址接口依赖会话 Cookie。题设浏览器在跨站请求中实际携带了该 Cookie；它使用 `SameSite=None; Secure; HttpOnly`。恶意页面能发出服务器接受的跨站表单请求，虽然读不到响应，收款地址仍被修改。下列判断正确的是哪项？

- A. 使用了 HTTPS，所以服务器无需再校验操作意图
- B. 有 `HttpOnly`，浏览器就不会在跨站请求中发送会话 Cookie
- C. 恶意页面读不到响应，说明同源策略已经阻止修改生效
- D. 已出现 CSRF 风险，应对状态变更请求实施服务端验证的 CSRF 防护，并保持资源授权检查

**答案：D。** 请求是否发出并产生副作用，与攻击页面能否读取响应是两回事。`Secure` 约束 Cookie 的安全传输条件，`HttpOnly` 约束脚本读取，都不表达“用户同意修改地址”。可采用框架维护的 CSRF 防护，例如校验与会话绑定的令牌，并按设计验证来源等条件。令牌缺失或无效时应拒绝，不能仅由 Cookie 自动携带就放行。[OWASP CSRF 防御](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

`SameSite` 的有效性取决于具体值、同站关系和业务流程，不能把“设置过 SameSite”当作所有请求都安全的证明。严格的来源允许清单、自定义头和预检可在明确条件下组成 API 的防护方案；随意“配了 CORS”则不能推出免疫 CSRF。同源 XSS 还可能绕过页面可用的 CSRF 防线，因此两类漏洞都要处理。

## 密码存储题：不可逆不等于无法被猜中

密码验证通常需要判断输入是否匹配，无需恢复用户的原始密码。应使用适合密码的自适应哈希方案，为每份密码生成独立随机 salt，并保存验证所需的算法、参数、salt 与结果。工作因子要结合当前指南和部署容量评估。单次快速通用哈希即使加盐，也不能替代密码专用的成本设计。[OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

### 原创模拟题 7：数据库泄露后，salt 提供什么保护

系统只需验证密码，不需要取回明文。哪种设计最合理？

- A. 用 AES 加密所有密码，并把解密密钥与密文放在同一张可被一并导出的表中
- B. 仅计算一次 `SHA-256(password + salt)`；只要 salt 不重复，就不再可能离线猜测密码
- C. 使用按部署评估参数的 Argon2id 等密码哈希方案，为各份密码使用独立随机 salt，保存验证元数据，并对在线登录设置适当限速
- D. 对密码做 Base64 编码，因为没有对应字典的人无法恢复明文

**答案：C。** 密码哈希的成本参数提高逐次猜测的代价；独立 salt 减少预计算表和跨账户复用计算的收益，但 salt 不必保密，也不会消灭对弱密码的离线猜测。在线限速限制服务端登录尝试，不能阻止拿到数据库后的本地计算。A 在题设下没有必要保存可恢复密码，且密钥同泄露会失去相应保护；B 高估了 salt；D 把编码当作保密措施。

## 答题时保留条件

“验签成功”要附带可信公钥与验证规则，“已经登录”之后仍有资源授权，“加了 salt”之后仍有离线猜测成本，“浏览器读不到响应”之后仍可能存在写入副作用。选项出现“必然”“自动”“所有场景都安全”时，先寻找它略去的前提。

## 参考资料

- [NIST FIPS 199：Security Objectives](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.199.pdf)（2004 年版，第 2 页定义 CIA；本文只采用基础定义）
- [NIST Glossary：Cryptographic Hash Function](https://csrc.nist.gov/glossary/term/cryptographic_hash_function)
- [NIST Glossary：Digital Signature](https://csrc.nist.gov/glossary/term/digital_signature)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [OWASP Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [OWASP Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP Cross-Site Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

OWASP 与术语网页为滚动文档，以上正文核实日期为 **2026-11-09**。题目没有给出具体密码学协议、认证系统或访问控制策略时，不把基础判断扩展为完整系统的安全保证。
