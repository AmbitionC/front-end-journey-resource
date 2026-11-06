公司为腾讯，方向为混元后台开发，轮次为二面。可确认的记录发布时间为 2025 年 11 月 6 日，实际面试日期未注明，不能把本次整理时间当成面试时间。以下短答与例子是编辑教学整理，不代表当年的框架版本、作者实际架构或项目数据；个人项目事实缺项单独保留。

<details data-knowledge-key="agent-queue-worker"><summary>（1）队列管理中出现数据不一致，怎样定位并修复？</summary>
</details>
<p>原文未说明实际故障，回答应先给出权威状态、消息、执行者和提交的时间线，再验证重复、丢失或并发覆盖发生在哪个窗口。比如任务结果已写库而 ACK 丢失时会重投，读取持久终态并幂等处理可避免再执行；租约与条件更新还要阻止过期 Worker 覆盖新状态。 <a href="../../../knowledge/llm/production/agent-queue-worker.md">知识详解</a></p>

<details data-knowledge-key="llm-open-source-deployment"><summary>（2）为什么采用 Prefill/Decode（PD）分离，处理逻辑是什么？</summary>
</details>
<p>Prefill 处理整段输入并形成 KV，Decode 依已有上下文逐步生成 token；二者的计算、内存访问与调度特点不同。PD 分离可减少长预填充对解码的干扰，但会增加缓存握手、传输和容量安排成本，不能仅凭分离就宣称更快。教学例子是在固定负载下比较首 token、逐 token 时延、排队和 KV 传输，再决定是否分离。 <a href="../../../knowledge/llm/basics/llm-open-source-deployment.md">知识详解</a></p>

<details data-knowledge-key="llm-open-source-deployment"><summary>（3）SGLang 怎样处理用户请求？</summary>
</details>
<p>先限定部署版本与 PD 模式。典型链路是入口预处理与准入，选择 P/D 实例，P 侧计算并传递必要 KV，D 在缓存可用后继续解码，网关关联元数据并返回输出。教学例子是把一次首 token 变慢拆成 P 排队、P 计算、KV 握手传输与 D 等待来定位；原文未给版本、配置或追踪，不能把通用链路当作作者实际系统。 <a href="../../../knowledge/llm/basics/llm-open-source-deployment.md">知识详解</a></p>

<details data-knowledge-key="llm-open-source-deployment"><summary>（4）P 节点或 D 节点异常时，怎样发现和处理？</summary>
</details>
<p>实例健康与单请求进度要分别观察：P 排队、KV 未就绪、D 输出停滞有不同的超时与清理边界。教学例子是 P 已算完但 KV 传输失败时，D 不能当成正常请求继续；在总预算内有限重试，释放本次请求占用的状态。已输出的生成不能悄悄换结果拼接，一个请求失败也不应永久占住其他独立请求。 <a href="../../../knowledge/llm/basics/llm-open-source-deployment.md">知识详解</a></p>

<details data-knowledge-key="llm-open-source-deployment"><summary>（5）如果负责模型上游的路由调度，应怎样设计？</summary>
</details>
<p>先按模型、版本和兼容约束筛候选，再分别看 P 的排队及未缓存输入量、D 的排队与 KV 容量，结合前缀亲和、会话约束和截止预算做准入与选路。教学例子是长输入与短输入虽各算一个请求，实际负载却不同；仅轮询请求数不能代表公平或低延迟。策略须用目标负载下的首 token、逐 token 时延、拒绝率和错误率验收，不虚构作者的路由实现。 <a href="../../../knowledge/llm/basics/llm-open-source-deployment.md">知识详解</a></p>

<details data-knowledge-key="llm-open-source-deployment"><summary>（6）除了 SGLang，还可以怎样比较其他推理框架？</summary>
</details>
<p>可把 vLLM、TensorRT-LLM 与 llama.cpp 等作为候选，先核对具体版本的模型、硬件、量化和并行支持，再做固定负载比较。比如同时报告首 Token、逐 Token、吞吐、内存与错误，而不是拿不同输入长度的 tokens/s 直接排名；列出框架名不代表作者实际用过。 <a href="../../../knowledge/llm/basics/llm-open-source-deployment.md">知识详解</a></p>

<details data-knowledge-key="llm-open-source-deployment"><summary>（7）怎样介绍 NVIDIA 的大模型推理框架？</summary>
</details>
<p>可用 TensorRT-LLM 作为教学例子，先说明它面向的模型、GPU、精度与服务能力，并按官方版本验证兼容性。比如某量化格式能否运行取决于模型和硬件组合，不能只凭 NVIDIA GPU 就保证全部功能；原文没有写出当时指的是哪个产品或版本。 <a href="../../../knowledge/llm/basics/llm-open-source-deployment.md">知识详解</a></p>

<details data-knowledge-key="agent-queue-worker"><summary>（8）离线调度任务的具体流程怎样组织？</summary>
</details>
<p>先持久化任务、输入引用、优先级和 deadline，再可靠发布通知，Worker 取得租约后执行并保存检查点和终态，最后确认消息。教学例子中，保存结果后 ACK 前崩溃会产生重投，因此恢复器先读任务状态与副作用记录，而不是从头重复整项任务。 <a href="../../../knowledge/llm/production/agent-queue-worker.md">知识详解</a></p>

<details data-knowledge-key="agent-concurrency"><summary>（9）怎样设计队列任务优先级？</summary>
</details>
<p>把任务类别、租户份额、截止时间、预计资源和等待年龄分开建模，再在容量内调度，不能只有一个可能永远饿死普通任务的高低标记。比如紧急交互任务有保护份额，批任务在安全检查点让出资源，并用受限 aging 防止长期等待；同时记录每类任务的等待分位数。 <a href="../../../knowledge/llm/production/agent-concurrency.md">知识详解</a></p>

<details data-knowledge-key="agent-concurrency"><summary>（10）高优先推理任务必须尽快执行，但集群没有空闲资源，怎么办？</summary>
</details>
<p>优先级本身不会创造容量，应先检查预留资源、可扩容时延，以及低优任务是否支持安全检查点与抢占。比如暂停可恢复批任务并释放相应资源，再调度紧急任务；若现有任务不可抢占且无备用容量，就必须按服务合同排队或拒绝，不能承诺立即执行。 <a href="../../../knowledge/llm/production/agent-concurrency.md">知识详解</a></p>

<details data-binding-status="pending_semantic_verification"><summary>（11）原文提到的生活服务平台上线了吗？</summary>
<span>关联知识点待核实。</span>
</details>
<p>项目状态待补：原文只记录面试官询问，没有给出上线、用户规模或运行证据，不能替作者回答“已上线”。应以实际版本、部署回执和可用范围说明状态，并区分个人 Demo、试用与生产服务；本项不作知识计热。</p>

<details data-knowledge-key="async-job-queue"><summary>（12）为什么选择 RabbitMQ，还了解哪些消息队列？</summary>
</details>
<p>按任务通知、路由、确认重投、顺序范围、积压与运维需求解释选型，再和 Kafka、RocketMQ 等候选的实际合同比较，不从名字推出统一性能胜负。比如长任务用 RabbitMQ 通知 Worker，任务数据库仍保存权威状态，结果持久化后才 ACK；原文未给出真实选型依据。 <a href="../../../knowledge/backend/api/async-job-queue.md">知识详解</a> · <a href="https://rocketmq.apache.org/docs/featureBehavior/02delaymessage/">规范核对</a></p>

<details data-knowledge-key="rag-pipeline"><summary>（13）RAG 在项目中怎样落地？</summary>
</details>
<p>沿离线解析切块和在线检索生成两条链说明，保留权限、版本、证据来源与失败定位，而非只说“用了向量库”。教学例子是先查正确片段是否进候选，再看重排、上下文和引用是否支持回答；原文未提供作者的索引产品、参数或效果数据。 <a href="../../../knowledge/llm/rag/rag-pipeline.md">知识详解</a></p>

<details data-binding-status="pending_semantic_verification"><summary>（14）校园助手使用的 DeepSeek 模型是多大量级？</summary>
<span>关联知识点待核实。</span>
</details>
<p>模型参数待补：原文没有型号、权重版本、总参数或激活参数数据，不能补成某个 B 数或从显存反推结论。实际回答应读取对应模型卡与部署清单，区分模型大小、精度、上下文和并发资源；本项不把选型知识当成缺失项目事实的替代品。</p>

<details data-binding-status="pending_semantic_verification"><summary>（15）项目使用快速思考模式还是慢思考模式？</summary>
<span>关联知识点待核实。</span>
</details>
<p>实际模式待补：原文没有给出选择或配置，不能替作者说开启了某种推理模式。一般应比较相同任务下的质量、延迟与推理预算；例如简单分类与可验证多步任务可能采用不同策略，但这只是教学取舍，不是项目事实。</p>

<details data-binding-status="pending_semantic_verification"><summary>（16）改进后模型返回的 Token 数有统计吗？</summary>
<span>关联知识点待核实。</span>
</details>
<p>统计待补：原文没有样本、用量字段、分母和数值，不能凭可见字数补出平均 Token。应固定请求集与模型配置，区分输入、输出、缓存及供应商的其他用量语义，再报告分布、成本和质量；没有真实 usage 时只能说明尚未测量。</p>

<details data-binding-status="pending_semantic_verification"><summary>（17）项目使用 Redis 时遇到过什么问题？</summary>
<span>关联知识点待核实。</span>
</details>
<p>经历待补：原文没有写出实际故障，不能把缓存穿透、击穿或雪崩中的任一种说成作者亲历。可以按请求、命中、热点、TTL、数据库压力和恢复过程复盘一个真实案例；后面两题只讲通用缓存机制，不据此补写项目事故。</p>

<details data-knowledge-key="redis-cache"><summary>（18）什么是缓存穿透，怎样处理？</summary>
</details>
<p>查询缓存和权威数据库都没有的数据，仍反复回源，就是常见穿透问题；可结合参数校验、短期负缓存和维护完整的成员过滤。比如攻击者不断请求不同随机 ID 时，仅缓存空值仍可能撑大缓存；布隆过滤器未完成装载或新增同步时，阴性结果也不能直接拒绝真实数据。 <a href="../../../knowledge/backend/database/redis-cache.md">知识详解</a></p>

<details data-knowledge-key="redis-cache"><summary>（19）除缓存穿透外，还有哪些常见问题，分别何时发生？</summary>
</details>
<p>热点 key 失效导致同一时刻大量重建可形成击穿，大量 key 同时过期或缓存服务不可用则可能形成雪崩。教学例子是合并同 key 重建、限制回源并发并为 TTL 加受控抖动，但旧值能否兜底取决于业务合同；权限与余额等关键动作仍读权威状态。 <a href="../../../knowledge/backend/database/redis-cache.md">知识详解</a></p>

<details data-binding-status="pending_semantic_verification"><summary>（20）科研项目主要做的是算法改进吗？</summary>
<span>关联知识点待核实。</span>
</details>
<p>研究内容待补：原文只记录这一问，没有论文、基线、改动或实验结果，不能替作者认定研究方向。应按真实问题、相对基线的具体变化、消融和局限作答，保留个人贡献与团队成果的边界；本项不生成技术知识关联。</p>

<details data-binding-status="pending_semantic_verification"><summary>（21）主要使用 Java，是否接受团队的 Go、C++、Python 技术栈？</summary>
<span>关联知识点待核实。</span>
</details>
<p>个人意愿待补：原文没有候选人的回答，不能替他承诺接受或描述熟练程度。可以据实说明已掌握的运行时、并发与工程能力，以及通过小任务验证新语言适配的计划；这种岗位匹配问题不增加某种语言知识的热度。</p>

## 技术核对资料

- [SGLang current gateway; not the 2025 deployment](https://github.com/sgl-project/sglang/blob/main/sgl-model-gateway/README.md)
- [SGLang current router architecture](https://github.com/sgl-project/sglang/blob/main/sgl-router/ARCHITECTURE.md)
