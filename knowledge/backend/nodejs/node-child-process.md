# child_process 与进程通信

Node.js 的 `child_process` 模块允许创建子进程来执行系统命令、其他语言脚本或另一个 Node.js 程序，是与操作系统深度集成、突破单进程限制的重要工具。

## 四种创建方式对比

| API | 返回值 | 执行方式 | shell 解析 | 适用场景 |
|-----|--------|---------|-----------|---------|
| `spawn` | `ChildProcess` | 流式（Streaming） | 否 | 长时间运行、大量输出的命令 |
| `exec` | `ChildProcess` | 缓存输出 | **是**（`/bin/sh`） | 短命令，方便获取完整输出 |
| `execFile` | `ChildProcess` | 缓存输出 | 否 | 直接执行文件，比 exec 更安全 |
| `fork` | `ChildProcess` | 流式 | 否 | 运行 Node.js 模块，自带 IPC 通道 |

> 以上四者都有对应的 Promise 版本，通过 `util.promisify` 或 `child_process/promises` 使用。

## spawn — 流式处理大量输出

```typescript
import { spawn } from 'child_process';

const ls = spawn('ls', ['-lh', '/usr']);

ls.stdout.on('data', (data: Buffer) => {
  process.stdout.write(data); // 逐块处理，不缓存
});

ls.stderr.on('data', (data: Buffer) => {
  console.error('stderr:', data.toString());
});

ls.on('close', (code: number | null) => {
  console.log(`子进程退出，退出码: ${code}`);
});
```

`spawn` 不经过 shell 解析，参数以数组形式传入，**天然防止命令注入**。

## exec — 快速执行短命令

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function getGitLog(): Promise<string> {
  const { stdout, stderr } = await execAsync('git log --oneline -10');
  if (stderr) console.warn(stderr);
  return stdout;
}
```

`exec` 会缓存全部输出，默认限制 200KB（`maxBuffer` 选项可调整），超出时进程会被终止并抛出错误。适合输出量有限的命令。

## execFile — 比 exec 更安全

```typescript
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// 直接执行可执行文件，不经过 shell，避免注入
const { stdout } = await execFileAsync('/usr/bin/python3', [
  'script.py',
  '--input', userInput // 用户输入作为参数传入，不会被 shell 解释
]);
```

## fork — Node.js 进程间通信

`fork` 专为运行 Node.js 子模块设计，自动建立双向 IPC（Inter-Process Communication）通道：

```typescript
// parent.ts
import { fork } from 'child_process';
import path from 'path';

const child = fork(path.join(__dirname, 'worker-process.ts'));

// 向子进程发送消息
child.send({ cmd: 'compute', data: [1, 2, 3, 4, 5] });

// 接收子进程消息
child.on('message', (result: unknown) => {
  console.log('子进程计算结果:', result);
});

child.on('exit', (code) => {
  console.log(`子进程退出，退出码: ${code}`);
});
```

```typescript
// worker-process.ts（子进程）
process.on('message', (msg: { cmd: string; data: number[] }) => {
  if (msg.cmd === 'compute') {
    const sum = msg.data.reduce((a, b) => a + b, 0);
    process.send!({ result: sum });
    process.exit(0);
  }
});
```

### stdio 配置

```typescript
import { spawn } from 'child_process';

// 将子进程的 stdio 继承自父进程（输出直接打印到终端）
spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  cwd: '/path/to/project'
});

// 分别控制 stdin/stdout/stderr
spawn('ffmpeg', ['-i', 'input.mp4', 'output.webm'], {
  stdio: ['ignore', 'pipe', 'pipe'] // stdin 关闭，stdout/stderr 可读
});
```

## 处理退出码

```typescript
import { spawn } from 'child_process';

function runCommand(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);

    child.on('close', (code: number | null, signal: string | null) => {
      if (code === 0) {
        resolve();
      } else if (signal) {
        reject(new Error(`进程被信号 ${signal} 终止`));
      } else {
        reject(new Error(`进程异常退出，退出码: ${code}`));
      }
    });

    child.on('error', reject); // 命令不存在等情况
  });
}
```

常见退出码：`0` = 成功，非零 = 失败，`null` = 被信号终止（如 SIGKILL）。

## 安全注意事项：命令注入

`exec` 通过 shell 执行命令，用户输入直接拼接到命令字符串中极其危险：

```typescript
// ❌ 极度危险：用户输入直接拼入命令
exec(`ls ${userInput}`);
// 攻击者传入 "; rm -rf /"，命令变成 ls ; rm -rf /

// ✅ 安全做法一：使用 spawn 并将参数作为数组传入
spawn('ls', [userInput]); // userInput 不会被 shell 解释

// ✅ 安全做法二：使用 execFile 直接调用可执行文件
execFile('/bin/ls', [userInput]);

// ✅ 安全做法三：对用户输入做严格校验/白名单
const safeInput = /^[a-zA-Z0-9_\-./]+$/.test(userInput) ? userInput : null;
```

## 常见面试题

- **spawn 和 exec 最本质的区别是什么？** exec 经过 shell 解析（支持管道、重定向等 shell 特性，但有注入风险），spawn 直接执行可执行文件；exec 缓存输出（有内存上限），spawn 以流的方式处理输出。

- **fork 和 spawn 的区别？** fork 是 spawn 的特殊形式，专门用于运行 Node.js 模块，会自动建立父子进程间的 IPC 通道，可以通过 `send/message` 互传消息。

- **IPC 通道通过什么传递数据？** 底层通常是 Unix domain socket 或 Windows named pipe，`process.send()` 传递的数据会被 JSON 序列化，因此不能传递函数、循环引用等不可序列化的对象。

- **如何防止 exec 命令注入？** 改用 `spawn` 或 `execFile` 将用户输入作为参数数组传入，或对用户输入做严格的白名单校验。永远不要将用户输入直接拼接到 `exec` 的命令字符串中。
