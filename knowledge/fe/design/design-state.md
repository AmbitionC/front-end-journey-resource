前端状态设计不是选择 Redux、Context 或某个 store，而是确定 source of truth、所有者、生命周期和同步协议。模型正确后，库只是承载方式；模型错误时，全局化只会扩大不一致。

![URL、组件 UI、表单、客户端领域状态和服务器缓存分别由不同 owner 管理，通过事件与失效规则同步而不是复制彼此](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/frontend-state-ownership-synchronization-v1.webp)
*图：状态先按所有权分层；派生 selector 从单一真相源生成视图，server state 通过 stale/invalidate/refetch 管理时间维度。*

---

## 按所有权分类

先把状态放到正确领域：

- URL state：可分享、可书签、支持前进/后退的筛选与分页；
- local UI state：焦点、展开、临时选择、弹窗；
- form draft：尚未提交的输入、校验与 dirty 状态；
- client domain state：仅客户端拥有的跨组件业务流程；
- server state：远端实体、缓存、请求状态和失效时间；
- external state：浏览器 API、WebSocket、第三方 widget。

状态放在能覆盖所有消费者的最低公共 owner 中。只有跨远距离组件、需要独立订阅或跨页面保留时才提升到 Context/store。全局不等于持久化，持久化也不等于权威。

## 删除冗余与矛盾

[React 的 state structure 指南](https://react.dev/learn/choosing-the-state-structure)建议合并共同变化的状态，避免矛盾、冗余与重复，并让单一 owner 持有真相。

```tsx
// 不存 fullName；它可由当前 state 推导。
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const fullName = `${firstName} ${lastName}`.trim();
```

过滤后列表、总价和完成数量通常是 selector，不是第二份 state。昂贵计算可以 memoize，但 memo 不改变“派生值不拥有真相”的事实。

实体集合可规范化为 `byId + allIds`，关系只存 ID；selector 再组合视图。更新按不可变语义返回新引用，使订阅、缓存与调试能准确识别变化。

## 用状态机表达流程

多个 boolean 容易形成 `isLoading && isSuccess && hasError` 等非法组合。判别联合让状态与可用字段绑定：

```typescript
type LoadState<T> =
  | { status: 'idle' }
  | { status: 'loading'; requestId: string }
  | { status: 'success'; data: T; updatedAt: number }
  | { status: 'error'; error: Error; retryable: boolean };
```

事件定义允许的迁移。并发请求携带 requestId/版本，旧响应不能覆盖新结果；取消进入明确路径。乐观更新保存可回滚快照或补偿操作，失败时不能只靠“刷新一下”掩盖竞争。

复杂流程可以用 reducer：

```typescript
function reducer(state, event) {
  switch (event.type) {
    case 'request':
      return { status: 'loading', requestId: event.requestId };
    case 'resolve':
      if (state.status !== 'loading' || state.requestId !== event.requestId) return state;
      return { status: 'success', data: event.data, updatedAt: Date.now() };
    case 'reject':
      return { status: 'error', error: event.error, retryable: event.retryable };
    default:
      return state;
  }
}
```

## 组件通信

父组件通过 props 传数据，通过回调接收事件；子组件不应读取未声明的隐式字段。跨层共享可使用 Context，但要按变化频率和责任拆分，避免一个高频大对象让所有消费者重渲染。

外部 store 的价值是独立订阅、统一事件与开发工具，不是绕过组件边界。选择库前写出 state schema、event、selector、持久化范围和清理规则；无法写清这些内容时，换库不会解决模型问题。

## Server state 有时间维度

[TanStack Query 的 defaults 文档](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)展示了 server cache 常见语义：数据可能立即视为 stale，窗口聚焦或网络恢复时 refetch，失败请求按策略 retry，inactive query 在一段时间后被回收。具体默认值随库版本变化，业务应显式决定：

- query key 是否完整包含请求参数与身份边界；
- stale time 与业务新鲜度要求；
- mutation 后 invalidate、直接更新还是乐观更新；
- 分页/游标如何合并；
- 权限变化、登出和租户切换时怎样清缓存；
- retry 是否会重复非幂等副作用。

server cache 是远端真相的客户端副本，不应与本地领域 state 复制同一实体再双向同步。

## URL 与持久化

刷新后必须保留不等于必须进 localStorage。可导航状态优先放 URL；离线大量数据用 IndexedDB；非敏感偏好可 localStorage；服务端会话由安全 Cookie 管理。

持久化 schema 带版本、迁移、过期和损坏回退。恢复后仍需权限与服务端校验，不能信任旧缓存继续执行高权限动作。多个标签页同步要定义冲突策略和时间顺序，而不只是监听 storage event。

## 验收状态模型

列出所有 state、event 与 side effect，检查：

- 是否存在能推导却重复保存的字段；
- 非法状态能否被类型或 reducer 排除；
- 快速连续请求、取消、失败重试和卸载；
- 离线、恢复、权限变化和跨标签冲突；
- 持久化迁移与损坏数据；
- selector 是否纯净，side effect 是否位于明确边界。

好的状态模型让非法组合难以表达，让每个事件只有可解释的迁移，并让 server data 的新鲜度与失效成为显式策略。

## 参考资料

- [React choosing the state structure](https://react.dev/learn/choosing-the-state-structure)
- [TanStack Query important defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
