问题选自作者自述的阿里淘天 Agent开发一面记录。以下短答为备面讲解，不代表作者当场作答。页面发表于北京时间2026-08-15；面试绝对日期未确认。

<details data-knowledge-key="multi-agent">
<summary>（1）主 Agent 怎样把任务路由给合适的服务 Agent？</summary>
</details>

先把任务目标、必需能力、输入输出和权限范围定义清楚，再按能力与可用性选择执行者。委派消息要携带必要上下文、截止时间和任务标识；结果返回后还要校验完成条件，并处理超时、重复回复和无法完成的情况。并行只适用于无依赖的子任务，不能按子Agent数量判断架构优劣。

<details data-knowledge-key="agent-skill-design">
<summary>（2）Skill 和 RAG 为 Agent 提供的信息有什么区别？</summary>
</details>

Skill 通常提供如何执行特定任务的流程、约束和资源；RAG 主要按查询取回外部知识证据。两者可以组合：流程决定什么时候检索、如何核验和执行，检索结果提供事实依据。外部文档或工具返回中的指令不能直接覆盖受信任规则。

<details data-knowledge-key="prompt-context-compression">
<summary>（3）长对话中怎样保留关键 Skill 约束？</summary>
</details>

把当前目标、硬约束和必要任务状态显式保留，按任务阶段加载相关Skill，裁剪无关历史并用可追溯摘要保存未完事项。执行前仍要由程序检查权限、输入和完成条件；重复强调提示词不能替代校验，也不能保证模型始终遵守。

<details data-knowledge-key="agent-skill-design">
<summary>（4）改动 Skill 后怎样验证影响范围？</summary>
</details>

记录Skill版本和依赖，先重放触发改动的失败样例，再覆盖正常、边界、拒绝及相近Skill误选样例。比较任务结果、工具轨迹、错误率和成本，并用未参与修改的留出集检查退化；小范围灰度、监控和可回滚版本是后续发布措施，不能只看一次成功。

<details data-knowledge-key="agent-skill-design">
<summary>（5）面向用户发布 Skill，版本和灰度怎样设计？</summary>
</details>

把Skill内容、依赖和执行器兼容条件一起版本化，保留回滚目标。按受控用户范围逐步放量，观察任务成功率、错误工具调用、延迟和投诉等信号；涉及副作用时还要验证权限和幂等。灰度只是降低暴露范围，不能替代离线回归和执行前检查。
