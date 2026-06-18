# Express 核心原理

Express 是 Node.js 生态中使用最广泛的 Web 框架，以极简的设计著称——核心不过几千行代码，通过中间件和路由系统提供扩展能力。理解其内部原理，有助于写出更健壮的应用，并在选型时做出正确判断。

## 路由系统：Router、Layer 与 Route

Express 的路由由三层结构组成：

```
Application
  └── Router（主路由器）
        ├── Layer（/users, GET）  → Route
        │                              └── Layer（处理函数）
        ├── Layer（/users/:id, GET）→ Route
        └── Layer（中间件函数，无路径绑定）
```

- **Router**：路由容器，维护一个 `stack: Layer[]` 数组，请求进来时依次匹配
- **Layer**：对路径和处理函数的封装，持有编译后的路径正则
- **Route**：具体路由对象，一个 Route 可以绑定多个 HTTP 方法的处理函数

```typescript
import express, { Router } from 'express';

const router = Router();

// router.get() 内部：创建 Route，再在 Route 上绑定 GET 处理函数
// router.stack 中添加一个指向该 Route 的 Layer
router.get('/users', (req, res) => {
  res.json([]);
});

// 同一路径不同方法，使用 Route 链式调用
router.route('/users/:id')
  .get((req, res) => res.json({ id: req.params.id }))
  .put((req, res) => res.json({ updated: true }))
  .delete((req, res) => res.status(204).send());
```

## 中间件管道执行

Express 中间件本质上是一个函数 `(req, res, next) => void`，所有中间件和路由处理函数都挂载在同一个 `stack` 数组上，按注册顺序依次执行。

```typescript
import express from 'express';
const app = express();

// 全局中间件：每个请求都会经过
app.use(express.json());

// 路径匹配中间件
app.use('/api', (req, res, next) => {
  console.log('API request:', req.path);
  next(); // 不调用 next() 则请求在此终止
});

// 路由处理
app.get('/api/hello', (req, res) => {
  res.send('Hello');
});

// 如果没有路由匹配，最终到达 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});
```

**执行机制**：Express 遍历 `stack`，对每个 Layer 测试路径是否匹配。匹配则调用处理函数，不匹配则跳过继续遍历。`next()` 触发遍历向前推进。

## req/res 的 prototype 扩展

Express 通过原型链扩展了 Node.js 原生的 `IncomingMessage` 和 `ServerResponse`，提供了更多便捷方法：

- `req.params`、`req.query`、`req.body`（body-parser 注入）
- `res.json()`、`res.status()`、`res.send()`、`res.redirect()`

这意味着你可以在 Express 应用启动前修改原型来全局扩展 req/res：

```typescript
import express, { Request, Response } from 'express';

// 在 TypeScript 中扩展类型声明
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

// 扩展请求对象的实际行为
const app = express();

app.use((req, res, next) => {
  // 解析 JWT 后将 userId 挂在 req 上
  req.userId = parseTokenUserId(req.headers.authorization);
  next();
});

app.get('/profile', (req: Request, res: Response) => {
  res.json({ userId: req.userId });
});
```

## 错误处理中间件：四参数签名

Express 通过函数参数个数来区分普通中间件和错误处理中间件——当函数有 **4 个参数** `(err, req, res, next)` 时，Express 将其识别为错误处理中间件。

```typescript
import express, { Request, Response, NextFunction } from 'express';
const app = express();

// 业务路由
app.get('/data', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await fetchData();
    res.json(data);
  } catch (err) {
    next(err); // 将错误传递给错误处理中间件
  }
});

// 错误处理中间件必须放在所有路由之后
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
  });
});
```

注意：**异步路由中的错误必须手动 `next(err)`**，Express 4 不会自动捕获 async 函数中的 rejected Promise（Express 5 改进了这一点）。

## Router 挂载与子应用

Express 支持将 Router 作为独立模块挂载，实现路由的模块化组织：

```typescript
// routes/users.ts
import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => res.json({ list: [] }));
router.get('/:id', (req, res) => res.json({ id: req.params.id }));

export default router;

// app.ts
import express from 'express';
import usersRouter from './routes/users';

const app = express();
app.use('/api/users', usersRouter); // 挂载，路径前缀会被剥离后传给 router

// 完整路径 /api/users/:id 在 usersRouter 内看到的 req.path 是 /:id
```

还可以用 `express()` 创建完全独立的子应用（sub-application），拥有独立的中间件栈、错误处理和设置，适合微前端或模块化大型应用。

## TypeScript 类型化实战

```typescript
import express, { Request, Response, NextFunction } from 'express';

interface User {
  id: number;
  name: string;
  email: string;
}

// 使用泛型参数为 req.params / req.body / req.query 提供类型
type GetUserParams = { id: string };
type CreateUserBody = Omit<User, 'id'>;

const router = express.Router();

router.get(
  '/:id',
  async (req: Request<GetUserParams>, res: Response<User | { error: string }>, next: NextFunction) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }
    // 模拟数据库查询
    const user: User = { id, name: 'Alice', email: 'alice@example.com' };
    res.json(user);
  }
);

router.post(
  '/',
  async (req: Request<{}, User, CreateUserBody>, res: Response<User>, next: NextFunction) => {
    const newUser: User = { id: Date.now(), ...req.body };
    res.status(201).json(newUser);
  }
);
```

## Express 的优势与局限

| 维度 | Express 的表现 |
|------|---------------|
| 学习成本 | 极低，API 简单，文档丰富 |
| 灵活性 | 高，不约束项目结构 |
| 生态 | 庞大，几乎所有功能都有对应中间件 |
| TypeScript 支持 | 需要 `@types/express`，类型推断有限 |
| 异步错误处理 | 需手动 `next(err)`，Express 4 有坑 |
| 大型项目组织 | 无官方规范，项目结构容易混乱 |
| 内置功能 | 极少，路由 + 中间件，其余靠第三方 |

与 NestJS、MidwayJS 等框架相比，Express 更像是一个"工具箱"而非"框架"。它在快速原型、小型项目、或作为其他框架底层（如 NestJS 默认使用 Express 适配器）时表现出色；但在需要团队统一规范、大规模项目或强 TypeScript 类型安全的场景下，更有主张性（opinionated）的框架会是更好的选择。

## 面试常问

- Express 如何区分普通中间件和错误中间件？（函数形参个数：3 个是普通中间件，4 个是错误中间件）
- `app.use()` 和 `app.get()` 的区别？（`app.use()` 匹配所有 HTTP 方法，且路径是前缀匹配；`app.get()` 只匹配 GET 且是精确路径匹配）
- Express 4 中 async 路由的错误为什么不会被捕获？（Express 4 中路由处理函数的返回值被忽略，rejected Promise 不会触发错误中间件，必须用 try/catch + next(err)）
- Router 和 sub-application 的区别？（Router 是轻量的路由容器，共享父应用的设置；sub-application 是完整的独立应用实例，拥有独立配置）
