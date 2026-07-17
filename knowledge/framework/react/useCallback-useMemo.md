`useMemo` 和 `useCallback` 只是在依赖不变时复用值或函数引用的性能工具，不会让组件“天然不渲染”，也不应承担正确性。优化顺序应是定位真实慢点、理解 render 与 commit、修复状态边界，再在有引用稳定需求的地方 memoize，并用 Profiler 验证收益。

![React 渲染、依赖比较、useMemo/useCallback、memo 子组件和 Profiler 的性能关系](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/usecallback-usememo-render-dependency-v1.webp)
*图：父组件 render 不等于 DOM 更新；稳定引用只有在下游做相等比较或依赖它时才可能减少工作。*

## 先理解 React 的工作

父组件状态更新会调用父组件函数，并通常递归计算子树。render 是计算下一棵 UI，commit 才把差异应用到 DOM。组件函数再次执行不等于 DOM 全部重建；盲目阻止 render 可能比计算本身更贵。

常见慢因是昂贵计算、过大的组件树、状态放得太高、Effect 循环、列表 key 不稳定或事件触发过频。先用 React DevTools Profiler 看哪些组件慢、为何 render 和 commit 多久，不凭感觉给所有函数包 Hook。

## `useMemo` 缓存计算结果

[React useMemo](https://react.dev/reference/react/useMemo)在依赖按 `Object.is` 比较不变时复用上次计算值：

```jsx
const visibleTodos = useMemo(
  () => filterTodos(todos, query),
  [todos, query]
);
```

适合昂贵纯计算，或为 `memo` 子组件提供稳定对象/数组。若计算只是 `a + b`，依赖比较、Hook 管理和代码复杂度可能高于收益。React 也可能基于平台行为丢弃缓存，所以业务正确性不能依赖“只计算一次”。

计算函数在 render 期间执行，必须纯净，不能发请求、改 DOM 或修改输入数组。开发 Strict Mode 可能重复调用以发现副作用；有副作用的 memo 是 bug，不是 Strict Mode 问题。

## `useCallback` 缓存函数身份

[React useCallback](https://react.dev/reference/react/useCallback)等价于缓存函数本身，而非缓存调用结果：

```jsx
const handleSubmit = useCallback((payload) => {
  save(projectId, payload);
}, [projectId]);
```

它在两类场景有意义：函数作为 prop 传给 `memo` 子组件，稳定身份能让 shallow compare 通过；函数是其他 Hook 的依赖，稳定能避免 Effect/订阅无必要重建。若下游不比较引用，包装不会阻止任何 render。

## `memo` 与引用稳定必须配套

`React.memo` 默认浅比较 props。父组件每次创建 `{}`、`[]` 或新函数，会让比较失败；此时 useMemo/useCallback 可稳定引用。但若其他 prop 总在变化，优化仍无效。

自定义 comparator 必须比较所有影响渲染的 prop，包括函数闭包；漏掉会让子组件看到陈旧 handler。深比较可能比重新 render 更慢，并在数据结构增长时突然恶化。

更优先的是让 props 最小且语义稳定：传 `selected` 布尔值而不是整个 mutable record；children composition 让局部状态不牵动昂贵子树；把状态放到最近 owner。

## Dependency 与闭包

Hook 内读取的 reactive value 应进入依赖。遗漏会形成 stale closure：回调捕获旧 state/prop。eslint exhaustive-deps 是设计反馈，不应随意禁用。依赖太多时，先问逻辑是否应移入 Effect、移出组件或使用 state updater。

```jsx
const addTodo = useCallback((text) => {
  setTodos(list => [...list, { id: crypto.randomUUID(), text }]);
}, []);
```

使用 updater 让回调不必读取当前 todos，但只在逻辑确实基于最新状态时适用。`useRef` 可保存不驱动 render 的可变值，却不应成为逃避依赖的隐藏状态库。

## Effects 往往是性能根因

Effect 中同步 setState 会产生额外 render；对象/函数依赖每次变化会重复订阅。若某值可从 props/state 直接推导，就在 render 计算，必要时 useMemo，而不是 Effect + state 复制。

把只在事件发生时做的工作放事件 handler，不放观察某个布尔 state 的 Effect。网络请求使用专门数据层、缓存和取消，memoize 请求函数并不会自动避免重复请求。

## React Compiler 的影响

React 文档指出 React Compiler 可自动 memoize 值和函数，减少手写 useMemo/useCallback。即使启用 Compiler，仍需正确状态边界、纯 render 和 profiling；手工 memo 可在互操作或明确热点保留，但不再是默认仪式。

库 API 不应强迫消费者为每个 handler 手工 useCallback 才能正确。若组件性能依赖稳定 prop，在文档说明并考虑内部架构。

## 什么时候删掉 memoization

依赖频繁变化、计算很便宜、组件不慢、或 memo 造成难懂依赖时就删除。优化要比较交互的 Profiler before/after，不只看 render count；少一次微小 render 但增加内存和比较未必是收益。

列表性能还可能由虚拟化、图片、布局和 DOM 数量主导。memo 不能修复不稳定 key；key 变化会 remount，缓存引用也无效。

## 验证清单

用生产构建或接近生产环境测代表性数据，记录交互、commit duration、render 原因和次数。测试依赖变化后值/handler 更新，避免 stale closure；Strict Mode 下无副作用；自定义 comparator 不漏 prop。

判断是否使用两个 Hook 的简短路径是：这里真的慢吗？昂贵的是哪个计算/子树？下游是否依赖引用相等？依赖是否正确？Profiler 是否证明净收益？任一答案不清楚，就先保持简单。

## 参考资料

- [React：useMemo](https://react.dev/reference/react/useMemo)
- [React：useCallback](https://react.dev/reference/react/useCallback)
