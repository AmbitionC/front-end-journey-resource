Promise 表示一个未来会 settle 的结果：只能从 pending 变为 fulfilled 或 rejected，一旦确定就不可改变。它不是线程、任务队列或取消令牌。理解 `then` reaction 的 microtask 顺序、thenable adoption、错误传播和并发组合，才能避免“加几个 await 就能顺序正确”的错觉。

![JavaScript Promise、async/await、微任务、错误传播、并发限制与 AbortSignal 的异步控制流](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/promise-async-control-flow-v1.webp)
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

若两个调用互不依赖，先创建再 `Promise.all`；逐个 await 会无意串行。若第二步依赖第一步，则串行才正确。try/catch 只捕获其作用域内 awaited/returned Promise；启动后不 await 的任务不会被外层可靠捕获。

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

## 参考资料

- [ECMAScript：Promise Objects](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise-objects)
- [ECMAScript：Async Function Definitions](https://tc39.es/ecma262/multipage/ecmascript-language-functions-and-classes.html#sec-async-function-definitions)
- [WHATWG DOM：AbortSignal](https://dom.spec.whatwg.org/#interface-abortsignal)
