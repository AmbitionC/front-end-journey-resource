浏览器事件循环协调 JavaScript、事件、网络回调、microtask 与渲染。它不会让长时间同步代码“自动异步”；一个 long task 会占住主线程，直到调用栈返回，用户输入和页面更新都只能等待。

![浏览器选择一个 task 执行 JavaScript，清空本次 microtask checkpoint，然后才获得可能的 rendering update，之后进入下一轮](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/browser-event-loop-task-microtask-render-v1.webp)
*图：task → microtask checkpoint → possible render 是一轮关键顺序；microtask 中继续入队会延迟后续 task 与绘制。*

---

## 一轮事件循环

[HTML Standard 的 event loop 算法](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)区分 task queue、microtask queue 与更新渲染的处理步骤。简化理解为：

1. 从合适的 task queue 选择一个可运行 task；
2. 执行 task 对应的 JavaScript，直到调用栈为空；
3. 执行 microtask checkpoint，持续处理队列中新加入的 microtask；
4. 宿主在合适时机可能更新渲染；
5. 开始下一轮。

计时器、用户交互与网络事件可以来自不同 task source，规范不会承诺所有 task 只存在一个简单 FIFO 队列。`setTimeout(fn, 0)` 只是让回调在满足最小延迟后成为未来 task 的候选，不是立即执行。

## Promise Job 与 microtask

[ECMAScript Jobs 规范](https://tc39.es/ecma262/multipage/executable-code-and-execution-contexts.html#sec-jobs-and-job-queues)定义 Promise reaction 等 Job 的抽象，浏览器把相关 Job 接入 microtask 机制。`queueMicrotask` 也直接安排 microtask。

```javascript
console.log('A');

setTimeout(() => console.log('B'), 0);

queueMicrotask(() => {
  console.log('C');
  queueMicrotask(() => console.log('D'));
});

Promise.resolve().then(() => console.log('E'));
console.log('F');
```

同步阶段输出 `A F`。task 结束后按入队顺序运行 `C`、`E`；C 新增的 D 仍在同一个 checkpoint 继续运行；计时器在后续 task 才运行。结果是 `A F C E D B`。

推导顺序时记录“哪段同步代码在何时向哪个队列入队”，不要背“Promise 永远比 setTimeout 快”。如果 Promise 是在后续 task 中才创建，时间关系自然不同。

## Microtask starvation

microtask checkpoint 通常持续到队列为空。如果每个 microtask 都再安排一个 microtask，浏览器会一直处理它们，后续 task 与渲染长期得不到机会：

```javascript
function starve() {
  queueMicrotask(starve);
}
```

因此 microtask 适合在当前同步阶段结束后快速收敛状态，不适合拆分重计算。要让输入或渲染得到机会，应跨 task 主动 yield，或把 CPU 密集工作移动到 Worker。

## Rendering 与 requestAnimationFrame

`requestAnimationFrame` 回调属于浏览器更新渲染的处理时机，适合在下一次绘制前计算视觉状态。它不是普通 microtask，也不保证固定 16.7ms；后台标签、屏幕刷新率和主线程负载都会改变节奏。

读写布局时可在同一帧批量读取，再批量写入，减少强制同步布局。动画中若一个回调运行太久，仍会丢帧；使用 rAF 并不自动消除长任务。

## 浏览器与 Node.js 不同

ECMAScript 只定义语言级 Job 等抽象，具体事件循环由宿主提供。Node.js 基于 libuv，拥有 timers、poll、check 等阶段，并有 `process.nextTick` 的特殊队列。浏览器中的“task/microtask/render”顺序不能原样套到 Node I/O 示例；讨论前先写明运行时和版本。

## 排查卡顿

在 DevTools Performance 中先定位 long task，再展开同步调用栈、microtask 链、style/layout 与 paint。一个大任务拆成数千 Promise callback 仍可能阻塞同一 checkpoint；真正的优化包括减少工作、分帧、Worker、虚拟化和避免重复布局。

测试异步顺序时不要只依赖固定 sleep。将关键回调记录到数组，等待明确事件或可控 scheduler，再断言相对顺序；对渲染还要用浏览器环境而不是只在 Node 测试。

## 小结

浏览器每轮执行一个 task、完成 microtask checkpoint，并在合适时机更新渲染。同步长任务和无限 microtask 都会阻塞 UI。正确推导依赖实际入队时机与宿主规则，而不是“宏任务/微任务优先级”的口号。

## 参考资料

- [HTML Standard: Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
- [ECMAScript Jobs and Job Queues](https://tc39.es/ecma262/multipage/executable-code-and-execution-contexts.html#sec-jobs-and-job-queues)
