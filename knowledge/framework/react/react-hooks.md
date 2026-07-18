React 函数组件每次渲染都用当次 props 与 state 计算 UI 快照。Hook 让 React 在多次渲染之间关联状态槽位，并在 commit 后与外部系统同步；它们不是普通工具函数，也不能按条件随意调用。

![事件处理器把 state update 加入队列，React render 生成快照并 commit DOM，Effect 随后 setup 外部同步且在依赖变化或卸载时 cleanup](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/react-render-state-effect-cycle-v1.webp)
*图：event → update queue → render snapshot → commit → effect；顶部固定 Hook 调用顺序，底部区分纯派生数据与外部系统。*

---

## State 是一次渲染的快照

[useState 文档](https://react.dev/reference/react/useState)说明 setter 会请求下一次渲染，不会修改当前函数中的 state 变量：

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  function incrementTwice() {
    setCount(current => current + 1);
    setCount(current => current + 1);
  }

  return <button onClick={incrementTwice}>{count}</button>;
}
```

两个函数式 updater 按队列依次接收最新待处理状态，所以增加 2。如果写两次 `setCount(count + 1)`，两个表达式都捕获同一次 render 的 count，不能据此推导为增加 2。

对象和数组 state 按不可变方式更新。React 用新引用表达变化；原地修改后再传回同一对象会让调试、memo 和并发渲染边界失去可靠信号。

## Hook 调用顺序必须稳定

[Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)要求 Hook 只在 React 函数组件或自定义 Hook 顶层调用，不能位于条件、循环、事件函数或提前 return 之后。React 按调用顺序把 `useState`、`useEffect` 等对应到组件内部槽位；某次渲染跳过一个 Hook，会让后续槽位错位。

自定义 Hook 用于复用状态逻辑，不共享同一份状态实例。每个调用者获得自己的 state 与 Effect；若要共享数据，需要共同 owner、Context 或外部 store。

## Effect 同步外部系统

[useEffect 文档](https://react.dev/reference/react/useEffect)把 Effect 定义为组件与外部系统的同步。依赖发生变化的 commit 后，React 先用旧值运行 cleanup，再用新值运行 setup；组件卸载时再执行最后一次 cleanup。依赖不变时才跳过重新同步。

```tsx
useEffect(() => {
  const controller = new AbortController();

  loadUser(userId, { signal: controller.signal })
    .then(setUser)
    .catch(error => {
      if (error.name !== 'AbortError') setError(error);
    });

  return () => controller.abort();
}, [userId]);
```

依赖数组不是人工挑选的“触发条件”，而是 setup/cleanup 使用的所有响应式值。修复 lint 警告应重构闭包、把非响应式逻辑移出组件或使用函数式更新，不能随意删除依赖。

## 什么时候不需要 Effect

能在 render 中从 props/state 计算的值直接计算；昂贵时再 memoize。用户点击引发的提交放在事件处理器，因为事件提供明确意图。只为“state A 变化后 set state B”写 Effect，常导致额外 render 和短暂不一致。

```tsx
// 不需要 Effect 和第二份 state。
const visibleItems = items.filter(item => item.name.includes(query));
```

Effect 适合连接 WebSocket、订阅浏览器 API、控制非 React widget、发送曝光事件等。setup 做什么，cleanup 就撤销什么；开发 Strict Mode 中额外的 setup/cleanup 循环用于暴露不对称逻辑。

## Context、Reducer、Ref 与 Memo

`useContext` 读取最近 Provider 的值。高频变化的大对象 Context 会使所有消费者重新渲染，应按责任拆分并保持 value 稳定，而不是把所有状态塞进一个 Provider。

`useReducer` 适合多个事件驱动同一状态机：reducer 接收 state/action 并返回新 state，便于集中验证合法迁移。它不是因为“字段多”就必然优于 useState。

`useRef` 保存跨渲染的可变值且修改不会触发 render，适合 DOM、timer ID 与外部实例。屏幕上要响应变化的数据应是 state。

`useMemo` 与 `useCallback` 是性能优化，不是语义保证。只有昂贵计算、memoized child 或稳定依赖边界确有收益时使用，并以 Profiler 验证；给每个函数加 useCallback 会增加依赖维护成本。

## 组件设计步骤

1. 先写纯 render：相同 props/state 得到相同 UI。
2. 找到最小 state，删除可推导与重复字段。
3. 把用户意图放入事件处理器。
4. 列出真正的外部系统，为每个 setup 写对称 cleanup。
5. 运行 Hooks lint，并测试依赖变化、快速切换、卸载与失败。
6. 最后才用 profiler 决定 memo。

这套顺序把 Hook 从 API 清单变成渲染模型：state 驱动下一快照，commit 更新宿主，Effect 只负责外部同步。

## 参考资料

- [React useState reference](https://react.dev/reference/react/useState)
- [React useEffect reference](https://react.dev/reference/react/useEffect)
- [React Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
