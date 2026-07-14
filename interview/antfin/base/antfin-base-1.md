### 面试中的问题：

### 代码题：

#### （1）非递归实现二叉树中序遍历

**答题思路**：用一个显式栈模拟递归。中序顺序是「左 → 根 → 右」，所以先沿最左路径一路压栈，弹出即访问，再转向右子树。

```javascript
function inorder(root) {
  const res = [], stack = [];
  let cur = root;
  while (cur || stack.length) {
    while (cur) {           // 一路压入左孩子
      stack.push(cur);
      cur = cur.left;
    }
    cur = stack.pop();      // 弹出即访问（根）
    res.push(cur.val);
    cur = cur.right;        // 转向右子树
  }
  return res;
}
```

时间复杂度 `O(n)`，每个节点进出栈一次。

#### （2）买卖股票的最佳时机

**答题思路**：只允许买卖一次，本质是求「后面某天卖价 − 前面某天买价」的最大差值。一次遍历维护**历史最低价** `minPrice`，用当前价减去它更新最大利润，无需回看。

```javascript
function maxProfit(prices) {
  let minPrice = Infinity, profit = 0;
  for (const p of prices) {
    minPrice = Math.min(minPrice, p);
    profit = Math.max(profit, p - minPrice);
  }
  return profit;
}
```

时间 `O(n)`、空间 `O(1)`。若允许多次买卖，则改为累加所有相邻上涨区间的差值（贪心）。

### 基础题：

#### （1）宏任务和微任务

事件循环每次执行完一个**宏任务**后，会**清空整个微任务队列**，再去渲染、取下一个宏任务。因此微任务优先级高于宏任务。

+ **宏任务**：`setTimeout`、`setInterval`、`setImmediate`、I/O、UI 渲染、整体 script。
+ **微任务**：`Promise.then/catch/finally`、`queueMicrotask`、`MutationObserver`、`process.nextTick`（Node，优先级更高）。

关键点：一个宏任务里同步代码跑完 → 掏空所有微任务（包括微任务中新产生的微任务）→ 才进入下一轮宏任务。

#### （2）箭头函数作为构造函数

箭头函数**不能**用作构造函数，`new` 它会抛 `TypeError`。原因是箭头函数没有自己的 `[[Construct]]` 内部方法，也没有 `this`、`arguments`、`prototype` 属性——它的 `this` 在定义时由外层词法作用域决定，无法被 `new` 绑定到新创建的实例上。

#### （3）浮点精度问题

JS 的 `Number` 采用 **IEEE 754 双精度浮点**，`0.1`、`0.2` 这类十进制小数无法用二进制精确表示，导致 `0.1 + 0.2 === 0.30000000000000004`。

+ **判等**：用误差容忍 `Math.abs(a - b) < Number.EPSILON`。
+ **展示/计算**：`toFixed` 四舍五入，或先放大成整数运算再缩小，或用 `decimal.js`、`big.js` 等高精度库。

#### （4）原型链

每个对象都有内部属性 `[[Prototype]]`（`__proto__`），指向其构造函数的 `prototype`。访问属性时若自身没有，就沿着 `[[Prototype]]` 逐级向上查找，形成**原型链**，直到 `Object.prototype`，其上一层为 `null`——这就是链的尽头。它是 JS 实现继承与属性共享的核心机制。

#### （5）for in 与原型链

`for...in` 会遍历对象自身以及**原型链上所有可枚举**（enumerable）的属性。因此遍历时常需要 `Object.hasOwnProperty.call(obj, key)` 过滤掉继承来的属性。若只想要自身可枚举属性，用 `Object.keys()` 更安全。

#### （6）浏览器跨域限制

跨域限制源于浏览器的**同源策略**（协议、域名、端口任一不同即跨域），用来防止恶意站点读取其他站点数据。常见解决方案：

+ **CORS**：服务端返回 `Access-Control-Allow-Origin` 等响应头，最标准的方案。
+ **代理**：开发用 devServer 代理、生产用 Nginx 反向代理，绕过浏览器限制。
+ **JSONP**：利用 `<script>` 不受限制，仅支持 GET。
+ 其他：`postMessage`、WebSocket 等。

#### （7）JSONP

JSONP 利用 `<script>` 标签的 `src` 不受同源策略限制的特性实现跨域：前端定义一个回调函数，服务端把数据包在 `callback(data)` 的形式返回，脚本加载后即调用该回调。**缺点**：只支持 GET，安全性差（易受 XSS、CSRF），且需服务端配合，现已基本被 CORS 取代。

#### （8）跨域请求的拒绝

跨域请求实际上**已经发出并到达服务器**，服务器也返回了响应；是**浏览器**根据同源策略检查响应头（缺少合法的 `Access-Control-Allow-Origin`），拦截了 JS 对响应内容的读取。所以是浏览器拒绝，而非服务器；也因此 CSRF 类攻击中请求仍可能对服务端产生副作用。

#### （9）HTTP OPTIONS请求

`OPTIONS` 用于探测服务器对某资源支持的能力。在 CORS 中，对于**非简单请求**（自定义头、`PUT/DELETE`、`application/json` 等），浏览器会先自动发一个 `OPTIONS` **预检请求**，携带 `Access-Control-Request-Method/Headers`，服务器用 `Access-Control-Allow-*` 响应确认后，才发真正的请求。

#### （10）HTTP请求方法

常用方法及语义：

+ **GET**：获取资源，安全、幂等。
+ **POST**：提交数据，非幂等。
+ **PUT**：整体替换资源，幂等。
+ **PATCH**：局部更新资源。
+ **DELETE**：删除资源，幂等。
+ **HEAD**：只取响应头；**OPTIONS**：查询支持的方法/预检。

#### （11）POST与GET的区别

+ **语义**：GET 取数据（安全、幂等、可缓存），POST 提交数据（非幂等，一般不缓存）。
+ **参数位置**：GET 参数在 URL query 里，POST 在请求体中。
+ **长度**：GET 受 URL 长度限制（浏览器/服务器约束），POST 理论无限制。
+ **补充**：非简单的 POST 会触发 CORS 预检；GET 参数暴露在 URL 更不适合敏感数据。

#### （12）React Fiber

Fiber 是 React 16 重写的**协调（reconciliation）架构**。它把原本递归、不可中断的虚拟 DOM 对比，拆成一个个 fiber 节点组成的链表结构，使渲染工作可以**分片、可中断、可恢复、可复用**。这让 React 能在浏览器空闲时间分批处理，避免长任务阻塞主线程，是并发特性（时间切片、优先级调度）的基础。

#### （13）React任务调度

React 内部维护**优先级调度器**（Scheduler）。更新按优先级（如用户输入 > 数据请求 > 离屏渲染）排队，Fiber 架构在 render 阶段把工作切成小单元，每处理一段就检查是否还有剩余时间/更高优先级任务；高优先级任务可打断低优先级渲染，保证交互响应流畅。

#### （14）浏览器剩余空间时间

React 需要知道当前帧还剩多少空闲时间来决定是否继续渲染。理念上类似 `requestIdleCallback`（回调参数 `deadline.timeRemaining()`），但因其兼容性与触发时机问题，React 自己基于 `MessageChannel` 实现了调度：每帧预留约 5ms 时间片，用完就让出主线程给浏览器绘制，下一轮再继续。

#### （15）requestAnimationFrame

`requestAnimationFrame` 在浏览器**下一次重绘前**执行回调，频率与屏幕刷新率一致（通常 60fps，约 16.6ms 一次），能避免掉帧和撕裂。相比 `setTimeout` 做动画更平滑、更省电（页面不可见时自动暂停）。适合逐帧动画、滚动等视觉更新。

#### （16）React合成事件

合成事件（SyntheticEvent）是 React 对原生事件的**跨浏览器封装**。React 17 前统一委托到 `document`、17 起委托到 **根容器**，通过事件冒泡在顶层做一次监听并分发，减少了大量 DOM 事件绑定、抹平浏览器差异，并可复用事件对象。注意其触发时机、`e.stopPropagation` 与原生事件混用时的差异。

#### （17）高阶组件（HOC）

HOC 是**参数为组件、返回值为增强后新组件**的函数（`const Enhanced = withX(Comp)`），用于跨组件复用逻辑，如权限校验、数据注入、埋点。它不修改原组件，属于组合模式。**注意点**：透传 props、复制静态方法、不在 render 中创建 HOC。现在很多场景已被 **自定义 Hook** 替代，逻辑复用更直接。

#### （18）useEffect、useState使用限制

Hooks 必须在**函数组件（或自定义 Hook）的顶层**调用，不能放在条件、循环、嵌套函数里。原因是 React 靠**调用顺序**把每次渲染的 Hook 与其内部状态一一对应；顺序一旦变化，状态就会错位。此外只能在 React 函数组件里调用，不能在普通函数中用（这两条由 `eslint-plugin-react-hooks` 强制约束）。

#### （19）微前端

微前端把大型前端应用按业务拆成多个**可独立开发、独立部署、技术栈无关**的子应用，由主应用（基座）在运行时集成。常见方案：`qiankun`（基于 single-spa，JS 沙箱 + 样式隔离）、`Module Federation`（Webpack5 模块共享）、`iframe`。**核心难点**：应用隔离（JS/CSS）、通信、路由与公共依赖共享。
