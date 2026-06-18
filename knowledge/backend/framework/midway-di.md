# MidwayJS 框架与依赖注入

MidwayJS 是阿里巴巴开源的 Node.js 全栈框架，以 TypeScript 为一等公民，通过装饰器驱动的 IoC 容器实现依赖注入，显著提升了 Node.js 服务的可维护性与可测试性。

## 核心概念：IoC 容器与装饰器

MidwayJS 的 IoC（Inversion of Control）容器负责对象的创建、管理和销毁。开发者不需要手动 `new` 对象，只需用装饰器声明依赖关系，容器会自动完成组装。

### @Provide 与 @Inject

```typescript
// service/user.service.ts
import { Provide, Inject } from '@midwayjs/core';
import { UserRepository } from '../repository/user.repository';

@Provide()
export class UserService {
  @Inject()
  userRepository: UserRepository;

  async findById(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  async createUser(data: CreateUserDTO) {
    return this.userRepository.save(data);
  }
}
```

`@Provide()` 将类注册到 IoC 容器，`@Inject()` 声明该属性由容器自动注入。注入的 key 默认为属性名的驼峰形式对应的类名（可自定义）。

### @Controller 与路由装饰器

```typescript
// controller/user.controller.ts
import { Controller, Get, Post, Body, Param, Inject } from '@midwayjs/core';
import { UserService } from '../service/user.service';

@Controller('/api/users')
export class UserController {
  @Inject()
  userService: UserService;

  @Get('/:id')
  async getUser(@Param('id') id: number) {
    return this.userService.findById(id);
  }

  @Post('/')
  async createUser(@Body() data: CreateUserDTO) {
    return this.userService.createUser(data);
  }
}
```

## 作用域（Scope）

MidwayJS 支持三种作用域，通过 `@Scope()` 装饰器指定：

| Scope | 说明 | 适用场景 |
|-------|------|---------|
| `ScopeEnum.Singleton` | 整个应用生命周期只创建一个实例（默认） | 无状态 Service、工具类 |
| `ScopeEnum.Request` | 每个请求创建一个新实例，请求结束后销毁 | 需要感知请求上下文的 Service |
| `ScopeEnum.Prototype` | 每次注入都创建新实例 | 少用，有状态且不共享的场景 |

```typescript
import { Provide, Scope, ScopeEnum } from '@midwayjs/core';

@Provide()
@Scope(ScopeEnum.Request)
export class RequestContextService {
  private requestId: string;

  setRequestId(id: string) {
    this.requestId = id;
  }

  getRequestId() {
    return this.requestId;
  }
}
```

需要注意：**Singleton 作用域的类不能注入 Request 作用域的依赖**，否则在第一次请求后，Singleton 实例持有的始终是第一个请求的 Request 实例。

## 中间件集成

MidwayJS 中间件实现 `IMiddleware` 接口，并通过 `@Middleware()` 装饰器注册：

```typescript
import { Middleware, IMiddleware, NextFunction } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

@Middleware()
export class LoggingMiddleware implements IMiddleware<Context, NextFunction> {
  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      ctx.logger.info(`${ctx.method} ${ctx.url} - ${ctx.status} ${ms}ms`);
    };
  }

  // 可选：忽略特定路径
  ignore(ctx: Context): boolean {
    return ctx.path === '/health';
  }
}
```

在 `src/configuration.ts` 中注册中间件：

```typescript
import { Configuration, App } from '@midwayjs/core';
import { LoggingMiddleware } from './middleware/logging.middleware';

@Configuration({
  imports: [/* 框架组件 */],
})
export class MainConfiguration {
  @App('koa')
  app: Application;

  async onReady() {
    this.app.useMiddleware([LoggingMiddleware]);
  }
}
```

## 完整示例：Controller + Service + Repository 三层架构

```typescript
// repository/user.repository.ts
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entity/user.entity';

@Provide()
export class UserRepository {
  @InjectEntityModel(UserEntity)
  repo: Repository<UserEntity>;

  findOne(options: object) {
    return this.repo.findOne(options);
  }

  save(data: Partial<UserEntity>) {
    return this.repo.save(data);
  }
}
```

```
请求
  │
  ▼
UserController      ← 路由层，参数解析，响应格式化
  │  @Inject
  ▼
UserService         ← 业务逻辑层，事务，规则校验
  │  @Inject
  ▼
UserRepository      ← 数据访问层，ORM 操作
  │  @InjectEntityModel
  ▼
Database
```

## 与 NestJS 依赖注入的对比

| 特性 | MidwayJS | NestJS |
|------|----------|--------|
| 注册方式 | `@Provide()` | `@Injectable()` |
| 注入方式 | 属性注入 `@Inject()` | 构造函数注入（推荐） |
| 模块概念 | 通过 `@Configuration` 组织 | 强制 `@Module()` 分层 |
| 请求上下文 | `@Scope(ScopeEnum.Request)` | `Scope.REQUEST` |
| 生态定位 | 阿里系，对接 FC/EDAS，中文社区活跃 | 通用，npm 生态更广 |
| 设计风格 | 属性注入为主，更简洁 | 构造函数注入，更利于单测 Mock |

NestJS 推荐构造函数注入的原因是：构造函数参数的依赖关系一目了然，且在单元测试中可以不依赖反射系统直接传入 mock 对象。MidwayJS 的属性注入更简洁，但在单元测试时需要借助 `createApp` 等容器工具。

## 面试常问

- `@Provide` 和 `@Injectable`（NestJS）的本质都是什么？（将类元数据注册到 IoC 容器，使容器知道如何创建和管理该类的实例）
- 为什么 Singleton 不能注入 Request 作用域的依赖？（Singleton 实例在整个应用生命周期存在，其属性在第一次解析后就固定了，无法随请求变化）
- 属性注入 vs 构造函数注入各有什么优劣？（属性注入代码简洁但依赖不透明；构造函数注入依赖关系清晰，易于测试和理解）
- MidwayJS 的 IoC 容器何时初始化？（应用启动阶段，`onReady` 生命周期之前，框架会扫描所有 `@Provide` 类并完成 Singleton 的实例化）
