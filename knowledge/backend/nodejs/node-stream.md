Stream 是 Node.js 处理大量数据的核心抽象，它允许以分块（chunk）方式读写数据，避免将整个文件或响应体加载进内存，是构建高性能 I/O 管道的基础。

## 四种 Stream 类型

| 类型 | 方向 | 典型例子 |
|------|------|---------|
| Readable | 只读 | `fs.createReadStream`、HTTP request |
| Writable | 只写 | `fs.createWriteStream`、HTTP response |
| Duplex | 读写双向（独立缓冲） | TCP socket |
| Transform | 读写双向（输入变输出） | `zlib.createGzip`、加密流 |

## 背压（Backpressure）机制

背压是流控制的核心。当 Writable 的内部缓冲区满时，`write()` 返回 `false`，通知上游暂停生产数据；缓冲区清空后触发 `drain` 事件，上游恢复写入。

**不处理背压的后果：**内存无限增长，最终导致进程崩溃（OOM）。

```typescript
import { createReadStream, createWriteStream } from 'fs';

const readable = createReadStream('./large-file.csv');
const writable = createWriteStream('./output.csv');

readable.on('data', (chunk: Buffer) => {
  const canContinue = writable.write(chunk);
  if (!canContinue) {
    // 背压：暂停上游
    readable.pause();
    writable.once('drain', () => {
      // 缓冲区清空，恢复读取
      readable.resume();
    });
  }
});

readable.on('end', () => writable.end());
```

## pipe() — 自动处理背压

`pipe()` 封装了上述背压逻辑，是连接流最简洁的方式：

```typescript
import { createReadStream, createWriteStream } from 'fs';
import { createGzip } from 'zlib';

// 读取 → 压缩 → 写入，全程流式，内存占用恒定
createReadStream('./large-file.log')
  .pipe(createGzip())
  .pipe(createWriteStream('./large-file.log.gz'));
```

**pipe() 的注意事项：** 默认情况下，源流结束时会自动关闭目标流；但发生错误时不会自动清理，推荐改用 `pipeline()`：

```typescript
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import { createGzip } from 'zlib';

// pipeline 会在任意流出错时自动销毁所有流，并返回 Promise
await pipeline(
  createReadStream('./input.log'),
  createGzip(),
  createWriteStream('./output.log.gz')
);
```

## 实现 Transform Stream

Transform 是最常用的自定义流类型，输入数据经过处理后变为输出数据：

```typescript
import { Transform, TransformCallback } from 'stream';

// 将 CSV 行转换为 JSON 对象的 Transform 流
class CsvToJsonTransform extends Transform {
  private headers: string[] = [];
  private isFirstLine = true;

  constructor() {
    super({ objectMode: true }); // 输出模式：对象而非 Buffer
  }

  _transform(chunk: Buffer, _encoding: string, callback: TransformCallback): void {
    const lines = chunk.toString('utf8').split('\n').filter(Boolean);

    for (const line of lines) {
      if (this.isFirstLine) {
        this.headers = line.split(',');
        this.isFirstLine = false;
        continue;
      }

      const values = line.split(',');
      const record: Record<string, string> = {};
      this.headers.forEach((header, i) => {
        record[header.trim()] = values[i]?.trim() ?? '';
      });

      this.push(record); // 推送到可读端
    }

    callback(); // 通知框架本次 chunk 处理完毕
  }

  _flush(callback: TransformCallback): void {
    // 流结束时的清理工作（如处理最后一个不完整的 chunk）
    callback();
  }
}

// 使用示例
import { createReadStream } from 'fs';

const transform = new CsvToJsonTransform();

createReadStream('./data.csv')
  .pipe(transform)
  .on('data', (record: Record<string, string>) => {
    console.log(record); // { name: 'Alice', age: '30' }
  });
```

## 实战场景

### HTTP 响应流式传输

```typescript
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { createReadStream } from 'fs';

createServer((req: IncomingMessage, res: ServerResponse) => {
  res.setHeader('Content-Type', 'application/octet-stream');
  // 直接 pipe 到 HTTP response（Writable），不占用额外内存
  createReadStream('./large-video.mp4').pipe(res);
}).listen(3000);
```

### 实时日志处理

```typescript
import { Transform } from 'stream';

class LogFilterTransform extends Transform {
  constructor(private level: string) {
    super({ readableObjectMode: true, writableObjectMode: true });
  }

  _transform(line: string, _enc: string, cb: TransformCallback): void {
    if (line.includes(`[${this.level}]`)) {
      this.push(line);
    }
    cb();
  }
}
```

## 常见陷阱与最佳实践

**内存泄漏来源：**

- 使用 `pipe()` 而非 `pipeline()`：错误发生时流不会自动销毁，上游 Readable 持续生产数据导致内存增长
- 在 `objectMode` 流中传递大对象：objectMode 绕过字节级背压，对象数量过多同样会撑爆内存
- 监听 `data` 事件但不处理背压（见上文手动背压示例）

**最佳实践：**

- 优先使用 `stream/promises` 的 `pipeline()` 替代 `pipe()`
- 处理大文件时设置合理的 `highWaterMark`（默认 16KB），根据场景调大可提升吞吐量
- `objectMode` 适合逻辑对象流（如 JSON 记录），不适合高频率小对象

## 常见面试题

- **Duplex 和 Transform 的区别是什么？** Duplex 的读写端完全独立（如 TCP socket，读和写数据没有关联）；Transform 的写入数据经过处理后从读端输出，输入输出有因果关系。

- **背压不处理会怎样？** 写入端消费慢而读取端持续生产，数据在内存中堆积，最终触发 OOM。

- **为什么推荐 `pipeline` 而非 `pipe`？** `pipe` 不会在错误时自动销毁链中的其他流；`pipeline` 会在任意流出错或中止时清理整条链，并以 Promise 形式返回结果，便于 async/await 集成。

- **`highWaterMark` 是什么？** 内部缓冲区的软上限（字节数或对象数）。Readable 超过此值停止从底层读取；Writable 超过此值 `write()` 返回 false 触发背压。
