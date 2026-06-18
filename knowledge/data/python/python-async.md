Python 的 `asyncio` 模块让单线程程序具备并发处理 I/O 密集型任务的能力，核心思想是"等待时让出控制权"，而非为每个任务开一个线程。

## 同步、异步与多线程的适用场景

| 场景 | 推荐方案 | 原因 |
|------|----------|------|
| CPU 密集型（压缩、加密、矩阵运算） | `multiprocessing` | GIL 限制，多进程才能真正并行 |
| I/O 密集型、高并发（HTTP 请求、数据库、文件读写） | `asyncio` | 等待 I/O 时不占用线程，开销极低 |
| 少量并发 + 兼容同步库 | `threading` | 适合旧代码迁移，但受 GIL 限制 |
| 简单顺序逻辑、无并发需求 | 同步 | 可读性最好，无额外复杂度 |

asyncio 的性能优势来自**协程切换成本远低于线程上下文切换**，一个进程可轻松维护数万个协程。

## async def / await 基础

`async def` 定义一个协程函数，调用它不会立即执行，而是返回一个协程对象；`await` 挂起当前协程，把控制权交还给事件循环，直到等待的对象完成。

```python
import asyncio

async def fetch_data(url: str) -> str:
    # 模拟 I/O 等待
    await asyncio.sleep(1)
    return f"data from {url}"

async def main():
    result = await fetch_data("https://example.com")
    print(result)
```

`await` 只能用在 `async def` 函数内部，否则会触发 `SyntaxError`。

## asyncio.run() 与事件循环

`asyncio.run()` 是 Python 3.7+ 推荐的入口点，它创建一个新的事件循环、运行传入的协程、完成后关闭循环。

```python
# 正确：程序入口
asyncio.run(main())

# 不要手动管理循环（旧写法，已不推荐）
loop = asyncio.get_event_loop()
loop.run_until_complete(main())
loop.close()
```

**注意**：不要在已运行的事件循环中再次调用 `asyncio.run()`，Jupyter Notebook 中常见此问题，需改用 `await main()` 或安装 `nest_asyncio`。

## 并发执行：gather 与 create_task

### asyncio.gather

`gather` 并发调度多个协程，等所有完成后返回结果列表，顺序与传入顺序一致。

```python
async def main():
    results = await asyncio.gather(
        fetch_data("url1"),
        fetch_data("url2"),
        fetch_data("url3"),
    )
    # 3 个请求并发执行，总耗时约 1 秒而非 3 秒
    print(results)
```

`gather` 默认传播第一个异常；设置 `return_exceptions=True` 可将异常作为结果返回，避免其他任务被取消。

### asyncio.create_task

`create_task` 立即将协程包装为 `Task` 并调度执行，适合需要**先启动、后等待**的场景。

```python
async def main():
    task1 = asyncio.create_task(fetch_data("url1"))
    task2 = asyncio.create_task(fetch_data("url2"))

    # 两个任务已经在并发运行
    result1 = await task1
    result2 = await task2
```

`create_task` 返回的 `Task` 对象支持 `.cancel()`、`.done()`、`.add_done_callback()` 等方法，控制粒度更细。

### gather vs create_task 对比

- **gather**：一次性声明所有协程，代码简洁，适合固定数量的并发。
- **create_task**：任务可以在不同时机创建，适合动态并发或需要单独取消的场景。

## 异步上下文管理器与异步迭代器

### 异步上下文管理器

实现 `__aenter__` 和 `__aexit__` 即可与 `async with` 配合，常见于数据库连接池、HTTP 会话：

```python
import aiohttp

async def fetch_with_session(url: str) -> str:
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.text()
```

### 异步迭代器

实现 `__aiter__` 和 `__anext__`，或使用 `async def` + `yield` 定义异步生成器：

```python
async def paginate(base_url: str):
    page = 1
    while True:
        data = await fetch_data(f"{base_url}?page={page}")
        if not data:
            break
        yield data
        page += 1

async def main():
    async for chunk in paginate("https://api.example.com/items"):
        print(chunk)
```

## 与同步代码交互：run_in_executor

`asyncio` 事件循环是单线程的，**在协程中调用阻塞的同步函数会冻结整个事件循环**。正确做法是用 `run_in_executor` 将其放到线程池或进程池中执行：

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor
import time

def blocking_io():
    time.sleep(2)  # 模拟阻塞 I/O
    return "done"

async def main():
    loop = asyncio.get_running_loop()

    # 使用默认线程池
    result = await loop.run_in_executor(None, blocking_io)

    # 使用自定义线程池
    with ThreadPoolExecutor(max_workers=4) as pool:
        result = await loop.run_in_executor(pool, blocking_io)

    print(result)
```

CPU 密集型任务应换用 `ProcessPoolExecutor`，以绕过 GIL。

## 常见误区

### 忘记 await

```python
# 错误：协程对象没有被执行，Python 3.11+ 会发出 RuntimeWarning
async def main():
    fetch_data("url")  # 忘记 await，什么都不会发生

# 正确
async def main():
    await fetch_data("url")
```

### 在同步函数中调用异步函数

```python
# 错误：无法在普通函数中 await
def sync_wrapper():
    result = await fetch_data("url")  # SyntaxError

# 正确选项一：将包装函数也改为 async
async def async_wrapper():
    return await fetch_data("url")

# 正确选项二：从同步上下文入口调用
result = asyncio.run(fetch_data("url"))
```

### CPU 密集型误用 asyncio

asyncio 不能加速 CPU 密集型任务——协程等待的是 I/O，不是计算。数字运算、图像处理、机器学习推理等应使用 `multiprocessing` 或 `concurrent.futures.ProcessPoolExecutor`。

### 过度使用 gather 导致雪崩

一次并发数百个请求可能压垮服务端或触发限流。应使用 `asyncio.Semaphore` 控制并发上限：

```python
async def limited_fetch(sem: asyncio.Semaphore, url: str):
    async with sem:
        return await fetch_data(url)

async def main():
    sem = asyncio.Semaphore(10)  # 最多 10 个并发
    tasks = [limited_fetch(sem, url) for url in urls]
    return await asyncio.gather(*tasks)
```

## 面试要点

**协程与线程的区别**：协程是用户态的协作式调度，切换成本极低，无需加锁（单线程）；线程是内核态的抢占式调度，存在竞争条件，需要锁保护共享状态。

**`asyncio.gather` 与 `asyncio.wait` 的区别**：`gather` 返回有序结果列表，任一异常默认取消其余任务；`wait` 返回 `(done, pending)` 集合，提供更细粒度的控制（`FIRST_COMPLETED`、`FIRST_EXCEPTION`、`ALL_COMPLETED`）。

**事件循环原理**：事件循环维护一个就绪队列和一个 I/O 等待集合，每次迭代（tick）先处理就绪的回调，再调用 `select`/`epoll` 等系统调用检查 I/O 事件，将完成的 I/O 对应协程放入就绪队列。

**Task 取消机制**：调用 `task.cancel()` 会在协程的下一个 `await` 点注入 `CancelledError`，协程可以用 `try/except asyncio.CancelledError` 捕获并做清理，但清理后必须重新 `raise`，否则取消会被静默吞掉。

**`asyncio.shield`**：保护内部协程不受外部取消影响，适合"取消外层操作但内层必须完成"的场景（如写数据库）。
