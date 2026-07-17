配置回答“服务应怎样运行”，秘密回答“谁被允许访问什么”。二者都不应烘焙进镜像，但风险完全不同：公开配置错误通常导致行为异常，秘密泄露会扩散权限。可靠方案从分类、环境隔离和工作负载身份出发，再设计注入、轮换、审计与日志脱敏。

![开发、预发布与生产环境中配置和秘密的交付、身份、轮换及审计边界](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/secrets-config-environment-boundaries-v1.webp)
*图：配置可以版本化分发；秘密由独立存储按工作负载身份短期交付，生产边界不能复用开发凭据。*

## 先分类再存储

配置包括功能开关、并发限制、服务地址和展示参数；秘密包括数据库口令、API key、私钥和签名材料。还有一类“敏感配置”，例如内部拓扑或风控阈值，虽不是凭据，也不应公开。分类决定访问、审计、缓存与保留策略。

[Kubernetes ConfigMap](https://kubernetes.io/docs/concepts/configuration/configmap/)用于把非机密键值与镜像解耦；[Kubernetes Secret](https://kubernetes.io/docs/concepts/configuration/secret/)用于敏感数据，但文档明确提醒 Secret 默认可能未加密地存于 etcd，Base64 也不是加密。使用 Secret 对象不等于完成安全治理，还要启用静态加密、限制 RBAC、保护备份并减少节点暴露。

## 环境是权限边界

开发、预发布和生产使用不同账号、项目、密钥与信任根。禁止把生产 secret 下载到开发机“方便排查”，也不让预发布服务拥有生产资源权限。环境名不是授权条件：真正的边界应由云账号、网络策略、工作负载身份和密钥策略强制执行。

配置包按环境和 releaseId 版本化，发布时记录实际解析后的非秘密摘要。应用启动要验证必填项、类型、范围和互斥关系，缺失时 fail fast；不要用看似方便的默认值让生产悄悄连到错误数据库。

## 不把长期凭据交给应用

优先使用工作负载身份换取短期令牌，例如云实例角色或 Kubernetes service account federation。应用只证明“我是谁”，权限系统再按资源和动作签发短期能力。这样轮换由平台承担，也降低静态 key 在文件、环境变量和崩溃转储中长期存在的风险。

确需交付秘密时，secret manager 根据 workload、环境和用途授权。以文件或内存挂载通常比命令行参数更安全，因为参数容易被进程列表读取；环境变量虽方便，也可能被诊断页、子进程或错误报告收集。无论何种方式，应用都不应把秘密复制到普通配置对象。

## 轮换是有状态协议

轮换不是覆盖一个字符串。对于签名密钥，先发布新 key 并保留旧 key 验证，待旧令牌过期后再撤销；数据库口令可以先创建新凭据、更新消费者、确认连接迁移，再禁用旧凭据。每次轮换记录 owner、version、启用时间、最后使用和撤销时间。

应用需要定义热加载或重启语义。若 SDK 缓存连接，secret 已更新也不代表旧连接消失；应通过连接年龄、凭据版本指标确认迁移。紧急泄露时，先缩小权限和撤销，再部署替换，不能等完整常规发布窗口。

## 最小权限与审计

[Kubernetes 安全检查清单](https://kubernetes.io/docs/concepts/security/security-checklist/)强调最小权限、限制 Secret 访问和隔离工作负载。一个服务只读自己需要的路径，不给通配符列举权限；部署者未必需要读取 secret 明文，运行平台可在启动时注入。

审计记录主体、资源路径、动作、结果和时间，不记录 secret 值。对异常批量读取、跨环境请求、过期凭据使用和管理员导出告警。Break-glass 访问需强认证、短时授权、双人审批和事后复盘。

## 防止通过交付链泄露

仓库使用 secret scanning 只能作为最后一道网。CI 不在命令回显中展开变量，不把 secret 写进构建参数、镜像层、缓存或测试快照。日志库对常见凭据结构和显式敏感字段做统一脱敏；错误对象、Trace attribute、用户分析事件也遵循同一规则。

前端代码中的任何值都可被用户读取，因此所谓“前端环境变量”只能放公开配置。第三方私钥必须由后端保存；浏览器通过受限业务 API 使用能力，而不是领取主密钥。

## 验证清单

测试无权限工作负载、跨环境身份、secret 缺失、版本过期、轮换双 key 窗口、撤销后旧连接、日志与崩溃报告脱敏、备份恢复后的加密密钥。定期扫描镜像、仓库、制品和对象存储，并演练一次凭据泄露处置。系统应能回答每个秘密由谁拥有、哪些工作负载可用、最后何时读取、怎样轮换以及多久能彻底撤销。

## 参考资料

- [Kubernetes：Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [Kubernetes：ConfigMaps](https://kubernetes.io/docs/concepts/configuration/configmap/)
- [Kubernetes：Security Checklist](https://kubernetes.io/docs/concepts/security/security-checklist/)
