FastAPI 是当前构建 AI 后端最主流的 Python 框架，原生支持 async/await、自动生成 OpenAPI 文档，配合 Pydantic 的类型校验，能让接口定义和 LLM 流式返回写得极其简洁。

## 核心特性

FastAPI 的三个核心优势：

| 特性 | 说明 |
|------|------|
| 自动文档 | 访问 `/docs`（Swagger UI）或 `/redoc` 即得交互文档，无需额外维护 |
| 类型驱动 | 路径参数、查询参数、请求体均通过 Python 类型注解声明，运行时自动校验 |
| async 原生 | 基于 Starlette，路由函数可以是 `async def`，适合 I/O 密集型的 LLM 调用 |

这三点放在 AI 后端场景下尤其重要：LLM 调用本质是高延迟的网络 I/O，async 让单进程也能并发处理大量请求而不被某个慢请求阻塞；类型驱动意味着请求参数的校验、错误提示、文档三者由同一份类型定义自动生成，省去了大量手写样板代码；自动文档则让前端和算法同学能直接对照接口联调。需要注意的是，uvicorn 单进程是单事件循环，CPU 密集任务（如本地推理、向量计算）应放到线程池或独立进程，否则会阻塞整个事件循环。

安装与启动：

```python
pip install fastapi uvicorn
uvicorn main:app --reload
```

## 路由定义

### 路径参数与查询参数

```python
from fastapi import FastAPI

app = FastAPI()

# 路径参数：{item_id} 自动映射到函数参数
@app.get("/items/{item_id}")
async def get_item(item_id: int, verbose: bool = False):
    return {"id": item_id, "verbose": verbose}
```

- 路径参数在 URL 模板里声明，类型注解决定解析方式，传错类型返回 422
- 带默认值的参数自动识别为查询参数，无默认值则为必填查询参数

### POST 路由

```python
@app.post("/chat", status_code=201)
async def create_chat(message: str):
    return {"echo": message}
```

## 请求体：Pydantic Model

复杂请求体用 Pydantic `BaseModel` 描述，FastAPI 自动完成反序列化和校验：

```python
from pydantic import BaseModel, Field
from typing import Optional

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4096)
    model: str = "gpt-4o"
    temperature: Optional[float] = Field(0.7, ge=0.0, le=2.0)
    stream: bool = False

@app.post("/chat")
async def chat(req: ChatRequest):
    # req.message、req.model 已经过校验
    return {"model": req.model, "input": req.message}
```

**常见陷阱**：函数参数同时出现路径参数、查询参数和 Body 时，FastAPI 按以下规则区分：
- 在路径模板里的 → 路径参数
- 类型是 `BaseModel` 子类的 → 请求体
- 其余带默认值或简单类型的 → 查询参数

## 依赖注入（Depends）

`Depends` 是 FastAPI 实现横切逻辑（鉴权、数据库连接、配置读取）的核心机制：

```python
from fastapi import Depends, HTTPException, Header

async def verify_token(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    token = authorization.removeprefix("Bearer ")
    # 验证 token，返回用户信息
    return {"user_id": "u_123"}

@app.post("/chat")
async def chat(req: ChatRequest, user=Depends(verify_token)):
    return {"user": user["user_id"], "input": req.message}
```

依赖可以嵌套：`Depends(A)` 里可以再 `Depends(B)`，FastAPI 自动解析执行顺序。依赖函数可以是普通函数也可以是 `async def`，与路由函数的 async 特性一致。

## 流式响应（StreamingResponse）

AI 场景的核心需求——让 LLM 的 token 边生成边返回，避免用户等待完整响应：

```python
from fastapi.responses import StreamingResponse
import asyncio

async def token_generator(prompt: str):
    """模拟 LLM 逐 token 流式输出"""
    words = f"你好，关于「{prompt}」的回答如下：这是一段流式输出的内容。".split("，")
    for word in words:
        yield f"data: {word}\n\n"   # SSE 格式
        await asyncio.sleep(0.1)    # 模拟网络延迟
    yield "data: [DONE]\n\n"

@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    return StreamingResponse(
        token_generator(req.message),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
```

`X-Accel-Buffering: no` 是 Nginx 反向代理下必须加的响应头，否则 Nginx 会缓冲流式内容导致客户端无法实时接收。

## 中间件与错误处理

### 全局异常处理

```python
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "path": str(request.url)},
    )
```

### CORS 中间件

AI 后端常被前端直接调用，CORS 是必备配置：

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend.com"],  # 生产环境不要用 "*"
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)
```

## 与 AI 集成的典型骨架

以调用 OpenAI 兼容接口并流式返回为例：

```python
import httpx
from fastapi import FastAPI, Depends
from fastapi.responses import StreamingResponse

app = FastAPI()

LLM_API_URL = "https://api.openai.com/v1/chat/completions"
LLM_API_KEY = "sk-..."

async def llm_stream(messages: list[dict], model: str = "gpt-4o"):
    """向 LLM 发起流式请求，逐块 yield 给调用方"""
    payload = {"model": model, "messages": messages, "stream": True}
    headers = {"Authorization": f"Bearer {LLM_API_KEY}"}

    async with httpx.AsyncClient(timeout=60) as client:
        async with client.stream("POST", LLM_API_URL, json=payload, headers=headers) as resp:
            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    yield f"{line}\n\n"

@app.post("/v1/chat")
async def chat_endpoint(req: ChatRequest):
    messages = [{"role": "user", "content": req.message}]
    return StreamingResponse(
        llm_stream(messages, req.model),
        media_type="text/event-stream",
    )
```

关键点：使用 `httpx.AsyncClient` 而非 `requests`，后者是同步阻塞的，会卡住整个事件循环，导致服务在 LLM 响应期间无法处理其他请求。

## 面试要点：与 Flask / Django 对比

**FastAPI vs Flask**：Flask 是同步框架（Flask 2.x 支持 async 但生态主要是同步），FastAPI 从设计上就是异步优先；Flask 没有内置数据校验，需要 marshmallow 等额外库；FastAPI 自动生成文档，Flask 需要 flask-restx 等插件。

**FastAPI vs Django**：Django 是全栈框架，自带 ORM、Admin、Auth；FastAPI 是微框架，只做 HTTP 路由和数据校验，ORM 需自选（SQLAlchemy、Tortoise-ORM）。AI 后端通常不需要 Django 的全栈能力，FastAPI 的轻量和 async 优势更突出。

**常见追问**：
- 为什么 `StreamingResponse` 的生成器必须是 `async def`？因为 FastAPI 运行在 asyncio 事件循环中，同步生成器会阻塞循环，应改用 `async for` + `yield`
- `Depends` 和装饰器有什么区别？`Depends` 支持依赖嵌套、可测试（测试时可覆盖依赖），装饰器不具备这两点
- FastAPI 的并发模型是什么？单进程多协程（asyncio），生产环境通常配合 `--workers N` 启动多个 Uvicorn 进程，或用 Gunicorn + UvicornWorker
