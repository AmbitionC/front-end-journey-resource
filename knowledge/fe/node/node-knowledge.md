Node.js 把 JavaScript、V8、libuv、操作系统 I/O 和模块系统组合成服务器运行时。它擅长让一个线程管理大量等待型 I/O，但“异步”不等于所有工作都并行：长 JavaScript 回调仍会阻塞 event loop，CPU 密集任务需要 worker/process 或外部计算服务。

![Node.js 主线程、事件循环阶段、微任务、libuv 线程池、Streams 背压、Worker Threads 与进程退出](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/node-knowledge-runtime-subsystems-v1.webp)
*图：网络 I/O 多由系统异步机制完成，部分文件/DNS/crypto 使用线程池；Worker Thread 用于并行 JavaScript 计算。*

## 运行时边界

V8 执行 JavaScript、管理 heap 与 GC；Node 提供 fs/http/stream/process 等 API 和 C++ bindings；libuv 抽象 event loop、线程池与跨平台 I/O；操作系统完成 socket、文件和调度。排障时先定位是哪一层排队。

Node 进程有一个主要 JavaScript event loop。多请求回调在其上交错执行，不代表共享状态没有竞态：两个 async 流在 await 边界仍可能读到同一旧值再覆盖，数据库约束/事务依然必要。

## Event Loop 与微任务

[Node Event Loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)介绍 timers、pending callbacks、poll、check、close 等阶段。`setTimeout` 表示最早可运行时间，不保证精确时刻；poll 阶段慢或回调长会延迟 timer。

Promise reactions/`queueMicrotask` 和 `process.nextTick` 在阶段之间有更高优先处理语义；递归 nextTick/microtask 会饿死 I/O。`setImmediate` 常在 check 阶段运行，和 `setTimeout(0)` 顺序取决于调用上下文，不能以一次实验当通用规则。

## 不要阻塞主线程

同步 fs、巨大 JSON parse/stringify、灾难性正则、压缩和复杂循环都会让所有连接停顿。限制输入大小，把计算分块或移到 worker。监控 event loop delay/utilization、长回调和 heap，而不是只看 CPU 平均。

异步 API 也可能消耗 libuv thread pool，例如部分 fs、crypto、DNS；线程池太小会排队，盲目增大则增加切换与内存。网络 socket 通常依赖操作系统事件机制，不为每个请求占一个线程。

## 模块：ESM 与 CommonJS

CommonJS 用 `require/module.exports`，ESM 用 `import/export`。`package.json` 的 `type`、文件扩展名和 exports 决定解释与公开入口。两者互操作有规则和陷阱，不要混用隐式 default。

库通过 `exports` 明确支持的子路径和条件，避免消费者依赖内部文件。ESM import 是静态绑定并支持 top-level await，但顶层 await 会影响依赖图启动，应谨慎。模块 cache 意味着顶层可变 singleton 跨请求共享，测试需隔离。

## Streams 与 Backpressure

[Node Streams](https://nodejs.org/api/stream.html)提供 Readable、Writable、Duplex、Transform，按 chunk 增量处理而非把整个文件放内存。Writable `write()` 返回 false 表示内部 buffer 达到 highWaterMark，生产者应等待 `drain`；忽略会让内存持续增长。

`pipeline()` 连接 stream 并传播错误/关闭，优于手工多次 pipe 后遗漏某一端失败。对象模式 highWaterMark 按对象数，不是字节。chunk 边界不是业务消息，文本解码用 StringDecoder/TextDecoder 处理多字节字符。

```js
import { pipeline } from 'node:stream/promises';
await pipeline(source, transform, destination, { signal });
```

传 AbortSignal 支持协作取消，但外部副作用仍需业务幂等。

## Worker Threads 与进程

[Node worker_threads](https://nodejs.org/api/worker_threads.html)让 JavaScript 在独立 V8 isolate 并行执行，适合 CPU 密集任务；普通异步 I/O 通常无需 worker。创建 worker 有成本，使用池并传任务。大数据可 transfer ArrayBuffer 减少复制，SharedArrayBuffer 需要同步与安全设计。

worker 崩溃不能带走主进程，任务有 timeout/cancel 和重试语义。若需要故障/权限隔离、不同运行时或独立扩缩，child process/container 更合适。cluster/多进程可利用多核，但 session 与状态放外部共享存储。

## HTTP 服务生命周期

设置 header/request/body/idle timeouts 和最大连接，防止慢连接占资源。校验 `Content-Length` 但不完全信任它，流式读取时累计上限。代理后只信受控 hop 设置的 forwarded headers。

收到 SIGTERM 后停止接新连接，标记 readiness false，等待在途请求到 deadline，取消后台任务，关闭数据库/队列，再退出。`process.exit()` 会立即终止，可能丢未刷新日志；设置 exitCode 并让事件循环自然收尾，紧急路径除外。

`uncaughtException` 表示进程可能处于未知状态，记录低敏诊断并优雅终止，由 supervisor 重启；不要捕获后假装继续。Unhandled rejection 也应通过一致策略处理。

## 内存与诊断

V8 heap 只是 RSS 一部分，Buffer/native addon 可能在 heap 外。缓存无上限、事件监听器不移除、闭包持有大对象会泄漏。观察 heapUsed、external、rss、GC pause 和对象增长，必要时在受控环境采 heap snapshot。

日志带 requestId/runId，不同步写大量磁盘；profiling 使用 CPU profile、heap snapshot、event loop 指标和 async context。AsyncLocalStorage 可传播上下文，但不能当业务状态数据库。

## 测试

测试并发请求、慢客户端、body 超限、stream 背压、下游取消、worker 崩溃、SIGTERM 和连接 drain。压测同时关注吞吐、p95/p99、event loop delay、RSS 与错误，不以单一 QPS 决定上线。

理解 Node 的关键是为每类工作选择正确子系统：等待型 I/O 留给 event loop，增量数据交给 Stream，CPU 计算交给 Worker，持久状态交给数据库，进程生命周期交给可观测的 supervisor。

## 参考资料

- [Node.js：The Event Loop, Timers, and nextTick](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)
- [Node.js：Stream](https://nodejs.org/api/stream.html)
- [Node.js：Worker Threads](https://nodejs.org/api/worker_threads.html)
