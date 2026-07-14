### 面试中的问题：

#### （1）自我介绍

**答题思路**：1 分钟内讲清「你是谁 + 技术亮点 + 为什么匹配这个岗位」。建议结构：教育背景 → 最有代表性的 1~2 个项目及你的角色和量化产出 → 熟悉的技术栈 → 求职动机。突出与 JD 相关的关键词，避免堆砌无重点的经历。

#### （2）echarts源码，svg，canvas，位图事件监听

+ **Canvas（位图）**：命令式绘制到一整块位图，DOM 上只有一个 `<canvas>`，**没有独立元素**，适合海量图形/高频重绘（数据点多、动画）；缺点是**事件监听要自己实现**——通过监听 canvas 的鼠标坐标，再用图形的几何范围做**碰撞检测**（或离屏 canvas 用颜色索引拾取）判断命中了哪个图元。
+ **SVG（矢量）**：每个图形是独立 DOM 节点，**可直接绑定事件**、无损缩放，适合图形数量较少、需要交互和清晰度的场景；节点过多时性能差。
+ **ECharts**：默认用 Canvas 渲染（zrender 引擎），也可切换 SVG 渲染器；事件系统在 Canvas 下正是靠 zrender 做的图元级命中检测来模拟 DOM 事件。选型：数据量大选 Canvas，强交互/需矢量清晰选 SVG。

#### （3）http3的设计思路，UDP实现可靠、安全传输

HTTP/3 基于 **QUIC（跑在 UDP 上）**，目标是解决 HTTP/2 的 TCP 队头阻塞并加快建连：

+ **可靠**：QUIC 在 UDP 之上自行实现序列号、确认、重传、拥塞控制；且**每个 stream 独立**，一个流丢包不阻塞其他流（消除 TCP 队头阻塞）。
+ **安全**：内置 **TLS 1.3**，握手与传输加密一体化。
+ **低延迟**：合并传输握手与加密握手，支持 **0-RTT / 1-RTT** 快速建连。
+ **连接迁移**：用 Connection ID 标识连接，切换网络（WiFi↔4G）不断连。

#### （4）微前端的设计思路

微前端把大型前端应用拆成**可独立开发、部署的子应用**，由主应用（基座）统一加载和调度。

+ **核心能力**：子应用加载与路由分发、**JS 沙箱隔离**（Proxy 隔离全局变量）、**样式隔离**（Shadow DOM / CSS 作用域）、应用间通信（全局状态/事件总线）。
+ **方案**：qiankun（基于 single-spa）、Module Federation（Webpack5，运行时共享模块）、iframe（隔离最彻底但体验差）。
+ **优势**：技术栈无关、独立部署、增量升级老系统；**挑战**：隔离、公共依赖复用、性能与通信复杂度。

#### （5）this指向

`this` 在函数**调用时**确定，规则优先级：**new 绑定 > 显式绑定（call/apply/bind）> 隐式绑定（obj.fn()）> 默认绑定（全局/严格模式 undefined）**。箭头函数没有自己的 this，取定义时外层作用域的 this，无法被改变。

```javascript
const obj = { name: 'a', fn() { return this.name; } };
obj.fn();            // 'a'（隐式）
const f = obj.fn; f(); // undefined（默认）
obj.fn.call({ name: 'b' }); // 'b'（显式）
```

#### （6）手撕Promise.any

**答题思路**：任一 Promise 成功就 resolve；**全部失败**才 reject（抛出 `AggregateError`）。用计数器统计失败数。

```javascript
function promiseAny(promises) {
  return new Promise((resolve, reject) => {
    const errors = [];
    let count = 0;
    if (promises.length === 0) return reject(new AggregateError([], 'All promises were rejected'));
    promises.forEach((p, i) => {
      Promise.resolve(p).then(resolve, (err) => {
        errors[i] = err;
        if (++count === promises.length) reject(new AggregateError(errors, 'All promises were rejected'));
      });
    });
  });
}
```

#### （7）封装一个类，实现异步与同步代码链式调用

**答题思路**：借鉴洗牌/LazyMan 思路——每个方法（不论同步还是 `sleep`）都往**任务队列**里 push 一个返回 Promise 的函数，链式调用只负责入队并返回 `this`，构造后用微任务/`setTimeout` 触发按序 `await` 执行。

```javascript
class Chain {
  constructor() {
    this.queue = [];
    Promise.resolve().then(() => this.run()); // 下一个微任务开始执行
  }
  run = async () => {
    for (const task of this.queue) await task();
  };
  do(fn) { this.queue.push(async () => fn()); return this; }
  sleep(ms) {
    this.queue.push(() => new Promise((r) => setTimeout(r, ms)));
    return this;
  }
}
// new Chain().do(()=>console.log(1)).sleep(1000).do(()=>console.log(2));
```

#### （8）封装一个类，使得异步和同步代码能够以链式的方式调用

**答题思路**：与上题同一考点，关键在**返回 `this` 保证链式** + **任务队列串行 `await`**。同步任务用 `async () => fn()` 包装、异步任务返回 Promise，执行器逐个 `await`，从而无论同步异步都严格按调用顺序执行。可复用上一题的 `Chain` 实现；若要求「先注册后统一 start」，把自动触发去掉、暴露一个 `start()` 方法即可。

#### （9）封装事件代理函数

**答题思路**：利用**事件冒泡**在父容器上统一监听，通过 `event.target.matches(selector)` 判断是否命中目标子元素，避免给大量子节点逐一绑定，也支持动态新增元素。

```javascript
function delegate(parent, selector, type, handler) {
  parent.addEventListener(type, (e) => {
    const target = e.target.closest(selector);
    if (target && parent.contains(target)) handler.call(target, e);
  });
}
// delegate(ul, 'li', 'click', function(){ console.log(this.textContent); });
```

#### （11）接雨水问题的算法思路

**答题思路**：每个位置能接的水 = `min(左侧最高, 右侧最高) - 当前高度`。最优解用**双指针**，从两端向中间移动，谁矮移谁并结算，时间 O(n)、空间 O(1)。

```javascript
function trap(h) {
  let l = 0, r = h.length - 1, lMax = 0, rMax = 0, res = 0;
  while (l < r) {
    if (h[l] < h[r]) {
      h[l] >= lMax ? (lMax = h[l]) : (res += lMax - h[l]);
      l++;
    } else {
      h[r] >= rMax ? (rMax = h[r]) : (res += rMax - h[r]);
      r--;
    }
  }
  return res;
}
```

#### （12）字符串全排列的dfs变形题

**答题思路**：回溯（DFS）+ `used` 标记，每层从未使用的字符里选一个，递归到底记录结果，回溯时撤销选择。含重复字符时先排序，再用 `i>0 && s[i]===s[i-1] && !used[i-1]` 剪枝去重。

```javascript
function permute(str) {
  const s = [...str].sort(), res = [], used = [], path = [];
  const dfs = () => {
    if (path.length === s.length) return res.push(path.join(''));
    for (let i = 0; i < s.length; i++) {
      if (used[i] || (i > 0 && s[i] === s[i - 1] && !used[i - 1])) continue;
      used[i] = true; path.push(s[i]);
      dfs();
      used[i] = false; path.pop();
    }
  };
  dfs();
  return res;
}
```

#### （13）字符串正则匹配

**答题思路**：面试可从两个方向答——**（1）会用正则**：讲常用元字符（`\d \w \s .`）、量词（`* + ? {n,m}`）、分组与捕获 `()`、断言 `(?=)`、修饰符 `g/i/m`，并给实例（校验邮箱/手机号、`replace` 提取）。**（2）实现匹配算法**：若题目是「正则表达式匹配」（支持 `.` 和 `*`，LeetCode 10），用**动态规划**，`dp[i][j]` 表示 s 前 i 与 p 前 j 是否匹配，重点处理 `*` 匹配 0 次或多次两种转移。

```javascript
// 校验示例
/^1[3-9]\d{9}$/.test('13800138000'); // 手机号
'a1b2'.replace(/\d/g, '*');          // 'a*b*'
```

#### （14）字节实习期间的业务和经历

**答题思路**：这是行为题，考察你**在真实项目中的贡献与解决问题的能力**，切忌流水账。建议用 **STAR** 组织：所在业务/背景（Situation）→ 你负责的具体任务（Task）→ 你做了什么、用了什么技术、遇到什么难点如何攻克（Action）→ 结果与量化收益（Result，如性能提升 X%、上线覆盖 X 用户）。突出你个人的技术决策和成长，而非团队整体。
