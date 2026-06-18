# GraphQL 核心概念与使用

GraphQL 是 Facebook 开源的 API 查询语言，让客户端精确声明所需数据，彻底解决 REST API 中常见的过度获取（over-fetching）和获取不足（under-fetching）问题。

## GraphQL vs REST

| 维度 | REST | GraphQL |
|------|------|---------|
| 数据获取 | 固定字段，多端同一接口 | 客户端精确声明需要的字段 |
| 请求次数 | 多资源需多次请求 | 单次请求获取所有相关数据 |
| 版本管理 | 需要 v1/v2 等版本 | 通过字段废弃（@deprecated）平滑演进 |
| 类型系统 | 无强制约束 | 强类型 Schema，自描述 |
| 学习成本 | 低 | 较高 |

## Schema 定义语言（SDL）

GraphQL API 从 Schema 定义开始，描述所有可用的类型和操作。

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
  createdAt: String
}

type Post {
  id: ID!
  title: String!
  content: String
  author: User!
  tags: [String!]!
}

# 查询入口
type Query {
  user(id: ID!): User
  users(page: Int, pageSize: Int): [User!]!
  post(id: ID!): Post
}

# 变更入口
type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User
  deletePost(id: ID!): Boolean!
}

# 订阅入口
type Subscription {
  postCreated: Post!
  userOnline(userId: ID!): User!
}

# 输入类型
input CreateUserInput {
  name: String!
  email: String!
}
```

`!` 表示非空（Non-Null），`[Post!]!` 表示非空数组且数组元素非空。

## 三种操作类型

### Query（查询）

```graphql
# 客户端精确声明所需字段
query GetUserWithPosts {
  user(id: "42") {
    id
    name
    posts {
      id
      title
      tags
    }
  }
}
```

### Mutation（变更）

```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
    email
  }
}
```

变量在请求的 `variables` 字段中传入：

```json
{
  "input": { "name": "Alice", "email": "alice@example.com" }
}
```

### Subscription（订阅）

基于 WebSocket 建立长连接，服务端推送实时数据：

```graphql
subscription OnPostCreated {
  postCreated {
    id
    title
    author {
      name
    }
  }
}
```

## NestJS + Apollo GraphQL 实现

```typescript
// app.module.ts
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql', // 代码优先，自动生成 SDL
    }),
  ],
})
export class AppModule {}

// user.resolver.ts
@Resolver(() => User)
export class UserResolver {
  constructor(
    private usersService: UsersService,
    private postsService: PostsService,
  ) {}

  @Query(() => User, { nullable: true })
  async user(@Args('id') id: string): Promise<User | null> {
    return this.usersService.findById(id);
  }

  @Mutation(() => User)
  async createUser(@Args('input') input: CreateUserInput): Promise<User> {
    return this.usersService.create(input);
  }

  // 字段解析器：按需加载关联数据
  @ResolveField(() => [Post])
  async posts(@Parent() user: User): Promise<Post[]> {
    return this.postsService.findByUserId(user.id);
  }
}
```

## N+1 问题与 DataLoader

GraphQL 字段解析器按需触发，若查询列表时每条记录都单独查关联数据，会产生 N+1 查询。

```
查询 100 个用户的文章：
  1 次查询获取用户列表
  + 100 次查询各用户的文章
= 101 次数据库查询！
```

**DataLoader** 通过批处理和缓存解决此问题：

```typescript
import DataLoader from 'dataloader';

// 批量加载：将 N 个独立查询合并为 1 次 IN 查询
const postLoader = new DataLoader<string, Post[]>(async (userIds) => {
  const posts = await postRepository.findBy({ userId: In([...userIds]) });
  // 按 userId 分组，保持与 keys 顺序一致
  return userIds.map((id) => posts.filter((p) => p.userId === id));
});

// 在 Resolver 中使用
@ResolveField(() => [Post])
async posts(@Parent() user: User): Promise<Post[]> {
  return this.postLoader.load(user.id); // 自动批处理
}
```

## 错误处理

GraphQL 始终返回 200 状态码，错误信息在响应体的 `errors` 字段中：

```json
{
  "data": { "user": null },
  "errors": [
    {
      "message": "User not found",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["user"],
      "extensions": { "code": "NOT_FOUND" }
    }
  ]
}
```

## 面试常问

- **GraphQL 一定比 REST 好吗？**
  不一定。GraphQL 适合数据关系复杂、多端（Web/Mobile）需求差异大的场景；REST 更简单，适合简单 CRUD、公开 API、缓存友好的场景（GraphQL 的 POST 请求无法直接走 HTTP 缓存）。
- **什么是 N+1 问题，如何解决？**
  查询列表时每条记录的关联数据触发单独查询，用 DataLoader 批量合并为 IN 查询。
- **GraphQL 的 Schema 优先和代码优先哪种更好？**
  各有优劣。Schema 优先（SDL first）契约清晰；代码优先（Code first，如 NestJS）类型安全，与 TypeScript 配合更好。
- **如何防止 GraphQL 查询复杂度攻击？**
  设置 `maxDepth`（最大查询深度）和 `maxComplexity`（最大复杂度）限制，使用 `graphql-depth-limit`、`graphql-query-complexity` 等库。
