### 面试中的问题：

#### （1）自我介绍

**答题思路**：用 1 分钟讲清「你是谁 + 技术亮点 + 为什么匹配」。建议结构：教育背景 → 最拿得出手的 1~2 个项目及你的角色与量化产出 → 熟悉的技术栈 → 想来该岗位的原因。多用与 JD 相关的关键词，避免流水账。

#### （2）为什么选择前端？

**答题思路**：给出真实且能自圆其说的动机，避免空谈「兴趣」。可从三点组织：**即时反馈**（代码改动能直接看到界面变化，正反馈强）、**贴近用户**（直接决定用户体验，工程与设计结合）、**技术栈广度**（从 JS/浏览器原理到工程化、性能、Node 全栈都有纵深）。最后落到自己做过的一个具体项目印证。

#### （3）讲一下SpringBoot启动原理，包括Bean的初始化？

启动入口是 `SpringApplication.run()`，核心流程：**（1）** 创建 `ApplicationContext`（Web 项目为 `AnnotationConfigServletWebServerApplicationContext`）；**（2）** 通过 `@SpringBootApplication` 中的 `@EnableAutoConfiguration` 读取 `META-INF/spring.factories`（2.7+ 为 `AutoConfiguration.imports`）完成**自动配置**，配合 `@Conditional` 条件装配；**（3）** `refresh()` 阶段扫描并注册 BeanDefinition。

Bean 初始化：实例化（构造）→ 属性填充/依赖注入 → `Aware` 回调 → `BeanPostProcessor` 前置处理 → `@PostConstruct` / `InitializingBean.afterPropertiesSet` / init-method → 后置处理（AOP 代理常在此织入）→ Bean 就绪。单例 Bean 默认在容器启动时预初始化。

#### （4）前端路由的几种方式，hash的本质作用是什么？

+ **Hash 模式**：利用 URL 中 `#` 后的部分，通过 `hashchange` 事件监听变化。**本质**：`#` 后内容不会发送到服务器、改变它不会触发页面刷新，浏览器仅更新历史记录，因此可用来在纯前端切换视图；无需服务端配置。
+ **History 模式**：基于 `history.pushState / replaceState` 修改 URL 且不刷新，配合 `popstate` 监听。URL 更干净，但刷新时会真实请求该路径，**需要服务端把所有路由回退到 index.html**。

#### （5）如何实现列表跳到详情，再到列表，不刷新页面？

核心是**用前端路由做 SPA 内切换**而非整页跳转，并**保留列表状态**：

+ 用 `router.push` 跳详情，返回时用 `router.back()`，避免 `<a>` 整页刷新。
+ 列表组件用 **keep-alive 缓存**，返回时复用实例，保留滚动位置、分页、筛选条件。
+ 或把列表数据/滚动位置提升到状态管理（Vuex/Pinia）或路由 meta 中，返回时恢复。

#### （6）keep-alive是基于什么做缓存的？

`keep-alive` 是 Vue 内置的**抽象组件**，缓存的是**组件实例（vnode）而非 DOM**。内部维护一个 `cache` 对象和 `keys` 数组，以组件的 `key`（或 name）为键缓存 vnode，命中时直接复用，未命中时按 **LRU** 策略淘汰（受 `max` 限制）。被缓存组件不会走销毁/重建，而是触发 `activated` / `deactivated` 生命周期。可用 `include` / `exclude` 控制缓存范围。

#### （7）除了rbac，权限管理还有哪些方式？

+ **ACL（访问控制列表）**：直接给「用户—资源」配权限，粒度细但规模大时难维护。
+ **RBAC（基于角色）**：用户→角色→权限，最常用。
+ **ABAC（基于属性）**：根据用户属性、资源属性、环境（时间/IP）动态计算权限，灵活但规则复杂。
+ **PBAC / 策略式**：以策略语言（如 OPA/Rego）集中描述规则。
+ **DAC / MAC**：自主访问控制（资源属主授权）与强制访问控制（按安全等级，多用于操作系统/军政系统）。

#### （8）如何将excel中的信息放入MySQL？

**答题思路**：分「解析 → 清洗 → 入库」三步。**（1）解析**：前端可用 SheetJS（xlsx）读取，或后端用 Apache POI / EasyExcel 流式读取（大文件避免一次性加载）。**（2）清洗**：校验必填、类型转换、去重、处理空值与格式。**（3）入库**：拼装成对象后**批量插入**（`INSERT ... VALUES (...),(...)` 或 MyBatis batch），大数据量分批提交并用事务保证一致性；失败行记录并返回报告。

#### （9）前端响应式方式有哪几种，以及优缺点？

这里指响应式布局：

+ **媒体查询（@media）**：按断点切换样式，控制力强；缺点是断点多时代码分散。
+ **百分比 %**：相对父元素，简单但不同属性参照物不一致易混乱。
+ **rem**：相对根字号，配合 JS/媒体查询动态改 `html` 字号可整体缩放；需要额外脚本。
+ **vw/vh**：相对视口，天然自适应，无需 JS；老浏览器兼容性差、极端尺寸下字号可能过大过小。
+ **flex / grid**：弹性/网格布局，处理对齐与空间分配最优，现代首选。

实际常组合使用（如 flex 布局 + vw/rem 字号 + 媒体查询微调）。

#### （10）介绍一下rem和em。

+ **em**：相对**当前元素**的 `font-size`（用于 `font-size` 时相对父元素字号），会**层层继承叠加**，嵌套时容易累积失控。
+ **rem**：相对**根元素 `html`** 的 `font-size`，不受父级影响，计算稳定，常用于移动端整体等比缩放（改 `html` 字号即可全局缩放）。

#### （11）什么是物理尺寸，什么是逻辑像素？px是物理像素还是逻辑像素？

+ **物理像素（设备像素）**：屏幕上真实的发光点，是硬件固有的。
+ **逻辑像素（CSS 像素 / 设备无关像素）**：CSS 中使用的抽象单位，与物理像素的比值由 **DPR（devicePixelRatio）** 决定，如 DPR=2 时 1 个 CSS px 对应 2×2 个物理像素。
+ **CSS 中的 `px` 是逻辑像素**，不是物理像素。这也是为什么高清屏下 1px 细线要用 transform scale 或 0.5px 处理。

#### （12）谈谈es学习的新内容，比如const、let、proxy、数组api。

+ **let / const**：块级作用域、不存在变量提升（有暂时性死区 TDZ）、不可重复声明；`const` 声明后引用不可变（对象内部仍可改）。
+ **Proxy**：拦截对象的基本操作（get/set/has/deleteProperty 等），是 Vue3 响应式的基础。
+ **数组 API**：`map/filter/reduce/find/findIndex/includes/flat/flatMap`、`Array.from`、`Array.of` 等，更函数式、可读性更好。
+ 其它常用：**解构赋值、模板字符串、箭头函数、Promise/async-await、Set/Map、可选链 `?.`、空值合并 `??`**。

#### （13）在es5没有const，如何实现const，实现常量不可变？

**答题思路**：用 `Object.defineProperty` 把属性设为不可写、不可配置，即可模拟常量。

```javascript
function defineConst(obj, key, value) {
  Object.defineProperty(obj, key, {
    value,
    writable: false,     // 不可修改
    enumerable: true,
    configurable: false, // 不可删除/重定义
  });
}
defineConst(window, 'PI', 3.14);
// PI = 4 静默失败（严格模式下抛错）
```

注意这只能保证引用不可变；若值是对象，其内部属性仍可改，需要 `Object.freeze` 做浅冻结。

#### （14）object.defineProproty和proxy的区别？

+ **拦截范围**：`defineProperty` 只能劫持**已存在的属性**的 get/set，新增/删除属性无法感知；`Proxy` 代理**整个对象**，能拦截 get/set/has/deleteProperty 等 13 种操作，天然支持新增删除。
+ **数组**：`defineProperty` 对数组下标和 length 变化处理困难（Vue2 需重写数组方法）；`Proxy` 可直接监听。
+ **性能与惰性**：`Proxy` 无需初始化时递归遍历所有属性，可在访问时惰性代理。
+ **兼容性**：`Proxy` 不支持 IE 且无法 polyfill，`defineProperty` 兼容性更好。这也是 Vue2→Vue3 响应式方案变化的原因。

#### （15）object.defineProproty中除了set get还有哪些可配置的属性？

一个属性描述符分两类，不能混用：

+ **数据描述符**：`value`（属性值）、`writable`（是否可写）。
+ **存取描述符**：`get`、`set`。
+ **两类共有**：`enumerable`（是否可枚举，影响 `for...in`/`Object.keys`）、`configurable`（是否可删除或再次修改描述符）。

`writable/enumerable/configurable` 默认都是 `false`。

#### （16）js的迭代器是如何设计的？js中string是可迭代的吗？

迭代器是**遵循迭代器协议的对象**：具有 `next()` 方法，每次返回 `{ value, done }`。一个对象若实现了 **`Symbol.iterator`** 方法（返回一个迭代器），就是**可迭代对象**，可用于 `for...of`、扩展运算符、解构。

**String 是可迭代的**，它内置了 `Symbol.iterator`，并且**按 Unicode 码点遍历**（能正确处理 emoji 等代理对，而非按 UTF-16 单元），`[...'𝒳a']` 得到两个元素。

#### （17）es6有Map，map和{}有什么区别？如何实现自己的map，让key是任意类型？

**Map vs 对象**：

+ Map 的 **key 可以是任意类型**（对象、函数），对象的 key 只能是 string/symbol。
+ Map 保持**插入顺序**，有 `size` 属性，增删查性能更优，且不受原型链污染。
+ Map 可直接迭代（`for...of`、`entries()`）。

**用数组模拟任意 key 的 map**（利用全等比较存 key/value 对）：

```javascript
class MyMap {
  constructor() { this.items = []; }
  set(key, val) {
    const item = this.items.find(i => i.key === key);
    item ? (item.val = val) : this.items.push({ key, val });
    return this;
  }
  get(key) { return this.items.find(i => i.key === key)?.val; }
  has(key) { return this.items.some(i => i.key === key); }
}
```

#### （18）两个鸡蛋，100层楼，找到鸡蛋临界楼层，最少的次数找到临界摔碎点？

**答题思路**：目标是**最坏情况下次数最少**。设第一个鸡蛋第一次从第 `x` 层扔，之后每次递减 1 层（x, x+(x-1), x+(x-1)+(x-2)…），保证无论在哪一段摔碎，总次数都不超过 `x`。要覆盖 100 层需 `x + (x-1) + ... + 1 ≥ 100`，即 `x(x+1)/2 ≥ 100`，解得 **x = 14**。

策略：第一个蛋从 14、27、39… 层扔，碎了则用第二个蛋从上一区间底部**逐层线性**上探。最坏 **14 次**。

#### （19）代码优雅地求解表达式：1+23+6(4+5)，考虑优先级和括号。

**答题思路**：标准做法是**中缀转求值**——用「双栈（数字栈 + 运算符栈）」或「调度场算法」处理优先级和括号，遇到 `(` 入栈、`)` 时回退计算，遇到运算符时先算完优先级 ≥ 它的。

```javascript
function calc(s) {
  const nums = [], ops = [];
  const prio = { '+': 1, '-': 1, '*': 2, '/': 2 };
  const apply = () => {
    const b = nums.pop(), a = nums.pop(), op = ops.pop();
    nums.push(op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b);
  };
  s = s.replace(/\s/g, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (/\d/.test(c)) {
      let n = 0;
      while (i < s.length && /\d/.test(s[i])) n = n * 10 + +s[i++];
      i--; nums.push(n);
    } else if (c === '(') ops.push(c);
    else if (c === ')') { while (ops.at(-1) !== '(') apply(); ops.pop(); }
    else { while (ops.length && prio[ops.at(-1)] >= prio[c]) apply(); ops.push(c); }
  }
  while (ops.length) apply();
  return nums[0];
}
```

（题中 `6(4+5)` 若表示乘法，需先做预处理补上 `*`。）

#### （20）实习期限和对实习岗位的了解。

**答题思路**：诚实说明**可实习时长与到岗时间**（企业通常要求每周 4~5 天、连续 3 个月以上、能转正优先）。对岗位的了解可结合 JD 讲：团队做什么业务、用什么技术栈、这个岗位承担的职责，以及你的技能如何匹配，表现出提前做过功课和长期投入的意愿。

#### （21）对前端职业发展的广度与深度是否有足够的心态和时间去学习？

**答题思路**：这是考察**学习主动性和抗压/持续投入的心态**。可回答：认可前端技术更新快、既要广度（工程化、性能、跨端、Node）也要深度（浏览器/JS 引擎/框架原理），并用**具体行动**佐证——比如平时如何持续学习（读源码、写博客、做项目、跟进新标准），以及愿意投入业余时间。突出「持续成长」而非空表决心。
