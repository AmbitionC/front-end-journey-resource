### 字节后端与 Code Review Agent 秋招一面

原帖标题记有 8 月 19 日，未给出面试年份；原帖发布于 2026 年 8 月。本文选录可见技术问题，省略自我介绍、未披露题面的做题环节、个人面试评价及反问中的改进建议。答案为教学整理，不代表候选人现场回答或项目实际实现；来源评级不等于独立核验。

这是一份候选人自述的一面记录。核心追问是 Spark Session 复用、Redis 水平扩展与原子性，以及 Code Review Agent 的收敛、断点续跑和 Meta Harness。

#### （1）Spark Session 复用要说明什么？

<details data-binding-status="pending_semantic_verification">
<summary>（1）Spark Session 复用要说明什么？</summary>
<p>关联知识点待核实。</p>
</details>

先讲背景：重复创建 Session/Context 会带来初始化、连接与元数据加载成本；复用可以降低任务启动延迟并共享部分配置或缓存。随后必须讲边界：不同租户的配置、临时视图、UDF、Catalog 状态和并发任务可能互相污染。工程上需要隔离可变状态、设置生命周期和空闲回收，并用启动延迟、资源占用与错误率证明收益。

#### （2）Redis 怎样水平扩展？

<details data-binding-status="pending_semantic_verification">
<summary>（2）Redis 怎样水平扩展？</summary>
<p>关联知识点待核实。</p>
</details>

主从与 Sentinel 侧重高可用，Redis Cluster 才通过 16384 个 hash slot 在多个主节点之间分片。扩容时把部分 slot 迁移到新节点，客户端根据 `MOVED`/`ASK` 重定向更新路由。回答还应覆盖热点 key、大 key、跨 slot 多 key 命令、迁移期间的延迟和故障处理。

#### （3）Lua 在 Redis 中解决什么，能否替代？

<details data-binding-status="pending_semantic_verification">
<summary>（3）Lua 在 Redis 中解决什么，能否替代？</summary>
<p>关联知识点待核实。</p>
</details>

Lua 脚本使一组命令在 Redis 事件循环内连续执行，适合“检查再更新”等原子操作。某些场景可以用单条原子命令、事务 `WATCH/MULTI/EXEC`、带条件的模块命令或重新设计数据模型替代，但语义不一定完全相同。跨多个 Redis 节点或同时修改外部数据库时，Lua 也不能提供全局事务。

#### （4）JVM 中 CAS 和锁怎样比较？

<details data-binding-status="pending_semantic_verification">
<summary>（4）JVM 中 CAS 和锁怎样比较？</summary>
<p>关联知识点待核实。</p>
</details>

CAS 适合单变量、小临界区的乐观更新，竞争高时会反复重试，还要关注 ABA；`synchronized`/`ReentrantLock` 适合需要互斥保护的复合不变量。Redis 分布式锁和 JVM 锁作用域不同：前者协调多个进程，仍需租约、持有者 token、幂等和故障边界。

延伸阅读：[Redis 分布式锁：租约、续期与故障边界](../../../knowledge/backend/database/redis-distributed-lock.md)。

#### （5）Code Review Agent 怎样设计？

<details data-binding-status="pending_semantic_verification">
<summary>（5）Code Review Agent 怎样设计？</summary>
<p>关联知识点待核实。</p>
</details>

一个可控的流程可以是：获取变更与仓库规则，按语言解析差异，检索相关上下文，分别运行静态检查、测试和模型审查，合并并去重问题，最后只输出有证据、可定位的建议。模型意见应与编译器、测试和规则工具区分置信度，不能把风格偏好当缺陷。

#### （6）发现问题后怎样“收敛”？

<details data-binding-status="pending_semantic_verification">
<summary>（6）发现问题后怎样“收敛”？</summary>
<p>关联知识点待核实。</p>
</details>

为同一文件位置和问题类型生成稳定指纹，合并重复评论；限制每轮最大建议数和修复轮数；修复后只重跑受影响检查，并在回归失败时停止自动修改。结束条件包括全部门禁通过、无新增高严重度问题、达到预算或需要人工决策。

#### （7）怎样保证断点续跑？

<details data-binding-status="pending_semantic_verification">
<summary>（7）怎样保证断点续跑？</summary>
<p>关联知识点待核实。</p>
</details>

将 run、commit SHA、步骤状态、工具输入输出摘要和副作用 ID 写入检查点。恢复时先验证代码版本与依赖是否仍匹配，再从最后一个已提交步骤继续；每个写操作使用幂等键。仅保存聊天记录不足以恢复执行状态。

延伸阅读：[工作流状态、检查点与断点续跑](../../../knowledge/llm/agent/agent-workflow-state.md)。

#### （8）DeepSeek Harness 与项目自定义 Meta Harness 分别做什么，哪一个更能收敛？

<details data-binding-status="pending_semantic_verification">
<summary>（8）DeepSeek Harness 与项目自定义 Meta Harness 分别做什么，哪一个更能收敛？</summary>
<p>关联知识点待核实。</p>
</details>

原帖未提供所指 DeepSeek Harness 和作者自定义 Meta Harness 的仓库、版本或完整设计，不能凭名称补出实现或判断谁更能收敛。教学比较应固定任务、初始代码、工具权限、预算和判分依据，再检查两者怎样执行、验证、重试和停止，并比较成功率、回归错误、复现性与成本。若设计资料不足，应先补证据。
