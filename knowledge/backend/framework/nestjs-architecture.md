# NestJS 企业级架构

NestJS 是一个构建高效、可扩展 Node.js 服务端应用的框架，通过强制性的模块化架构、TypeScript 装饰器和依赖注入，将 Angular 的设计理念带入了后端开发，特别适合需要严格规范的企业级项目。

## 核心三元组：Module / Controller / Provider

NestJS 应用由一组模块组成，每个模块封装一个业务领域的完整功能：

```
AppModule（根模块）
  ├── UsersModule
  │     ├── UsersController    ← 处理 HTTP 请求，路由入口
  │     ├── UsersService       ← 业务逻辑（Provider）
  │     └── UsersRepository    ← 数据访问（Provider）
  └── AuthModule
        ├── AuthController
        └── AuthService
```

```typescript
// users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // 允许其他模块注入 UsersService
})
export class UsersModule {}
```

## 依赖注入：构造函数注入

NestJS 推荐构造函数注入，依赖关系一目了然：

```typescript
// users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepo.create(createUserDto);
    return this.userRepo.save(user);
  }
}
```

```typescript
// users/users.controller.ts
import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

## 请求生命周期：Guards / Interceptors / Pipes / Filters 执行顺序

```
请求进入
    │
    ▼
Middleware（全局 → 模块级）
    │
    ▼
Guards（全局 → Controller → Route）        ← 鉴权/授权，返回 boolean
    │
    ▼
Interceptors（全局 → Controller → Route）  ← 请求前逻辑，transform
    │
    ▼
Pipes（全局 → Controller → Route → Param） ← 数据验证和转换
    │
    ▼
Route Handler（实际处理函数）
    │
    ▼
Interceptors（响应后逻辑，反向执行）
    │
    ▼
Exception Filters（捕获异常，全局 → Controller → Route）
    │
    ▼
响应返回
```

```typescript
// 典型鉴权 Guard
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) return false;
    request.user = this.jwtService.verify(token);
    return true;
  }
}

// 应用在 Controller 或路由级别
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {}
```

```typescript
// 响应转换 Interceptor（统一包装响应格式）
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => ({ code: 0, data, timestamp: Date.now() })),
    );
  }
}
```

## TypeORM / Prisma 集成

**TypeORM 方式**（装饰器 + Entity）：

```typescript
// entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

**Prisma 方式**（Schema-first，更好的类型安全）：

```typescript
// 在 Module 中提供 PrismaService
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}

// 在 Service 中使用
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
```

## 微服务支持

NestJS 内置多种微服务传输层，无需更换架构即可扩展为微服务：

```typescript
// 将应用切换为微服务（TCP 传输）
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.TCP,
  options: { host: 'localhost', port: 8877 },
});

// 消息处理
@MessagePattern({ cmd: 'get_user' })
getUser(@Payload() data: { id: number }) {
  return this.usersService.findOne(data.id);
}
```

支持 TCP、Redis、MQTT、gRPC、Kafka、NATS 等多种传输层，方便在 HTTP 和消息驱动架构之间切换。

## NestJS vs 轻量框架选型对比

| 维度 | NestJS | Express / Koa / Hono |
|------|--------|----------------------|
| 上手成本 | 较高，需要理解 DI、模块、装饰器 | 低，概念少 |
| 项目结构 | 强制模块化，规范统一 | 自由，需自行约定 |
| TypeScript 支持 | 一等公民，类型完整 | 通过 `@types` 支持 |
| 测试友好度 | 内置测试工具，DI 易于 Mock | 手动搭建测试结构 |
| 性能开销 | 有元数据处理开销，但通常可接受 | 极轻 |
| 适合场景 | 企业级、多人协作、复杂业务 | 轻量 API、BFF、微服务边缘层 |
| 生态 | 官方模块丰富（Cache、Config、Auth等） | 依赖社区中间件 |

## 何时选择 NestJS

**适合：**
- 团队规模较大，需要统一代码规范
- 业务逻辑复杂，模块间依赖关系多
- 项目预期长期维护，可维护性优先
- 需要 microservices 架构扩展能力

**不适合：**
- 简单的 CRUD API，引入 NestJS 会增加不必要的复杂度
- 极致性能要求的场景（Fastify 适配器可缓解）
- 团队对 TypeScript + 装饰器不熟悉的初期项目

## 面试常问

- NestJS 的 Module 体系解决了什么问题？（通过强制模块化，明确了依赖边界，避免了 Express 项目中常见的"大泥球"架构，并通过 exports 控制依赖可见性）
- Guard 和 Middleware 的区别是什么？（Middleware 在路由匹配前执行，无法访问路由元数据；Guard 在路由匹配后执行，可以通过 `ExecutionContext` 读取 `@Roles()` 等自定义装饰器元数据）
- Interceptor 和 Middleware 的区别？（Interceptor 可以在请求和响应两个时机介入，并且可以修改响应数据；Middleware 只能在请求阶段介入）
- `@Module` 的 exports 字段作用是什么？（控制本模块哪些 Provider 可以被其他导入了本模块的模块使用；不导出的 Provider 仅在本模块内可见）
