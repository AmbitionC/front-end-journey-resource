Buffer 是 Node.js 处理二进制数据的核心类，在文件 I/O、网络传输、加密等场景中不可或缺。它在 V8 堆外分配内存，专为高性能二进制操作设计。

## Buffer 与 Uint8Array 的关系

Node.js v6 之后，`Buffer` 是 `Uint8Array` 的子类，可以在任何接受 `Uint8Array` 的地方使用 Buffer。但两者有重要区别：

| 特性 | Buffer | Uint8Array |
|------|--------|-----------|
| 所在环境 | Node.js 专属 | 浏览器 + Node.js |
| 内存分配 | V8 堆外（C++ 层） | V8 堆内 |
| 编码支持 | 内置 utf8/base64/hex 等 | 无内置编码方法 |
| 默认填充 | `Buffer.alloc` 用零填充 | 新建 TypedArray 默认零填充 |

```typescript
const buf = Buffer.from([1, 2, 3]);
console.log(buf instanceof Uint8Array); // true
console.log(buf instanceof Buffer);     // true
```

## 三种创建方式

### Buffer.alloc — 安全分配

```typescript
// 分配 10 字节，全部初始化为 0
const buf1 = Buffer.alloc(10);

// 分配 10 字节，用 0xff 填充
const buf2 = Buffer.alloc(10, 0xff);

console.log(buf1); // <Buffer 00 00 00 00 00 00 00 00 00 00>
console.log(buf2); // <Buffer ff ff ff ff ff ff ff ff ff ff>
```

**使用场景：** 需要确保内存安全（无旧数据泄露）时，如写入加密密钥的临时缓冲区。

### Buffer.allocUnsafe — 高性能分配

```typescript
// 分配 10 字节，不清零（可能包含旧内存数据）
const buf = Buffer.allocUnsafe(10);
// 必须在写入数据前使用，否则可能泄露旧内存内容
buf.fill(0); // 手动清零，等效于 alloc
```

`allocUnsafe` 比 `alloc` 快（跳过清零步骤），适合立即要写入数据的场景。**永远不要将未写入的 `allocUnsafe` Buffer 直接发送给外部。**

### Buffer.from — 从现有数据创建

```typescript
// 从字符串创建（默认 utf8 编码）
const fromString = Buffer.from('Hello, 世界', 'utf8');

// 从字节数组创建
const fromArray = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]);

// 从另一个 Buffer 创建（深拷贝）
const original = Buffer.from('test');
const copy = Buffer.from(original);
copy[0] = 0x58; // 修改 copy 不影响 original

// 从 ArrayBuffer 创建（注意：默认是引用，不是拷贝）
const arrayBuffer = new ArrayBuffer(8);
const sharedBuf = Buffer.from(arrayBuffer);
// sharedBuf 和 arrayBuffer 共享同一块内存
```

## 编码与解码

Node.js Buffer 支持多种编码格式：

```typescript
const text = '前端工程师';

// 编码：字符串 → Buffer
const utf8Buf  = Buffer.from(text, 'utf8');
const base64Buf = Buffer.from(text, 'utf8');

// 解码：Buffer → 字符串
console.log(utf8Buf.toString('utf8'));   // 前端工程师
console.log(utf8Buf.toString('base64')); // 6YeN56uv5bel56iL5biI
console.log(utf8Buf.toString('hex'));    // e5898de7ab af...

// base64 编解码
const encoded = Buffer.from('Hello World').toString('base64');
// SGVsbG8gV29ybGQ=
const decoded = Buffer.from(encoded, 'base64').toString('utf8');
// Hello World
```

| 编码名称 | 用途 |
|---------|------|
| `utf8` / `utf-8` | 默认，Unicode 文本 |
| `ascii` | 7 位 ASCII，超出部分截断 |
| `base64` | 二进制转文本传输（HTTP、JWT） |
| `hex` | 调试、加密哈希值展示 |
| `binary` / `latin1` | 每个字节映射为一个字符（旧协议） |
| `ucs2` / `utf16le` | UTF-16 小端序（Windows API） |

## 切片与拷贝

```typescript
const buf = Buffer.from('Hello World');

// slice / subarray：返回引用（共享内存）
const slice = buf.slice(0, 5);  // 或 buf.subarray(0, 5)
slice[0] = 0x68; // 修改 slice 同时修改了 buf！
console.log(buf.toString()); // hello World

// copy：将内容拷贝到另一个 Buffer
const dest = Buffer.alloc(5);
buf.copy(dest, 0, 0, 5); // dest 是独立副本
dest[0] = 0x48;
console.log(buf.toString()); // 不受影响

// Buffer.concat：合并多个 Buffer（返回新 Buffer）
const part1 = Buffer.from('Hello');
const part2 = Buffer.from(' World');
const merged = Buffer.concat([part1, part2]);
// 等同于：Buffer.concat([part1, part2], part1.length + part2.length)
```

**重要陷阱：** `slice()` 和 `subarray()` 返回的是**引用**，修改切片会影响原始 Buffer。如果需要独立副本，使用 `Buffer.from(original.slice(start, end))`。

## 实战案例

### 读取二进制文件（解析 BMP 头）

```typescript
import { readFileSync } from 'fs';

function parseBmpHeader(filePath: string): void {
  const buf = readFileSync(filePath);

  // BMP 文件头：偏移 0-1 是标识符（"BM"）
  const signature = buf.slice(0, 2).toString('ascii');
  // 偏移 2-5 是文件大小（小端序 32 位整数）
  const fileSize = buf.readUInt32LE(2);
  // 偏移 18-21 是图像宽度
  const width = buf.readInt32LE(18);
  // 偏移 22-25 是图像高度
  const height = buf.readInt32LE(22);

  console.log({ signature, fileSize, width, height });
}
```

### 网络协议自定义帧

```typescript
// 自定义二进制协议：4 字节长度 + N 字节 payload
function encodeFrame(payload: string): Buffer {
  const payloadBuf = Buffer.from(payload, 'utf8');
  const frame = Buffer.allocUnsafe(4 + payloadBuf.length);

  frame.writeUInt32BE(payloadBuf.length, 0); // 写入长度头
  payloadBuf.copy(frame, 4);                 // 写入 payload

  return frame;
}

function decodeFrame(frame: Buffer): string {
  const length = frame.readUInt32BE(0);
  return frame.slice(4, 4 + length).toString('utf8');
}
```

### 加密与哈希

```typescript
import { createHash, createHmac } from 'crypto';

// SHA-256 哈希
const hash = createHash('sha256')
  .update(Buffer.from('password'))
  .digest('hex'); // 返回 hex 字符串

// HMAC
const hmac = createHmac('sha256', Buffer.from('secret-key'))
  .update('message')
  .digest('base64');
```

## 常见面试题

- **Buffer.alloc 和 Buffer.allocUnsafe 的区别？** `alloc` 用零填充分配的内存，安全但略慢；`allocUnsafe` 不清零，性能更高但可能包含旧内存数据，必须在使用前写入数据。

- **Buffer.from(str) 和 Buffer.from(buffer) 的区别？** 从字符串创建会编码字符串为字节；从另一个 Buffer 创建会**深拷贝**数据，是独立副本。

- **slice() 和 copy() 的区别？** `slice()`（及 `subarray()`）返回原 Buffer 的视图（引用同一内存），修改会互相影响；`copy()` 是真正的内存拷贝，独立存在。

- **为什么 Buffer 在 V8 堆外分配？** 大量二进制数据（如文件内容、网络数据）在 V8 堆内会给 GC 带来压力。堆外内存由 Node.js 直接管理，生命周期与 Buffer 对象绑定，GC 时只需回收 JS 对象引用，实际内存由 C++ 层释放。

- **如何安全地将 Buffer 转换为 JSON 传输？** 使用 `buf.toString('base64')` 将二进制数据编码为 base64 字符串，接收方用 `Buffer.from(str, 'base64')` 还原。
