公司：华为；来源自述部门为终端BG，方向为AI应用开发暑期实习，轮次只写技术面，没有编号或面试日期。本文选录RAG评测可信度与冲突证据处理两题。解答、例子和评测设计均为编辑教学补充，不代表候选人实际回答、项目成绩或企业政策。

<details data-knowledge-key="rag-evaluation">
<summary>（1）怎样设计 RAG 测试集，并证明 LLM-as-Judge 的高分可信？</summary>
</details>

测试集要覆盖真实任务及长尾、不可回答、版本冲突等失败情况，把检索证据、答案正确性和忠实度分开检查。Judge需要明确量表、证据和人工金标校准；模型给高分只是一条测量结果，不能自己证明测量有效。

RAGAS的[原始摘要](https://aclanthology.org/2024.eacl-demo.16/)把检索上下文质量、生成忠实度与生成质量分开；[Agent评测实践](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)也强调不同评分器和人工校准。选择评测样本时，应同时保留正常任务与已知失败切片，并把调参材料与最终留出材料分开。

教学反例：一个答案忠实复述了检索到的旧版规则，可能“忠实度高”却不适用于当前问题；另一个答案碰巧符合常识，但证据没有支持它，正确性与忠实度也会分离。量表必须说明判哪一层，不能让一个“整体很好”的分数代替诊断。

校准时让领域人员对成功、失败和争议样例按同一规则判定，再检查Judge在哪些类别误放行、误拒绝。数值、引用ID等可确定条件直接校验；开放解释交给有证据的判断。更换Judge、提示或数据版本后重新检查一致性，不能用自己的高分循环证明自己可靠。

延伸阅读：[RAG 评估与优化](../../../knowledge/llm/rag/rag-evaluation.md)。

<details data-knowledge-key="rag-citation-grounding">
<summary>（2）检索结果相互矛盾时，怎样处理？</summary>
</details>

先判断是否在讨论同一对象、版本、时间和适用条件，再检查来源权威性与证据位置。能由条件差异解释的分别说明；无法消解的真正冲突应明确保留分歧、补查或停止断言，不能让生成模型随意选一个或把两个结论混成新事实。

教学例子：一份文档说“支持功能X”，另一份说“不支持”。若前者针对v2、后者针对v1，这可能是适用条件不同；若都明确针对同一版本同一范围，就应继续查发布说明或业务权威数据。发布日期较新只是线索，不自动证明它覆盖旧来源。

把答案拆成原子声明，逐条绑定具体文档版本和片段，检查证据是否支持该声明。ALCE的[原始出版页](https://aclanthology.org/2023.emnlp-main.398/)将答案正确性与引用质量分开评价；有链接不等于引用真的支持相邻结论。

对无法确认的部分，可回答“现有资料分别记为A与B，尚不能确认当前适用规则”，同时保留来源差异。修复后还要检查索引和缓存是否继续返回旧版本。原帖没有披露真实bad case，不能把这个教学例子说成作者已经发现并解决的事故。

延伸阅读：[引用溯源、Grounding 与事实一致性](../../../knowledge/llm/rag/rag-citation-grounding.md)。

## 参考资料

- [ragas](https://aclanthology.org/2024.eacl-demo.16/)。
- [evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)。
- [alce](https://aclanthology.org/2023.emnlp-main.398/)。
