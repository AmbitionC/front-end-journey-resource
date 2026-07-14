### 面试中的问题：

#### （1）自我介绍

**答题思路**：1 分钟讲清「你是谁 + 技术亮点 + 为什么匹配」。结构建议：教育背景 → 最拿得出手的 1~2 个项目及量化产出 → 技术栈 → 想来该岗位的原因。多用与 JD 相关的关键词，避免流水账。

#### （2）细讲一下秒发方案

**答题思路**：这是项目题，先讲清「秒发」要解决什么（发布慢/生效慢），再讲你的方案与效果。常见技术点：资源**预构建/增量发布**、**CDN 边缘节点**分发、**离线包/资源预热**、灰度与回滚。按背景 → 方案 → 量化效果（发布时长从 X 降到 Y）组织，突出你负责的部分。

#### （3）首屏渲染速度是如何优化的，咋量化

+ **优化手段**：路由/组件懒加载、代码分割、资源压缩与 CDN、图片懒加载与格式优化（WebP）、关键 CSS 内联、SSR/预渲染、减少首屏请求数。
+ **量化**：用 Performance API（FP/FCP）、Lighthouse 评分、LCP/TTI/CLS 指标，并通过埋点上报真实用户首屏时间（RUM），做优化前后对比。

#### （4）详细说一下轮播图预加载实现思路

**答题思路**：当前图展示时，提前加载**相邻的下一张（及上一张）**图片，切换时命中缓存实现无白屏。实现上用 `new Image()` 预请求相邻索引的图片 URL，只预加载 1~2 张避免浪费带宽，配合浏览器缓存复用。

```javascript
function preload(urls) {
  urls.forEach(url => { const img = new Image(); img.src = url; });
}
```

#### （5）如何将其封装成一个通用逻辑组件

**答题思路**：把「可变点」抽象为 props/插槽/回调，让业务逻辑与 UI 解耦。手段：props 参数化、slot 或 render prop 定制 UI、事件回调暴露交互、用 composable（Vue hooks）或自定义 Hook 复用逻辑。原则是单一职责、可配置、提供合理默认值。

#### （6）Vue3 比较大的更新有哪些

+ **Composition API**：`setup` 组织逻辑，替代 mixins，逻辑复用更清晰。
+ **响应式重写**：用 `Proxy` 替代 `defineProperty`，可监听属性新增/删除、数组索引，性能更好。
+ **性能**：静态提升、patchFlag 标记动态节点加速 diff，Tree-shaking 友好、包体更小。
+ **新特性**：Fragment 多根节点、Teleport、Suspense，以及更完善的 TypeScript 支持。

#### （7）Vue 数据双向绑定实现原理

`v-model` 是语法糖，等价于 `:value` 绑定 + `@input` 监听。底层依赖**响应式系统**：`Proxy`（Vue3）/`defineProperty`（Vue2）劫持数据，数据变化时更新视图，DOM 事件触发时更新数据，双向联动。

#### （8）页面 input 框输入变化这个过程中数据流程如何处理

用户输入 → 触发 `input` 事件 → 事件处理器更新响应式数据 → 触发 setter → 派发依赖通知 → 重新执行 render 生成新 VNode → diff 新旧 VNode → patch 最小化更新真实 DOM，视图刷新。

#### （9）整体来看上面这个数据流转涉及到哪些架构

核心是 **MVVM**（Model-View-ViewModel）：ViewModel 通过数据绑定连接 Model 和 View，开发者只关注数据、无需手动操作 DOM。配合**组件化**、**单向数据流**（props down / events up）、以及状态管理（Vuex/Pinia）构成整体架构。

#### （10）Vue-Router 底层是通过什么 API 进行路由跳转

+ **history 模式**：用 `history.pushState`/`replaceState` 修改 URL 不刷新，监听 `popstate` 响应前进后退。
+ **hash 模式**：用 `location.hash` 修改 `#` 后内容，监听 `hashchange` 事件。

两种模式都是拦截跳转、匹配路由后渲染对应组件，实现 SPA 无刷新切换。

#### （11）node 核心模块有哪些

+ **文件/路径**：`fs`、`path`、`os`。
+ **网络**：`http`/`https`、`net`、`dns`。
+ **通用**：`events`（EventEmitter）、`stream`、`buffer`、`crypto`、`util`。
+ **进程**：`process`、`child_process`、`cluster`、`worker_threads`。

#### （12）介绍一些对打包工具的了解

+ **Webpack**：功能全、loader/plugin 生态丰富，支持代码分割、HMR，适合复杂应用。
+ **Rollup**：基于 ESM，Tree-shaking 好、输出干净，适合打库。
+ **Vite**：开发用原生 ESM + esbuild 免打包、启动极快，生产用 Rollup 打包。
+ **esbuild**：Go 编写，构建速度极快，常作底层依赖。

#### （13）为什么 ESModule 速度会更快

ESM 是**静态结构**，`import/export` 在编译时即可确定依赖关系，因此能做**静态分析**：Tree-shaking 消除死代码、按需加载、并行请求。而 CommonJS 的 `require` 是运行时动态执行，可出现在任意位置，无法在编译期静态优化。

#### （14）场景题：如何封装一个输入联想通用组件（输入框联想出下拉筛选项）

**答题思路**：受控输入 + 防抖请求 + 下拉展示 + 键盘导航 + 选中回填。核心点：`input` 防抖（约 300ms）触发查询；请求要处理**竞态**（只采用最后一次请求结果，取消旧请求）；处理 loading、空态、错误；支持键盘上下键选择和回车确认，选中后回填并关闭下拉。

#### （15）具体说一下需要设计哪些属性

+ **数据**：`value`（受控值）、`fetch`/`dataSource`（数据源或请求函数）、`fieldNames`（自定义 label/value 字段）。
+ **行为**：`debounce`（延迟）、`minLength`（最少触发字符数）、`filterLocal`（本地或远程过滤）。
+ **交互**：`placeholder`、`loading`、`disabled`、`maxCount`。
+ **事件/插槽**：`onSearch`、`onChange`、`onSelect`、`renderItem`（自定义选项渲染）。

#### （16）拿后端数据这部分逻辑如何处理，如果掉的接口、传参等都不一样如何处理

用**依赖注入 + 适配器**思路解耦：把「请求函数」作为 prop 传入（如 `fetch: (keyword) => Promise`），组件不关心具体接口。不同响应结构用 `transform` 适配器归一化成统一格式（如 `{ label, value }`）。同时处理请求**竞态**（取消旧请求）、错误兜底和结果缓存。

#### （17）对微前端框架的了解

微前端把大型应用拆成可独立开发、部署的子应用，主应用负责路由分发和加载，解决巨石应用维护难、技术栈绑定问题。代表框架 **qiankun**（基于 single-spa，提供 JS 沙箱和样式隔离），此外还有 Module Federation、iframe 方案。价值在于技术栈无关、独立发布、增量升级。

#### （18）最近在学什么技术

**答题思路**：讲一个正在深入的方向（如 TypeScript、React 源码、性能优化、Rust/Wasm），说明**为什么学、学到什么、如何实践**，体现自驱和持续学习能力。选自己真能聊深的，别报没准备的名词。

#### （19）es6 中 static 的作用

`static` 定义类的**静态成员**，属于类本身而非实例，通过类名直接访问。常用于工具方法、工厂方法、常量、单例模式；静态方法内 `this` 指向类本身。ES 后续还支持静态属性和静态初始化块。

#### （20）说下自己的优缺点

**答题思路**：优点结合岗位举例佐证（如学习能力强、注重代码质量），别空泛。缺点讲一个**真实但可改进**的点，并说明你正在如何改善，体现自省，避免「我太追求完美」这类套路答案。

#### （21）useCallback 和 useMemo 区别

两者都用于缓存以避免每次渲染重新创建，区别在缓存对象：

+ **useMemo**：缓存**计算结果值**，`useMemo(() => compute(a), [a])`。
+ **useCallback**：缓存**函数引用**，`useCallback(fn, [deps])`，等价于 `useMemo(() => fn, [deps])`。

主要用于把稳定引用传给子组件，配合 `React.memo` 避免不必要的重渲染。

#### （22）手写题一：React 实现防抖

**答题思路**：用 `useRef` 保存定时器跨渲染持久，用 `useCallback` 保证返回函数引用稳定，触发时先清除上次定时器再重新计时。

```javascript
function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}
```

#### （23）手写题二：判断对象数组是否相等

**答题思路**：递归**深比较**——先比引用，再比类型和 key 数量，逐 key 递归。数组也是 object，可复用同一逻辑。

```javascript
function isEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every(k => isEqual(a[k], b[k]));
}
```

（注意边界：循环引用、`NaN`。）

#### （24）手写题三：数组转树状结构

**答题思路**：一次遍历建 id → 节点的 Map，再一次遍历把每个节点挂到父节点的 children 下，整体 **O(n)**。

```javascript
function arrToTree(list, rootId = null) {
  const map = new Map();
  list.forEach(item => map.set(item.id, { ...item, children: [] }));
  const tree = [];
  map.forEach(node => {
    if (node.pid === rootId) tree.push(node);
    else map.get(node.pid)?.children.push(node);
  });
  return tree;
}
```
