![Compose 应用图：web、api、db 三个 service 位于显式 network；db 使用 named volume，api 等待 db healthcheck，配置与 secret 分开注入；标出 depends_on 只表达启动依赖](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/docker-compose-service-dependency-network-v1.webp)
*图：沿图中的节点与箭头阅读，重点是明确 services、networks、volumes、depends_on 健康条件、配置合并与 secrets。*

---

Docker Compose 用 YAML 声明多容器应用的 services、networks、volumes、configs 和 secrets，并可统一创建本地依赖。它常用于开发与集成测试；是否用于生产取决于高可用、调度、备份和运维要求。（参见 [Compose file reference](https://docs.docker.com/reference/compose-file/)）

## 定位：本地开发与测试的多容器编排

Docker Compose 的核心价值在于**本地开发和集成测试**，而不是生产部署。它解决的问题是：一个 Agent 系统往往依赖多个基础服务（LLM 代理、任务队列、向量检索、关系存储），手动逐一启动和配置既繁琐又容易出错。

| 场景 | 推荐方案 |
|------|---------|
| 本地开发 / CI 集成测试 | Docker Compose |
| 单机生产部署 | Docker Compose（有限场景）+ 手动备份 |
| 多机生产 / 高可用 | Kubernetes / 云托管服务 |

## compose.yaml 核心字段

Compose V2 推荐使用 `compose.yaml`（或 `compose.yml`），不再需要 `version` 字段。

```yaml
# compose.yaml 顶层字段结构
services:       # 必填：每个服务的配置
networks:       # 可选：自定义网络（默认自动创建 bridge 网络）
volumes:        # 可选：命名 volume，持久化数据
configs:        # 可选：只读配置文件注入
secrets:        # 可选：敏感数据注入
```

核心服务字段：

| 字段 | 作用 |
|------|------|
| `image` / `build` | 指定镜像或构建上下文 |
| `ports` | 宿主机:容器端口映射 |
| `environment` / `env_file` | 环境变量注入 |
| `depends_on` | 声明启动顺序与条件 |
| `healthcheck` | 定义服务就绪探针 |
| `volumes` | 挂载目录或命名卷 |
| `networks` | 加入指定网络 |
| `restart` | 容器退出后的重启策略 |

## 完整示例：Agent 服务栈

以 Node.js Agent API + Redis（任务队列）+ PostgreSQL（业务数据）+ Qdrant（向量数据库）为例：

```yaml
# compose.yaml
services:
  # ---- Agent API 服务 ----
  agent-api:
    build:
      context: .
      dockerfile: Dockerfile
      target: dev              # 多阶段构建，开发 stage
    ports:
      - "3000:3000"
    env_file:
      - .env                   # 从 .env 文件加载所有变量
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://pguser:pgpass@postgres:5432/agentdb
      REDIS_URL: redis://:redispass@redis:6379
      QDRANT_URL: http://qdrant:6333
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      qdrant:
        condition: service_healthy
    volumes:
      - ./src:/app/src          # 挂载源码，支持热重载
    networks:
      - agent-net
    restart: unless-stopped

  # ---- PostgreSQL：业务数据存储 ----
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: pguser
      POSTGRES_PASSWORD: pgpass
      POSTGRES_DB: agentdb
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pguser -d agentdb"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - agent-net

  # ---- Redis：任务队列与缓存 ----
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass redispass --appendonly yes
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "redispass", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - agent-net

  # ---- Qdrant：向量数据库 ----
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"            # REST API
      - "6334:6334"            # gRPC
    volumes:
      - qdrantdata:/qdrant/storage
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:6333/healthz || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s
    networks:
      - agent-net

volumes:
  pgdata:
  redisdata:
  qdrantdata:

networks:
  agent-net:
    driver: bridge
```

## 服务依赖关系图

```mermaid
graph TD
    A[agent-api<br/>:3000] -->|DATABASE_URL| B[(postgres<br/>:5432)]
    A -->|REDIS_URL| C[(redis<br/>:6379)]
    A -->|QDRANT_URL| D[(qdrant<br/>:6333)]

    B -->|healthcheck<br/>pg_isready| B
    C -->|healthcheck<br/>redis-cli ping| C
    D -->|healthcheck<br/>curl /healthz| D

    style A fill:#4A90D9,color:#fff
    style B fill:#336791,color:#fff
    style C fill:#DC382D,color:#fff
    style D fill:#FF6B35,color:#fff
```

`agent-api` 在三个依赖服务全部通过 healthcheck 后才会启动，避免了连接失败导致的启动崩溃。

## 环境变量管理

### .env 文件与 env_file 指令

```bash
# .env（同目录自动加载，不提交 Git，加入 .gitignore）
POSTGRES_PASSWORD=secret123
REDIS_PASSWORD=redispass
OPENAI_API_KEY=sk-xxxx
TAG=v1.2.3
```

```yaml
# 方式一：env_file 批量加载
services:
  agent-api:
    env_file:
      - .env
      - .env.local             # 可叠加多个文件，后者覆盖前者

# 方式二：environment 单独声明，引用 .env 中的变量
services:
  agent-api:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      NODE_ENV: development    # 直接写死不依赖 .env
```

`env_file` 将文件中所有键值对注入容器；`environment` 优先级更高，可以覆盖 `env_file` 中的同名变量。

## 服务间通信：DNS 服务名发现

Compose 为同一项目下的所有服务创建共享网络，**服务名自动作为 hostname** 注册到内置 DNS，无需知道容器 IP：

```javascript
// agent-api 代码中直接使用服务名
const redisClient = createClient({ url: 'redis://:redispass@redis:6379' });
const pgPool = new Pool({ host: 'postgres', port: 5432, database: 'agentdb' });
const qdrantClient = new QdrantClient({ url: 'http://qdrant:6333' });
```

宿主机访问容器服务需要通过映射的 `ports`（如 `localhost:6333`），容器之间则通过服务名直接通信。

## Volume 挂载：开发热重载 vs 生产数据持久化

```yaml
volumes:
  # 开发：挂载宿主机目录实现热重载（bind mount）
  - ./src:/app/src             # 源码改动实时同步进容器

  # 生产：命名卷持久化数据（named volume）
  - pgdata:/var/lib/postgresql/data   # 容器重建数据不丢失

  # 只读配置注入（:ro 标记）
  - ./nginx.conf:/etc/nginx/nginx.conf:ro
```

bind mount 的路径以 `./` 或 `/` 开头，named volume 直接写卷名。开发环境挂载整个项目目录时注意排除 `node_modules`（在 Dockerfile 中单独处理，或使用匿名卷覆盖）。

## depends_on + healthcheck 保证启动顺序

[Docker Compose 启动顺序文档](https://docs.docker.com/compose/how-tos/startup-order/) 说明 `depends_on` 可以结合 `service_healthy` 等条件等待依赖就绪；单纯的创建顺序并不证明数据库已经可接受请求。


`depends_on` 有两种模式：

```yaml
depends_on:
  postgres:
    condition: service_started    # 仅等容器启动（默认）
  redis:
    condition: service_healthy    # 等 healthcheck 通过（推荐）
  migrations:
    condition: service_completed_successfully  # 等一次性任务完成
```

`healthcheck` 配置要点：

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U pguser"]  # 探针命令，非零退出码=不健康
  interval: 5s        # 检查间隔
  timeout: 5s         # 单次超时
  retries: 5          # 连续失败 5 次后标记 unhealthy
  start_period: 10s   # 容器启动后的宽限期，期间失败不计入 retries
```

## 常用命令速查

```bash
# 启动所有服务（-d 后台运行，--build 强制重新构建镜像）
docker compose up -d --build

# 只启动指定服务及其依赖
docker compose up -d agent-api

# 查看所有服务状态
docker compose ps

# 实时跟踪某服务日志
docker compose logs -f agent-api

# 进入运行中的容器
docker compose exec agent-api sh

# 停止并删除容器（保留 volume 和镜像）
docker compose down

# 停止并删除容器 + volume（⚠️ 数据库数据会丢失）
docker compose down -v

# 只重启某个服务（不重建镜像）
docker compose restart agent-api

# 水平扩展服务副本
docker compose up -d --scale agent-api=3

# 查看服务配置的最终合并结果（调试 override 文件）
docker compose config
```

## Compose V2 vs V1

| 对比项 | V1（docker-compose） | V2（docker compose） |
|--------|---------------------|---------------------|
| 命令格式 | `docker-compose up` | `docker compose up`（空格） |
| 安装方式 | 独立 Python 包 | Docker Desktop 内置插件 |
| 配置文件 | `docker-compose.yml` | `compose.yaml`（推荐）/ `compose.yml` |
| `version` 字段 | 必填（`'3.9'` 等） | 废弃，不再需要 |
| 性能 | 较慢 | 更快，Go 实现 |
| 维护状态 | 已停止维护 | 当前官方版本 |

现在应该统一使用 `docker compose`（V2），`docker-compose`（V1）已于 2023 年停止维护。

---

## 常见误区 / 最佳实践 / 面试要点

### 常见误区

- **误区：生产环境直接用 Compose 部署多实例服务**。Compose 没有跨主机调度、自动故障转移和负载均衡能力。多副本场景应使用 Kubernetes、Docker Swarm 或云托管服务（如 Cloud Run、ECS）。
- **误区：不配置 healthcheck，只用 `depends_on: service_started`**。`service_started` 只等容器进程启动，数据库初始化可能需要数秒，此时连接必然失败。必须配合 healthcheck 使用 `condition: service_healthy`。
- **误区：把 `.env` 文件提交到 Git**。`.env` 通常含有数据库密码和 API Key，必须加入 `.gitignore`，用 `.env.example` 提供模板。
- **误区：开发时挂载 `./:/app` 后 node_modules 被宿主机目录覆盖**。正确做法是在 `volumes` 中额外添加 `- /app/node_modules` 匿名卷，让容器内的 node_modules 不被覆盖。

### 最佳实践

- 使用 `compose.yaml`（V2 格式），去掉 `version` 字段，服务都配置 healthcheck。
- 敏感变量通过 `.env` 注入，代码库只保留 `.env.example`。
- 开发/生产配置用 override 文件分离：`compose.yaml`（基础）+ `compose.override.yaml`（开发自动加载）+ `compose.prod.yaml`（生产手动指定）。
- 数据库等有状态服务始终使用 named volume，不用 bind mount 存储数据。

### 面试要点

- **`depends_on` 能保证服务就绪吗**：不能，只保证容器启动顺序。需配合 `healthcheck` + `condition: service_healthy` 才能保证下游服务真正可用。
- **服务间如何互相访问**：同一 Compose 网络内，服务通过服务名作为 hostname 直接通信（如 `postgres:5432`），Docker 内置 DNS 负责解析，无需知道 IP。
- **Compose V1 和 V2 的主要区别**：命令从 `docker-compose` 变为 `docker compose`，配置文件从 `docker-compose.yml` 变为 `compose.yaml`，`version` 字段废弃，V2 由 Go 实现性能更好。
- **Volume bind mount 和 named volume 的区别**：bind mount 映射宿主机目录，适合开发热重载；named volume 由 Docker 管理，适合生产数据持久化，容器重建后数据不丢失。
- **`docker compose down -v` 的风险**：会同时删除 named volumes，数据库数据永久丢失，生产环境严禁随意执行。

## 参考资料

- [Compose file reference](https://docs.docker.com/reference/compose-file/)
- [Docker Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/)
