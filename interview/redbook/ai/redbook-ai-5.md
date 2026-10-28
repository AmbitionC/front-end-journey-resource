### 小红书 AI 全栈业务交叉面与二面：MVP、运行稳定性和视频 Agent

以下短答与教学示例由编辑补充，不代表原作者的现场回答、实际架构或实测结果。

公司为小红书，岗位为 AI 全栈开发。两份记录分别标注业务交叉面、二面，各自自述约 40 分钟；具体部门和面试日期均未注明。按同一作者的同公司同岗位流程合并，不推断业务交叉面是第几轮，也不把两次发帖日期当面试日。

选录业务交叉面的需求到 MVP、上线异常两组，以及二面的视频项目编排、质量与耗时两组。算法、出行产品、低代码、模型选型、可验证知识库和其余已见问题本页未展开。

<details data-knowledge-key="agent-coding">
<summary>（1）模糊需求怎样形成 MVP，怎样检查 AI 产出的代码质量？</summary>
</details>

先把目标用户、输入输出、范围和验收条件写清，用最小可运行原型验证关键假设。让 AI 实现窄而连贯的变更，结合相关测试、实际运行和差异审查验收；生成了代码不等于功能完成。

教学例子：做一个行程表原型，先验收能否新增、修改和保存一条行程，再扩展地图能力；若 AI 只做了界面却没有保存行为，就回到明确的验收条件补实现，而不是按截图宣布完成。

技术核对：[SWE-bench 的仓库级任务定义](https://www.swebench.com/original.html)。

知识导航：[Coding Agent 的架构与执行循环](../../../knowledge/llm/agent/agent-coding.md)。

<details data-knowledge-key="agent-model-fallback">
<summary>（2）LLM 流量暴涨并报错时，监控、降级与回滚怎样配合？</summary>
</details>

先看请求量、任务成功与错误类型、队列等待、分位延迟和依赖耗时，区分容量不足、限流与版本退化。按已验证的策略限制并发和重试、熔断故障依赖，再选择合格备用模型、异步处理或版本回滚；各路径仍需满足权限和质量底线。

教学例子：主模型开始返回限流错误，系统先限制新请求和带抖动的有限重试；备用模型若不支持当前工具或输出格式，就保留受限状态或转异步，不能静默切换后当作完整成功。这里没有声称原项目实际部署了这些方案。

技术核对：[AWS：退避重试的适用条件](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/retry-backoff.html)。

知识导航：[模型降级、Fallback 与熔断](../../../knowledge/llm/production/agent-model-fallback.md)。

<details data-knowledge-key="build-agent-framework">
<summary>（3）怎样区分 Prompt 编排、工具调用与 Memory，LangGraph 又提供什么？</summary>
</details>

先按实际链路分别说明模型输入、工具契约与调用结果、当前会话状态及跨会话记忆。调用了框架不证明这些模块都已实现。LangGraph 用状态、节点和边表达执行及更新，适合需要分支和恢复的链路；框架选择还要看状态控制、维护成本与团队能力。

教学例子：提示词要求生成剪辑脚本，只能说明有生成步骤；若另有受校验的素材查询工具和项目状态，才分别说明工具与状态职责。保存当前脚本也不自动等于跨会话长期记忆。

技术核对：[LangGraph：Graph API 概览](https://docs.langchain.com/oss/python/langgraph/graph-api)。

知识导航：[从零构建 Agent 运行时](../../../knowledge/llm/agent/build-agent-framework.md)。

<details data-knowledge-key="agent-eval-framework">
<summary>（4）视频 Agent 的成片质量与处理耗时怎样分别评估？</summary>
</details>

先拆出文案、脚本、素材处理与合成的阶段耗时，再检查可播放、分辨率、音画时间关系、字幕覆盖等可验证约束。内容相关性和观感使用明确量表与人工复核；固定输入、环境和质量要求后比较优化前后，不能只凭一次更快或主观评分证明提升。

教学例子：并行处理两个互不依赖的素材可能缩短等待，但合成后仍要检查字幕结束时间是否超出视频。原记录提到从三十分钟到五分钟，这只是面试提问中的项目说法；本文没有原始测量，不能替作者证明该收益。

技术核对：[τ-bench：用环境终态评估任务结果](https://arxiv.org/abs/2406.12045)。

知识导航：[Agent 评测原理：任务、轨迹与环境结果](../../../knowledge/llm/production/agent-eval-framework.md)。
