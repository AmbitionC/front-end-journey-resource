# Cluster 集群模式

Node.js 默认单进程运行，无法充分利用多核 CPU。`cluster` 模块允许创建多个子进程（Worker）共享同一个端口，通过多进程并行处理请求，显著提升吞吐量。

## Master/Worker 架构

```
           ┌──────────────┐
           │   Master     │  ← 不处理请求，负责管理 Worker 生命周期
           └──────┬───────┘
          fork()  │  fork()  fork()
    ┌─────────────┼──────────────┐
    ▼             ▼              ▼
┌────────┐  ┌────────┐    ┌────────┐
│Worker 1│  │Worker 2│    │Worker N│  ← 每个 Worker 都是独立进程
│:3000   │  │:3000   │    │:3000   │  ← 共享同一端口
└────────┘  └────────┘    └────────┘
```

Master 进程监听端口，收到连接后将其分发给某个 Worker 进程处理。Worker 进程通过与 Master 共享的文件描述符（fd）来"监听"同一端口。

## 基本用法

```typescript
import cluster from 'cluster';
import { cpus } from 'os';
import { createServer } from 'http';

const numCPUs = cpus().length;

if (cluster.isPrimary) {
  console.log(`Master 进程 ${process.pid} 启动`);

  // 为每个 CPU 核心 fork 一个 Worker
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} 退出，代码: ${code}，信号: ${signal}`);
    // Worker 意外退出时自动重启
    if (!worker.exitedAfterDisconnect) {
      console.log('重启 Worker...');
      cluster.fork();
    }
  });

} else {
  // Worker 进程：运行实际的 HTTP 服务器
  createServer((req, res) => {
    res.writeHead(200);
    res.end(`由 Worker ${process.pid} 处理\n`);
  }).listen(3000);

  console.log(`Worker ${process.pid} 已启动`);
}
```

## 负载均衡策略

| 平台 | 默认策略 | 说明 |
|------|---------|------|
| Linux / macOS | Round-Robin（轮询） | Node.js Master 主动调度，防止单个 Worker 过载 |
| Windows | OS 级别分发 | 操作系统直接将连接分配给监听相同端口的进程 |

可以通过 `cluster.schedulingPolicy` 手动设置：
```typescript
cluster.schedulingPolicy = cluster.SCHED_RR;  // 轮询（Round-Robin）
cluster.schedulingPolicy = cluster.SCHED_NONE; // 交给操作系统决定
```

**Round-Robin 的局限：** 如果某个请求处理时间很长，该 Worker 仍然可能接到新请求（RR 不感知 Worker 当前负载）。

## Worker 生命周期管理

### Worker 与 Master 通信

```typescript
if (cluster.isPrimary) {
  const worker = cluster.fork();

  // 接收 Worker 发来的消息
  worker.on('message', (msg: { cmd: string; value: number }) => {
    if (msg.cmd === 'report') {
      console.log(`Worker ${worker.id} 已处理 ${msg.value} 个请求`);
    }
  });

  // 向 Worker 发送消息
  worker.send({ cmd: 'reload-config' });

} else {
  let requestCount = 0;

  process.on('message', (msg: { cmd: string }) => {
    if (msg.cmd === 'reload-config') {
      // 重新加载配置
    }
  });

  createServer((req, res) => {
    requestCount++;
    if (requestCount % 100 === 0) {
      process.send!({ cmd: 'report', value: requestCount });
    }
    res.end('OK');
  }).listen(3000);
}
```

## 优雅重启（Zero-Downtime Restart）

直接杀死所有 Worker 会导致正在处理的请求失败。优雅重启的思路是逐个替换 Worker：

```typescript
import cluster, { Worker as ClusterWorker } from 'cluster';

function gracefulRestart(): void {
  const workers = Object.values(cluster.workers ?? {}) as ClusterWorker[];

  let restartIndex = 0;

  function restartNext(): void {
    if (restartIndex >= workers.length) {
      console.log('所有 Worker 重启完毕');
      return;
    }

    const worker = workers[restartIndex++];

    // 1. 停止接受新连接
    worker.send({ cmd: 'shutdown' });
    worker.disconnect();

    // 2. 等待旧 Worker 退出后再启动新 Worker
    worker.on('exit', () => {
      cluster.fork();
      // 新 Worker 准备好后继续重启下一个
      cluster.once('listening', () => restartNext());
    });
  }

  restartNext();
}

// 在 Worker 中处理 shutdown 命令
process.on('message', (msg: { cmd: string }) => {
  if (msg.cmd === 'shutdown') {
    server.close(() => process.exit(0)); // 等待现有连接处理完毕
  }
});

// 监听信号（如 PM2 的 reload 信号）
process.on('SIGUSR2', gracefulRestart);
```

## PM2 作为替代方案

手动管理 Cluster 代码复杂，生产环境通常使用 PM2：

```bash
# 以集群模式启动，自动使用所有 CPU 核心
pm2 start app.js -i max

# 零停机重载（逐个重启 Worker）
pm2 reload app

# 查看各 Worker 状态
pm2 list
pm2 monit
```

PM2 的 `ecosystem.config.js` 配置：

```javascript
module.exports = {
  apps: [{
    name: 'api-server',
    script: './dist/app.js',
    instances: 'max',      // 等同于 CPU 核心数
    exec_mode: 'cluster',
    wait_ready: true,      // 等待进程发送 ready 事件
    listen_timeout: 3000,  // 等待 ready 的超时时间
    kill_timeout: 5000,    // 等待进程退出的超时时间
  }]
};
```

## Cluster 能解决什么，不能解决什么

**能解决：**
- 多核 CPU 利用率低的问题
- 单 Worker 崩溃导致服务不可用（Master 自动重启）

**不能解决：**
- 内存不足：每个 Worker 都是独立进程，各有完整的 V8 堆，内存占用是 N 倍
- 进程间共享状态：Session、缓存等需要使用 Redis 等外部存储（各 Worker 内存独立）
- CPU 密集型任务：应使用 Worker Threads，而非增加 Cluster Worker 数量

## 常见面试题

- **Cluster 和 Worker Threads 如何选择？** Cluster 适合处理高并发网络请求（多进程监听同一端口），每个 Worker 是独立进程，隔离性好；Worker Threads 适合 CPU 密集型计算，同进程内多线程，内存共享代价低但隔离性弱。

- **Cluster Worker 之间能共享内存吗？** 不能，每个 Worker 是独立进程，有独立的内存空间。共享状态必须通过外部存储（Redis、数据库）或 Master 进程中转（IPC 消息）。

- **Round-Robin 的问题是什么？** 纯轮询不考虑 Worker 的当前负载，长耗时请求会导致该 Worker 积压。生产中可结合健康检查和限流来缓解。

- **如何实现零停机部署？** 逐个 disconnect Worker（已有连接继续处理），每个 Worker 退出后 fork 新 Worker，新 Worker ready 后再处理下一个，全程保持总 Worker 数不变。
