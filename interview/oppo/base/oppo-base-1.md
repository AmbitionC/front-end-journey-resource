### 面试中的问题：

#### （1）项目里响应式布局怎么做的

响应式的核心是让页面适配不同屏幕尺寸。常用手段：

+ **媒体查询**：`@media` 按断点切换布局与样式。
+ **弹性单位**：`%`、`vw/vh`、`rem`（配合根字号）、`clamp()` 做流式缩放。
+ **弹性布局**：Flexbox 一维、Grid 二维自适应排布（`auto-fit`/`minmax`）。
+ **配套**：`<meta viewport>` 开启移动端缩放、图片 `srcset` 响应式、移动优先编写。

#### （2）计算机中的基本数据类型有哪些

指编程语言内置的原始类型，随语言略有不同，通常包括：

+ **整数**：`int`、`long`（不同位宽、有无符号）。
+ **浮点数**：`float`、`double`（IEEE 754）。
+ **字符**：`char`。
+ **布尔**：`bool`（真/假）。
+ 部分语言把 **字符串** 也作为基本类型。

底层都以二进制存储，区别在于占用字节数和解释方式。

#### （3）计算机为什么用二进制

+ **物理可实现**：电子元件（晶体管）天然有**通/断、高/低电平**两种稳定状态，正好对应 0 和 1，抗干扰、可靠。
+ **运算简单**：二进制的算术和**逻辑运算**（与或非）规则简单，便于用逻辑门电路实现。
+ **成本低**：两态存储比多态更易制造、更稳定。综合可靠性与成本，二进制是最优选择。

#### （4）js中的基本数据类型有哪些

JS 有 **7 种原始类型**：`String`、`Number`、`Boolean`、`null`、`undefined`、`Symbol`（ES6）、`BigInt`（ES2020）。除此之外都是 **引用类型 `Object`**（含数组、函数等）。

注意：原始类型按值存储、不可变；`typeof null` 因历史原因返回 `"object"` 是个著名坑。

#### （5）原型和原型链，原型链的尽头

**原型（prototype）** 是函数对象上的一个属性，指向一个对象，实例通过 `[[Prototype]]`（`__proto__`）指向它，从而共享其属性和方法。

**原型链**：访问属性时若自身没有，就沿 `[[Prototype]]` 逐级向上查找，形成链式结构。链的尽头是 `Object.prototype`，它的原型是 `null`——查找到此终止。这正是 JS 继承的实现方式。

#### （6）this的几种情况

`this` 的指向由**调用方式**决定，而非定义位置：

+ **默认调用**：普通函数中指向全局对象（严格模式为 `undefined`）。
+ **方法调用**：`obj.fn()` 中指向 `obj`。
+ **构造调用**：`new Fn()` 中指向新建实例。
+ **显式绑定**：`call/apply/bind` 指向传入的对象。
+ **箭头函数**：没有自己的 `this`，捕获定义时外层作用域的 `this`。

#### （7）浏览器事件循环

JS 是单线程，靠事件循环处理异步。同步代码进**调用栈**执行；异步任务完成后其回调进入任务队列。执行顺序：

+ 执行完当前**宏任务**（整体 script、`setTimeout`、事件回调等）；
+ **清空所有微任务**（`Promise.then`、`queueMicrotask`、`MutationObserver`）；
+ 视需要渲染，再取下一个宏任务。

关键点：微任务优先于下一个宏任务，且会连带执行期间新产生的微任务。

#### （8）跨域的解决方案

跨域由浏览器**同源策略**引起（协议/域名/端口不同）。方案：

+ **CORS**（推荐）：服务端返回 `Access-Control-Allow-Origin` 等响应头控制放行。
+ **代理**：devServer 代理、Nginx 反向代理，服务端间请求无跨域限制。
+ **JSONP**：借 `<script>` 实现，仅 GET，已少用。
+ 其他：`postMessage`、WebSocket。

#### （9）预检请求是什么

预检（preflight）是 CORS 的安全机制。对于**非简单请求**（`PUT/DELETE`、自定义头、`Content-Type: application/json` 等），浏览器会先自动发一个 `OPTIONS` 请求，携带 `Access-Control-Request-Method` 和 `Access-Control-Request-Headers`，询问服务器是否允许；服务器用 `Access-Control-Allow-*` 响应确认后，浏览器才发送真正的请求。可用 `Access-Control-Max-Age` 缓存预检结果。

#### （10）CSS 水平垂直居中的方式

+ **Flex**：父 `display:flex; justify-content:center; align-items:center`（最常用）。
+ **Grid**：父 `display:grid; place-items:center`（最简洁）。
+ **绝对定位 + transform**：`position:absolute; top:50%; left:50%; transform:translate(-50%,-50%)`（不需知道自身宽高）。
+ **绝对定位 + margin:auto**：`inset:0; margin:auto`（需定宽高）。
+ 单行文本：`line-height` 等于高度 + `text-align:center`。

#### （11）CSS 绝对定位后对子元素width:50%的影响

`width:50%` 中的百分比是相对**包含块（containing block）** 的宽度计算的。对绝对定位元素，其包含块是**最近的已定位祖先**（`position` 非 `static`）的 padding box，而非普通父元素。若找不到已定位祖先，则相对**初始包含块**（视口）。所以父元素是否定位、是否有确定宽度，会直接影响子元素 50% 的实际取值。

#### （12）口述：用两个栈实现一个队列的伪代码

**答题思路**：用一个 `inStack` 负责入队、一个 `outStack` 负责出队。出队时若 `outStack` 为空，就把 `inStack` 全部弹出压入 `outStack`，顺序正好反转，从而实现 FIFO；否则直接弹 `outStack`。每个元素至多搬移一次，均摊 `O(1)`。

```javascript
class MyQueue {
  constructor() { this.inStack = []; this.outStack = []; }
  push(x) { this.inStack.push(x); }        // 入队
  pop() {                                    // 出队
    if (this.outStack.length === 0) {
      while (this.inStack.length) {
        this.outStack.push(this.inStack.pop()); // 倒腾一次，顺序反转
      }
    }
    return this.outStack.pop();
  }
}
```

### 反问：

#### （1）部门业务技术栈

**答题思路**：通过反问了解岗位真实情况并表现兴趣。可问：团队负责什么业务、主要技术栈与工程化程度、是否有自研框架/组件库、我入职后主要参与的方向。这类问题帮助判断技术成长空间与匹配度。

#### （2）期望的能力和品质

**答题思路**：借此了解团队看重什么，也侧面展示自我认知。可问：团队最看重候选人的哪些能力和特质、对新人一年内的成长期望、如何评估绩效。听到答复后可简要呼应自己在这些方面的经历，形成正向互动。
