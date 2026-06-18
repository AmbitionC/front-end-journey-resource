完善的日志与监控体系是生产系统的"眼睛"——没有它，故障发生时只能靠猜；有了它，问题在用户感知之前就能被发现和定位。

## 日志最佳实践

### 结构化日志（JSON）

纯文本日志难以机器解析，生产环境应使用结构化 JSON 格式，便于日志平台检索和聚合。

```ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  // 生产环境输出 JSON，开发环境美化输出
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  base: {
    service: 'api-service',
    env: process.env.NODE_ENV,
  },
  // 不记录敏感字段
  redact: ['req.headers.authorization', 'body.password'],
});

export default logger;
```

输出示例（生产 JSON）：
```json
{
  "level": "info",
  "time": "2024-01-15T10:23:45.123Z",
  "service": "api-service",
  "env": "production",
  "traceId": "abc123",
  "msg": "Request completed",
  "method": "POST",
  "url": "/api/orders",
  "statusCode": 201,
  "duration": 45
}
```

### Express 请求日志中间件

```ts
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import logger from './logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const traceId = req.headers['x-trace-id'] as string ?? randomUUID();
  req.traceId = traceId;
  res.setHeader('X-Trace-Id', traceId);

  res.on('finish', () => {
    const child = logger.child({ traceId });
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    child[level]({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: Date.now() - start,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    }, 'Request completed');
  });

  next();
}
```

### 日志级别规范

| 级别 | 使用场景 |
|---|---|
| `error` | 需要立即处理的错误（未捕获异常、数据库连接失败） |
| `warn` | 潜在问题（降级处理、重试成功、接近限额） |
| `info` | 关键业务事件（用户登录、订单创建、服务启动） |
| `debug` | 调试信息，生产不开启 |

## 监控指标

### Prometheus + Node.js

```ts
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

const register = new Registry();

// 收集 Node.js 默认指标（CPU、内存、GC 等）
collectDefaultMetrics({ register });

// 自定义业务指标
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

// 暴露 /metrics 端点供 Prometheus 抓取
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// 中间件记录指标
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const labels = { method: req.method, route: req.route?.path ?? req.path, status_code: res.statusCode };
    end(labels);
    httpRequestTotal.inc(labels);
  });
  next();
});
```

## 日志收集架构

### ELK Stack（开源自建）

```yaml
# docker-compose.yml 片段

services:
  # 日志收集 Agent
  filebeat:
    image: elastic/filebeat:8.12.0
    volumes:
      - /var/log/app:/var/log/app:ro
      - ./filebeat.yml:/usr/share/filebeat/filebeat.yml:ro

  # 日志存储 & 检索
  elasticsearch:
    image: elasticsearch:8.12.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    volumes:
      - esdata:/usr/share/elasticsearch/data

  # 日志可视化
  kibana:
    image: kibana:8.12.0
    ports:
      - "5601:5601"
```

### 云服务方案（推荐生产使用）

| 云厂商 | 日志服务 | 监控服务 |
|---|---|---|
| 阿里云 | SLS（日志服务） | ARMS、云监控 |
| 腾讯云 | CLS（日志服务） | 云监控 |
| AWS | CloudWatch Logs | CloudWatch Metrics |

## 报警配置

### Prometheus AlertManager 规则

```yaml
# alert-rules.yml
groups:
  - name: api-alerts
    rules:
      # 错误率报警
      - alert: HighErrorRate
        expr: |
          rate(http_requests_total{status_code=~"5.."}[5m])
          /
          rate(http_requests_total[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "API 5xx 错误率超过 5%"
          description: "当前错误率: {{ $value | humanizePercentage }}"

      # 响应时间报警
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95,
            rate(http_request_duration_seconds_bucket[5m])
          ) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P95 响应时间超过 1 秒"
```

### 报警通知（钉钉 Webhook 示例）

```ts
async function sendDingAlert(title: string, content: string) {
  await fetch(process.env.DINGTALK_WEBHOOK!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      msgtype: 'markdown',
      markdown: {
        title,
        text: `## ${title}\n\n${content}\n\n> ${new Date().toLocaleString('zh-CN')}`,
      },
    }),
  });
}
```

## 面试常问

- **为什么要用结构化日志而不是 `console.log`**：结构化 JSON 可以被日志平台（ELK、SLS）自动解析、建索引、按字段检索；纯文本只能全文搜索，难以聚合分析。
- **traceId 的作用**：在分布式系统中，一次请求会经过多个服务，traceId 将所有相关日志串联起来，快速定位问题链路。
- **Prometheus 的 pull 模式有什么好处**：监控服务主动抓取，应用无需感知监控系统地址；天然支持服务发现；抓取失败可立即感知（而 push 模式的沉默是不可区分的）。
- **P99 和平均响应时间哪个更重要**：P99（99 分位）更重要，它代表尾延迟，直接影响 1% 用户体验；平均值容易被少量极慢请求拉高，也容易被大量快请求拉低，掩盖真实问题。
