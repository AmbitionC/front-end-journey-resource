### 面试中遇到的问题：

#### （1）TS 中 interface 和 type 的区别

+ **合并**：`interface` 同名会**声明合并**；`type` 不能重复定义。
+ **表达能力**：`type` 更广，能定义**联合类型、交叉类型、元组、映射类型、条件类型**及给基本类型起别名；`interface` 主要描述对象/函数结构。
+ **继承**：`interface` 用 `extends`；`type` 用 `&` 交叉实现组合。
+ **实践建议**：描述对象结构、需要被 class 实现或对外扩展时用 `interface`；需要联合/工具类型等复杂类型运算时用 `type`。

#### （2）元素之间 margin 会有什么问题

主要是 **margin 折叠（外边距合并）**：

+ **相邻兄弟**：上下相邻块级元素的垂直 margin 取**较大值**而非相加。
+ **父子嵌套**：子元素的 `margin-top` 可能「溢出」到父元素外，导致父级整体下移。
+ **空块**：自身上下 margin 也会折叠。

只发生在**垂直方向**（水平不折叠），且仅普通流的块级元素。**解决**：给父元素加 `overflow:hidden`/`padding`/`border` 触发 BFC，或改用 flex/grid 布局（其子项不折叠）。

#### （3）bind、call、apply 是干啥的，区别有啥

三者都用于**改变函数执行时的 `this` 指向**：

+ **call**：立即调用，参数**逐个传入** `fn.call(obj, a, b)`。
+ **apply**：立即调用，参数以**数组传入** `fn.apply(obj, [a, b])`。
+ **bind**：**不立即执行**，返回一个 this 被永久绑定的新函数，参数可分次传（柯里化）。

记忆：call 和 apply 区别在「参数形式（A for Array）」，bind 区别在「返回新函数、延迟执行」。

#### （4）BFC 以及如何设置 BFC

**BFC（块级格式化上下文）** 是一块独立的渲染区域，内部布局不影响外部。作用：**清除浮动**（包裹浮动子元素）、**阻止 margin 折叠**、**阻止元素被浮动元素覆盖**。

**触发方式**：`overflow` 非 `visible`（如 `hidden`/`auto`）、`display: flow-root`（最干净无副作用）、`float` 非 none、`position: absolute/fixed`、`display: inline-block/flex/grid` 等。

#### （5）base64 以及其实现原理

Base64 把二进制数据编码为 **64 个可打印 ASCII 字符**（A-Z a-z 0-9 + /）。**原理**：将数据按每 **3 字节（24 位）** 一组，重新切成 **4 个 6 位** 单元（2^6=64），每个单元映射到编码表中一个字符；不足 3 字节时用 `=` 补位。因此编码后体积约**增大 1/3**。常用于在文本环境嵌入图片（Data URL）、传输二进制，注意它是编码而非加密。

#### （6）第二次挥手服务端都做了什么

TCP 四次挥手中，客户端发 FIN（第一次挥手）请求关闭。**第二次挥手**是服务端收到 FIN 后**回一个 ACK 确认**，表示「我知道你要关了」，此时连接进入**半关闭状态**：客户端到服务端方向关闭，但**服务端仍可继续发送剩余数据**给客户端。等服务端数据发完，才发自己的 FIN（第三次挥手）。之所以要四次而非三次，正是因为服务端的 ACK 和 FIN 不能合并——中间要留时间把未发完的数据发送完。

#### （7）http 和 https 的区别

+ **安全性**：HTTP 明文传输，易被窃听/篡改；HTTPS 在 HTTP 与 TCP 之间加了 **TLS/SSL**，做加密、完整性校验和身份认证。
+ **端口**：HTTP 默认 80，HTTPS 默认 443。
+ **证书**：HTTPS 需要 CA 签发的**数字证书**。
+ **性能**：HTTPS 多了握手与加解密开销（TLS1.3/会话复用已大幅优化），但安全性远胜，现已是标配。

#### （8）代码题：手写 bind 函数

**答题思路**：返回新函数，绑定 this 与预设参数，并要兼容 `new` 调用（此时 this 应指向新实例而非绑定对象）。

```javascript
Function.prototype.myBind = function (ctx, ...preArgs) {
  const self = this;
  function bound(...args) {
    // 作为构造函数调用时，this 指向新实例，忽略 ctx
    const isNew = this instanceof bound;
    return self.apply(isNew ? this : ctx, [...preArgs, ...args]);
  }
  bound.prototype = Object.create(self.prototype); // 维持原型链
  return bound;
};
```

#### （9）代码题：手写继承（问了各个继承有啥缺点）

+ **原型链继承**：`Child.prototype = new Parent()`。缺点：**引用类型属性被所有实例共享**，且不能给父类传参。
+ **构造函数继承**：子构造里 `Parent.call(this)`。缺点：解决了共享和传参，但**无法继承父类原型上的方法**，方法都得定义在构造函数里，无法复用。
+ **组合继承**：`call` 继承属性 + 原型链继承方法。缺点：**父构造函数被调用两次**。
+ **寄生组合继承（最优）**：用 `Object.create(Parent.prototype)` 替代 `new Parent()`，避免二次调用，是 ES5 理想方案。

```javascript
function inherit(Child, Parent) {
  Child.prototype = Object.create(Parent.prototype);
  Child.prototype.constructor = Child;
}
// ES6 直接用 class ... extends（本质即寄生组合）
```

#### （10）代码题：一个异步调度器

**答题思路**：实现并发受限的调度器 Scheduler，最多同时跑 N 个异步任务，完成一个再从队列取下一个补位。

```javascript
class Scheduler {
  constructor(max = 2) { this.max = max; this.running = 0; this.queue = []; }
  add(task) { // task 返回 Promise
    return new Promise((resolve) => {
      this.queue.push(() => task().then(resolve));
      this.run();
    });
  }
  run() {
    while (this.running < this.max && this.queue.length) {
      this.running++;
      this.queue.shift()().finally(() => { this.running--; this.run(); });
    }
  }
}
```

#### （11）代码题：递归判断回文字符串

**答题思路**：比较首尾字符，相等则递归判断去掉首尾的子串，直到长度 ≤ 1。

```javascript
function isPalindrome(s) {
  if (s.length <= 1) return true;
  if (s[0] !== s[s.length - 1]) return false;
  return isPalindrome(s.slice(1, -1));
}
isPalindrome('level'); // true
```

时间 O(n)。若考虑性能可改双指针避免 `slice` 的字符串拷贝开销。
