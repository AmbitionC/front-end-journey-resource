事件循环几乎是前端面试的必考题，最常见的形式是给一段代码让你写输出顺序。真正要掌握的只有一条规则：**每执行完一个 task，就把 microtask 队列清空，然后浏览器才有机会渲染，再进入下一个 task**。记住这条，再难的输出题也能一步步推出来。

> **30 秒答法**：JS 是单线程的，浏览器用事件循环调度代码。每一轮先从任务队列取一个 task（比如 script 整体、setTimeout 回调、点击事件）执行完，接着清空所有 microtask（Promise 的 then、await 之后的代码、queueMicrotask），然后浏览器视情况渲染一帧，再开始下一轮。所以当前 task 里已经入队的 microtask（比如已 resolve 的 Promise 的 then）一定在下一个 task（比如 setTimeout 回调）之前执行；如果 microtask 不停地产生新的 microtask，页面就会卡死。

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

推导时盯住「哪段代码在什么时候进了哪个队列」，而不是背「Promise 比 setTimeout 快」：如果 Promise 是在某个 setTimeout 回调里才创建的，它的 then 自然排在那个回调之后。

## 必考题：async/await 混合输出

```javascript
async function async1() {
  console.log('async1 start');
  await async2();
  console.log('async1 end');
}
async function async2() {
  console.log('async2');
}
console.log('script start');
setTimeout(() => console.log('setTimeout'), 0);
async1();
new Promise((resolve) => {
  console.log('promise1');
  resolve();
}).then(() => console.log('promise2'));
console.log('script end');
```

输出：`script start → async1 start → async2 → promise1 → script end → async1 end → promise2 → setTimeout`

一步步推：

1. 整段 script 是第一个 task，同步代码按顺序执行：打印 `script start`，setTimeout 的回调进入任务队列。
2. 调用 `async1`，打印 `async1 start`；`await async2()` 会**先同步执行** `async2`，打印 `async2`，然后把 `await` 之后的代码放进 microtask 队列。
3. `new Promise` 的执行器是同步的，打印 `promise1`；`resolve()` 后 `then` 回调进入 microtask 队列。
4. 打印 `script end`，第一个 task 结束。
5. 清空 microtask：按入队顺序打印 `async1 end`、`promise2`。
6. 下一个 task：打印 `setTimeout`。

最容易错的两点：`await` 右边的函数是同步执行的，只有 `await` **后面**的代码才变成 microtask；`new Promise` 里的代码也是同步的。

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

ECMAScript 只定义 Promise Job 这类语言层面的概念，事件循环由宿主环境实现。Node.js 基于 libuv，一轮循环分成多个阶段，面试常问的区别：

| | 浏览器 | Node.js |
| --- | --- | --- |
| 循环结构 | task → 清空 microtask → 可能渲染 | timers → poll（I/O）→ check（setImmediate）等阶段 |
| 特殊队列 | 无 | `process.nextTick`，优先级高于 Promise microtask |
| 渲染 | 有 requestAnimationFrame 和渲染时机 | 无渲染 |
| 典型追问 | Promise 和 setTimeout 谁先 | setTimeout(0) 和 setImmediate 谁先 |

Node 11 起，每执行完一个 timer 或 immediate 回调就会清空一次 microtask，和浏览器表现一致了。`setTimeout(0)` 和 `setImmediate` 在主模块里的先后不确定，但放在 I/O 回调里时 `setImmediate` 一定先执行，因为 poll 阶段之后紧接着就是 check 阶段。

## 排查卡顿

在 DevTools Performance 中先定位 long task，再展开同步调用栈、microtask 链、style/layout 与 paint。一个大任务拆成数千 Promise callback 仍可能阻塞同一 checkpoint；真正的优化包括减少工作、分帧、Worker、虚拟化和避免重复布局。

测试异步顺序时不要只依赖固定 sleep。将关键回调记录到数组，等待明确事件或可控 scheduler，再断言相对顺序；对渲染还要用浏览器环境而不是只在 Node 测试。

## 小结

浏览器每轮执行一个 task、完成 microtask checkpoint，并在合适时机更新渲染。同步长任务和无限 microtask 都会阻塞 UI。正确推导依赖实际入队时机与宿主规则，而不是“宏任务/微任务优先级”的口号。

## 参考资料

- [HTML Standard: Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
- [ECMAScript Jobs and Job Queues](https://tc39.es/ecma262/multipage/executable-code-and-execution-contexts.html#sec-jobs-and-job-queues)

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节全栈一二面：调度器、流式恢复与浏览器网络](../../../interview/bytedance/base/bytedance-base-53.md)
- [字节全栈实习：Session、权限与前端基础](../../../interview/bytedance/base/bytedance-base-46.md)
- [字节财经保险 AI 全栈实习一面：项目设计、AI Coding 与 Diff](../../../interview/bytedance/base/bytedance-base-34.md)
- [字节全栈一二面：调度器、流式恢复与浏览器网络](../../../interview/bytedance/base/bytedance-base-53.md)
- [字节剪映 AI 前端一面：Agent 运行时、MCP 与性能](../../../interview/bytedance/base/bytedance-base-30.md)
- [网易云音乐全栈一面：JavaScript、排序与 RAG](../../../interview/netease/fullstack/netease-fullstack-2.md)
<!-- interview-source-history:end -->
