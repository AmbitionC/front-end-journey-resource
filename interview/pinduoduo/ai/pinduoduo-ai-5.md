记录标注拼多多 Agent 复活赛二面，发布时间为 2026 年 9 月 15 日，实际面试日期未注明。以下短答与例子为编辑教学整理，不代表作者现场回答、真实项目方案或实际量化结果。

<details data-knowledge-key="agent-ab-testing"><summary>（1）变更上线时，怎样设计 A/B 实验或灰度发布？</summary>
</details>
<p>先说明目标：A/B 实验侧重比较候选方案的效果，灰度发布侧重限制变更的生产影响，两者可以组合；先固定版本包、分组单位、指标护栏与观察窗口，再据证据决定放量、暂停或回滚。教学例子是同一会话保持在一个版本，分组观察合格任务完成、尾延迟和单位合格成本，严重越权单独阻断；不能仅凭上线前后两条曲线或小流量暂时没报错就宣布成功。原文未给实际平台、比例和结果。 <a href="../../../knowledge/llm/production/agent-ab-testing.md">知识详解</a> · <a href="../../../knowledge/llm/production/agent-canary-release.md">灰度边界</a></p>

<details data-knowledge-key="agent-project-evaluation"><summary>（2）Agent 怎样在业务中提效？</summary>
</details>
<p>先选可验收、有权限边界的业务环节，把人工或现有规则流程作为基线，用一致任务口径比较合格结果、交付周期、人工复核与返工、总成本。教学例子是工单助手先提出候选分类，再核对最终正确处理量和每个合格结果的全成本，避免把审核负担转给另一团队后仍宣称提效；需要把收益归因于 Agent 时，应设计随机实验或说明非随机对照的混杂与局限。原文没有实际流程和量化成绩，不能补写提效百分比。 <a href="../../../knowledge/career/agent-project-evaluation.md">知识详解</a></p>

<details data-knowledge-key="agent-permission-model"><summary>（3）Agent 的权限管理怎样设计？</summary>
</details>
<p>把用户与 Agent 身份、租户、资源、操作和环境交给受信策略判断，按任务授予最小范围和短时效能力，最终工具执行点仍要复核。教学例子是用户只可读取本项目文档，导出或写入需绑定具体目标和参数的审批；委派子 Agent 不扩大原权限，撤销后长任务也要重新校验。工具可见或提示词声称允许都不等于授权；原文未披露具体实现。 <a href="../../../knowledge/llm/production/agent-permission-model.md">知识详解</a></p>

<details data-binding-status="pending_semantic_verification"><summary>（4）矩阵遍历手写题（题面条件未记录）</summary>
<span>关联知识点待核实。</span>
</details>
<p>原文只写“手撕：矩阵遍历”，没有遍历顺序、起终点、输入输出、矩阵尺寸或其他约束。应先取得完整题面，再选择算法、复杂度与验证用例；本项保持待补。</p>

<details data-binding-status="pending_semantic_verification"><summary>（5）项目中遇到过什么难点，最终怎样解决？（具体事实未记录）</summary>
<span>关联知识点待核实。</span>
</details>
<p>原文只提出项目难点与解决方式，没有业务背景、负责范围、问题证据或实际方案。需要补充当事人的真实项目和解决过程，才能核对取舍与结果；本项保留问题，不编写作者经历或现场回答。</p>

## 技术核对资料

- [NIST：完全随机实验设计](https://www.itl.nist.gov/div898/handbook/pri/section3/pri331.htm)
- [Google SRE：Canarying Releases](https://sre.google/workbook/canarying-releases/)
- [NIST SP 800-162：ABAC 定义](https://csrc.nist.gov/pubs/sp/800/162/upd2/final)
