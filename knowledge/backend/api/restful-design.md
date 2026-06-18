REST（Representational State Transfer）是一种基于 HTTP 协议的 API 设计风格，以资源为中心，通过 HTTP 动词表达操作意图，是目前 Web API 的主流范式。

## 核心设计原则

### 资源命名

URL 代表资源，应使用**名词复数形式**，不使用动词。

```
# 好的设计
GET  /users          → 获取用户列表
GET  /users/42       → 获取 ID=42 的用户
POST /users          → 创建用户
PUT  /users/42       → 全量更新用户
PATCH /users/42      → 部分更新用户
DELETE /users/42     → 删除用户

# 不好的设计（URL 含动词）
GET /getUsers
POST /createUser
POST /users/42/delete
```

### HTTP 方法语义

| 方法 | 语义 | 幂等性 | 安全性 |
|------|------|--------|--------|
| GET | 查询资源 | 是 | 是 |
| POST | 创建资源 | 否 | 否 |
| PUT | 全量替换资源 | 是 | 否 |
| PATCH | 部分更新资源 | 否（通常） | 否 |
| DELETE | 删除资源 | 是 | 否 |

**幂等**：多次相同请求结果与一次相同。**安全**：不修改服务器状态。

### 嵌套资源

表达从属关系时，可以使用嵌套 URL，但通常不超过两级：

```
GET  /users/42/orders       → 获取用户 42 的订单列表
GET  /users/42/orders/7     → 获取用户 42 的 7 号订单
POST /users/42/orders       → 为用户 42 创建订单

# 三级以上容易混乱，改为查询参数更清晰
GET /orders?userId=42&status=pending  ← 推荐
GET /users/42/orders/7/items/3        ← 不推荐
```

## HTTP 状态码规范

正确使用状态码是 RESTful 设计的关键，让客户端无需解析 body 就能理解请求结果。

```
2xx 成功
  200 OK           → GET/PUT/PATCH 成功
  201 Created      → POST 创建成功（配合 Location 响应头返回资源地址）
  204 No Content   → DELETE 成功（无响应体）

4xx 客户端错误
  400 Bad Request  → 请求参数校验失败
  401 Unauthorized → 未认证（未登录）
  403 Forbidden    → 已认证但无权限
  404 Not Found    → 资源不存在
  409 Conflict     → 资源冲突（如邮箱重复注册）
  422 Unprocessable Entity → 语义错误（参数格式正确但业务不合法）
  429 Too Many Requests    → 触发限流

5xx 服务端错误
  500 Internal Server Error → 服务器未预期的错误
  503 Service Unavailable   → 服务暂时不可用
```

## 统一响应结构

约定统一的响应格式，便于前端统一处理：

```typescript
// 成功响应
{
  "data": { "id": 42, "name": "Alice", "email": "alice@example.com" },
  "meta": { "timestamp": "2024-01-01T00:00:00Z" }
}

// 错误响应
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "用户不存在",
    "details": [{ "field": "userId", "issue": "ID 42 does not exist" }]
  }
}

// 列表响应（含分页信息）
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

## 分页、过滤与排序

```
# 分页（页码式）
GET /posts?page=2&pageSize=20

# 分页（游标式，适合无限滚动）
GET /posts?cursor=eyJpZCI6MTAwfQ&limit=20

# 过滤
GET /orders?status=paid&userId=42

# 排序（+ 升序，- 降序）
GET /products?sort=-price,+name

# 字段筛选（稀疏字段集）
GET /users?fields=id,name,email
```

## 版本管理

```
# URL 路径版本（最直观，推荐）
/api/v1/users
/api/v2/users

# 请求头版本
Accept: application/vnd.myapp.v2+json

# 查询参数（不推荐，容易被忽略）
GET /users?version=2
```

## NestJS 中的 RESTful 实现

```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
```

## 面试常问

- **PUT 和 PATCH 的区别？**
  PUT 是全量替换（不传的字段会被置空/删除），PATCH 是部分更新（只修改传入的字段）。
- **POST 和 PUT 都能创建资源，区别是什么？**
  POST 由服务器决定资源 ID（客户端不知道），是非幂等的；PUT 由客户端指定完整 URL，多次请求结果相同（幂等）。
- **401 和 403 的区别？**
  401 是"你是谁我不知道"（未认证），403 是"我知道你是谁，但你没权限"（未授权）。
- **REST 是协议吗？**
  不是，REST 是一种架构风格，不是协议。完全遵循所有 REST 约束的 API 称为 RESTful，实际工程中通常只满足其中大部分约束。
