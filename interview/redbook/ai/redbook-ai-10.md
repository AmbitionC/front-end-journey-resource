公司：小红书；方向：AI全栈暑期实习；轮次：二面。面试日期和部门未披露。本文选录RAG流程与Skill实践两题；其余Go、框架和算法问题未展开。答案与示例是编辑教学补充，不代表作者实际方案。

<details data-knowledge-key="rag-pipeline">
<summary>（1）请介绍 RAG 的整体流程。</summary>
</details>

RAG有数据入库与在线回答两条路径：先把文档解析、切分并建立带来源的索引，再对用户问题检索候选、选择证据、组装上下文并生成回答。生成后要检查引用支持和证据不足的情况；检索到相似文本，不等于已经获得正确答案。

离线路径保存原文、文档版本和可访问范围，切块后建立关键词或向量等索引。在线路径使用当前用户的访问范围检索，必要时做重排和去重，再把有限证据交给模型。RAGAS的[原始出版页](https://aclanthology.org/2024.eacl-demo.16/)说明，检索上下文、生成忠实度和生成质量应分别评价。

教学例子：问题询问某虚构产品v2的安装限制，索引却只返回v1说明。此时即使向量分数很高，也不能把v1内容无条件套给v2。应检查版本和适用范围；没有v2证据就明确说明资料不足。

排查错误时沿链路找：正确文档是否入库、相关块是否召回、证据有没有在排序或截断中丢失、生成是否误读。这样才能决定修数据、修检索还是改生成提示，不把每次失败都归咎于大模型。

延伸阅读：[RAG 完整流程实战](../../../knowledge/llm/rag/rag-pipeline.md)。

<details data-knowledge-key="agent-skill-design">
<summary>（2）平时怎样制作 Skill，怎样介绍自己的方案？</summary>
</details>

把一类可重复任务写成有触发条件、步骤、资源和验收方式的能力包；描述负责让Agent选对，正文负责说明做法，脚本和参考材料按需加载。介绍自己的方案时，要说明实际解决的任务和失败样例，不能只展示一个文件名。

按[Agent Skills格式规范](https://agentskills.io/specification)，最小目录包含带name、description的SKILL.md，正文可以引用scripts、references或assets。规范强调渐进披露；具体加载和工具授权能力仍取决于宿主，文档不能自己授予执行权限。

教学例子：做一个“接口变更检查”Skill，description写清用于已有接口变更，不用于新产品需求。正文要求读取差异、找调用方、核对请求响应合同并输出兼容性风险；较长的检查示例放入references，必要脚本只在允许环境执行。

评估时准备应触发、不应触发和信息不足的任务，检查是否选对Skill、步骤有没有遗漏、输出能否被验收。一次跑通不等于稳定有效；修改描述可能提高召回，也可能增加误触发，两者都要观察。原帖未提供作者Skill内容，上述不是复原其实现。

延伸阅读：[Agent Skill：渐进式披露、热插拔与版本治理](../../../knowledge/llm/agent/agent-skill-design.md)。

## 参考资料

- [ragas](https://aclanthology.org/2024.eacl-demo.16/)。
- [skill-spec](https://agentskills.io/specification)。
- [context](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)。
