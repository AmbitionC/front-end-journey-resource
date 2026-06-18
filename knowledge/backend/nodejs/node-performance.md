Node.js 的单线程事件循环模型在高并发场景下极具优势，但也容易因为同步阻塞或内存泄漏而陷入性能瓶颈。掌握性能分析工具与调优方法，是 Node.js 后端开发者的必备技能。

## 内置性能分析：--prof 与 V8 Profiler

Node.js 内置了 V8 的 CPU profiler，通过 `--prof` 标志启动后，V8 会生成 `isolate-*.log` 文件：

```bash
node --prof app.js
# 运行一段时间后 Ctrl+C
node --prof-process isolate-0x*.log > processed.txt
```

生成的报告会列出函数调用耗时占比，帮助快速定位 CPU 热点。也可以在代码中使用 `v8-profiler-next` 进行程序化采样：

```typescript
import * as profiler from 'v8-profiler-next';
import * as fs from 'fs';

profiler.startProfiling('CPU profile', true);

// 执行需要分析的逻辑
await heavyOperation();

const profile = profiler.stopProfiling('CPU profile');
profile.export((error, result) => {
  fs.writeFileSync('profile.cpuprofile', result!);
  profile.delete();
});
```

生成的 `.cpuprofile` 文件可以直接拖入 Chrome DevTools 的 Performance 面板进行可视化分析。

## clinic.js：专业诊断工具集

[clinic.js](https://clinicjs.org) 提供三个核心工具，分别针对不同类型的性能问题：

| 工具 | 用途 | 原理 |
|------|------|------|
| `clinic doctor` | 综合诊断，识别问题类型 | 收集 CPU、内存、事件循环延迟等多维指标 |
| `clinic flame` | 生成火焰图，定位 CPU 热点 | 基于 `0x` 工具的 V8 采样 |
| `clinic bubbleprof` | 分析异步延迟，追踪 async_hooks | 可视化异步操作耗时与等待时间 |

```bash
npm install -g clinic
clinic doctor -- node app.js
clinic flame -- node app.js
clinic bubbleprof -- node app.js
```

Doctor 会在分析结束后自动打开 HTML 报告，给出具体建议（如"检测到事件循环阻塞"）。

## 内存泄漏检测：Heap Snapshot

Node.js 提供内置的 `v8.writeHeapSnapshot()` 方法，在运行时导出堆快照：

```typescript
import * as v8 from 'v8';
import * as path from 'path';

// 注册信号处理，按需触发快照
process.on('SIGUSR2', () => {
  const filename = v8.writeHeapSnapshot(
    path.join('/tmp', `heap-${Date.now()}.heapsnapshot`)
  );
  console.log(`Heap snapshot written to ${filename}`);
});
```

**使用步骤：**
1. 在服务启动后等待内存稳定，拍第一个快照（基线）
2. 执行可疑操作或等待一段时间
3. 拍第二个快照
4. 在 Chrome DevTools Memory 面板中，选择 "Compare" 模式对比两个快照，查看新增的对象

常见的泄漏模式：
- 全局变量意外累积（Map/Array 只增不减）
- 事件监听器未被移除（`EventEmitter` 泄漏）
- 闭包意外持有大对象引用
- 定时器 (`setInterval`) 未清除

## 事件循环延迟监控

事件循环的 lag（延迟）是衡量 Node.js 服务健康度的关键指标。可以用简单的定时器法自测：

```typescript
let lastCheck = Date.now();

setInterval(() => {
  const now = Date.now();
  const lag = now - lastCheck - 100; // 期望间隔 100ms
  if (lag > 50) {
    console.warn(`Event loop lag: ${lag}ms`);
  }
  lastCheck = now;
}, 100);
```

生产环境推荐使用 `perf_hooks` 模块提供的 `monitorEventLoopDelay`（Node.js 11.10+）：

```typescript
import { monitorEventLoopDelay } from 'perf_hooks';

const histogram = monitorEventLoopDelay({ resolution: 20 });
histogram.enable();

setInterval(() => {
  console.log({
    min: histogram.min / 1e6,      // 转换为毫秒
    max: histogram.max / 1e6,
    mean: histogram.mean / 1e6,
    p99: histogram.percentile(99) / 1e6,
  });
  histogram.reset();
}, 5000);
```

## 常见性能瓶颈

### 同步阻塞代码

```typescript
// 危险：大量 JSON 解析或 CPU 密集计算会阻塞事件循环
app.get('/parse', (req, res) => {
  const data = JSON.parse(req.body.hugeString); // 如果 string 很大，会阻塞
  res.json(data);
});

// 改进：将 CPU 密集任务交给 Worker Threads
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

function runInWorker(data: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./parser.worker.js', { workerData: data });
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}
```

### 异步模式对比

```typescript
// 错误示例：用同步文件 I/O 处理请求
import * as fs from 'fs';

app.get('/config', (req, res) => {
  const config = fs.readFileSync('./config.json', 'utf-8'); // 阻塞！
  res.send(config);
});

// 正确示例：使用 async/await + fs.promises
import { promises as fsp } from 'fs';

app.get('/config', async (req, res) => {
  const config = await fsp.readFile('./config.json', 'utf-8');
  res.send(config);
});
```

### 数据库查询优化

```typescript
// 反模式：N+1 查询
async function getUsersWithPosts(userIds: number[]) {
  const users = await User.findAll({ where: { id: userIds } });
  for (const user of users) {
    user.posts = await Post.findAll({ where: { userId: user.id } }); // N 次额外查询！
  }
  return users;
}

// 优化：使用 include（JOIN）或批量查询
async function getUsersWithPostsOptimized(userIds: number[]) {
  return User.findAll({
    where: { id: userIds },
    include: [{ model: Post }], // 一次 JOIN 查询
  });
}
```

## 性能调优实践清单

**面试常问：**
- `--prof` 和 clinic.js 的区别是什么？（前者是 V8 内置 CPU 采样，后者是更高层的综合诊断工具集）
- 如何判断 Node.js 服务是 CPU bound 还是 I/O bound？（clinic doctor 可以识别，CPU bound 通常伴随事件循环延迟高）
- Worker Threads 和 child_process 的选择？（共享内存用 Worker Threads，隔离进程或执行 shell 命令用 child_process）
- 堆快照对比时重点看什么？（看 "# Delta" 列，新增数量多的构造函数是怀疑对象）

**调优清单：**
- [ ] 消除所有同步 I/O（`fs.readFileSync`、`crypto.pbkdf2Sync` 等）
- [ ] CPU 密集任务使用 Worker Threads 或单独服务
- [ ] 数据库查询避免 N+1，善用批量查询和索引
- [ ] 合理设置连接池大小（数据库连接、HTTP Agent）
- [ ] 开启 HTTP Keep-Alive 减少 TCP 握手开销
- [ ] 使用 streaming 处理大文件，避免一次性读入内存
- [ ] 定期采集事件循环 lag 指标并设置告警阈值
