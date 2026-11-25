Promise 是前端面试里出现频率最高的 JavaScript 考点之一，常见形式有三种：讲原理、看代码说输出顺序、手写 `Promise.all` 或并发控制。

> **30 秒答法**：Promise 表示一个将来才有结果的值，有 pending、fulfilled、rejected 三种状态，只能从 pending 变一次，变了就不能再改。`then` 总是返回一个新的 Promise，回调里返回普通值，下一步就成功；抛错，下一步就失败。所以链式调用能把异步写成顺序的样子，错误也会一路传到最近的 `catch`。`then` 的回调放在微任务里执行：如果 Promise 已经完成，回调会在当前同步代码跑完后、下一个宏任务（比如 setTimeout 回调）之前执行；如果还没完成，要等它完成后才排进微任务队列。`async/await` 是它的语法糖。注意 Promise 本身不能取消，要取消得配合 AbortController。

Promise 表示一个未来会 settle 的结果：只能从 pending 变为 fulfilled 或 rejected，一旦确定就不可改变。它不是线程、任务队列或取消令牌。理解 `then` reaction 的 microtask 顺序、thenable adoption、错误传播和并发组合，才能避免“加几个 await 就能顺序正确”的错觉。

![Promise 四件事：状态从 pending 只能 settle 一次，resolve 变 fulfilled，reject 或抛错变 rejected，resolve 一个 thenable 会跟随它的最终状态；then 总返回新 Promise，返回普通值则下一步 fulfilled，抛错则 rejected，忘了 return 下一步拿到 undefined；组合器中 all 全部成功才成功、任一失败立即失败且不取消其余操作，allSettled 逐项报告，race 取第一个 settle，any 取第一个成功；Promise 本身不能取消，要把 AbortSignal 传给每一层，并用池子限制同时在途的任务数](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/promise-state-chain-combinators-cancel-v2.dark.png)
*图：settlement 不可变，reaction 进入 microtask；取消是独立协作协议，并发需要显式调度。*

## 状态与 Resolution

Promise 有 pending、fulfilled、rejected 三种状态。fulfilled/rejected 合称 settled。`resolve(x)` 不总是立即 fulfilled：若 x 是 Promise/thenable，新 Promise 会 adoption 它的最终状态。规范中的 resolved 与 fulfilled 不是同义词。

[ECMAScript Promise Objects](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise-objects)定义 reaction job 与 resolution。executor 在构造时同步执行，异常自动变 rejection；但 `then`/`catch` handler 总在后续 job 执行，不会同步插入当前调用栈。

```js
console.log('A');
const p = new Promise(resolve => {
  console.log('B');
  resolve(42);
});
p.then(() => console.log('C'));
console.log('D');
// A B D C
```

## Microtask 与事件循环

当前 JavaScript job/call stack 清空后，宿主会运行 microtask checkpoint；Promise reaction 和 `queueMicrotask` 在其中执行，通常先于下一个 timer task。顺序取决于它们入队先后，而不是“Promise 永远比某 API 快”。

连续递归创建 microtask 可能饿死 timer、I/O 和渲染。把大计算拆成 Promise 链不会让它并行，也未必让出给 task；需要 worker 或显式 task yield。

## `then` 返回新 Promise

每次 `then` 都返回新 Promise。handler return 普通值则下一个 fulfilled；throw 或返回 rejected Promise 则下一个 rejected；不传 handler 会穿透对应状态。

```js
fetchUser()
  .then(user => fetchOrders(user.id))
  .then(orders => summarize(orders))
  .catch(error => recover(error))
  .finally(() => hideSpinner());
```

最常见错误是花括号里忘记 `return`，导致下一步得到 `undefined`，内部请求成为无人等待的浮动 Promise。`finally` 用于不依赖结果的清理；它通常透传原值/错误，但若自身 throw，会用新错误替换。

## async/await 只是结构化语法

[ECMAScript Async Function Definitions](https://tc39.es/ecma262/multipage/ecmascript-language-functions-and-classes.html#sec-async-function-definitions)规定 async function 总返回 Promise。`await x` 取得 x 的 Promise resolution，暂停当前 async function 的 continuation，JavaScript 线程仍可执行其他 job。

```js
async function loadDashboard() {
  const [user, flags] = await Promise.all([loadUser(), loadFlags()]);
  return buildDashboard(user, flags);
}
```

若两个调用互不依赖，先创建再 `Promise.all`；逐个 await 会无意串行。若第二步依赖第一步，则串行才正确。try/catch 可捕获作用域内同步抛错与实际 await 到的 rejection；直接 return 一个稍后 reject 的 Promise 不会被该层 catch 捕获，需 return await 或显式 .catch。启动后不 await 的任务也不会被外层可靠捕获。

## 组合器语义

`Promise.all` 全部 fulfilled 才成功，任一 rejection 立即让组合 Promise rejected，但其他操作不会被自动取消。`allSettled` 等待全部并返回每项状态，适合批量报告；`race` 采用第一个 settle；`any` 采用第一个 fulfill，全部拒绝时给 AggregateError。

超时常用 `race`，但 timer 胜出不会停止底层 fetch。要把 AbortSignal 传入实际操作并清理 timer。组合器输入顺序决定输出数组顺序，不是完成顺序。

## 错误边界

在能恢复的层 catch：404 可转换为空结果，认证过期可重新授权，未知错误记录上下文后继续 throw。不要 `catch(() => undefined)` 把故障伪装成有效缺失。

每个启动的 Promise 必须被 await、return、组合，或在明确 fire-and-forget 边界附 catch 与生命周期。浏览器 `unhandledrejection`/Node 事件可观测，但不是业务恢复机制。错误保留 `cause`，日志避免敏感输入。

## 取消是协作协议

Promise 本身无 cancel。[DOM AbortSignal](https://dom.spec.whatwg.org/#interface-abortsignal)提供独立信号。调用方创建 AbortController，把 signal 传给每一层；各操作监听并尽快停止、清理资源、以 AbortError 结束。

```js
async function load(url, { signal }) {
  const res = await fetch(url, { signal });
  return res.json();
}
```

取消客户端等待不保证服务端副作用撤销。支付/发送等操作用 idempotency key 和结果查询。函数文档说明是否支持 signal、何时检查、部分结果怎样处理。

## 并发限制与背压

`Promise.all(items.map(work))` 会立刻创建所有任务，数万请求可能耗尽连接、内存和配额。使用 worker pool/semaphore 只保持 N 个 in-flight，并为每项保留索引、超时和取消。N 由下游容量与延迟测量，不是越大越快。

对流式生产者还要背压：消费者慢时暂停读取或限制缓冲。Promise 只表达单次完成，连续数据更适合 Streams/AsyncIterator，并明确关闭与错误传播。

## 测试

用可控 deferred Promise 测顺序，不依赖真实 sleep；覆盖同步 executor 异常、thenable、组合器空输入、部分拒绝、Abort、超时竞态和并发上限。fake timer 要同时推进 microtask。

判断异步代码是否可靠，可以问四个问题：谁等待它、错误到哪里、能否取消、最多并发多少。Promise 只回答第一个问题的一部分，其余需要显式协议。

## 手写 Promise.all

面试最常让手写的是 `Promise.all`。要点有五个：入参必须可迭代，否则返回一个被拒绝的 Promise；结果按输入顺序放，不按完成顺序；任意一个失败就整体失败；输入里可以有普通值，所以要先用 `Promise.resolve` 包一层；空数组直接成功。

```javascript
function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const items = [...iterable];          // 传入不可迭代的值会抛 TypeError，和原生一样变成 rejected
    const results = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) return resolve(results);
    items.forEach((item, i) => {
      Promise.resolve(item).then(value => {
        results[i] = value;              // 按下标放，保证顺序
        if (--remaining === 0) resolve(results);
      }, reject);                        // 第一个失败就 reject，之后的结果被忽略
    });
  });
}

promiseAll([1, Promise.resolve(2), new Promise(r => setTimeout(() => r(3), 10))])
  .then(console.log); // [1, 2, 3]
```

追问常见两个：为什么不用 `results.push`（完成顺序和输入顺序不一样）；一个失败后其他请求还在跑吗（还在跑，`Promise.all` 不会取消它们，要取消得另外传 AbortSignal）。如果要求「全部跑完、逐个报告成败」，那就是 `Promise.allSettled`。

## 手写并发上限：惰性任务与结果策略

输入若已经是运行中的 Promise，就无法用外层调度器限制其启动。下面的教学接口接收无参任务函数，采用“全部尝试、逐项记录成功或失败”的策略，并按输入顺序返回；它没有取消和超时功能，不能当完整生产调度器。

```javascript
async function settleLimit(taskFns, limit) {
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError('Invalid limit');
  if (!Array.isArray(taskFns) || Array.from(taskFns).some(fn => typeof fn !== 'function')) {
    throw new TypeError('Tasks must be lazy functions');
  }
  const results = new Array(taskFns.length);
  let cursor = 0;
  async function worker() {
    while (cursor < taskFns.length) {
      const index = cursor++;
      try { results[index] = {status: 'fulfilled', value: await taskFns[index]()}; }
      catch (reason) { results[index] = {status: 'rejected', reason}; }
    }
  }
  await Promise.all(Array.from({length: Math.min(limit, taskFns.length)}, worker));
  return results;
}
```

一个工作者等待当前任务 settle 后才领取下一项；同一 JavaScript 执行环境中，读取并递增 cursor 之间没有 await，所以每项只分配一次。工作者数不超过 limit，控制的是返回 Promise 所代表的未完成任务，而不是任意函数背后未报告的后台工作。同步抛错也被逐项捕获，后续任务继续；若题目要求遇错停止启动或取消已启动项，必须改契约与实现。

测试应使用可控 deferred Promise：让后启动的先完成，检查最大在途数、任务只启动一次、结果仍按输入顺序；再混入同步 throw 和异步 reject，并覆盖空输入与非法 limit。只测最终数组无法证明并发上限。

## 练一练

### 高频考点题 1：Promise.all 的失败

Promise.all 中有一个 Promise 被 rejected，其他还在进行的请求会怎样？

- A. 被自动取消
- B. 立即抛出同步异常，中断后面的代码
- C. 全部回滚
- D. 继续执行，结果不再被使用

**答案：D。** 组合 Promise 立即 rejected，但底层操作不会自动取消；需要取消时把 AbortSignal 传给实际请求。

### 高频考点题 2：then 里忘了 return

then 的回调用了花括号，内部发了请求却没有 return，下一个 then 收到什么？

- A. undefined
- B. 请求的结果
- C. 一个 rejected 的 Promise
- D. 上一个 then 的参数

**答案：A。** 每个 then 返回新 Promise，回调返回值决定它的结果；忘了 return 的请求变成没人等待的浮动 Promise。

### 高频考点题 3：独立请求的写法

两个互不依赖的请求，用两行 await 依次等待，会有什么问题？

- A. 没问题，会自动并行
- B. 第二个请求要等页面空闲时才会发出
- C. 变成串行，总耗时变长
- D. 会抛出语法错误

**答案：C。** 应先创建两个 Promise 再用 Promise.all 等待；有依赖关系时串行才正确。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节前端全栈实习一面：渲染、Worker 与认证](../../../interview/bytedance/base/bytedance-base-38.md)
- [字节全栈实习：Session、权限与前端基础](../../../interview/bytedance/base/bytedance-base-46.md)
- [字节全栈一二面：调度器、流式恢复与浏览器网络](../../../interview/bytedance/base/bytedance-base-53.md)
<!-- interview-source-history:end -->

## 参考资料

- [ECMAScript：Promise Objects](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise-objects)
- [ECMAScript：Async Function Definitions](https://tc39.es/ecma262/multipage/ecmascript-language-functions-and-classes.html#sec-async-function-definitions)
- [WHATWG DOM：AbortSignal](https://dom.spec.whatwg.org/#interface-abortsignal)
