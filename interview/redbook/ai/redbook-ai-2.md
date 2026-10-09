### 小红书与百度 Agent 面试合并记录：LangGraph 子图、Skill 与工程校验（2026 年 8 月发帖）

同一份记录包含小红书与百度两家公司的面试。小红书部分围绕自动切题 Agent 追问 Pipeline、子图通信、Skill、AI Coding，以及 MySQL 索引与锁；百度部分追问节点输入输出、输出不达预期、子图跑偏后的恢复和动态路由。下列第（6）至（8）题归百度，其余题归小红书。本页复用已有合并记录，不增加独立面试样本；回答为教学整理，不代表现场作答。发帖月份也不等于面试日期。

<details data-knowledge-key="agent-state-machine">
<summary>（1）怎样说明七步 Pipeline，而不陷入流程背诵？</summary>
</details>

先给每一步定义输入、输出、所有者和成功条件，再说明为什么有这个边界。一条典型链路可以是：请求规范化、意图路由、上下文检索、任务规划、工具执行、结果校验、交付与反馈。每一步都写入结构化状态，并记录版本、耗时和错误；只有校验通过才能进入下一步。面试官真正关心的是步骤是否可替换、可恢复和可观测。

延伸阅读：[Agent 状态机](../../../knowledge/llm/agent/agent-state-machine.md)。

<details data-knowledge-key="agent-multi-agent-messaging">
<summary>（2）LangGraph 子图之间怎样传递数据？</summary>
</details>

主图维护版本化状态，子图只读取声明过的字段，并返回有限的状态增量或领域结果。大型文件和长文本应通过对象引用传递，避免复制进每个上下文。并行子图写同一字段时，需要 reducer、优先级或冲突检测；跨进程时还要有序列化协议、幂等键和检查点。不要让子图共享任意可变对象，否则很难重放和定位错误。

延伸阅读：[多 Agent 消息与状态同步](../../../knowledge/llm/agent/agent-multi-agent-messaging.md)。

<details data-knowledge-key="agent-state-machine">
<summary>（3）为什么拆成三个子图，而不是一条长 Pipeline？</summary>
</details>

只有在领域职责、工具权限、故障边界或生命周期明显不同的时候才拆子图。例如理解与规划、内容生产、质量校验可以独立演进和重试。拆分收益是隔离上下文、降低权限、并行执行和独立评测；代价是通信、状态一致性和观测复杂度。若步骤始终串行且共享大量状态，一条显式 Pipeline 往往更简单。

<details data-knowledge-key="agent-skill-design">
<summary>（4）Skill 知识进化流程怎样搭建？</summary>
</details>

候选经验来自成功轨迹、人工修正和失败复盘；先脱敏、去重并归纳为明确适用条件，再写成包含触发条件、步骤、工具约束、检查项和反例的 Skill。新版本必须在冻结任务集上回放，比较成功率、成本和回归；通过后灰度发布并保留版本与回滚。运行期只检索与当前任务相关的 Skill，避免技能库全部进入上下文。

<details data-knowledge-key="agent-skill-design">
<summary>（5）Skill 与把规则直接写进 Prompt 有什么区别？</summary>
</details>

Prompt 适合短小、全局且每次都适用的约束；Skill 是可独立检索、版本化、测试和组合的任务能力包，还可以绑定工具、脚本和验收流程。把大量领域规则堆进 System Prompt 会增加 Token、产生指令冲突且难以评估。Skill 的价值不只是“多一份提示词”，而是让知识具备明确的触发和交付契约。

延伸阅读：[Agent Skill 设计](../../../knowledge/llm/agent/agent-skill-design.md)。

<details data-knowledge-key="agent-tool-result-validation">
<summary>（6）节点输入输出与输出校验怎样设计？</summary>
</details>

节点使用版本化 Schema，输入包含任务 ID、前置状态、权限和预算，输出包含结果、证据、状态码、可重试性与副作用摘要。输出先过类型、范围、路径、引用和业务规则校验。

延伸阅读：[工具结果校验](../../../knowledge/llm/agent/agent-tool-result-validation.md)。

<details data-knowledge-key="agent-failure-recovery">
<summary>（7）子图跑偏后怎样重跑并恢复？</summary>
</details>

可恢复错误采用限次退避重试或替代工具，不可恢复错误进入人工队列。执行副作用前生成幂等键，检查点保存“已完成什么”，重跑时从最后一个安全边界继续。

延伸阅读：[Agent 失败恢复](../../../knowledge/llm/production/agent-failure-recovery.md)。

<details data-binding-status="pending_semantic_verification">
<summary>（8）动态路由该由规则还是模型决定？</summary>
<p>关联知识点待核实。</p>
</details>

高风险、权限和确定性分支使用规则；语义模糊、长尾意图可让模型输出结构化路由与置信度。低置信度进入澄清、默认安全路径或人工处理。候选节点应先按当前权限和状态过滤，模型不能跳到未授权节点；线上记录路由、候选、理由和最终结果，用混淆矩阵与任务成功率持续评估。

<details data-knowledge-key="mysql-index">
<summary>（9）MySQL 的 B+ 树索引怎样回答？</summary>
</details>

B+ 树的非叶节点只存索引键和子指针，叶节点有序连接，适合范围扫描且扇出高；聚簇索引叶子保存整行，二级索引叶子保存主键，可能需要回表。

延伸阅读：[MySQL 索引](../../../knowledge/backend/database/mysql-index.md)。

<details data-knowledge-key="db-transaction-lock">
<summary>（10）MySQL 的乐观锁、悲观锁与锁粒度怎样回答？</summary>
</details>

乐观锁用版本号或条件更新检测冲突，适合冲突较少的短事务；悲观锁在事务内锁住记录或范围，适合冲突高且失败重试代价大的场景。锁到行还是范围取决于索引访问路径和隔离级别，不是由 SQL 文本直觉决定。

延伸阅读：[事务与锁](../../../knowledge/backend/database/db-transaction-lock.md)。

<details data-knowledge-key="agent-coding">
<summary>（11）AI Coding 怎样形成可复用习惯？</summary>
</details>

先让模型复述需求、列影响面和验收条件，再给最小相关上下文；用失败测试锁定行为，小步实现并检查 Diff。生成代码必须经过格式化、类型检查、测试、依赖与权限审计。把有效提示沉淀为仓库规则或 Skill，把失败案例加入回归集，但不能让模型改测试来证明自己正确。

<details data-binding-status="pending_semantic_verification">
<summary>（12）最长递增子序列有哪些解法？</summary>
<p>关联知识点待核实。</p>
</details>

动态规划定义 `dp[i]` 为以第 `i` 个元素结尾的最长递增子序列，枚举前驱，时间 `O(n²)`。更优解维护数组 `tails`：长度为 `k+1` 的递增子序列最小结尾放在 `tails[k]`，对每个数二分查找第一个大于等于它的位置替换，时间 `O(n log n)`。若需恢复具体序列，还要保存前驱与每个长度对应的下标。
