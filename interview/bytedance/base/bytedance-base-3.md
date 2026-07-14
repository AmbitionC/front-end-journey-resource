### 面试中的问题：

#### （1）盒子模型

盒子模型由内到外为 **content（内容）→ padding（内边距）→ border（边框）→ margin（外边距）**。

+ **标准盒模型**（`box-sizing: content-box`，默认）：`width` 只算内容宽，实际占位 = width + padding + border。
+ **IE/怪异盒模型**（`box-sizing: border-box`）：`width` 包含 content + padding + border，布局更直观，实践中常全局设为 `border-box`。

#### （2）左右固定宽，中间自适应

多种实现，最常用：

+ **Flex**：容器 `display: flex`，左右两栏固定宽度，中间 `flex: 1` 占满剩余。
+ **Grid**：`grid-template-columns: 200px 1fr 200px`。
+ **圣杯 / 双飞翼布局**：float + 负 margin 的经典方案，兼容老浏览器但代码较绕。

现代首选 Flex 或 Grid，一行搞定。

#### （3）盒子模型，设置 background：blue 计算颜色区域（注意margin badding 2）

背景色（`background-color`）默认绘制范围是 **border-box**，即**覆盖 content + padding + border 区域，但不包含 margin**（margin 永远透明）。

+ 若 `background-clip: content-box`，则背景只画到 content 区。
+ **margin 折叠**：相邻块级元素的上下 margin 会取较大值合并（题中「margin 加倍」通常指未折叠或方向不同时的叠加），计算可见颜色区时要把 margin 排除在染色范围之外。

#### （4）this 指向

`this` 在**函数调用时**才确定，取决于调用方式：

+ **默认绑定**：普通函数调用，`this` 指向全局对象（严格模式为 `undefined`）。
+ **隐式绑定**：`obj.fn()`，`this` 指向 `obj`。
+ **显式绑定**：`call/apply/bind` 指定。
+ **new 绑定**：`this` 指向新创建的实例。
+ **箭头函数**：无自身 this，捕获定义时**外层作用域**的 this。

优先级：new > 显式 > 隐式 > 默认。

#### （5）箭头函数

箭头函数是 ES6 简化的函数写法 `(a, b) => a + b`。特点：**没有自己的 `this`/`arguments`/`super`**，`this` 取自定义时的词法作用域；不能作为构造函数（不能 `new`）；没有 `prototype`。适合回调、需要保持外层 this 的场景。

#### （6）箭头函数与普通函数区别

+ **this**：普通函数取决于调用方式；箭头函数继承定义时外层的 this，无法被 call/apply/bind 改变。
+ **arguments**：普通函数有；箭头函数没有，需用 rest 参数 `...args`。
+ **构造函数**：普通函数可 `new`；箭头函数不可（无 `[[Construct]]`、无 `prototype`）。
+ **不能用作 generator**（不能有 `yield`）。

#### （7）代码输出（promise settimeout）

**答题思路**：考事件循环执行顺序。规则：**同步代码 → 清空所有微任务（Promise.then、queueMicrotask、await 后续）→ 取一个宏任务（setTimeout）→ 再清空微任务**，如此循环。

```javascript
console.log(1);
setTimeout(() => console.log(2));      // 宏任务
Promise.resolve().then(() => console.log(3)); // 微任务
console.log(4);
// 输出：1 4 3 2
```

关键点：`setTimeout` 回调总在当前所有微任务之后执行；`await x` 之后的代码相当于放进微任务队列。

#### （8）手写 promise.all

**答题思路**：返回新 Promise，用计数器收集所有结果并**保持顺序**，任一失败立即 reject。

```javascript
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let count = 0;
    if (promises.length === 0) return resolve(results);
    promises.forEach((p, i) => {
      Promise.resolve(p).then((res) => {
        results[i] = res;              // 按索引保序
        if (++count === promises.length) resolve(results);
      }, reject);                       // 任一失败即 reject
    });
  });
}
```

#### （9）合并两个有序数组

**答题思路**：双指针，各指向两数组头部，每次取较小值放入结果，时间 O(m+n)。

```javascript
function merge(a, b) {
  const res = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    res.push(a[i] <= b[j] ? a[i++] : b[j++]);
  }
  while (i < a.length) res.push(a[i++]);
  while (j < b.length) res.push(b[j++]);
  return res;
}
```

若是 LeetCode 88「原地合并」，则从两数组尾部往前填，避免覆盖。

#### （10）反问

**答题思路**：反问要体现你对岗位的关注和思考。可问：团队负责的**业务与技术栈**、这个岗位近期要解决的**核心问题**、团队的**代码规范/成长路径**、对实习生/新人的培养方式，以及「您觉得我还有哪些需要提升的地方」。避免一上来就问薪资、加班等敏感细节。
