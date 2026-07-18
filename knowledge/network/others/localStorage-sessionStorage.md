浏览器状态不能只按“容量和过期时间”选择。localStorage、sessionStorage、Cookie、IndexedDB 与 URL 的关键差异是作用域、生命周期、同步/异步、是否自动随请求发送，以及谁能读取。

![URL、内存、sessionStorage、localStorage、IndexedDB 与 Cookie 按 origin、标签页会话、服务器请求和敏感性分层](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/browser-state-cookie-storage-boundaries-v1.webp)
*图：导航状态优先进入 URL，短期 UI 状态留在内存；Web Storage 属于脚本可读区域，HttpOnly Cookie 位于脚本边界之外并随匹配请求发送。*

---

## Web Storage 的作用域

[HTML Standard 的 Web Storage 章节](https://html.spec.whatwg.org/multipage/webstorage.html)定义了 Storage API。localStorage 按 origin 隔离；origin 包含 scheme、host 与 port，不能简化为“协议 + 域名”。同源页面共享相应 local storage。

sessionStorage 除 origin 外还与顶层浏览上下文的页面会话相关。同源的新标签页通常有独立会话，复制标签页或 opener 关系可能影响初始副本，不能把它概括为“同一浏览器窗口全部共享”。关闭对应页面会话后，session storage 可被清除。

localStorage 可跨同源标签页持久存在，但并非“永不丢失”。隐私模式、用户清理、浏览器配额和存储策略都可能让写入失败或数据被删除。对 `setItem` 应捕获异常，并允许缓存缺失。

## 同步 API 与配额

Web Storage 读写是同步的，频繁序列化大对象会阻塞主线程。它只保存字符串，JSON 读取后仍需 schema/version 校验。容量不是跨浏览器固定的“5 MB 合同”；[WHATWG Storage Standard](https://storage.spec.whatwg.org/)用 storage key、bucket、quota 与 eviction 描述更完整的模型，具体配额由用户代理策略决定。

多个标签页可监听 `storage` 事件协调简单偏好，但事件不会在发起写入的同一 document 上触发，也不提供事务或可靠消息队列语义。大量结构化数据、索引和事务应使用异步的 IndexedDB。

## Cookie 的请求语义

[RFC 6265](https://www.rfc-editor.org/rfc/rfc6265.html)规定 Cookie 的存储、Domain/Path 匹配、过期与发送。Cookie 会自动附加到匹配请求，因此适合服务器会话标识，也会增加每次请求开销并引入 CSRF 风险。

- `Secure` 要求在安全传输上发送；
- `HttpOnly` 让脚本 API 无法读取该 Cookie，降低会话值被 XSS 直接窃取的风险；
- [`SameSite`](https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html) 按现代 6265bis 规则约束跨站 Cookie 携带；其默认值和兼容行为要结合目标浏览器验证；
- Domain 与 Path 应尽量收窄。

HttpOnly 不是“防止 XSS”：恶意同源脚本仍可能代表用户发请求或读取页面数据。Cookie 会自动发送，所以还要配合 SameSite、CSRF token 和 Origin 检查。

## 不要把敏感 token 默认放进 localStorage

localStorage/sessionStorage 没有 HttpOnly 属性，任何成功运行在该 origin 的脚本都可读。把长期 bearer token 放入其中，会让 XSS 直接获得可带离浏览器的凭据。更稳妥的会话设计通常让服务器设置 Secure、HttpOnly、SameSite Cookie，并缩短会话、轮换令牌、限制权限。

这不表示 Cookie 天然安全；配置错误、CSRF、子域边界和日志泄漏同样危险。选择前先完成威胁模型，而不是给三种存储做“安全性高/低”的绝对排名。

## 按状态语义选择

| 状态 | 推荐位置 | 原因 |
| --- | --- | --- |
| 可分享、可书签、支持前进/后退的筛选 | URL | 导航本身就是状态契约 |
| 当前组件瞬时交互 | 内存 state | 生命周期与 UI 一致 |
| 当前标签页的短期草稿 | sessionStorage 或 IndexedDB | 需要恢复但不跨长期会话 |
| 非敏感用户偏好 | localStorage | 简单持久化，需版本与失败处理 |
| 大量离线结构化数据 | IndexedDB | 异步、事务、索引 |
| 服务器会话标识 | Secure + HttpOnly Cookie | 服务器控制，脚本不能直接读取 |

不要重复保存可从 URL、服务器响应或其他状态推导的数据。持久化值需要 `schemaVersion`、迁移、过期、清除和损坏回退；缓存不能成为高权限业务数据的唯一真相来源。

## 示例：带版本的非敏感偏好

```javascript
const KEY = 'preferences:v2';

export function loadPreferences() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (value?.version !== 2) return { theme: 'system' };
    return { theme: value.theme === 'dark' ? 'dark' : 'system' };
  } catch {
    return { theme: 'system' };
  }
}

export function savePreferences(preferences) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 2, ...preferences }));
  } catch {
    // 存储不可用时仍允许页面工作，只失去持久化偏好。
  }
}
```

## 参考资料

- [HTML Standard: Web storage](https://html.spec.whatwg.org/multipage/webstorage.html)
- [RFC 6265: HTTP State Management Mechanism](https://www.rfc-editor.org/rfc/rfc6265.html)
- [WHATWG Storage Standard](https://storage.spec.whatwg.org/)
- [RFC 6265bis: Cookies — HTTP State Management Mechanism](https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html)
