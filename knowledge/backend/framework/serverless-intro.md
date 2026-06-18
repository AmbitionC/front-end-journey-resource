# Serverless 函数计算入门

Serverless（无服务器）并非没有服务器，而是开发者无需管理服务器——云平台负责资源分配、弹性扩缩容和运维，开发者只需关注函数代码本身。它代表了云计算从"租服务器"到"买算力"的演进。

## FaaS vs BaaS

Serverless 架构通常由两类服务共同构成：

| 类型 | 全称 | 说明 | 典型产品 |
|------|------|------|---------|
| FaaS | Function as a Service | 运行无状态函数，按调用次数和执行时间计费 | AWS Lambda、阿里云 FC、腾讯云 SCF |
| BaaS | Backend as a Service | 托管的后端能力：数据库、存储、消息队列、认证 | Firebase、AWS DynamoDB、阿里云 OSS |

一个典型的 Serverless 应用：HTTP 请求触发 FaaS 函数，函数调用 BaaS（如托管数据库）处理数据，结果返回。开发者不需要维护任何服务器进程。

## 冷启动问题与缓解策略

**冷启动（Cold Start）**是 FaaS 的核心挑战：当函数长时间未被调用时，容器实例被回收；下次请求到来时，平台需要重新初始化容器、加载运行时、执行初始化代码，这个过程会增加几百毫秒到几秒的额外延迟。

```
冷启动流程：
[下载代码包] → [启动容器] → [初始化 Runtime] → [执行初始化代码] → [处理请求]
                                                                      ↑
热启动流程：                                               [复用已有实例] → [处理请求]
```

**缓解策略：**
- **预置并发（Provisioned Concurrency）**：主流平台均支持，预先启动并保持一定数量的热实例，彻底消除冷启动（需额外付费）
- **定时预热**：用定时触发器每隔几分钟 ping 一次函数，防止实例被回收
- **减小代码包体积**：精简依赖，使用 tree-shaking 和 bundle 工具（如 esbuild），减少代码加载时间
- **减少初始化开销**：将数据库连接等耗时操作放在函数 handler 外部（模块级别），容器复用时可跳过
- **选择轻量运行时**：Node.js / Python 的冷启动远快于 Java / .NET

## 无状态函数设计

FaaS 函数必须设计为无状态——同一函数的不同调用可能在不同实例上执行，本地内存、临时文件不可跨调用共享：

```typescript
// 错误：将状态存在内存中
const cache: Record<string, string> = {}; // 不同实例的 cache 互不共享！

export async function handler(event: APIGatewayEvent) {
  if (cache[event.pathParameters!.id]) {
    return { statusCode: 200, body: cache[event.pathParameters!.id] };
  }
  // ...
}

// 正确：使用外部存储（Redis、数据库）共享状态
import { createClient } from 'redis';
const redis = createClient({ url: process.env.REDIS_URL });

export async function handler(event: APIGatewayEvent) {
  const id = event.pathParameters!.id;
  const cached = await redis.get(`user:${id}`);
  if (cached) {
    return { statusCode: 200, body: cached };
  }
  // ...
}
```

## 事件驱动触发器

FaaS 函数通过各种事件触发，不同平台的触发器大同小异：

| 触发类型 | 典型场景 | 平台示例 |
|---------|---------|---------|
| HTTP 触发 | API 接口、BFF 层 | API Gateway + Lambda |
| 定时触发 | 定时任务、数据聚合 | EventBridge Cron / FC 定时触发 |
| 消息队列触发 | 异步任务、削峰填谷 | SQS、阿里云 MNS、腾讯云 CMQ |
| 对象存储触发 | 图片处理、文件转码 | S3 事件、OSS 触发 |
| 数据库变更触发 | 数据同步、审计日志 | DynamoDB Streams |

## TypeScript 函数处理器示例

以下是一个适配 AWS Lambda HTTP 触发器的 TypeScript 函数，展示了初始化优化和错误处理的最佳实践：

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';

// 数据库连接在函数 handler 外部初始化
// 容器复用时不会重复创建连接（利用热启动的内存复用）
let prisma: PrismaClient;

function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// Lambda 函数入口
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  // 防止 Lambda 等待事件循环清空（数据库连接等异步资源会阻塞函数退出）
  context.callbackWaitsForEmptyEventLoop = false;

  const db = getPrismaClient();
  const userId = event.pathParameters?.id;

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing user ID' }),
    };
  }

  try {
    const user = await db.user.findUnique({ where: { id: parseInt(userId, 10) } });
    if (!user) {
      return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
    }
    return { statusCode: 200, body: JSON.stringify(user) };
  } catch (err) {
    console.error('Database error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
```

## 主流平台概念对比

| 特性 | AWS Lambda | 阿里云 FC | 腾讯云 SCF |
|------|-----------|----------|-----------|
| 运行时 | Node.js、Python、Java、Go 等 | Node.js、Python、PHP、Java 等 | Node.js、Python、Java、Go 等 |
| 最大执行时长 | 15 分钟 | 24 小时（按需实例） | 12 小时 |
| 预置并发 | 支持 | 支持 | 支持 |
| 触发器生态 | 最丰富（AWS 全系产品） | 阿里云产品深度集成 | 腾讯云产品集成 |
| 本地开发工具 | SAM CLI | Serverless Devs | SCF CLI |
| 适用场景偏向 | 全球部署，海外业务 | 国内业务，阿里云技术栈 | 国内业务，腾讯云技术栈 |

## 计费模式

Serverless 按实际使用量计费，与传统按时间租用服务器不同：

- **调用次数**：通常前 N 次/月免费（各平台免费额度不同）
- **执行时长 × 内存**：以 GB·秒为单位，函数配置的内存越大、运行越久，费用越高
- **流量费用**：外网出流量额外计费

对于流量不稳定、有明显峰谷特征的业务，Serverless 相比固定规格的 ECS/容器可以显著降低成本；但对于高并发、持续稳定的流量，预置并发的成本可能接近甚至超过传统部署。

## 适用与不适用场景

**适合 Serverless 的场景：**
- 流量波动大、有明显峰谷的业务（如电商大促）
- 定时任务、数据处理 pipeline
- BFF 层、轻量 API 网关
- 事件驱动的异步任务（图片压缩、消息处理）
- 低频调用的内部工具 API

**不适合的场景：**
- 长连接服务（WebSocket、gRPC streaming）——函数执行有时间限制
- 对延迟极度敏感的接口——冷启动难以完全消除
- 有大量本地状态或内存缓存需求的服务
- 复杂的有状态计算任务

## 面试常问

- 冷启动的本质是什么，有哪些优化手段？（本质是容器/实例从零初始化的开销；优化手段：预置并发、减小包体积、模块级初始化、定时预热、选择轻量运行时）
- 为什么 FaaS 函数要设计为无状态？（同一函数可能在任意实例上执行，且实例随时可能被回收，本地内存无法保证持久化或共享）
- `callbackWaitsForEmptyEventLoop = false` 的作用是什么？（告诉 Lambda 不要等待事件循环清空再返回，防止数据库连接等异步资源导致函数超时）
- FaaS 和传统长运行服务在成本模型上的核心区别？（FaaS 按实际执行时长付费，空闲不计费，适合稀疏流量；长运行服务按时间付费，更适合持续高流量）
