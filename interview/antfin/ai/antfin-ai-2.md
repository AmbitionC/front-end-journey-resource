### 蚂蚁 Agent 一二面：Code Agent 与应用开发

同一份原记录依次包含一面 Code Agent 代码生成方向、二面 Agent 应用开发方向，保留在同一面经页。具体面试日期未披露；题中的“2026 年 Agent 应用开发”是比较范围，不能据此推断面试日期。下列 14 组为技术题选录与教学答法，项目和开源贡献的回答模板不代表候选人的真实经历。HANAS、Cloud / Open Cloud 的指代待确认；职业规划、学业与同学情况、城市偏好和推广信息不纳入技术问答。

#### 一面：Code Agent 代码生成

<details data-knowledge-key="agent-coding">
<summary>（1）工程级 Code Agent 的核心挑战是什么？</summary>
</details>

它必须在超大仓库中找到正确上下文，理解跨文件依赖和项目约定，在可控环境里修改文件并验证结果。难点还包括长任务状态、工具错误、构建成本、权限和不确定性。一个能生成代码的 demo 不等于能安全维护项目。

<details data-knowledge-key="build-agent-framework">
<summary>（2）Agent 框架在向什么方向演进？</summary>
</details>

重点从“把工具接给模型”转向显式状态与恢复、可观测事件、标准化工具协议、上下文按需加载、隔离执行和系统化评估。框架最终仍需服务业务约束；不可测试的抽象越多，生产故障越难定位。

<details data-knowledge-key="agent-quality-gates">
<summary>（3）怎样保障 AI 生成代码的质量、安全和可控？</summary>
</details>

输入侧限制仓库、文件和命令权限；生成侧要求小变更、结构化计划和可审阅 diff；验证侧运行格式化、类型检查、测试、安全扫描与政策检查；发布侧人工审批高风险变更并灰度上线。所有工具调用与结果进入审计轨迹。

<details data-knowledge-key="agent-coding">
<summary>（4）怎样验证代码正确性？</summary>
</details>

测试金字塔仍然有效：纯逻辑用单元/属性测试，模块边界用集成和契约测试，关键用户路径用端到端测试。编译与静态分析只能排除一类错误；测试也要覆盖失败、并发、权限和回滚。无法自动判定的业务语义由领域评审确认。

<details data-knowledge-key="agent-quality-gates">
<summary>（5）生成完成后能否直接上线？</summary>
</details>

不能因为生成者是 AI 就跳过交付流程。变更需要需求验收、测试、代码评审、依赖/许可证与安全检查、迁移评估、灰度、指标观察和回滚方案。门禁强度按风险分层，文档小改与支付逻辑不能使用同一审批级别。

<details data-knowledge-key="agent-coding">
<summary>（6）代码生成适合哪些场景，有什么边界？</summary>
</details>

适合测试补全、重复重构、脚手架、文档和有清晰验收标准的局部任务。对需求含糊、隐含领域规则、高权限或难以验证的变更，应以辅助分析为主。价值取决于“验证成本是否低于人工实现成本”。

#### 二面：Agent 应用开发

<details data-knowledge-key="agent-architecture">
<summary>（7）2026 年 Agent 应用开发的变化怎样回答？</summary>
</details>

先选有具体版本和实践证据的变化说明，例如持久任务状态、按需上下文、可观测和验证环节，并比较这些机制对项目的实际影响。不要把年份、demo印象或个别框架特征直接推广为所有Agent应用的行业趋势。

<details data-binding-status="pending_semantic_verification">
<summary>（8）项目采用什么架构，原记录的 HANAS 指什么？</summary>
<p>关联知识点待核实。</p>
</details>

先如实说明项目的组件、数据流和运行边界。待确认：HANAS的正式指代和版本未披露，不能猜成其他框架或架构模式；这一未确认组不绑定专题。

<details data-knowledge-key="agent-skill-design">
<summary>（9）渐进式披露后还需要 RAG 吗？</summary>
</details>

两者解决不同问题。渐进式披露决定何时加载哪组操作说明和资源；RAG 从大量动态语料中检索与当前问题相关的证据。Skill 目录很小且稳定时可直接按需加载；知识规模大、更新快或需要引用时仍需 RAG。

<details data-knowledge-key="agent-resume-interview">
<summary>（10）Agent 项目解决了传统方式难以处理的什么问题？</summary>
</details>

先给传统方案和真实限制，再说明Agent承担的决策或工具步骤，用任务成功率、验证成本和失败案例比较；项目名称、收益和技术细节只能来自本人真实证据。

<details data-knowledge-key="agent-open-source-contribution">
<summary>（11）怎样参与 GitHub 开源项目，承担了哪些工作？</summary>
</details>

说明真实仓库与参与路径、Issue/PR、本人改动和维护责任，用测试与评审证据支持贡献；不能把学习或使用项目包装成作者或核心贡献。

<details data-knowledge-key="context-engineering">
<summary>（12）上下文工程最关键的工作是什么？</summary>
</details>

不是把窗口填满，而是让模型在正确时刻看到正确、可信、最小充分的信息。需要定义信息层级、来源与权限，做检索/压缩、冲突处理、工具结果校验和 Token 预算，并通过失败样本评估每类上下文的贡献。

<details data-binding-status="pending_semantic_verification">
<summary>（13）原记录中的 Cloud、Open Cloud 指什么，核心实现是否了解？</summary>
<p>关联知识点待核实。</p>
</details>

待确认：记录有Cloud、Open Cloud字样，但正式产品、版本和实现范围不明确。确认具体指代后再按文档和实际代码说明；不能自行替换为Claude、OpenClaw或其他相近名称。

<details data-knowledge-key="agent-resume-interview">
<summary>（14）怎样讲最棘手的技术难题？</summary>
</details>

使用“现象—影响—假设—证据—修复—防复发”：给出可复现症状和指标，说明排除了哪些假设，展示根因证据，再讲修复、回归和监控。只说“调 Prompt 最后好了”无法证明工程能力。

#### 延伸阅读

- [Coding Agent 的架构与执行循环](../../../knowledge/llm/agent/agent-coding.md)
- [上下文工程](../../../knowledge/llm/agent/context-engineering.md)
- [Agent Skill 设计](../../../knowledge/llm/agent/agent-skill-design.md)
