### 面试中的问题：

#### （1）JavaScript的数据类型及判断方法

+ **7 种原始类型**：`string`、`number`、`boolean`、`undefined`、`null`、`symbol`、`bigint`；**1 种引用类型** `object`（含数组、函数等）。
+ **`typeof`**：适合判断原始类型，但有两个坑——`typeof null === 'object'`（历史遗留 bug），无法区分数组/对象/null。
+ **`instanceof`**：判断对象是否在某构造函数的原型链上，能区分数组，但跨 iframe 会失效，且对原始值无效。
+ **最可靠**：`Object.prototype.toString.call(x)`，返回 `"[object Type]"`，能精准区分数组、null、Date、RegExp 等所有类型。判断数组也可直接用 `Array.isArray()`。

#### （2）原型、原型链和继承的概念

+ **原型（prototype）**：每个函数都有 `prototype` 对象，每个实例都有 `__proto__`（`[[Prototype]]`）指向其构造函数的 `prototype`。
+ **原型链**：访问对象属性时，自身没有就沿 `__proto__` 逐级向上查找，直到 `Object.prototype`（其 `__proto__` 为 `null`）。这条链就是原型链，也是继承和属性共享的基础。
+ **继承实现**：ES5 常用**寄生组合继承**（`Child.prototype = Object.create(Parent.prototype)` + 构造函数内 `Parent.call(this)`），避免原型继承共享引用和组合继承调用两次父构造的问题；ES6 用 `class` + `extends` + `super`，本质仍是原型链，是语法糖。

#### （3）JavaScript的作用域和变量声明

+ **var**：**函数作用域**，存在**变量提升**（声明提到作用域顶部，值为 `undefined`），可重复声明，会挂到全局对象上（全局声明时）。
+ **let / const**：**块级作用域**（`{}` 内有效），有**暂时性死区（TDZ）**——声明前访问报错，不能重复声明。`const` 声明时必须初始化且不可重新赋值（但对象内部属性可变）。
+ **作用域链**：查找变量时从当前作用域逐层向外找到全局，闭包正是靠作用域链持有外层变量。
+ 实践建议：优先 `const`，需要重新赋值用 `let`，避免用 `var`。

#### （4）setTimeout和Promise的执行结果

经典题：`for` 循环里 `setTimeout` 打印。

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i)); // 输出 3 3 3
}
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i)); // 输出 0 1 2
}
```

+ **原因**：`var` 是函数作用域，三个回调共享**同一个** `i`，循环结束时 `i` 已是 3，异步回调执行时读到的都是 3。`let` 每轮迭代创建**独立的块级绑定**，各自捕获当轮的值。
+ **var 修复**：用 IIFE 或 `setTimeout(fn, 0, i)` 传参把当前值固化。
+ **执行顺序**：同步代码 → 微任务（Promise.then）→ 宏任务（setTimeout）。所以 Promise 回调总先于 setTimeout 执行。

#### （5）ES6新特性及其应用

+ **常用特性**：`let/const`、箭头函数（无自身 `this`、不能作构造函数）、模板字符串、解构赋值、默认参数、扩展/剩余运算符 `...`、`class`、`Map/Set`、`Symbol`、模块化 `import/export`、`Promise`。
+ **异步演进**：`Promise` 用链式 `then` 解决回调地狱，但仍需嵌套；`Generator`（`function*` + `yield`）可暂停/恢复执行，配合执行器实现异步流程控制；**`async/await` 是 Generator + Promise 的语法糖**，用同步写法写异步，`await` 后跟 Promise，配 `try/catch` 捕获错误，是目前最推荐的异步方案。

#### （6）浏览器的事件循环机制

JS 是单线程，靠事件循环（Event Loop）处理异步。执行栈清空后，会先清空**微任务队列**，再取**一个宏任务**执行，如此循环。

+ **宏任务（macrotask）**：`setTimeout`、`setInterval`、I/O、UI 事件、`requestAnimationFrame`（渲染前）。
+ **微任务（microtask）**：`Promise.then/catch/finally`、`queueMicrotask`、`MutationObserver`。
+ **关键规则**：每执行完一个宏任务，就**清空所有微任务**（包括微任务中新产生的微任务），再进入下一轮，其间穿插渲染。所以微任务永远优先于下一个宏任务。
+ 顺序口诀：同步 → 微任务 → 渲染 → 宏任务。

#### （7）数组扁平化问题

**答题思路**：把多层嵌套数组转成一维。最简用原生 `arr.flat(Infinity)`；手写常见递归和 `reduce` 两种。

```javascript
// 递归
function flatten(arr) {
  return arr.reduce(
    (res, item) =>
      res.concat(Array.isArray(item) ? flatten(item) : item),
    []
  );
}
// 迭代（用栈，避免深层递归爆栈）
function flattenStack(arr) {
  const stack = [...arr];
  const res = [];
  while (stack.length) {
    const next = stack.pop();
    if (Array.isArray(next)) stack.push(...next);
    else res.unshift(next);
  }
  return res;
}
```

#### （8）CSS布局方式和BFC的理解

+ **常见布局**：普通文档流、`float` 浮动、`position` 定位、**Flex**（一维弹性布局）、**Grid**（二维网格布局）。响应式还有百分比、`rem/vw`、媒体查询。
+ **BFC（块级格式化上下文）**：一个独立的渲染区域，内部布局不影响外部。**触发条件**：`overflow` 非 `visible`、`float` 非 `none`、`position: absolute/fixed`、`display: inline-block/flex/grid/table-cell` 等。
+ **BFC 作用**：① 清除浮动（父元素触发 BFC 可包含浮动子元素，撑开高度）；② 阻止 `margin` 重叠；③ 让元素不被浮动元素覆盖（两栏自适应布局）。

#### （9）二叉树的中序遍历和数据结构的应用

**中序遍历**顺序：左 → 根 → 右（对二叉搜索树可得升序序列）。

```javascript
// 递归
function inorder(root, res = []) {
  if (!root) return res;
  inorder(root.left, res);
  res.push(root.val);
  inorder(root.right, res);
  return res;
}
// 迭代（用栈）
function inorderStack(root) {
  const res = [], stack = [];
  let cur = root;
  while (cur || stack.length) {
    while (cur) { stack.push(cur); cur = cur.left; }
    cur = stack.pop();
    res.push(cur.val);
    cur = cur.right;
  }
  return res;
}
```

+ **栈（LIFO）**：后进先出，用于 DFS、递归调用栈、括号匹配、撤销操作。
+ **队列（FIFO）**：先进先出，用于 BFS（二叉树层序遍历）、任务调度、消息缓冲。中序迭代用栈模拟递归，层序遍历则用队列。

#### （10）手动实现数组的filter和reduce方法

**答题思路**：`filter` 遍历数组，回调返回真值的元素收集进新数组；`reduce` 维护累加器，遍历时用回调把当前值合并进累加器，注意**初始值缺省时取第一个元素**。

```javascript
Array.prototype.myFilter = function (fn, thisArg) {
  const res = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this && fn.call(thisArg, this[i], i, this)) {
      res.push(this[i]);
    }
  }
  return res;
};

Array.prototype.myReduce = function (fn, initial) {
  let acc = initial;
  let start = 0;
  if (arguments.length < 2) {       // 无初始值
    if (this.length === 0) throw new TypeError('Reduce of empty array with no initial value');
    acc = this[0];
    start = 1;
  }
  for (let i = start; i < this.length; i++) {
    acc = fn(acc, this[i], i, this);
  }
  return acc;
};
```

#### （11）浏览器的存储机制

+ **Cookie**：约 4KB，随同域请求**自动带到服务端**，可设过期时间，主要用于登录态；可加 `HttpOnly`/`Secure`/`SameSite` 增强安全。
+ **localStorage**：约 5~10MB，**持久**保存（手动清除才没），同源共享，纯客户端不随请求发送。
+ **sessionStorage**：容量同上，**会话级**，关闭标签页即清空，且不跨标签页。
+ **IndexedDB**：浏览器内置的**异步事务型数据库**，容量大（可上百 MB），支持结构化数据、索引和事务，适合离线应用、大量数据缓存。
+ 补充：还有 Cache Storage（配合 Service Worker 做离线缓存）。选型看数据量、生命周期和是否需服务端感知。
