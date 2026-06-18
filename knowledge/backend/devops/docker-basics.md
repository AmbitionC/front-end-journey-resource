Docker 通过容器技术将应用及其依赖打包成一个可移植的镜像，实现"一次构建，到处运行"，彻底解决"本地能跑、线上挂掉"的环境不一致问题。

## 核心概念

| 概念 | 说明 |
|---|---|
| Image（镜像） | 只读模板，包含应用代码、运行时、依赖、配置 |
| Container（容器） | 镜像的运行实例，相互隔离，可启动/停止/删除 |
| Dockerfile | 构建镜像的脚本，描述如何一步步构建镜像 |
| Registry（仓库） | 存储和分发镜像，如 Docker Hub、阿里云 ACR |
| Layer（层） | 镜像由多层叠加，相同层可被缓存和共享 |

## Dockerfile 最佳实践

以 Node.js（TypeScript）应用为例：

```dockerfile
# 使用官方 LTS 版本，alpine 体积更小
FROM node:20-alpine AS base
WORKDIR /app

# --- 依赖安装层（单独缓存，package.json 不变时不重装）---
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# --- 构建层 ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build   # tsc → dist/

# --- 生产镜像（只保留运行所需）---
FROM base AS runner
ENV NODE_ENV=production
# 创建非 root 用户，提升安全性
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
USER appuser
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**关键实践说明**：
- **多阶段构建（Multi-stage build）**：最终镜像只含运行态，不含编译器、源码、devDependencies，体积可从 1GB 压缩到 100MB 以下。
- **COPY package.json 单独一层**：利用 Docker 层缓存，`package.json` 未变时跳过 `npm install`，加速构建。
- **非 root 用户运行**：容器内进程不应以 root 运行，降低被攻击后的提权风险。
- **`.dockerignore`**：排除不需要的文件，加快 build context 传输。

```
# .dockerignore
node_modules
.git
dist
*.log
.env*
```

## 常用命令速查

```bash
# 构建镜像（-t 指定名称:标签，. 是 build context）
docker build -t my-app:1.0 .

# 运行容器
docker run -d \            # -d 后台运行
  -p 3000:3000 \           # 宿主机端口:容器端口
  -e NODE_ENV=production \ # 注入环境变量
  --name my-app \          # 容器名称
  my-app:1.0

# 查看运行中的容器
docker ps

# 查看容器日志（-f 跟踪实时输出）
docker logs -f my-app

# 进入容器调试
docker exec -it my-app sh

# 停止 / 删除容器
docker stop my-app && docker rm my-app

# 查看镜像列表
docker images

# 删除镜像
docker rmi my-app:1.0

# 清理无用资源（悬空镜像、停止的容器等）
docker system prune -f
```

## 镜像分层与缓存

```
FROM node:20-alpine          ← Layer 1（基础镜像）
WORKDIR /app                 ← Layer 2
COPY package.json ./         ← Layer 3（变更频率低）
RUN pnpm install             ← Layer 4（依赖 Layer 3，未变则命中缓存）
COPY . .                     ← Layer 5（代码变更频繁）
RUN pnpm build               ← Layer 6
```

**原则**：变更频率低的指令放前面，变更频繁的放后面，最大化缓存命中。

## 数据持久化：Volume

容器删除后数据默认丢失。数据库等持久化数据需挂载 Volume：

```bash
# 命名 volume（推荐，由 Docker 管理）
docker volume create pgdata
docker run -d \
  -v pgdata:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret \
  postgres:16-alpine

# 绑定挂载（开发时映射本地目录，实时反映代码变化）
docker run -d \
  -v $(pwd):/app \
  -p 3000:3000 \
  my-app:dev
```

## 环境变量管理

**开发环境**：使用 `.env` 文件（绝不提交到 Git）：

```bash
docker run --env-file .env my-app:1.0
```

**生产环境**：通过 CI/CD 系统、Kubernetes Secret 或云服务的环境变量管理功能注入，禁止在 Dockerfile 中硬编码敏感值。

## 面试常问

- **Docker 和虚拟机的区别**：Docker 容器共享宿主机内核，启动秒级，体积 MB 级；VM 含完整 OS，启动分钟级，体积 GB 级。容器隔离性弱于 VM，但轻量得多。
- **多阶段构建的作用**：将构建环境与运行环境分离，最终镜像只包含运行所需的最小文件集，减小攻击面和镜像体积。
- **如何查看容器内的进程**：`docker exec -it <name> sh` 进入容器后运行 `ps aux`，或在宿主机 `docker top <name>`。
- **镜像 tag latest 的风险**：`latest` 不是"最新"的保证，只是一个可变标签；生产环境应使用具体版本号（如 `node:20.15.0-alpine`）保证可重现性。
