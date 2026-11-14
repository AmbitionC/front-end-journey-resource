一个值得做的 Agent 项目，不是“把模型接到聊天框”，而是把真实工作流中高成本、重复、需要语言理解的一段，改造成可衡量的人机协作。需求阶段先定义 actor、当前基线、价值、数据与工具权限、失败代价和明确不做什么，再决定 Agent 形态。

![从真实工作流、用户痛点、业务价值与风险出发收敛 Agent 项目范围和验收标准](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-project-requirements-value-risk-scope-v1.webp)
*图：先选择一段可观察流程，建立 baseline 与约束，再定义最小闭环；能力清单不能替代结果标准。*

## 从工作流访谈开始

跟实际执行者走一遍任务：触发条件、输入、判断、工具、交付物、审批、例外和返工。记录每步耗时、频率和错误，而不是只问“你想要什么 AI 功能”。用户常会提出“自动化全部”，但风险和价值集中在少数步骤。

适合第一版的步骤通常输入可获得、结果可复核、失败可逆，例如整理工单并生成回复草稿；直接自动退款或对外承诺则需要更成熟控制。把手工流程画成 happy path + 高频例外。

## 写清问题与 Baseline

问题陈述模板：“客服每天处理 500 个工单，查三套系统平均 8 分钟；目标是给出带来源草稿，把中位处理时间降到 5 分钟，同时错误承诺率不高于当前 0.5%。”

baseline 可以是纯人工、规则搜索或现有工具。没有 baseline，只能展示 Agent 会做事，无法证明更好。记录质量、时延、成本、返工和用户满意，而非只算 token。

## Actor、影响与风险

[NIST AI RMF Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/)要求在 Map 等活动中理解语境、用途、影响者、收益与伤害。列出直接用户、被决策影响的人、数据 owner、审批者、运维和安全团队。一个招聘筛选助手的候选人即使不操作 UI，也是受影响 actor。

风险表包含错误信息、偏差、隐私泄露、越权工具、提示注入、过度依赖、成本和不可用。为每项写预防、检测、响应和 owner。高影响场景保留人工判断并提供证据，不用一句“human in the loop”结束设计。

## 能力与边界

把功能写成输入—行为—输出—失败：接收一张工单与已授权客户资料；检索产品政策；生成含引用草稿；资料不足时提问；不得承诺退款或自行发送。工具权限按最小范围列出，明确哪些操作每次审批。

[PAIR Mental Models](https://pair.withgoogle.com/guidebook-v2/chapter/mental-models/)强调设定能力、失败和反馈预期。需求应定义 UI 如何表达不确定、来源和无法完成，而不是让产品文案把概率系统伪装成确定自动化。

## 数据与知识可行性

盘点知识来源、更新时间、权限、敏感级别、历史样本和标签。RAG 需要可定位、可授权的资料；历史回复若包含旧政策，不能直接当 gold。建立小型代表性任务集，覆盖常见、边界和高风险案例。

定义数据保留、训练使用、日志脱敏和删除。用户上传与企业知识不默认用于训练；跨租户检索必须在召回前过滤。若无法合法获得必要数据，项目在需求阶段就应缩小或停止。

### 员工反馈场景：聚合不等于匿名

以“员工满意度分析工具”为例，一种可选起点是辅助发现组织层面的改进主题。先确认调查用途、参与者知情范围、获授权的数据与报告读者，只收集完成分析必需的字段，并约定保留、删除和人工复核；不把任务扩展成识别投诉者、个体考核或推断某人是否会离职。这是需求设计示例，不表示实际项目采用了该方案。

删除姓名仍可能留下可识别线索。[Microsoft Viva Glint 的反馈报告说明](https://learn.microsoft.com/en-us/viva/glint/setup/privacy-protection-reporting)区分评分与评论的展示阈值，并指出写作风格与小群体可能暴露答题者；其[保密与抑制规则](https://learn.microsoft.com/en-us/viva/glint/reports/confidentiality-suppression-reports)还限制能隔离小群体的组合筛选。需求据此应分别定义评分和自由文本的最小报告人数、低样本合并或不展示规则，以及总量与子组相减等差分推断的测试。厂商默认人数是具体产品设置，不是通用阈值，更不能据此承诺绝对匿名。

自由文本还可能直接提到姓名、稀有事件或个人经历，可在授权范围内去标识后再作主题归纳，并对输出做人工复核；脱敏不保证消除全部重新识别风险。第一版可输出聚合趋势、样本量和不确定性，保留原始评论的访问边界，既核验归纳是否受材料支持，也检查报告与日志是否泄露身份。

## 验收标准

每项标准可观察：任务完成率、引用支持率、严重错误率、人工修改量、p95 延迟、每任务成本、工具越权为零。给出测试集、计算方法和阈值。还要定义护栏：即使速度提升，只要隐私或严重错误越线就不发布。

在线阶段定义 shadow/canary、用户反馈和停止条件。成功不等于用户点击 thumbs up；它应改善真实工作流结果，同时不把负担转移到审核和事故处理。

## 收敛第一版

第一版只完成一条端到端闭环：一类用户、一类输入、少量可信知识、一个可逆输出和明确人工确认。暂不做多 Agent、长期记忆、十个工具和全渠道。每个额外自由度都会扩大评估矩阵。

Out of scope 与需求同样重要：不处理紧急投诉、不自动发送、不读取未授权附件、不跨语言。记录未来纳入条件，避免 scope creep 偷偷进入上线。

## 给需求排优先级：KANO 与四象限各回答什么

先区分不能越过的边界和可以权衡的增量：权限、隐私、关键事实错误与不可逆副作用不能靠“用户喜欢”抵消。其余需求再结合目标用户、问题频率与严重程度、预期价值、证据可信度、成本、依赖和时间约束排序。分数与位置都要回到调查或实验，不能把需求池里谁声音大当成价值证明。

### KANO：功能满足与用户满意如何关联

[Kano 等人的原始研究公开摘要](https://www.jstage.jst.go.jp/article/quality/14/2/14_KJ00002952366/_article/-char/en)提出按二维质量认识区分魅力、必备和一维质量，并以消费者问卷研究验证。它不是直接计算商业收益或研发排期的模型：

| 常用类别 | 对满意度的含义 |
| --- | --- |
| 必备型（Must-be） | 缺少会引起不满，具备往往只是达到预期 |
| 期望型／一维型（One-dimensional） | 满足程度提高通常伴随更高满意度，反之更不满 |
| 魅力型（Attractive） | 具备可能带来惊喜，缺少未必引起不满 |

不能凭团队直觉给功能贴标签。[Dave Verduyn 的方法说明](https://kanomodel.com/about-the-kano-model/)介绍对同一需求分别询问“具备”与“缺少”时的感受，再根据回答组合分类；无差异和反向反应也需要保留。实际调查先明确目标用户和功能描述，用访谈与试填检查理解，再按用户群查看分布、分歧与样本局限，避免一个多数标签掩盖不同群体。

例如对“问答结果带可定位的出处”，分别问有这项能力和没有时的感受，而不是先宣布它一定属于必备型。问卷反映声明偏好，仍需用原型和真实任务检查用户能否找到依据、纠正错误，以及是否增加审核负担；满意分类不能证明学习效果、付费意愿或风险已经可接受。

### 四象限：先说清两条轴

“四象限”只是二维组织方法，必须先说明比较什么。[Atlassian 的优先级工作坊](https://www.atlassian.com/team-playbook/plays/prioritization-matrix)使用影响与紧迫性，并把预期结果、投入、风险和依赖一起记录；[其产品发现矩阵说明](https://support.atlassian.com/jira-product-discovery/docs/understand-the-matrix-view/)也举出影响与投入、信心等维度。常说的重要性×紧急程度适合讨论处理时序，价值／影响×成本则帮助讨论资源取舍，二者不能混成一套固定答案。

| 比较轴 | 主要用途 | 仍需补的证据 |
| --- | --- | --- |
| 重要性／影响 × 紧急程度 | 区分必须及时处理的事项和可以计划的工作 | 截止时间、延误损失、关键依赖与目标 |
| 价值／影响 × 投入 | 寻找值得先验证的小投入方案，识别需分阶段验证的大项目 | 覆盖用户、价值假设、成本估计及其不确定性 |

AI 功能还要计入检索和模型费用、人工复核、失败处理与维护，不能只估开发天数。先做可逆原型或小范围验证，再据任务完成、质量、审核负担和成本更新排序；KANO 分类和矩阵位置是讨论依据，不是自动放行发布的规则。

## 交付需求包

最终包包含问题陈述、流程与 actor、baseline、目标/护栏、范围、数据/工具权限、风险 register、任务集、验收方法、上线/停止条件和 owner。技术设计必须逐项映射，而不是另起一套模型指标。

好需求会让团队在写代码前就能回答：我们改善哪个具体步骤，怎样知道它改善，最坏会伤害谁，系统不确定时如何退出。回答不清，继续堆 Agent 能力只会放大模糊。

## 参考资料

- [NIST AI RMF：Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/)
- [People + AI Guidebook：Mental Models](https://pair.withgoogle.com/guidebook-v2/chapter/mental-models/)
- [Microsoft Viva Glint：Privacy protection within feedback reporting](https://learn.microsoft.com/en-us/viva/glint/setup/privacy-protection-reporting)
- [Microsoft Viva Glint：Understand confidentiality and suppression in reports](https://learn.microsoft.com/en-us/viva/glint/reports/confidentiality-suppression-reports)

- [Kano et al.：Attractive Quality and Must-Be Quality（公开摘要）](https://www.jstage.jst.go.jp/article/quality/14/2/14_KJ00002952366/_article/-char/en)
- [Dave Verduyn：About the Kano Model](https://kanomodel.com/about-the-kano-model/)
- [Atlassian：Prioritization matrix](https://www.atlassian.com/team-playbook/plays/prioritization-matrix)
- [Atlassian：Understand the matrix view](https://support.atlassian.com/jira-product-discovery/docs/understand-the-matrix-view/)

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 AI 应用一、二面：MySQL、Redis 与编程基础](../../interview/bytedance/base/bytedance-base-36.md)
- [阿里云 AI 产品一面：模型基础、需求优先级与产品定位](../../interview/alibaba/ai/alibaba-ai-27.md)
- [字节 AI 全栈实习：记忆提炼、群聊搜索与 AI Coding](../../interview/bytedance/base/bytedance-base-48.md)
- [美团后端暑期二面：AI Coding 复盘、记忆与评估计划](../../interview/meituan/ai/meituan-ai-15.md)
- [京东 AI 应用开发日常实习二面：项目表达与产品场景](../../interview/jd/ai/jd-ai-7.md)
- [VAST 后端一面：可观测性、AI Coding 与节点调度](../../interview/vast/ai/vast-ai-1.md)
- [字节全栈实习：Session、权限与前端基础](../../interview/bytedance/base/bytedance-base-46.md)
- [字节财经保险 AI 全栈实习一面：项目设计、AI Coding 与 Diff](../../interview/bytedance/base/bytedance-base-34.md)
- [京东后端一面：交付标准、Agent 选型与跨语言数据边界](../../interview/jd/ai/jd-ai-1.md)
- [网易游戏 AI 实习：体验实验、问题复现与交付取舍](../../interview/netease/ai/netease-ai-2.md)
- [京东金融推荐算法实习一面：画像图谱与研究选题](../../interview/jd/ai/jd-ai-6.md)
- [阿里国际 Java 二面：RAG 数据评测、微调与代码生成](../../interview/alibaba/ai/alibaba-ai-26.md)
- [字节前端全栈实习一面：渲染、Worker 与认证](../../interview/bytedance/base/bytedance-base-38.md)
- [字节全栈：预请求、列表复用与 ThreadLocal](../../interview/bytedance/base/bytedance-base-44.md)
- [字节 Agent 实习：缓存一致性、定时任务与后端基础](../../interview/bytedance/base/bytedance-base-47.md)
- [字节 Agent 与全栈：视频工作流、工具权限与 RAG](../../interview/bytedance/base/bytedance-base-42.md)
<!-- interview-source-history:end -->
