# Worker Threads 多线程模型

Node.js 的单线程模型在处理 CPU 密集型任务时会阻塞事件循环，导致所有 I/O 请求卡住。`worker_threads` 模块提供了真正的多线程能力，让 CPU 密集型计算可以在独立线程中运行，不影响主线程的响应性。

## 为什么需要 Worker Threads

Node.js 主线程负责运行事件循环，一旦有同步的 CPU 密集计算（图像处理、加密、复杂算法），整个事件循环都会暂停：

```typescript
// ❌ 阻塞事件循环：在计算完成前，所有 HTTP 请求都无法响应
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

app.get('/fib', (req, res) => {
  res.json({ result: fibonacci(45) }); // 阻塞几秒
});
```

## 创建 Worker 与通信

### 基本用法

```typescript
// main.ts（主线程）
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { fileURLToPath } from 'url';

if (isMainThread) {
  // 主线程：创建 Worker，传入初始数据
  const worker = new Worker(__filename, {
    workerData: { n: 45 }
  });

  worker.on('message', (result: number) => {
    console.log('计算结果:', result);
  });

  worker.on('error', (err) => {
    console.error('Worker 错误:', err);
  });

  worker.on('exit', (code) => {
    if (code !== 0) console.error(`Worker 异常退出，代码: ${code}`);
  });

} else {
  // Worker 线程：执行 CPU 密集计算
  function fibonacci(n: number): number {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }

  const result = fibonacci(workerData.n as number);
  parentPort!.postMessage(result);
}
```

### 使用 MessageChannel 双向通信

`MessageChannel` 创建一对相互连接的 `MessagePort`，适合主线程与多个 Worker 之间建立私有通道：

```typescript
import { Worker, MessageChannel } from 'worker_threads';

const { port1, port2 } = new MessageChannel();

const worker = new Worker('./worker.js', {
  workerData: { port: port2 },
  transferList: [port2] // 转移所有权，port2 在主线程中变为不可用
});

// 主线程通过 port1 与 worker 通信
port1.on('message', (msg) => console.log('收到:', msg));
port1.postMessage({ cmd: 'start', data: [1, 2, 3] });

// worker.js 中通过 workerData.port 接收和发送
// workerData.port.on('message', ...)
// workerData.port.postMessage(result)
```

## SharedArrayBuffer + Atomics 共享内存

`postMessage` 通信会复制数据，对大型数据集代价高。`SharedArrayBuffer` 让多个线程直接读写同一块内存：

```typescript
import { Worker, isMainThread } from 'worker_threads';

if (isMainThread) {
  // 创建共享内存（1024 字节）
  const sharedBuffer = new SharedArrayBuffer(1024);
  const sharedArray = new Int32Array(sharedBuffer);

  const worker = new Worker(__filename, {
    workerData: { sharedBuffer }
  });

  worker.on('exit', () => {
    console.log('Worker 写入的值:', sharedArray[0]); // 读取 Worker 写入的结果
  });

} else {
  const { sharedBuffer } = workerData as { sharedBuffer: SharedArrayBuffer };
  const sharedArray = new Int32Array(sharedBuffer);

  // Atomics 保证操作的原子性，避免竞态条件
  Atomics.store(sharedArray, 0, 42);
  Atomics.notify(sharedArray, 0); // 唤醒等待的线程
}
```

`Atomics.wait()` 可以阻塞线程直到某个条件满足，常用于实现线程同步原语（锁、信号量）。**注意：主线程不能调用 `Atomics.wait()`**，否则会抛出错误（会阻塞事件循环）。

## Worker Threads vs libuv 线程池

Node.js 内部已有一个线程池（libuv，默认 4 个线程），专门处理文件 I/O、DNS 查询、crypto 等操作。两者的区别：

| 特性 | libuv 线程池 | Worker Threads |
|------|-------------|---------------|
| 用途 | 系统调用、I/O 操作 | 用户 JS 代码（CPU 计算） |
| 线程数 | 默认 4，可通过 `UV_THREADPOOL_SIZE` 调整 | 按需创建，无硬编码上限 |
| 控制权 | 无法直接控制，由 Node.js 内部管理 | 完全由开发者控制 |
| 通信方式 | 回调/Promise | postMessage / SharedArrayBuffer |
| V8 隔离 | 每个线程无独立 V8 堆 | 每个 Worker 有独立 V8 堆 |

## 封装 Worker 线程池

每次请求都新建 Worker 有启动开销，生产中通常使用线程池：

```typescript
import { Worker } from 'worker_threads';

class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{ resolve: Function; reject: Function; data: unknown }> = [];
  private available: Worker[] = [];

  constructor(private workerScript: string, private poolSize: number) {
    for (let i = 0; i < poolSize; i++) {
      this.addWorker();
    }
  }

  private addWorker(): void {
    const worker = new Worker(this.workerScript);
    worker.on('message', (result) => {
      const task = this.queue.shift();
      if (task) {
        worker.postMessage(task.data);
        task.resolve(
          new Promise(res => worker.once('message', res))
        );
      } else {
        this.available.push(worker);
      }
    });
    this.available.push(worker);
    this.workers.push(worker);
  }

  run(data: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const worker = this.available.pop();
      if (worker) {
        worker.postMessage(data);
        worker.once('message', resolve);
        worker.once('error', reject);
      } else {
        this.queue.push({ resolve, reject, data });
      }
    });
  }

  terminate(): void {
    this.workers.forEach(w => w.terminate());
  }
}
```

## 何时使用 Workers vs Cluster vs child_process

| 场景 | 推荐方案 | 原因 |
|------|---------|------|
| CPU 密集型计算（加密、图像处理） | Worker Threads | 同进程，内存共享代价低 |
| 利用多核处理 HTTP 请求 | Cluster | 多进程监听同一端口，各自独立 |
| 执行外部命令或脚本 | child_process | 需要独立进程隔离或调用非 JS 程序 |
| 需要 V8 堆完全隔离 | child_process / Cluster | Worker 共享进程，崩溃影响较小但不为零 |

## 常见面试题

- **Worker Threads 和 Cluster 的根本区别是什么？** Worker Threads 是同一进程内的多线程，共享内存空间（通过 SharedArrayBuffer）；Cluster 是多进程，每个进程有独立内存，通过 IPC 通信。

- **Worker 内存如何与主线程共享？** 使用 `SharedArrayBuffer` + `Int32Array` 等 TypedArray，通过 `Atomics` 保证操作的原子性。

- **postMessage 传递大对象时如何避免复制开销？** 使用 `transferList` 转移 `ArrayBuffer` 的所有权，转移后原线程的引用变为不可用，实现零拷贝传递。

- **为什么不能在 Worker 中直接使用某些 Node.js API？** 如 `cluster`、`process.exit()` 等，因为 Worker 是线程而非进程，这些 API 操作的是进程级别的资源。
