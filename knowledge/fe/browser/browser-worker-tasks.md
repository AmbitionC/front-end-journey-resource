Web Worker 把计算移到另一个执行环境，让页面主线程有机会处理输入和渲染。它不会自动减少计算量，也不会自动取消旧任务。连续请求的可靠实现，需要分开处理三个问题：任务怎样进入 Worker，旧计算何时能停，哪个结果仍有资格提交。

## 主线程与 Worker 的职责

主线程拥有 DOM 和页面交互；Worker 有自己的全局环境与事件处理，可以计算、使用受支持的网络或存储 API，但不能直接操作页面 DOM。普通消息采用结构化克隆；可转移对象会转移所有权，发送方不能继续按原方式使用已转移缓冲区。[MDN Worker 文档](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)描述了这些边界。

把 CPU 重任务迁出主线程有助于响应，但复制数据、启动、排队和汇合仍有成本。普通网络 I/O 等待本来就不占用同步计算，不能仅因异步就认定必须使用 Worker。

下图中的 ID 决定“结果属于谁”，分片决定“取消消息何时能被处理”；二者互不替代。

<iframe
  src="/archify/browser-worker-tasks.html"
  title="主线程递增taskId并发送消息，Worker分片计算并返回带ID的结果，主线程只提交仍对应最新ID的结果"
></iframe>
*图：旧结果可被忽略，但旧计算是否停止仍取决于协作取消和事件循环。*

## 最新结果不能靠完成顺序

教学假设：用户先发 A，再发 B，而 B 更早完成。如果无条件写入每次结果，A 的迟到结果会覆盖 B。主线程应在发送请求时递增 latestId，回复带原 ID，提交前检查 reply.id===latestId。错误消息也要带 ID，否则旧错误可能盖住新成功状态。

这个检查能阻止旧结果写 UI，却不能节省已经运行的旧计算。取消标记需要 Worker 接收新任务或取消消息，并在可中断的分片边界检查；同步长循环执行期间，消息处理器没有机会更新该标记。

## 为什么只 await Promise.resolve 不够

Promise 的后续任务进入微任务队列。连续创建微任务可能让普通消息或 timer task 长时间没有机会运行；因此把长循环换成一串 Promise 并不保证可响应取消。[HTML 事件循环规则](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)区分 task 与 microtask checkpoint。

以下代码是“让出到后续 timer task”的小示例，不是完整调度器：

```javascript
async function yieldTask() {
  await new Promise(resolve => setTimeout(resolve, 0));
}
```

timer task 负责调用 resolve，await 后的续接仍是微任务；示例的作用是先跨过一个 task 边界，让其他已排队任务有执行机会，并不规定不同 task 来源的全局执行顺序。0 表示请求尽早调度，不保证实际延迟为零；浏览器也不保证每个 task 后都绘制一次。完整计算需要在分片后调用它并检查取消标记，同时决定每片工作量。过大一片仍会卡住，过小一片可能让调度成本主导。

## 终止、取消与副作用

Worker.terminate 可以终止整个 Worker；共享它的其他任务也会一起丢失，且不能依赖内部 finally 完成清理。协作取消可以保留 Worker，但只会在代码主动检查或底层支持取消时生效。取消 fetch 等操作也应传递 AbortSignal，不把停止等待当成服务端撤销。

对于有写入等副作用的任务，还需幂等、状态查询或补偿。不能因为 UI 忽略旧回复，就宣称旧写入已经取消。

## 如何验证这个设计

用可控任务先后完成，构造 A慢/B快、取消消息迟到、传输数据较大、错误结果迟到与 Worker 被终止。分别验证：最新 ID 才可提交、分片边界才能观察取消、终止不会伪报成功、主线程交互指标改善而总耗时可能不降。传输开销、计算与等待应分开记录。

## 面试口述与教学追问

Worker 隔离 CPU 计算，但不能操作 DOM；消息传输有成本。任务 ID 保证结果归属，分片并让出 task 才让取消消息有机会生效，Promise 微任务不是这条路径的替代。停止等待与停止副作用也要分开验证。

教学追问：只有 ID 检查而无取消，资源会怎样？两项任务共用一个 Worker 时 terminate 有什么影响？若数据是巨大 ArrayBuffer，传输所有权会怎样影响发送方？这些条件变化分别检验完成语义、生命周期与数据边界。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节前端全栈实习一面：渲染、Worker与认证](../../../interview/bytedance/base/bytedance-base-38.md)
<!-- interview-source-history:end -->

## 参考资料

- [MDN：Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)（滚动文档，2026-10-03核验）
- [WHATWG HTML：Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
