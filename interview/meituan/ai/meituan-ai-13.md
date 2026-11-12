> 公司：美团；方向：后端工程 / Agent 应用研发；轮次：校招综合终面，先技术后 HR（作者自述）。具体面试日期未披露，不把采集日期当面试日期。

> 整理范围：仅依据已见文字。冻结页面含四个未解析图片 UI 槽，图片是否必要、实际内容均未核验；本页不宣称完整图文。以下短答是编辑整理的答题思路，不能当作当事人的现场回答，缺少的项目事实与题面条件已明确待补。

## 问题与简答

<details data-binding-status="pending_semantic_verification"><summary>（1）详细介绍实习项目。</summary><p>关联知识点待核实。原题缺少的具体事实或条件详见下方。</p></details>
<p>从业务问题、系统边界、个人职责和验证结果讲清项目，再解释关键取舍。原文没有公开完整实现与现场回答，项目名称与个人经历不扩写，具体架构和成果待补。</p>

<details data-binding-status="pending_semantic_verification"><summary>（2）你具体承担什么职责？</summary><p>关联知识点待核实。原题缺少的具体事实或条件详见下方。</p></details>
<p>用自己负责的模块、设计决策和可核对产物说明贡献，再区分团队协作与个人完成范围。实际职责没有披露，不能把项目全部功能默认归于个人。</p>

<details data-knowledge-key="agent-ontology-modeling"><summary>（3）如何定义本体？它在系统和页面开发中应该发挥什么作用？</summary></details>
<p>用领域对象、关系与明确语义描述本体，再说明页面与后端如何共享可解释的状态和操作含义。采用本体不一定采用 OWL，也不会让前端展示或推理结果自动拥有服务端执行权；原项目方案仍未披露。</p>

<details data-binding-status="pending_semantic_verification"><summary>（4）本体方案是小组选型还是公司范围推广？（应用范围待补）</summary><p>关联知识点待核实。原题缺少的具体事实或条件详见下方。</p></details>
<p>需要实际选型与推广范围的证据，并区分团队试点、部门使用和全公司标准。原文只有问题，不能把面试官的疑问当作已确认的组织事实或普及程度。</p>

<details data-binding-status="pending_semantic_verification"><summary>（5）整体分了几层，语义规范是什么，OWL 如何设定？（实际模型待补）</summary><p>关联知识点待核实。原题缺少的具体事实或条件详见下方。</p></details>
<p>先补实际对象、关系、公理、命名与版本合同，再解释哪些层负责语义、操作和执行。原文没有给出层数或 OWL 模型，不能用通用本体教程复原作者的分层设计。</p>

<details data-binding-status="pending_semantic_verification"><summary>（6）Action 分为哪些种类？（项目分类合同待补）</summary><p>关联知识点待核实。原题缺少的具体事实或条件详见下方。</p></details>
<p>需先知道该项目对 Action 的定义和分类依据，再讨论读取、修改或其他业务动作。原文没有分类合同，本页不把一种常见的工具划分冒称项目的真实类别。</p>

<details data-knowledge-key="agent-tool-design"><summary>（7）什么是对 Agent 友好的基础架构，怎样衡量？</summary></details>
<p>让能力可发现、输入输出和错误可判定，执行端独立约束权限、预算与副作用，并保留可追溯结果。衡量应看真实任务成功、恢复、越权、延迟与成本，不只看是否包装成 MCP 或能否生成合法 JSON。</p>

<details data-knowledge-key="agent-eval-framework"><summary>（8）智能面试间中的 Agent 如何评测？</summary></details>
<p>先定义任务、初始环境与成功条件，再分别检查最终内容、工具轨迹和真实环境结果，用确定性规则与经校准的开放质量评审组合验收。此处是编辑整理的方法，不代表原项目已实现的评测系统；实际数据集、评分器和结果仍需作者证据。</p>

<details data-knowledge-key="agent-metrics"><summary>（9）除了功能正确性，非功能层面有哪些评测方式和指标？</summary></details>
<p>同时看可靠性、端到端与首输出延迟、吞吐、资源和单位合格结果成本，明确分子分母、时间窗、版本及任务切片。用相同负载比较并保留失败与超时，避免通过提前失败或只报均值制造改善。</p>

<details data-binding-status="pending_semantic_verification"><summary>（10）能否举一个自己解决过的成本或性能问题？（实测案例待补）</summary><p>关联知识点待核实。原题缺少的具体事实或条件详见下方。</p></details>
<p>用真实基线、瓶颈、改动和同条件复测说明收益，同时核对质量与失败成本。原文没有具体案例和数字，不能替作者编造缓存命中、Token 降幅或延迟改善。</p>

<details data-knowledge-key="ddd-domain-modeling"><summary>（11）如何理解 DDD 领域建模？</summary></details>
<p>先通过共同语言与限界上下文明确业务模型的适用范围，再用身份、值与不变量识别实体、值对象及聚合。领域模型表达业务规则，不等同于把数据库表改名为实体或按层机械拆微服务。</p>

<details data-knowledge-key="distributed-saga-consistency"><summary>（12）多个代码库或微服务怎样保证数据一致性？Saga 除了成本与维护复杂，还有哪些问题，应该怎样选型？</summary></details>
<p>先界定必须立即成立的不变量，能收敛到本地事务就先核验该边界；跨服务长流程再按业务容忍的中间态选择消息或 Saga。Saga 缺少内建全局隔离，补偿可能失败且不可逆动作难撤销，需持久状态、幂等、结果未知对账和恢复规则，不能只靠重试保证一致。</p>

<details data-binding-status="pending_semantic_verification"><summary>（13）日常怎样使用 AI Coding、使用哪些工具和版本，不同版本编码能力有何体验提升？（实际工具与版本待补）</summary><p>关联知识点待核实。原题缺少的具体事实或条件详见下方。</p></details>
<p>应说明真实任务、工具和模型版本、使用方式，再用相同任务与预算比较正确性、改动质量和交付结果。原文没有给出实际工具链或版本，不从模糊产品名推断模型，也不替作者写亲测提升。</p>

<details data-knowledge-key="agent-role-landscape"><summary>（14）如何看待系统开发与 Agent 开发的关系？</summary></details>
<p>系统开发提供接口、状态、权限和可靠性基础，Agent 开发在此基础上组织模型、工具、上下文与评测，把不确定的决策放在可验证的执行边界内。两者职责相互交叉，应按用户功能、运行时、质量和基础设施等实际交付物比较；这里是编辑整理的工程理解，不替作者表达求职偏好。</p>

## 延伸阅读

- [关联知识：agent-role-landscape](https://www.agent-journey.cn/knowledge?activeKey=agent-role-landscape)
- [关联知识：agent-eval-framework](https://www.agent-journey.cn/knowledge?activeKey=agent-eval-framework)
- [关联知识：agent-metrics](https://www.agent-journey.cn/knowledge?activeKey=agent-metrics)
- [关联知识：agent-ontology-modeling](https://www.agent-journey.cn/knowledge?activeKey=agent-ontology-modeling)
- [关联知识：agent-tool-design](https://www.agent-journey.cn/knowledge?activeKey=agent-tool-design)
- [关联知识：ddd-domain-modeling](https://www.agent-journey.cn/knowledge?activeKey=ddd-domain-modeling)
- [关联知识：distributed-saga-consistency](https://www.agent-journey.cn/knowledge?activeKey=distributed-saga-consistency)
