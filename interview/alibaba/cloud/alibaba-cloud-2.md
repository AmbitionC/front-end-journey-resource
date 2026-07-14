### 面试中的问题：

#### （1）实习里印象深刻的项目

**答题思路**：用 **STAR** 结构讲一个项目——背景（Situation）、你的任务（Task）、你具体做了什么（Action）、量化结果（Result）。突出你**独立负责**或**攻克难点**的部分，给出可量化产出（性能提升 X%、覆盖 N 个页面）。选「有技术深度且你能答得住细节」的项目，因为面试官接下来会顺着追问。

#### （2）对着项目猛猛问

**答题思路**：面试官会顺着简历深挖，考察真实性和技术深度。提前准备：**技术选型的理由**（为什么用这个方案而非另一个）、**难点及解决过程**、**数据指标**、**你个人的贡献边界**。对每个技术名词都要能往下讲两层，避免只会背概念。不清楚的地方坦诚说「这块由同事负责，我了解到的是……」，别硬编。

#### （3）虚拟滚动列表实现思路

核心思想：**只渲染可视区域内的少量 DOM**，滚动时动态替换内容，而不是把上万条数据全渲染出来。

+ **（1）计算可视区**：根据容器高度和单项高度算出可见条数，加上下缓冲区（buffer）。
+ **（2）算起止索引**：`startIndex = Math.floor(scrollTop / itemHeight)`，取 `startIndex ~ startIndex + visibleCount` 这段数据渲染。
+ **（3）撑高度 + 偏移**：外层用一个总高度 `total * itemHeight` 的占位元素撑出正确的滚动条；列表用 `transform: translateY(startIndex * itemHeight)` 定位到正确位置。

不定高场景需**动态测量**每项高度并缓存偏移量（可结合 `IntersectionObserver`）。收益：DOM 数量从 O(n) 降到 O(可视数)，滚动流畅、内存占用低。

#### （4）介绍 React 常用 Hook

+ **useState**：给函数组件加状态，返回 `[值, setter]`，setter 触发重渲染。
+ **useEffect**：处理副作用（请求、订阅、DOM 操作），靠依赖数组控制执行时机，返回的函数用于清理。
+ **useContext**：跨层级读取 Context，避免 props 逐层传递。
+ **useRef**：保存跨渲染不变的可变引用，或获取 DOM 节点；改 `.current` 不触发重渲染。
+ **useMemo / useCallback**：缓存计算结果 / 函数引用，避免不必要的重复计算和子组件重渲染。
+ **useReducer**：状态逻辑复杂时替代 useState，用 reducer 集中管理。

#### （5）React 函数式组件相较于类组件的优势

+ **更简洁**：没有 `this` 指向问题，不需要 `bind`，代码量更少。
+ **逻辑复用更好**：用自定义 Hook 抽取和组合逻辑，取代类时代的 HOC / render props 嵌套地狱。
+ **关注点聚合**：`useEffect` 把「一次副作用的建立和清理」写在一起，而类组件要分散在 `componentDidMount` / `componentWillUnmount`。
+ **更贴合未来**：React 新特性（Hooks、并发特性）主要面向函数组件，是官方推荐写法。

#### （6）React 组件间通信方式，ref怎么用

**通信方式**：

+ **父传子**：props 向下传递。
+ **子传父**：父传入回调函数，子组件调用回调把数据传上去。
+ **跨层级**：Context（`useContext`）避免逐层透传。
+ **兄弟/全局**：状态提升到共同父组件，或用状态管理库（Redux/Zustand）、事件总线。

**ref 用法**：`useRef` 创建，绑到 DOM 元素上可直接访问节点（如聚焦、测量尺寸）；要拿子组件实例或让父组件调用子组件方法，用 `forwardRef` 转发 ref，配合 `useImperativeHandle` 暴露指定方法。

```jsx
const inputRef = useRef(null);
// <input ref={inputRef} />
inputRef.current.focus();
```

#### （7）实习时间

**答题思路**：这是考察**可入职时长和稳定性**（尤其能否满足实习转正或最低出勤要求）。如实说明起止时间、每周可到岗天数、能否长期实习。若能长期、稳定出勤是加分项，正面表达意愿即可。

#### （8）题目一：数组打平

**答题思路**：递归遍历，遇到数组元素就继续展开，否则收集到结果里；也可以用 reduce 简写，或用栈迭代避免深层递归爆栈。

```javascript
// 递归
function flatten(arr) {
  return arr.reduce(
    (res, item) => res.concat(Array.isArray(item) ? flatten(item) : item),
    []
  );
}

// 迭代（栈），可控制展开深度
function flattenIter(arr) {
  const stack = [...arr];
  const res = [];
  while (stack.length) {
    const next = stack.pop();
    Array.isArray(next) ? stack.push(...next) : res.unshift(next);
  }
  return res;
}
// 原生：arr.flat(Infinity)
```

#### （9）题目二：设计存储页面/组件内数据和方法的 JSON 格式，并从 JSON 格式转为页面代码

**答题思路**：这是**低代码/schema 渲染**的经典题。用一棵**组件树 JSON** 描述页面：每个节点含 `type`（组件类型）、`props`（属性）、`children`（子节点数组）；数据放 `state`，方法用字符串或引用挂在 `methods` 上，事件在 props 里以 `onXxx` 关联方法名。转换时**递归遍历**这棵树生成对应组件。

```javascript
const schema = {
  type: "div",
  props: { className: "card" },
  children: [
    { type: "button", props: { onClick: "handleClick" }, children: ["提交"] },
  ],
};

function render(node, ctx) {
  if (typeof node === "string") return node; // 文本节点
  const { type, props = {}, children = [] } = node;
  const realProps = {};
  for (const k in props) {
    // 事件名映射到真实方法
    realProps[k] = k.startsWith("on") ? ctx.methods[props[k]] : props[k];
  }
  return React.createElement(type, realProps, ...children.map((c) => render(c, ctx)));
}
```

关键点：**递归渲染**、事件名到方法的映射、以及自定义组件通过 type 到组件的映射表解析。

#### （10）题目三：简单的发布-订阅模式

**答题思路**：内部维护一个 `事件名 -> 回调数组` 的映射。`on` 注册、`emit` 遍历触发、`off` 移除、`once` 包一层用完自删。

```javascript
class EventEmitter {
  constructor() {
    this.events = {};
  }
  on(type, cb) {
    (this.events[type] ||= []).push(cb);
    return this;
  }
  emit(type, ...args) {
    (this.events[type] || []).forEach((cb) => cb(...args));
  }
  off(type, cb) {
    if (!this.events[type]) return;
    this.events[type] = this.events[type].filter((fn) => fn !== cb);
  }
  once(type, cb) {
    const wrap = (...args) => {
      cb(...args);
      this.off(type, wrap);
    };
    this.on(type, wrap);
  }
}
```

#### （11）遇到过项目中最难的点

**答题思路**：选一个**有技术含量、你主导解决**的难点，按「问题是什么 → 为什么难 → 你怎么排查/尝试了哪些方案 → 最终方案和效果」讲。重点展现**分析和权衡的过程**（而非结果），体现定位问题、查资料、对比方案的能力。避免选纯环境配置类的琐碎问题。

#### （12）写过最复杂的页面

**答题思路**：讲清「复杂在哪」——是**交互复杂**（大量状态联动、拖拽、可视化）、**数据复杂**（多接口聚合、实时更新）还是**性能压力**（长列表、大表单）。说明你如何拆解：组件划分、状态管理方案、性能优化手段。落点在你如何把复杂问题**结构化拆解并落地**。

#### （13）跨表单数据同步怎么做

核心是让多个表单**共享同一份状态源**，避免各自维护副本导致不一致。

+ **状态提升**：把共享字段提到共同父组件，通过 props 下发、回调上收。
+ **全局状态**：用 Context 或状态管理库（Redux/Zustand/Jotai）做单一数据源，各表单订阅同一字段。
+ **表单库联动**：如 Formily/rc-field-form，用统一的 form store 管理，字段间通过依赖/联动规则响应式更新。
+ **注意点**：受控组件保证「数据即视图」；跨表单频繁同步时对更新做**防抖**，避免输入卡顿和循环更新。

#### （14）设计组件的思路

+ **单一职责与粒度**：一个组件只做一件事，区分**展示型**（无状态、纯 props）和**容器型**（管数据逻辑）。
+ **API 设计**：props 清晰、命名语义化、给合理默认值；受控/非受控要想清楚；事件用 `onXxx` 回调暴露。
+ **可复用与可扩展**：用 `children` / slot、`render props` 或组合模式支持定制，避免写死。
+ **状态归属**：能内聚就内聚，需要共享才提升；关注**受控 vs 非受控**的取舍。
+ **健壮性**：处理边界（空数据、loading、error）、可访问性（a11y）、样式隔离。

#### （15）项目中大规模使用的组件更新流程

被很多地方引用的公共组件，改动要**可控、可回滚、不破坏存量**。

+ **版本化发布**：组件独立成包，遵循 **semver**（破坏性改动升 major），业务侧锁定版本按需升级。
+ **向后兼容**：新增能力用可选 props + 默认值；要废弃旧 API 先标 `deprecated` 保留过渡期，再移除。
+ **质量保障**：单元测试 + 快照/视觉回归测试，配合 Storybook 展示各状态。
+ **灰度与回滚**：先在小范围试点，出问题能快速回退到上一版本；变更配 changelog 通知使用方。

#### （16）对大语言模型的了解

LLM 基于 **Transformer** 架构，核心是**自注意力机制**，通过海量文本预训练学习语言规律，本质是**根据上下文预测下一个 token**。经指令微调（SFT）和人类反馈强化学习（RLHF）后能对齐人类意图。

**前端相关应用**：

+ **研发提效**：AI 代码补全、组件/低代码生成、自动写单测。
+ **产品能力**：智能客服、内容生成、语义搜索；前端通过流式接口（SSE）渲染逐字输出。
+ **注意点**：存在**幻觉**、上下文长度限制、时延和成本；关键结果需校验，可用 RAG 补充实时/私域知识。

#### （17）平时怎么学前端

**答题思路**：展现**主动、成体系的学习习惯**。可讲：读官方文档和规范（MDN、框架源码）打基础、通过做项目/复现造轮子加深理解、看优质博客和技术社区（GitHub、掘金、MDN）跟进动态、遇到问题深挖原理而非只搜答案。举一个「从不懂到搞懂某个知识点」的具体例子最有说服力。

#### （18）最近印象比较深的新技术

**答题思路**：选一个你**真正了解、能展开讲**的方向，说清它解决了什么问题、原理和你的看法。前端可选：React Server Components / 新一代构建工具（Vite、Turbopack）/ 信号（Signals）响应式 / AI 辅助编程与低代码 / WebAssembly 等。关键是有自己的思考，而非只报名词——讲讲它相比旧方案好在哪、局限在哪。
