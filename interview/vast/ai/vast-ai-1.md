记录为 VAST 后端一面，原帖发布时间为 2026 年 10 月 20 日，实际面试日期未注明。以下短答与例子为编辑教学整理，不代表作者现场回答、真实项目实现或量化结果；未记录的项目与使用案例继续待补。

<details data-binding-status="pending_semantic_verification"><summary>（1）介绍腾讯实习经历，主要负责什么？</summary>
<span>关联知识点待核实。</span>
</details>
<p>原文只记录了这个提问，没有给出实习业务、个人职责、团队分工或交付物。需要当事人的真实信息才能回答；本项保留待补，不编写实习履历。</p>

<details data-binding-status="pending_semantic_verification"><summary>（2）这段实习解决了哪些问题，达到了什么效果？</summary>
<span>关联知识点待核实。</span>
</details>
<p>原文未记录问题基线、实施方案、指标口径与实际结果。应补充可核实的项目证据后再讨论因果和收益，不能把教学例子的改善幅度写成作者成绩。</p>

<details data-knowledge-key="logging-monitoring"><summary>（3）除了增加监控告警，还可以怎样定位问题？</summary>
</details>
<p>先固定用户看到的故障、版本和时间窗，关联日志、指标与 Trace，再按假设补充采样剖析或受控复现。教学例子是接口变慢时沿请求追踪区分排队、下游调用与资源饱和，最后在相同条件下验证修复；没有错误日志或时间上接近某次发布，都不足以证明根因。 <a href="../../../knowledge/backend/devops/logging-monitoring.md">知识详解</a></p>

<details data-binding-status="pending_semantic_verification"><summary>（4）监控 Agent 分析问题的实际效果怎样？</summary>
<span>关联知识点待核实。</span>
</details>
<p>需要说明真实样本、人工确认的根因、误报漏报、定位耗时与复核成本，才能评价监控 Agent 的效果。原文没有这些结果，也没有对照方案；本项保持待补，不代填准确率或提效数据。</p>

<details data-knowledge-key="agent-project-requirements"><summary>（5）你认为一个需求做好的标准是什么？</summary>
</details>
<p>先把用户目标、输入输出、失败条件和权限边界写成可验收合同，再同时检查功能结果、可靠性、延迟、成本及人工返工。教学例子是工单助手不仅生成回复，还要有可核查出处、资料不足时退出，并在代表性任务集上满足事先约定的标准；功能能跑通不能替代真实工作流改善。 <a href="../../../knowledge/career/agent-project-requirements.md">知识详解</a></p>

<details data-knowledge-key="context-engineering"><summary>（6）新增的告警数据能否供 Agent 使用，能否把补充的上下文全部加载进去？</summary>
</details>
<p>可以在获准范围把告警作为证据入口，先按任务、请求标识和时间窗筛选，再保留版本、来源及必要关联信息，通过工具按需回读。教学例子是先给异常摘要和对应 Trace 引用，再取相关片段，避免把全部历史告警直接塞满窗口；权限和有效期先作硬过滤，压缩后仍要核对关键事实。原文未披露实际接入方案。 <a href="../../../knowledge/llm/agent/context-engineering.md">知识详解</a></p>

<details data-knowledge-key="ai-observability"><summary>（7）全链路可观测性怎样落地？</summary>
</details>
<p>先建立任务或请求入口与 Trace 关联，在模型、检索、工具和下游调用等边界记录 Span，并在跨服务和异步路径传播关联上下文。教学例子是用同一请求查看模型首 token、工具等待与重试，再关联日志、资源和版本；同时验证采样、脱敏与导出是否留下缺口，不能把 HTTP 成功等同任务正确。原文未给实际 SDK 或采样配置。 <a href="../../../knowledge/llm/production/ai-observability.md">知识详解</a></p>

<details data-knowledge-key="logging-monitoring"><summary>（8）Go 代码的埋点困难可能来自哪里，第三方库是否能支持？</summary>
</details>
<p>先核对实际框架、SDK、库插桩覆盖和 context 传播，不能把“Go 不好埋点”当成语言通性。OpenTelemetry Go 支持手工 Span 与 net/http 等库插桩，但库级信号不能自动解释自定义业务；教学排查可检查 SDK 初始化、业务边界、父子上下文和导出缺口，原项目实际障碍仍未记录。 <a href="../../../knowledge/backend/devops/logging-monitoring.md">知识详解</a></p>

<details data-knowledge-key="ai-observability"><summary>（9）用 AI 分析耗时等模块时，怎样组织并提供上下文？</summary>
</details>
<p>一种教学方案是先按 Trace 与时间窗提取阶段耗时、错误、重试、版本和负载信息，再给出可回读的日志或代码引用，让分析结论对应具体证据。比较同类请求的关键路径时，不能简单把并行 Span 时长相加；对 AI 提出的瓶颈假设还要实测验证。原文未记录实际模块、接口或效果，不能还原作者的具体实现。 <a href="../../../knowledge/llm/production/ai-observability.md">知识详解</a> · <a href="../../../knowledge/llm/agent/context-engineering.md">上下文组织</a></p>

<details data-binding-status="pending_semantic_verification"><summary>（10）开发工作流程怎样，使用自动化开发平台时遇到过什么问题？</summary>
<span>关联知识点待核实。</span>
</details>
<p>原文没有给出平台名称、实际步骤、故障现象或处理记录。需要补充真实工作流及问题证据，才能讨论平台的边界和改进；本项不编造使用经历。</p>

<details data-knowledge-key="agent-coding"><summary>（11）假设使用 Codex 开发，怎样组织工作流？</summary>
</details>
<p>先检查仓库状态、约束与相关代码，明确允许改动和验收标准，再把任务拆成可审查的小补丁，按依赖顺序实施。随后运行与风险相称的检查和测试，审查实际 Diff、失败路径及用户已有修改，最后交付变更与验证证据；这里是通用 Coding Agent 教学流程，不假定某个 Codex 版本或作者实习平台已经这样实现。 <a href="../../../knowledge/llm/agent/agent-coding.md">知识详解</a></p>

<details data-knowledge-key="llm-model-compare"><summary>（12）你认为谁家的模型效果最好？</summary>
</details>
<p>先明确任务和约束，再比较具体模型版本、API 或应用入口，不能用一个厂商品牌概括全部效果。教学例子是在同一仓库任务集和工具条件下比较合格补丁、人工修订、尾延迟及每个成功任务成本；公开榜单或一次体验不能直接给出适合所有场景的结论，原文也没有实际横评数据。 <a href="../../../knowledge/llm/basics/llm-model-compare.md">知识详解</a></p>

<details data-binding-status="pending_semantic_verification"><summary>（13）实习期间是否写过 Skill？</summary>
<span>关联知识点待核实。</span>
</details>
<p>原文没有记录是否编写过 Skill，也没有技能目标、文件内容、工具边界或验证结果。应补充真实实例后再审查设计与效果，本项不把通用技能模板当成作者经历。</p>

<details data-knowledge-key="agent-coding"><summary>（14）刚上手 Go 时，怎样识别 AI 生成代码中的质量问题？</summary>
</details>
<p>先把需求转成明确的输入输出、边界和失败条件，借助仓库已有构建、静态检查与受影响测试验证，再逐块审查 Diff。教学上可重点检查共享状态、错误返回和资源释放，并请熟悉相关模块的人复核关键路径；能编译或由同一个模型说“没问题”都不能证明业务正确，未验证部分应如实保留。 <a href="../../../knowledge/llm/agent/agent-coding.md">知识详解</a></p>

<details data-binding-status="pending_semantic_verification"><summary>（15）原文中的“go frame”是 HTTP 还是 gRPC 框架？</summary>
<span>关联知识点待核实。</span>
</details>
<p>原文没有提供仓库、模块路径、版本或服务配置，不能仅凭这个写法确认具体框架，也不能把项目采用的通信方式当成框架的唯一能力。应先补充实际依赖与配置；现有 gRPC 教材可解释协议层次，但不足以证明此处具体指什么，本项保持待核实。</p>

<details data-binding-status="pending_semantic_verification"><summary>（16）分享实际使用过的 Skill、MCP 或其他 AI 工具经验。</summary>
<span>关联知识点待核实。</span>
</details>
<p>原文没有记下具体 Skill、MCP 服务、调用方式或使用结果。需要真实案例与可核查的任务过程，才能分析适用边界和取舍；本项不以通用示例代替当事人的使用记录。</p>

<details data-knowledge-key="agent-deployment"><summary>（17）K8s Deployment 中的 requests 和 limits 主要影响什么？</summary>
</details>
<p>在常见容器资源配置中，requests 用于调度容量匹配，容器在条件允许时可使用超过 request 的资源；limits 约束运行时使用，CPU 超限通常受到节流，内存超限可能触发 OOM 终止。教学配置在 Deployment 的 Pod 模板容器 resources 中声明这些字段，并用实际负载验证资源与延迟；原文没有集群版本或具体数值，不能把示例当作原项目配置。 <a href="../../../knowledge/llm/production/agent-deployment.md">知识详解</a></p>

<details data-knowledge-key="agent-deployment"><summary>（18）服务只能运行在指定节点池，并限制其他工作负载进入，该怎样配置？</summary>
</details>
<p>用受控节点标签与 nodeSelector 或必需节点亲和性限制本服务的落点，再为专用池加 NoSchedule 污点，只让获准 Pod 获得匹配 toleration。只有容忍度不会把服务锁进该池，只有亲和性也不会阻止其他 Pod 进入；还需限制谁能设置这些字段，并处理已有工作负载，因为 NoSchedule 不会驱逐已运行的 Pod。这是通用调度思路，非原项目配置。 <a href="../../../knowledge/llm/production/agent-deployment.md">知识详解</a></p>

## 技术核对资料

- [OpenTelemetry：信号分类](https://opentelemetry.io/docs/concepts/signals/)
- [OpenTelemetry：Trace、Span 与上下文传播](https://opentelemetry.io/docs/concepts/signals/traces/)
- [Anthropic：上下文工程与按需读取](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [NIST AI RMF：任务语境、影响与风险](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/)
- [SWE-bench：仓库任务与行为测试](https://www.swebench.com/original.html)
- [OpenTelemetry Go：库插桩与业务埋点](https://opentelemetry.io/docs/languages/go/libraries/)
- [Kubernetes：容器资源 requests 与 limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
- [Kubernetes：专用节点、污点与容忍度](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)
- [Kubernetes：节点选择与必需节点亲和性](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/)
