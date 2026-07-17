可复用组件不是“把 JSX 拆进一个文件”，而是定义稳定职责、状态所有权、公开语义和扩展边界。好的组件让使用者表达意图，内部 DOM、样式和临时状态可以演进；坏组件暴露几十个布尔 prop，让调用者远程操纵实现细节。

![可复用组件树中的单一状态所有者、Props 向下、Events 向上、受控边界与 Context 范围](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/design-components-state-ownership-v1.webp)
*图：共享状态只有一个 owner；composition 决定结构，context 解决远距离读取，不应替代清晰的数据流。*

## 从职责与不变量开始

组件描述一个 UI 概念，例如 DateRangePicker，而不是“包含三个 div 的框”。写清输入、输出、状态、不变量、空/加载/错误/禁用和可访问行为。视觉变化频繁但语义稳定时，API 仍可保持。

拆分依据是变化原因和复用边界。一个组件同时请求数据、管理表单、渲染图表和控制 modal，测试与复用困难；但把每个 span 都抽组件也会增加跳转与 prop 转发。让容器协调数据，让 presentational/feature component 聚焦交互语义，是常见而非绝对的边界。

## 单一状态所有者

[React Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)建议共享状态提升到最近公共父级，并为每份状态指定单一 owner。两个输入需要同步时，不各自保存一份再 Effect 对齐；父级保存权威值，通过 props 向下、event 向上。

不要存可推导状态，例如同时保存 items 与 filteredItems；render 时计算，昂贵才 memoize。服务端状态由 query/cache 层管理，表单草稿、当前 tab 等局部 UI 状态留在最近组件，避免全局 store 变成所有状态垃圾场。

## Controlled 与 Uncontrolled

Controlled 组件由 `value` + `onChange` 控制，父级可协调、验证和持久化；uncontrolled 用 `defaultValue` 并在内部管理，使用简单。组件可支持两种模式，但一生不要在两者间切换，并明确 warning。

```tsx
<Disclosure open={open} onOpenChange={setOpen} />
<Disclosure defaultOpen />
```

事件命名表达意图 `onOpenChange`、`onValueCommit`，不暴露 `setInternalState`。事件 payload 包含调用者需要的业务值，不把原始 DOM event 作为唯一 API，除非组件本就是低层 primitive。

## Props 是协议

优先少量正交 prop 和判别联合，避免非法组合：

```ts
type NoticeProps =
  | { kind: 'info'; message: string }
  | { kind: 'action'; message: string; actionLabel: string; onAction(): void };
```

`isInfo/isAction/showButton` 会出现互相矛盾状态。公开 ref 只暴露必要 imperative handle，如 focus，而非整个内部 DOM。className/style escape hatch 有用，但说明哪些结构稳定，不承诺任意后代 selector。

## Composition 与 Slots

children/slots 让父级决定内容结构，适合 Card、Dialog、Toolbar 等容器。compound components 可共享局部 context，提供 `Tabs.List/Tabs.Trigger/Tabs.Content` 语义。但隐式关系过多会让错误难查，运行时校验并给清晰文档。

render prop 适合把行为状态交给调用者渲染；headless component/hook 提供状态机与 ARIA，视觉由使用者决定。选择一个主要扩展机制，不同时提供十种覆盖路径。

## Context 不是免费全局状态

[React Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)说明 Context 让后代读取远处值，适合 theme、locale、表单或 compound component 范围。Context value 引用变化会让消费者更新；拆分高低频 context，memoize 稳定 value，并限制 provider 范围。

Context 隐藏依赖，复用组件若必须在特定 provider 下才能运行，应文档化或给安全默认/明确错误。频繁大状态可用 selector store，不能仅靠多层 useMemo 掩盖模型问题。

## DOM 与可访问语义是 API

[WAI-ARIA APG Read Me First](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)强调原生元素优先与完整键盘行为。Button 组件应渲染真实 button；Dialog 负责焦点进入、trap、Escape、label 和关闭返回。调用者不应重复实现这些关键行为。

DOM 层级通常是实现细节，但 role、accessible name、focus 和 form behavior 是对用户的公开契约。asChild/polymorphic `as` 需要限制可替换元素，不能让 Button 轻易变成无键盘语义的 div。

## 样式与 Design Token

组件使用语义 token（surface, text-muted, danger）而非硬编码颜色。variant 表达设计系统允许的意图，size/spacing 有有限集合。响应式组件优先 container query，避免使用者知道内部 media breakpoint。

主题切换不改变 DOM 语义；高对比、reduced motion、RTL、zoom 都属于组件验收。CSS 作用域、layer 和 slot class 设计成稳定扩展点，内部类名可变。

## 测试与文档

测试公开行为：按 role/name 操作，受控/非受控、键盘、焦点、空/错误、长文本和异步。不要断言内部 state 或脆弱 DOM snapshot。Story 覆盖状态矩阵，视觉回归补充而非替代交互测试。

文档包含何时使用/不用、最小示例、状态所有权、事件时机、可访问要求和扩展点。版本变更按公开语义判断 breaking change，不因 TypeScript 编译通过就视为兼容。

## 参考资料

- [React：Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)
- [React：Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)
- [WAI-ARIA APG：Read Me First](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)
