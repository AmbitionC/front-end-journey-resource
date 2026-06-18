# API 版本管理与兼容性

随着业务演进，API 变更不可避免。合理的版本管理策略能在迭代新功能的同时，保持对老客户端的向后兼容，避免"破坏性变更"造成线上故障。

## 破坏性变更 vs 非破坏性变更

在决定是否引入新版本之前，先判断变更是否会破坏现有客户端：

**非破坏性变更（可直接上线）**：
- 新增可选字段（响应体加字段、请求体加可选参数）
- 新增 API 端点
- 新增枚举值（但客户端需能处理未知值）
- Bug 修复（行为趋于正确）

**破坏性变更（需要版本控制）**：
- 删除或重命名字段
- 修改字段类型（如 `string → number`）
- 修改业务语义（相同参数返回不同含义的结果）
- 修改必填参数规则
- 修改 HTTP 方法或 URL 路径

## 版本管理策略

### 策略一：URL 路径版本（最常用）

```
GET /api/v1/users
GET /api/v2/users
POST /api/v1/orders
```

优点：直观、易于调试、可在 Swagger/文档中清晰分组；缺点：URL 冗长，资源 URL 不够"纯粹"。

### 策略二：请求头版本

```
GET /api/users
Accept: application/vnd.myapp.v2+json
# 或自定义头
API-Version: 2
```

优点：URL 保持清洁；缺点：需要在请求头中处理，浏览器调试不如 URL 直观，缓存策略复杂。

### 策略三：查询参数版本

```
GET /api/users?version=2
```

优点：灵活；缺点：容易被忽略、混入业务参数，不推荐作为主要策略。

### 策略四：内容协商（Content Negotiation）

属于请求头版本的变体，严格遵循 HTTP 规范，适合追求 RESTful 纯粹性的团队，实际使用较少。

## NestJS 版本控制实现

```typescript
// main.ts — 启用版本控制
app.enableVersioning({
  type: VersioningType.URI, // 或 HEADER / MEDIA_TYPE
  defaultVersion: '1',
});

// 控制器级别版本
@Controller({ path: 'users', version: '1' })
export class UsersV1Controller {
  @Get()
  findAll() {
    return { version: 1, data: [] };
  }
}

@Controller({ path: 'users', version: '2' })
export class UsersV2Controller {
  @Get()
  findAll() {
    // v2 新的数据结构
    return { version: 2, items: [], pagination: {} };
  }
}

// 单个路由级别版本
@Controller('products')
export class ProductsController {
  @Get()
  @Version('1')
  findAllV1() { /* ... */ }

  @Get()
  @Version('2')
  findAllV2() { /* ... */ }
}
```

使用 `VersioningType.URI` 时，路由自动映射到 `/v1/users`、`/v2/users`。

## 版本生命周期管理

```
新版本发布 → 双版本并行维护 → 旧版本废弃通知 → 旧版本下线
```

### 废弃通知最佳实践

```typescript
// 响应头通知废弃
@Get()
@Version('1')
async findAllV1(@Res({ passthrough: true }) res: Response) {
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', 'Sat, 31 Dec 2025 23:59:59 GMT');
  res.setHeader('Link', '</api/v2/users>; rel="successor-version"');
  return this.usersService.findAll();
}
```

`Deprecation` 和 `Sunset` 是 IETF 草案标准头，告知客户端此版本即将下线的时间。

### GraphQL 的字段废弃

GraphQL 通过 `@deprecated` 指令在 Schema 层面标注废弃字段，无需独立版本：

```graphql
type User {
  id: ID!
  name: String!
  username: String @deprecated(reason: "Use `name` field instead")
}
```

## 兼容性设计技巧

### 宽进严出（Robustness Principle）

接口应对输入保持宽容（忽略未知字段而非报错），对输出保持清晰（严格定义返回格式）。

```typescript
// 不要因为未知字段拒绝请求
@Post()
async create(@Body() dto: CreateUserDto) {
  // ValidationPipe 配合 whitelist: true 自动过滤未知字段，而非报错
}

// 配置全局 Pipe
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,      // 过滤未声明字段
  forbidNonWhitelisted: false, // 不报错，只过滤
  transform: true,
}));
```

### 枚举扩展的安全处理

新增枚举值是非破坏性的，但要求客户端能容错处理未知值：

```typescript
// 服务端新增了 'REFUNDED' 状态
type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'REFUNDED';

// 客户端需要处理未知状态
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: '待支付',
    PAID: '已支付',
    SHIPPED: '已发货',
  };
  return labels[status] ?? '状态未知'; // 容错处理
}
```

## 多版本 API 的代码组织

```
src/
  users/
    v1/
      users.controller.ts   ← v1 控制器
      users.service.ts      ← v1 业务逻辑（或复用通用 service）
      dto/
    v2/
      users.controller.ts   ← v2 控制器（差异部分）
      dto/
    users.service.ts         ← 公共业务逻辑（v1/v2 共用）
    users.module.ts
```

尽量让版本差异集中在 Controller 和 DTO 层，核心业务逻辑（Service、Repository）保持共用。

## 面试常问

- **推荐哪种版本管理方式？**
  URL 路径版本（`/v1/`）最直观，工程上最易维护，是大多数公司的实际选择；学术上请求头版本更"RESTful"，但实践复杂。
- **什么时候需要发新版本？**
  有破坏性变更时才需要新版本；非破坏性变更（加字段、加接口）直接上线。
- **旧版本何时可以下线？**
  监控旧版本的请求量降至极低（如低于 1%），且完成对外公告（给出充足的迁移期，通常 3–6 个月）后才能下线。
- **GraphQL 需要版本管理吗？**
  通常不需要，通过 `@deprecated` 字段逐步演进 Schema，保持单一端点；重大重构时可引入独立端点（如 `/graphql/v2`）。
