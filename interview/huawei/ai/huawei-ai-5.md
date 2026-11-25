> 个人面试自述；以下短答为编辑整理，不代表候选人的现场回答。

> 本页仅整理已见文字中的技术与项目问题。原始采集未覆盖附件，补充图片检查不改变这一限制；具体项目材料、实际模型及部分追问条件未提供，保留待补。

## 项目工程化与 AI 编程

<details data-knowledge-key="agent-role-landscape"><summary>（1）在学校主要做模型训练吗，有没有固定课题？</summary></details>
<p>先说明学习或研究任务、自己的工作及可核验产物，再区分模型训练、数据处理和应用工程。没有参与训练时如实说明，避免用调用模型接口代替训练经历。</p>

<details data-knowledge-key="agent-role-landscape"><summary>（2）实习主要做模型训练，还是 AI 工程开发？</summary></details>
<p>用实际交付物区分职责：训练侧说明数据、实验与模型结果，工程侧说明接口、工具、状态、权限和验证。可以存在交叉，但需要指出自己负责的模块与验收边界。</p>

<details data-knowledge-key="agent-project-portfolio"><summary>（3）选择一个真正工程化落地的例子介绍。</summary></details>
<p>选一个确实完成过的需求，按业务目标、输入输出、关键设计和验证结果组织。说明从原型到实际使用走过哪些步骤，未上线的部分按真实阶段介绍。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（4）为什么当前简历附件没有提到这段实习经历？</summary></details>
<p>先确认面试官看到的是哪版简历，再解释经历时间线和附件更新情况。只陈述真实职责与当前状态，不补造未提交的项目或成果。</p>

<details data-knowledge-key="agent-project-portfolio"><summary>（5）项目的主要难点是什么？</summary></details>
<p>从一个可复现问题切入，交代约束、备选方案、自己的决策和验证。把已解决的问题与仍存在的限制分开，避免只说项目复杂或模型不稳定。</p>

<details data-knowledge-key="agent-eval-framework"><summary>（6）是模型本身准确度不够，还是业务输出要求没有满足？</summary></details>
<p>先把业务期望写成可验收条件，例如必填字段、事实与证据一致、输出结构和时延要求；再对照失败样本逐层检查输入材料、模型生成、工具执行和最终产物。用轨迹定位是哪一环偏离，并在同一任务集上验证改动，不能只凭一次不满意就归因为模型准确率。</p>

<details data-knowledge-key="llm-long-context"><summary>（7）一次模型处理能支持多大上下文？</summary></details>
<p>要先确认实际使用的模型版本、接口窗口和最大输出限制，再按该模型的 tokenizer 计算系统指令、历史、工具定义、材料及输出预算，留出余量。回答项目实测能稳定处理的范围，并说明关键证据在不同位置、存在干扰时的效果；最大窗口不等于有效上下文，原文没有给出可引用的具体数值。</p>

<details data-knowledge-key="prompt-structured-output"><summary>（8）材料中的信息怎样获取、抽取？</summary></details>
<p>先依据业务要求定义要抽取的字段、缺失值和来源标识，再把材料整理成可追溯的输入。规则明确的处理交给代码，需要语义判断的部分由模型生成结构化候选，随后校验响应完整性、字段结构及事实证据；缺证据就保留缺失或返回待确认。具体文件解析和模型方案按实际项目说明，格式正确不能替代内容正确。</p>

<details data-binding-status="pending_semantic_verification"><summary>（9）不同类型的维度、规则和流程怎样变化（原文未说明具体对象，待补）？</summary><p>关联知识点待核实。</p></details>
<p>原文没有交代“类型”“维度”所指的材料和业务对象，无法据此确定规则或流程。需要先补充具体输入、输出及变化条件，再讨论适用的设计；此题暂不绑定知识点。</p>

<details data-knowledge-key="agent-project-portfolio"><summary>（10）自己负责数据、编排、后处理和落库中的哪些工作？</summary></details>
<p>按数据、编排、后处理和落库逐段界定自己的责任、模块接口与实际验证。区分团队已有平台能力和个人实现，不把整个项目成果都算作个人贡献。</p>

<details data-knowledge-key="agent-architecture"><summary>（11）有没有内部 Agent 平台，使用什么模型？</summary></details>
<p>先如实说明是否使用内部平台、平台承担哪些功能，以及实际调用的模型和接口；再区分底层模型与 Agent 运行层。运行层负责组织工具、状态、控制循环和结果校验，应用层对接业务需求。只说明自己使用或实现的模块，不把接入模型说成自研模型。</p>

<details data-knowledge-key="agent-coding"><summary>（12）代码主要手写还是使用 AI？</summary></details>
<p>先说清任务拆分、模型辅助的环节和人工承担的判断，再举一个实际开发例子。对生成代码进行必要检查、测试和 diff 审查，不能把生成比例当作质量证明。</p>

<details data-knowledge-key="agent-coding"><summary>（13）真实需求开发中怎样使用 AI，怎样分工和 Review？</summary></details>
<p>以一个真实需求说明如何提供代码背景、约束和验收条件，再展示小步修改、测试反馈与人工审查的过程。说明哪些结果确实通过验证，失败时如何定位和回退。</p>

<details data-knowledge-key="agent-deterministic-workflow"><summary>（14）整体 AI 辅助开发框架和流程是否已经固化？</summary></details>
<p>区分已经固化的步骤、权限与验收门禁，以及仍需人工判断的例外。流程可复用不代表可以跳过状态、失败处理与结果验证，应以实际执行记录说明成熟度。</p>

<details data-knowledge-key="agent-coding"><summary>（15）对 AI Coding 发展、下一阶段方向有哪些了解？</summary></details>
<p>先区分代码补全、交互辅助和能调用工具并验证结果的 Coding Agent，再结合公开资料说明可观察的变化。对未来方向给出假设、验证方式和限制，不把预测说成既定事实。</p>
