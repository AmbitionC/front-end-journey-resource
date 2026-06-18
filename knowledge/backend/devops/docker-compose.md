Docker Compose 用一个 YAML 文件声明式地定义和管理多容器应用，一条命令启动整个开发环境（应用服务 + 数据库 + 缓存 + 消息队列），告别"十步启动教程"。

## 核心概念

- **Service（服务）**：Compose 管理的基本单元，对应一个容器类型（可多副本）。
- **Network（网络）**：Compose 默认为每个项目创建独立网络，同项目服务通过**服务名**直接互通（如 `postgres:5432`）。
- **Volume（数据卷）**：持久化数据，数据库数据存在 volume 中，容器重建不丢失。

## 典型配置示例

以 Node.js API + PostgreSQL + Redis 为例：

```yaml
# docker-compose.yml
version: '3.9'

services:
  # ---- 应用服务 ----
  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner          # 多阶段构建指定 stage
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://pguser:pgpass@postgres:5432/mydb
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy  # 等 postgres 健康检查通过再启动
      redis:
        condition: service_started
    volumes:
      - ./src:/app/src           # 挂载源码，开发时热更新
    networks:
      - app-net
    restart: unless-stopped

  # ---- PostgreSQL ----
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: pguser
      POSTGRES_PASSWORD: pgpass
      POSTGRES_DB: mydb
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql  # 初始化脚本
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pguser -d mydb"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - app-net

  # ---- Redis ----
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass redispass --appendonly yes
    volumes:
      - redisdata:/data
    networks:
      - app-net

volumes:
  pgdata:
  redisdata:

networks:
  app-net:
    driver: bridge
```

## 常用命令

```bash
# 启动所有服务（-d 后台，--build 强制重新构建镜像）
docker compose up -d --build

# 查看所有服务状态
docker compose ps

# 查看某服务日志（-f 实时跟踪）
docker compose logs -f api

# 进入某服务容器
docker compose exec api sh

# 停止并删除容器（保留 volume 和 image）
docker compose down

# 停止并删除容器 + volume（谨慎：数据库数据会丢失）
docker compose down -v

# 只重启某个服务
docker compose restart api

# 扩展服务副本数
docker compose up -d --scale api=3
```

## 开发与生产环境分离

不同环境共享基础配置，用 override 文件覆盖差异项：

```yaml
# docker-compose.override.yml（开发专用，自动加载）
services:
  api:
    build:
      target: base           # 开发 stage，含 devDependencies
    command: pnpm dev        # 热更新命令
    volumes:
      - .:/app               # 挂载整个项目目录
    environment:
      NODE_ENV: development
      DEBUG: "app:*"
```

```yaml
# docker-compose.prod.yml（生产，需手动指定）
services:
  api:
    image: registry.cn-hangzhou.aliyuncs.com/myapp/api:${TAG}
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    environment:
      NODE_ENV: production
```

```bash
# 生产启动（合并基础 + 生产配置）
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 健康检查与依赖顺序

`depends_on` 只保证容器**启动顺序**，不保证服务就绪。配合 `healthcheck` 确保下游服务真正可用：

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 10s
  timeout: 5s
  retries: 3
  start_period: 30s  # 容器启动后等待 30s 再开始健康检查
```

## 环境变量管理

```bash
# .env 文件（同目录自动加载，不提交 Git）
POSTGRES_PASSWORD=secret123
REDIS_PASSWORD=redispass
TAG=v1.2.3
```

```yaml
# docker-compose.yml 中引用
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

## 面试常问

- **`depends_on` 能保证服务启动完毕吗**：不能，只保证容器启动顺序。应用需要自行实现重试逻辑（如 `wait-for-it.sh` 脚本或 healthcheck + condition）。
- **开发和生产为什么分开 Compose 文件**：开发环境挂载源码、暴露调试端口、使用 devDependencies；生产环境用已构建镜像、不暴露多余端口、配置资源限制。
- **`docker compose down -v` 的风险**：会删除 named volumes，数据库数据永久丢失，生产环境严禁随意执行。
- **服务间如何通信**：同一 Compose 网络内，服务通过**服务名**作为 hostname 互相访问（如 `postgres:5432`），无需知道 IP。
