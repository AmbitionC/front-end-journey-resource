问题选自作者自述的面试记录。以下短答用于备面讲解，不代表作者当场作答；仅选录可核实的教学范围，未覆盖的原帖子问不补写。原帖标注10.09，未确认面试年份；按既有原文快照选录。

<details data-knowledge-key="agent-skill-design">
<summary>（1）团队维护多个仓库时，怎样共享背景知识和 Skill？</summary>
</details>

把稳定团队规范、仓库特有约束和当前任务状态分层管理，文档有负责人、版本和适用范围；新任务按需检索对应仓库信息。Skill Hub需有审查、发布版本、安装来源和回滚机制，跨项目复用前仍要核对权限与依赖，不能把所有内部背景一次性塞进每个会话。

<details data-knowledge-key="agent-human-in-loop">
<summary>（2）哪些开发节点需要人参与，怎样暂停和恢复？</summary>
</details>

人负责目标与验收口径、关键取舍以及被授权的高风险动作。系统在明确状态暂停，展示具体diff、测试结果与待决选项，批准应绑定当前版本与参数；恢复前再次检查状态是否变化。发一条通知和获得明确批准是不同事件。

<details data-knowledge-key="agent-test-pyramid">
<summary>（3）生成代码后的单元、集成、端到端测试怎样分工？</summary>
</details>

单元测试验证局部逻辑与边界，集成测试验证模块和真实合同，端到端验证用户可观察的完整流程。根据风险分层，回归需覆盖失败、取消、权限和恢复；lint及模型自审都不能替代测试或验收。运行时间由项目真实记录给出，不代作者编造。

<details data-knowledge-key="agent-test-pyramid">
<summary>（4）Agent 为什么可能无法完全替代人工验收？</summary>
</details>

测试需要明确预期、可控制环境和可观察结果。缺少业务规则、外部系统权限、稳定测试数据或视觉判断标准时，Agent可能只能完成部分自动化。把人工发现的问题转成可重放场景、可检查属性和受控工具，再逐步扩大覆盖，不把“让模型看一遍”当验收。

<details data-knowledge-key="agent-feedback-loop">
<summary>（5）怎样把代码问题沉淀成规则，形成改进闭环？</summary>
</details>

保存脱敏失败案例，定位错误来自规范缺失、工具合同还是实现，再提出可泛化规则并通过相邻案例回归。规则有版本、适用边界和撤回条件，先评测再发布；不能让一次模型自评直接改写全部开发流程。

<details data-knowledge-key="agent-skill-design">
<summary>（6）MCP 与 Skill 的用途与上下文成本怎样区分？</summary>
</details>

MCP主要规范主机、客户端与服务之间的能力交互；Skill通常承载可按需加载的任务说明及资源，具体运行机制由宿主决定。需要受控访问外部能力时看工具和协议，需要复用流程知识时看Skill，二者可组合；不能说Skill文件在所有宿主里都必然整份预先注入，也不能说MCP自动没有上下文成本。

<details data-knowledge-key="agent-deterministic-workflow">
<summary>（7）Temporal 中 Workflow 与 Activity 应怎样拆分？</summary>
</details>

Workflow表达可重放的编排决定、等待和状态推进，Activity承担外部I/O或非确定性工作。按重试、超时、幂等和业务责任拆Activity，并记录可能已发生但回执丢失的副作用；不能在工作流重放时再次任意调用外部模型或接口。

