Koa 是由 Express 原班人马打造的下一代 Node.js Web 框架，其核心创新是基于 async/await 的洋葱模型中间件机制，彻底解决了 Express 回调嵌套和错误处理的痛点。

## 洋葱模型（Onion Model）

Koa 的中间件执行顺序形如洋葱：请求从外层中间件依次进入，响应时再从内层依次返回外层。每个中间件通过 `await next()` 将控制权传给下一个中间件，`next()` 返回后再执行后续逻辑。

```
请求 ──▶ 中间件 A（前半段）
              ──▶ 中间件 B（前半段）
                      ──▶ 中间件 C（处理）
              ◀── 中间件 B（后半段）
◀── 中间件 A（后半段）
响应
```

这一模型使得**在中间件中同时处理"请求前"和"响应后"逻辑**变得非常自然，例如在同一个中间件函数里记录请求开始时间和响应耗时。

## koa-compose 的实现原理

`koa-compose` 是洋葱模型的核心，源码精简但设计精妙：

```typescript
type Middleware = (ctx: Context, next: () => Promise<void>) => Promise<void>;

function compose(middleware: Middleware[]) {
  return function (ctx: Context, next?: () => Promise<void>) {
    let index = -1;

    function dispatch(i: number): Promise<void> {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times'));
      }
      index = i;
      let fn = middleware[i];
      if (i === middleware.length) fn = next!;
      if (!fn) return Promise.resolve();
      try {
        return Promise.resolve(fn(ctx, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return dispatch(0);
  };
}
```

关键点：`dispatch(i)` 返回一个 Promise，`await next()` 实质上就是 `await dispatch(i + 1)`。如果中间件中调用了两次 `next()`，`index` 检测会抛出错误。

## ctx 对象结构

`ctx`（Context）是 Koa 对每个请求创建的上下文对象，封装了 `req`/`res` 并提供了大量便捷属性：

```typescript
// ctx 的主要属性
ctx.request      // Koa 封装的 Request 对象
ctx.response     // Koa 封装的 Response 对象
ctx.req          // Node.js 原生 IncomingMessage
ctx.res          // Node.js 原生 ServerResponse

// 常用快捷方式（委托自 ctx.request / ctx.response）
ctx.method       // HTTP 方法
ctx.url          // 请求 URL
ctx.path         // 路径部分
ctx.query        // 解析后的 query string 对象
ctx.headers      // 请求头
ctx.body         // 响应体（赋值即设置响应内容）
ctx.status       // HTTP 状态码
ctx.set()        // 设置响应头
ctx.throw()      // 抛出 HTTP 错误
ctx.state        // 在中间件间共享数据的推荐容器
```

## async/await 中间件 vs Express 回调中间件

```typescript
// Express 风格（回调）
app.use((req, res, next) => {
  const start = Date.now();
  next(); // next() 之后的代码无法感知后续中间件何时完成
  // 这里拿不到正确的响应时间，因为 next() 是同步返回的
  console.log(`耗时: ${Date.now() - start}ms`); // 始终接近 0
});

// Koa 风格（async/await）
app.use(async (ctx, next) => {
  const start = Date.now();
  await next(); // 等待所有后续中间件执行完毕
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`); // 正确的响应时间
});
```

Express 的 `next()` 是同步调用，无法等待异步中间件完成，导致"请求-响应"生命周期的前后逻辑难以封装在同一函数中。Koa 通过 `await next()` 完美解决了这一问题。

## 错误处理

Koa 的错误处理非常统一：在最外层中间件用 `try/catch` 包裹即可捕获整个中间件链的错误。

```typescript
import Koa from 'koa';
const app = new Koa();

// 全局错误处理中间件（必须第一个注册）
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err: any) {
    ctx.status = err.status || err.statusCode || 500;
    ctx.body = {
      code: ctx.status,
      message: err.message || 'Internal Server Error',
    };
    // 触发 app 的 error 事件，用于日志上报
    ctx.app.emit('error', err, ctx);
  }
});

// 业务中间件可以直接使用 ctx.throw() 或 throw new Error()
app.use(async (ctx) => {
  if (!ctx.query.token) {
    ctx.throw(401, 'Missing token'); // 抛出带有状态码的错误
  }
  ctx.body = { ok: true };
});

app.on('error', (err, ctx) => {
  console.error('Server error:', err.message);
});
```

## TypeScript 实战：日志 + 鉴权中间件栈

```typescript
import Koa, { Context, Next } from 'koa';
import Router from '@koa/router';

const app = new Koa();
const router = new Router();

// 1. 日志中间件
const logger = async (ctx: Context, next: Next) => {
  const start = Date.now();
  console.log(`--> ${ctx.method} ${ctx.path}`);
  await next();
  console.log(`<-- ${ctx.method} ${ctx.path} ${ctx.status} ${Date.now() - start}ms`);
};

// 2. 鉴权中间件
const auth = async (ctx: Context, next: Next) => {
  const token = ctx.headers['authorization']?.split(' ')[1];
  if (!token) {
    ctx.throw(401, 'Unauthorized');
  }
  // 将用户信息存入 ctx.state，后续中间件可读取
  ctx.state.user = { id: 1, name: 'Demo User' };
  await next();
};

// 3. 路由
router.get('/profile', auth, async (ctx: Context) => {
  ctx.body = { user: ctx.state.user };
});

app.use(logger);
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000);
```

## 常用中间件生态

| 包名 | 功能 |
|------|------|
| `@koa/router` | 路由管理，支持参数路由、嵌套路由 |
| `koa-bodyparser` | 解析 JSON、表单请求体 |
| `koa-static` | 静态文件服务 |
| `koa-session` | Session 管理 |
| `koa-helmet` | 安全相关 HTTP 头设置 |
| `koa-cors` | 跨域请求处理 |

## 与 Express 中间件模型的对比

| 维度 | Koa | Express |
|------|-----|---------|
| 中间件签名 | `(ctx, next) => Promise` | `(req, res, next) => void` |
| 异步支持 | 原生 async/await | 需要手动处理 Promise |
| 错误处理 | try/catch + `ctx.throw()` | 四参数错误中间件 `(err, req, res, next)` |
| 响应方式 | 赋值 `ctx.body` | 调用 `res.send()` |
| 框架大小 | 极简，无内置功能 | 内置路由、基础中间件 |
| 控制流 | 洋葱模型，可感知下游 | 线性，不可感知下游 |

## 面试常问

- 为什么 Koa 叫"洋葱模型"？（请求从外到内穿透中间件，响应从内到外回溯，形如洋葱切面）
- `koa-compose` 如何防止 `next()` 被调用两次？（用 `index` 变量记录上次调用的位置，下次调用时若 `i <= index` 则抛出错误）
- Koa 和 Express 错误处理的最大区别是什么？（Koa 用 try/catch 统一在外层捕获，Express 需要调用 `next(err)` 触发专门的四参数错误中间件）
- `ctx.state` 的作用是什么？（官方推荐的跨中间件共享数据的命名空间，避免直接污染 `ctx` 对象）
