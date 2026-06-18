# Node.js 事件循环深度解析

Node.js 事件循环是其异步非阻塞 I/O 的核心机制，理解它的各阶段执行顺序是写出可预期异步代码、排查诡异执行顺序问题的关键。

## 事件循环的六个阶段

Node.js 事件循环由 libuv 库驱动，每次循环（tick）按顺序经历以下六个阶段：

```
   ┌───────────────────────────┐
┌─>│        timers             │  ← setTimeout / setInterval
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │    pending callbacks      │  ← 上一轮循环延迟的 I/O 回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │    idle, prepare          │  ← 内部使用
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           poll            │  ← 获取新的 I/O 事件，执行 I/O 回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │          check            │  ← setImmediate 回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤    close callbacks        │  ← socket.on('close', ...)
   └───────────────────────────┘
```

### timers 阶段

执行 `setTimeout` 和 `setInterval` 的到期回调。注意：这里的"到期"指的是操作系统调度允许的最早时机，而非精确的延迟时间。

### poll 阶段

这是最重要的阶段。事件循环在这里：
1. 计算应该阻塞等待 I/O 的时间
2. 处理 poll 队列中的事件（文件读取、网络请求等 I/O 回调）

当 poll 队列为空时：
- 如果有 `setImmediate` 回调，进入 check 阶段
- 如果没有，等待新的 I/O 事件，直到 timers 阶段有到期任务

### check 阶段

专门执行 `setImmediate` 的回调，在 poll 阶段完成后立即运行。

## 微任务（Microtasks）vs 宏任务（Macrotasks）

宏任务（Macrotasks）是事件循环各阶段处理的回调，每个阶段各有自己的队列。微任务在**每个宏任务之后、进入下一个事件循环阶段之前**立即清空。

```
宏任务执行 → 清空微任务队列 → 下一个宏任务 → 清空微任务队列 → ...
```

Node.js 中的微任务有两类，执行优先级不同：

| 微任务类型 | API | 优先级 |
|-----------|-----|-------|
| nextTick 队列 | `process.nextTick()` | 高（先执行） |
| Promise 队列 | `Promise.then/catch/finally` | 低（后执行） |

### 为什么 process.nextTick 比 Promise 先执行？

这是 Node.js 的设计决策，非 V8 规范要求。`process.nextTick` 的回调放入独立的 nextTick 队列，在微任务队列（Promise）之前被清空。

```typescript
Promise.resolve().then(() => console.log('Promise'));
process.nextTick(() => console.log('nextTick'));
console.log('同步代码');

// 输出顺序：
// 同步代码
// nextTick
// Promise
```

## 各 API 执行顺序完整示例

```typescript
import { readFile } from 'fs';

setTimeout(() => console.log('1. setTimeout'), 0);
setImmediate(() => console.log('2. setImmediate'));

Promise.resolve().then(() => console.log('3. Promise'));
process.nextTick(() => console.log('4. nextTick'));

readFile(__filename, () => {
  // 在 poll 阶段的 I/O 回调中
  setTimeout(() => console.log('5. I/O 内 setTimeout'), 0);
  setImmediate(() => console.log('6. I/O 内 setImmediate'));
  process.nextTick(() => console.log('7. I/O 内 nextTick'));
  Promise.resolve().then(() => console.log('8. I/O 内 Promise'));
});

console.log('0. 同步代码');
```

**输出顺序：**
```
0. 同步代码
4. nextTick
3. Promise
1. setTimeout       ← 不保证先于 setImmediate（主模块中不确定）
2. setImmediate     ← 不保证先于 setTimeout（主模块中不确定）
7. I/O 内 nextTick
8. I/O 内 Promise
6. I/O 内 setImmediate  ← I/O 回调中 setImmediate 保证先于 setTimeout
5. I/O 内 setTimeout
```

### setTimeout(fn, 0) vs setImmediate 的不确定性

在主模块（非 I/O 回调）中，`setTimeout(fn, 0)` 和 `setImmediate` 的顺序**不确定**，取决于进程启动时的性能状态。但在 I/O 回调内部，`setImmediate` **始终先于** `setTimeout(fn, 0)` 执行，因为 I/O 回调在 poll 阶段，下一步就是 check 阶段（setImmediate），而 timers 阶段要等到下一轮循环。

## 嵌套 process.nextTick 的风险

```typescript
function recursiveNextTick() {
  process.nextTick(recursiveNextTick); // 危险！
}
recursiveNextTick();
// I/O 回调永远无法执行，事件循环被"饿死"
```

Node.js 为 `process.nextTick` 设有递归深度上限（默认 1000），超过会抛出 `RangeError: Maximum call stack size exceeded`。

## 实际应用：何时选择哪个 API

```typescript
// 场景一：需要在当前操作完成后、I/O 之前执行
// → 使用 process.nextTick
class EventEmitter {
  emit(event: string) {
    process.nextTick(() => {
      // 确保在调用 emit 的代码执行完后才触发监听器
      this.listeners.forEach(fn => fn());
    });
  }
}

// 场景二：需要在当前 I/O 轮次完成后执行
// → 使用 setImmediate（对 I/O 更友好，不会饿死事件循环）
function processLargeData(data: Buffer[]) {
  const chunk = data.shift();
  if (!chunk) return;
  process(chunk);
  setImmediate(() => processLargeData(data)); // 允许其他 I/O 穿插执行
}

// 场景三：需要延迟一定时间
// → 使用 setTimeout
setTimeout(() => cleanup(), 5000);
```

## 常见面试题

- **`setTimeout(fn, 0)` 和 `setImmediate` 谁先执行？** 在主模块不确定，在 I/O 回调中 `setImmediate` 先执行。

- **`process.nextTick` 和 `Promise.then` 谁先执行？** `process.nextTick` 先，因为 nextTick 队列在微任务队列（Promise）之前被清空。

- **微任务何时执行？** 每个宏任务（事件循环阶段的回调）执行完毕后立即执行，先清空 nextTick 队列再清空 Promise 队列，然后才进入下一个事件循环阶段。

- **为什么 Node.js 是单线程但能处理高并发？** 事件循环将 I/O 操作委托给 libuv 的线程池（默认 4 个线程），主线程不阻塞，通过回调处理完成的 I/O，实现非阻塞并发。

- **`setImmediate` 的典型使用场景是什么？** 将耗时的 CPU 计算拆分成小块，每块之间插入 `setImmediate`，避免阻塞 I/O 处理；或者在 I/O 回调中安排后续操作，确保比任何 setTimeout 先执行。
