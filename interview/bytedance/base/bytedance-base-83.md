岗位为后端 / Agent 开发，本页整理一场线上 HR 面，侧重项目表达、个人贡献、产品判断和求职沟通。未记录技术实现答题或编程题。面试与发布的具体日期未披露，采集日期不能视为面试日期。

材料限制：仅依据已见文字整理，身份与完整图文未经核验，4 个图片槽的内容未读取；xx 遮蔽的问题明确待补。学业、个人特点、地点与求职背景已作概括。下方回答均为编辑整理的备考思路，不代表当事人的现场答案。

## 面试问题与回答思路

<details data-knowledge-key="agent-resume-interview"><summary>（1）怎样做简短的整体自我介绍，突出自己的重点经历？</summary></details>
<p>围绕岗位选一两段真实经历，依次交代解决的问题、自己负责的部分和可核验产物。没有记录的项目成果与量化收益不能补进介绍，后续追问再展开具体判断与行动。</p>

<details data-binding-status="pending_semantic_verification"><summary>（2）京东实习是否在相关体系下主要做 xx 相关工作？（具体关键词待补）</summary><p>关联知识点待核实。</p></details>
<p>先核对原题中 xx 所指的工作与职责边界，再按真实经历回答。当前文字遮蔽了关键内容，不能把它补成具体系统或业务领域，本题暂不关联知识点。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（3）从单个实习模块扩展到招聘全链路，整个体系有哪些 AI 产品或模块，产品升级怎样规划？</summary></details>
<p>先按真实用户流程说明各模块服务谁、解决什么问题，再交代现状、升级目标与已确认的依赖。区分自己了解的全局规划与亲自参与的部分；原文没有列出具体产品架构，不能把通用分层当成现场方案。</p>

<details data-knowledge-key="agent-api-gateway"><summary>（4）实习中具体沉淀了哪些能力，哪些能力能避免各个功能重复、分散地对接模型？</summary></details>
<p>先说明实际沉淀的能力及其使用者，再解释共用接口怎样减少重复接入。统一身份、配额、路由与观测可作为通用接入层的讨论方向，但这只是备考思路；原文没有证明当事人建设了某种网关。</p>

<details data-knowledge-key="agent-api-gateway"><summary>（5）哪些沉淀能力可以复用到当前项目之外？</summary></details>
<p>逐项说明能力依赖哪些业务数据、权限和接口，再举真实的适用场景与不适用边界。共用接入策略与业务流程可以分开讨论，不能把一套项目代码直接声称为所有业务可用的平台。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（6）在这些工作中，你具体参与了哪一部分？</summary></details>
<p>把接手前已有的系统、自己承担的任务和他人提供的帮助分别讲清，再说明亲自完成的设计、实现与验证。成果停留在试用或内部验收，就按实际阶段表达，不把团队全部结果归为个人贡献。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（7）哪些部分挑战较大、此前没有经历过，对自己的成长帮助最多？</summary></details>
<p>选一个真实难点，交代原有经验为何不足、当时的约束和自己采取的行动，再给出结果与认识变化。可以说明仍未解决的限制，不能以一个宏大技术名词代替自己的实际工作。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（8）哪些问题是你自己主动发现并推进解决的？</summary></details>
<p>说明问题是怎样被观察到的、为什么值得处理，以及如何与相关负责人确认目标。再讲自己推进的验证、沟通和交付，区分提出建议、参与实现与最终落地，避免补造采纳或收益。</p>

<details data-knowledge-key="agent-project-evaluation"><summary>（9）你自己怎样评价所开发的产品？</summary></details>
<p>先说目标用户与核心任务，再用真实基线比较完成质量、使用负担、风险和总成本。可以同时说明产品优点与未覆盖场景；只有演示、体验或少量反馈时，应明确证据范围，不能直接称为业务收益。</p>

<details data-knowledge-key="agent-project-portfolio"><summary>（10）除了工作，日常在哪些场景使用 AI，有哪些使用技巧？</summary></details>
<p>挑真实发生的任务说明输入、期望结果和自己怎样检查输出，让技巧与任务效果对应。可以讲失败或需要人工修改的地方，避免只列工具名称，也不要把个人试用包装成已经交付的产品。</p>

<details data-knowledge-key="llm-capability-boundaries"><summary>（11）日常使用 AI 时，如何处理幻觉和消耗过快的问题？</summary></details>
<p>事实、引用与代码结果分别用原始资料、来源核对和测试检查，证据不足时保留不确定性。对消耗先记录实际任务与用量，限制无效循环和无关上下文；降低费用时仍须核验质量，不能把低温度或更贵套餐当成正确性保证。</p>

<details data-knowledge-key="llm-cost-optimize"><summary>（12）日常更多使用 Claude、Cursor 还是其他产品，使用量如何，Plus 或 Pro 是否够实际开发使用？</summary></details>
<p>按自己的真实产品、套餐和观察时段说明任务频率、用量及受限情况，区分订阅体验与 API 计费。是否够用取决于当期产品规则和任务负载；这里不提供套餐额度或价格结论，也不能推定原文中的 Plus、Pro 属于哪家产品。</p>

<details data-knowledge-key="agent-project-portfolio"><summary>（13）你提到的小工具具体是什么，桌面专注工具是什么产品，还有哪些个人小项目？</summary></details>
<p>用目标用户、使用场景、最小功能和实际完成阶段介绍工具，再说明自己做了什么与尚存问题。原文只提供桌面专注工具这个类别，没有功能清单或实现细节，备考时应换成自己的真实作品，不能替当事人补写。</p>

<details data-knowledge-key="agent-project-portfolio"><summary>（14）项目会放到 GitHub 开源吗，这些工具的关注度和 Star 情况怎样？</summary></details>
<p>如实区分已公开、计划公开与受限制不能公开的部分，再说明观察日期和可核验关注情况。Star 可说明外部关注的一面，作品介绍仍应给出可复现说明、真实功能与使用反馈，不能编造数量或用关注度替代效果证据。</p>

<details data-knowledge-key="agent-learning-roadmap"><summary>（15）对于没有开发背景的人，有什么用 AI 做产品或工具的建议，有想法后可以怎样开始？</summary></details>
<p>先选一个低风险、结果容易检查的小任务，把输入、输出和验收条件写清，再做最小可运行尝试。边练习边补当前需要的基础，检查生成结果与失败情况；涉及外部数据或真实动作时保留权限和人工确认，不能承诺无需学习就能可靠上线。</p>

<details data-knowledge-key="agent-learning-roadmap"><summary>（16）平时会帮助非研发同学学习 AI，或者做知识分享吗？</summary></details>
<p>有实际经历就说明对方要完成什么任务、自己怎样讲解或演示，以及对方能否独立检查结果。没有做过就如实说明，不能从愿意分享推成已组织培训；分享内容可用最小例子、预期结果和失败练习帮助理解。</p>

<details data-binding-status="pending_semantic_verification"><summary>（17）团队更偏 xx 系统，你对这个方向感兴趣吗，能否接受垂直领域知识较高的学习成本？（系统领域待补）</summary><p>关联知识点待核实。</p></details>
<p>先补齐 xx 所指的系统领域、岗位工作与必要知识，再结合自己的真实兴趣和学习条件回答。当前不能从邻近的招聘产品讨论推断团队业务，也不能替当事人承诺接受；本题保持未绑定，具体方向待确认。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（18）怎样说明当前学业阶段、升学路径、本硕学习情况与科研经历？</summary></details>
<p>按事实回答当前阶段、升学选择、学习和论文状态，涉及数据先核对，尚未发表不能说成已发表。这里只概括保留这组背景确认，不公开具体院校、成绩或可定位个人的细节，也不补写当事人的学业结果。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（19）还有哪些值得介绍的个人亮点，作为校招生，团队为什么选择你，有哪些强项？</summary></details>
<p>围绕岗位需要选择有经历支持的强项，用具体任务、亲自行动和可核验结果说明。也讲清仍需学习的部分，不用空泛标签代替证据，更不能编造团队已经认可或录用自己的结论。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（20）是否做过 MBTI 性格测评？</summary></details>
<p>如实说明是否做过测评即可，公开复盘不保留个人类型与真实结果。准备岗位相关的自我介绍时，可用真实行为例子说明个人特点，测评标签不能代替经历证据；这里不补写作者的测评结果或分享经历。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（21）反问时，怎样了解团队期待与融入方式？</summary></details>
<p>围绕新人的职责边界、首阶段交付、反馈和培养方式提问，确认自己需要补齐哪些条件。把面试官真实回答与尚待确认的安排分开记录；原文未提供具体答复，不能补写团队承诺。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（22）岗位的工作地点是否可以接受？</summary></details>
<p>结合自己的真实地点偏好、现实约束与可履行安排回答，需要了解的信息直接说明。公开整理对地点作概括处理；没有确认的搬迁、到岗或长期安排不要先作承诺。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（23）近期校招进展如何，已有哪些意向，其他机会推进到哪一步，是否有特别想去的机会？</summary></details>
<p>先区分沟通中、口头意向、书面意向和正式 offer，再说明实际进度与选择岗位的真实标准。可围绕工作内容、职责和培养方式表达偏好，不虚构竞争机会，也不在公开复盘里暴露具体意向组合。</p>

<details data-knowledge-key="agent-resume-interview"><summary>（24）从学生视角，怎样看待当年的校招市场和竞争情况？</summary></details>
<p>可以先限定个人观察的时间、岗位和接触范围，再说明这些观察怎样影响自己的准备。个人经历不能直接外推整体市场趋势；原文没有可核验统计，也未公开面试日期，这里不补写当年的行情判断。</p>

## 延伸复习

- [AI / Agent 岗位简历与面试](../../../knowledge/career/agent-resume-interview.md)
- [Agent Gateway 与统一接入层](../../../knowledge/llm/production/agent-api-gateway.md)
- [用业务指标证明 Agent 项目价值](../../../knowledge/career/agent-project-evaluation.md)
- [Agent 项目与作品集设计](../../../knowledge/career/agent-project-portfolio.md)
- [大模型的能力边界、幻觉与不确定性](../../../knowledge/llm/basics/llm-capability-boundaries.md)
- [Token、延迟与成本优化](../../../knowledge/llm/production/llm-cost-optimize.md)
- [从零到 Agent 工程师的学习路线](../../../knowledge/career/agent-learning-roadmap.md)
