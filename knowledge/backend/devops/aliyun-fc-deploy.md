# 阿里云 FC 函数计算部署

阿里云函数计算（Function Compute，FC）是 Serverless 计算服务，开发者只需关注代码本身，无需管理服务器——函数按请求自动扩缩容，按实际用量计费，极适合事件驱动、流量波动大的场景。

## 核心概念

| 概念 | 说明 |
|---|---|
| 函数（Function） | 代码执行单元，每次请求创建（或复用）一个实例 |
| 服务（Service） | 函数的逻辑分组，共享配置（VPC、日志、角色） |
| 触发器（Trigger） | 事件源，如 HTTP 触发器、OSS 触发器、定时触发器 |
| 冷启动 | 首次请求或实例空闲后的启动延迟，Node.js 通常 100-500ms |
| 实例（Instance） | FC 运行函数的容器实例，支持预留实例消除冷启动 |

## 支持的运行时

FC 支持 Node.js（18/20）、Python、Java、Go、PHP、自定义运行时（Custom Runtime / Custom Container）。

## Node.js HTTP 函数示例

### 入口函数（FC 3.0 HTTP 函数）

```ts
// src/index.ts
import { FC } from '@alicloud/fc3-nodejs-runtime';

const handler: FC.HttpHandler = async (req, resp, context) => {
  const path = req.path;
  const method = req.method;

  context.logger.info(`${method} ${path}`);

  if (method === 'GET' && path === '/health') {
    resp.setStatusCode(200);
    resp.setHeader('Content-Type', 'application/json');
    resp.send(JSON.stringify({ status: 'ok', requestId: context.requestId }));
    return;
  }

  // 路由分发（可接入 Express/Koa）
  resp.setStatusCode(404);
  resp.send(JSON.stringify({ message: 'Not Found' }));
};

export default handler;
```

### 接入现有 Express 应用

FC HTTP 触发器可以直接代理 Express 应用，迁移成本极低：

```ts
import express from 'express';
import serverless from '@vendia/serverless-express';

const app = express();
app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from FC!', query: req.query });
});

app.post('/api/echo', (req, res) => {
  res.json({ received: req.body });
});

// FC 入口
export const handler = serverless({ app });
```

## 配置文件（s.yaml — Serverless Devs）

阿里云官方 CLI 工具 Serverless Devs（`s` 命令）使用 `s.yaml` 管理部署：

```yaml
# s.yaml
edition: 3.0.0
name: my-api
access: default   # ~/.s/config.yaml 中配置的 Access Key

resources:
  my-api-fc:
    component: fc3
    props:
      region: cn-hangzhou
      functionName: my-api
      description: My Node.js API on FC
      runtime: nodejs20
      handler: dist/index.handler
      timeout: 30          # 函数超时（秒）
      memorySize: 512      # 内存（MB）

      # 代码包（本地目录或 OSS）
      code: ./

      # 环境变量
      environmentVariables:
        NODE_ENV: production
        DATABASE_URL: '{{ env.DATABASE_URL }}'  # 从环境变量注入

      # HTTP 触发器
      triggers:
        - triggerName: httpTrigger
          triggerType: http
          qualifier: LATEST
          triggerConfig:
            authType: anonymous
            disableURLInternet: false
            methods:
              - GET
              - POST
              - PUT
              - DELETE

      # VPC 配置（访问数据库等内网资源）
      vpcConfig:
        vpcId: vpc-xxxxxxxx
        securityGroupId: sg-xxxxxxxx
        vswitchIds:
          - vsw-xxxxxxxx

      # 自定义域名（需提前在 FC 控制台绑定证书）
      customDomains:
        - domainName: api.example.com
          protocol: HTTPS
          routeConfigs:
            - path: /*
              functionName: my-api
```

## 部署与调用

```bash
# 安装 Serverless Devs
npm install -g @serverless-devs/s

# 配置 Access Key（交互式）
s config add

# 本地调试
s local invoke --event '{"path":"/health","method":"GET"}'

# 构建（TypeScript 编译）
pnpm build   # tsc → dist/

# 部署到 FC
s deploy

# 查看部署信息（函数 URL）
s info

# 查看实时日志
s logs --tail

# 更新并重新部署
s deploy --use-local
```

## 定时触发器（Cron 任务）

```yaml
triggers:
  - triggerName: dailyJob
    triggerType: timer
    triggerConfig:
      cronExpression: 'CRON_TZ=Asia/Shanghai 0 2 * * *'  # 每天凌晨 2 点
      enable: true
      payload: '{"task":"cleanup"}'
```

```ts
// 定时触发函数入口
export const timerHandler: FC.TimerHandler = async (event, context) => {
  const payload = JSON.parse(event.triggerTime ? event.payload ?? '{}' : '{}');
  context.logger.info('Timer triggered', { payload });
  // 执行定时任务
};
```

## 冷启动优化

```yaml
# 预留实例：消除冷启动，保证响应时间
# 在 FC 控制台或 s.yaml 配置
provisionConfig:
  target: 2      # 预留 2 个实例（按实例时长计费）
```

代码层面：
- **减小包体积**：只打包运行时依赖，不含 devDependencies；使用 `esbuild` 打包成单文件。
- **延迟初始化**：数据库连接等重操作放在首次请求时懒加载，不在模块初始化时执行。
- **复用实例内的全局变量**：FC 实例可被多次调用复用，数据库连接池建为模块级单例。

```ts
// 单例连接池，实例复用时无需重新建连
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}
```

## 面试常问

- **Serverless 和传统服务器部署的核心区别**：Serverless 自动扩缩容（包括缩到 0），无需管理服务器，按调用次数/时长计费；适合流量不均匀的场景。
- **冷启动如何影响用户体验**：首次或长时间空闲后的请求需等待实例启动（Node.js 约 100-500ms），对延迟敏感的接口可用预留实例规避。
- **FC 函数如何访问 RDS 数据库**：将函数配置到与 RDS 同 VPC，通过内网地址访问；VPC 内访问不经公网，更安全且延迟低。
- **函数超时怎么设置**：根据业务实际耗时设置，HTTP 触发器最大 600 秒，普通触发器最大 24 小时（以官方文档为准）；超时函数被强制终止，日志可看到 TIMEOUT 错误。
