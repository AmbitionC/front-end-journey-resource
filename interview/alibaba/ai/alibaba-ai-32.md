原帖自述为淘天 AI 应用研发实习面试，轮次与具体面试日期未披露。问题覆盖项目、并发与网络基础、RAG、Transformer、提示策略和模型训练。

以下短答为编辑整理的复习思路，原帖没有提供现场答案。原编号 11—12 属于同一连续比较句，合并保留；项目、论文和 AI 编程需求缺失处明确待补。

## 问题与回答思路

<details data-binding-status="pending_semantic_verification"><summary>（1）请展开介绍项目。</summary><p>关联知识点待核实。</p></details>
<p>原帖没有项目名称、需求、架构或个人贡献，具体内容待补。准备时可按真实目标、基线、职责、关键取舍和验证证据组织，不能替当事人编造项目实现。</p>

<details data-knowledge-key="algorithm-linked-list"><summary>（2）LRU 缓存通常使用什么数据结构？</summary></details>
<p>用哈希表按 key 定位节点，用双向链表维护最近访问顺序，命中或更新时移到近期端，超容量时删除最久未用端并同步哈希表。哈希定位平均 O(1)，已知节点的局部重连 O(1)；并发访问还需要另行保护两个结构的一致性。</p>

<details data-knowledge-key="algorithm-stack-queue"><summary>（3）异步处理中的生产者—消费者模型怎样设计缓冲区，底层用什么数据结构？</summary></details>
<p>先约定顺序、容量、满与空时的行为，以及取消、关闭和错误处理。固定容量可用环形数组，动态节点可用链表队列；多线程访问再用互斥与条件等待或成熟阻塞队列，消费速度不足时对生产者施加背压，避免无界积压。</p>

<details data-knowledge-key="os-thread-sync"><summary>（4）读远多于写的多线程场景，如何保证共享数据安全？</summary></details>
<p>先判断是否能用不可变快照或消息传递减少共享写；必须共享时，按一致性要求选择读写锁、统一互斥或版本校验。读锁内不能修改受保护状态，复合操作要保持整体不变量，并评估写者饥饿和锁竞争；读多不自动证明某种锁最快。</p>

<details data-knowledge-key="nginx-proxy"><summary>（5）浏览器输入网址后，怎样找到服务器，服务器又怎样把请求交给对应的业务服务？</summary></details>
<p>以需要网络的新文档请求为例，先按缓存与 DNS 获得地址，再建立或复用连接并发送 HTTP 请求。服务入口根据协议、Host 与路径等规则交给反向代理或网关，由路由和负载均衡选择业务服务；缓存命中、连接复用和 HTTP/3 会改变实际步骤，不能套用每次必经的固定握手链。</p>

<details data-knowledge-key="rag-evaluation"><summary>（6）RAG 知识库用于问答时，怎样评估质量？</summary></details>
<p>检索层看正确证据的召回、候选噪声和排序，生成层看正确性、忠实度、完整性与引用，端到端再看任务成功、权限、延迟和成本。使用带证据标注的版本化任务集，按无答案、冲突、长尾与权限场景切片，不能只用答案读起来是否流畅打分。</p>

<details data-knowledge-key="transformer-arch"><summary>（7）Transformer 的核心思想是什么？</summary></details>
<p>把输入转成带位置信息的向量，通过自注意力按内容聚合其他位置，再由逐位置前馈网络变换表示，多层用残差和归一化连接。不同架构的可见范围与训练目标不同，不能把所有 Transformer 都当成同一款 Decoder-only 模型。</p>

<details data-knowledge-key="transformer-arch"><summary>（8）多头注意力有什么好处？</summary></details>
<p>不同投影子空间可同时学习多种位置关系，再拼接并投影成统一表示，增加表达方式。每个头并不保证固定承担语法或指代任务，头数增加也会改变每头维度、缓存与效率，收益需结合模型与任务评测。</p>

<details data-knowledge-key="transformer-arch"><summary>（9）为什么 Transformer 适合并行计算？</summary></details>
<p>训练时完整序列已知，自注意力和逐位置前馈可用矩阵运算同时计算多个位置，因果掩码限制未来信息而不要求逐时间步递归。自回归生成的下一个 token 依赖上一个已生成 token，KV Cache 可减少重复计算，却不能消除这种依赖。</p>

<details data-knowledge-key="prompt-few-shot"><summary>（10）为什么 Few-Shot 具体案例有时比纯文字指令更能稳定人设、风格和指令遵循？</summary></details>
<p>示例把抽象要求落成输入输出、标签边界、措辞与格式，模型可在当前上下文中据此归纳行为而不更新权重。效果受示例正确性、覆盖、顺序和模型影响，应与 Zero-Shot 比较；不相关或冲突示例可能退化，不能承诺人设始终稳定。</p>

<details data-knowledge-key="agent-paradigms"><summary>（11）CoT／思维链 Prompt、Plan-and-Execute 先规划再执行、检索辅助思考的 RAG，以及原生 Thinking 模型，使用场景有什么区别？</summary></details>
<p>这些不是互斥的同一层范式：CoT 是提示策略，Plan-and-Execute 是任务编排，RAG 提供外部证据，Thinking 则涉及模型与推理预算。多步任务可组合规划与推理，缺事实时仍需检索，简单低延迟任务先用更轻的基线；所有组合都要用可核验结果比较质量、成本与失败。</p>

<details data-knowledge-key="rag-reranking"><summary>（12）向量检索已经有分数，为什么还要精排？</summary></details>
<p>向量分数主要用于快速产生候选，未必充分区分否定、适用条件和细粒度相关性；Cross-Encoder 可联合阅读问题与候选做更细比较。它只能重排已有候选，不能补回漏召回证据，需在固定候选集上比较排序、最终答案与延迟成本，收益不足时可保留单阶段基线。</p>

<details data-knowledge-key="llm-lora-peft"><summary>（13）LoRA 微调与全量 SFT 有什么关系和差别？</summary></details>
<p>SFT 指用示范数据优化目标行为，LoRA 指冻结基座、训练低秩权重增量的参数化方式，可以用 LoRA 来做 SFT。与全量更新相比，它减少可训练参数和适配器存储，但基座、激活与运行开销仍在，质量和资源收益要在同条件下测量。</p>

<details data-knowledge-key="llm-rlhf-dpo"><summary>（14）已经做过 SFT，为什么还可能需要 RLHF 或其他 RL？</summary></details>
<p>SFT 学习示范输出，偏好或奖励优化进一步利用候选相对好坏、任务成功等信号，在给定目标下调整策略。是否值得追加取决于可用反馈与剩余失败，奖励可能被投机，不能保证总比 SFT 更好；训练后仍需独立评估事实、安全、任务效果和成本。</p>

<details data-binding-status="pending_semantic_verification"><summary>（15）请介绍论文成果。</summary><p>关联知识点待核实。</p></details>
<p>原帖未提供论文主题、方法、数据、实验或个人贡献，成果内容待补。只能用真实材料说明问题、基线、方法差异、消融和局限，不补造发表、性能数字或研究结论。</p>

<details data-binding-status="pending_semantic_verification"><summary>（16）AI 编程：基于 Qwen3.5 模型编程（题目条件待补）。</summary><p>关联知识点待核实。</p></details>
<p>原帖仅记录这一编程环节，没有题目、输入输出、语言、代码或验收条件，具体任务待补。暂不能还原解法或代码，也不能从模型名称推导官方能力、参数或现场完成情况。</p>

## 复习导航

- [链表、指针与 LRU](../../../knowledge/cs/algorithm/algorithm-linked-list.md)

- [栈、队列与任务调度](../../../knowledge/cs/algorithm/algorithm-stack-queue.md)

- [锁、信号量与并发同步](../../../knowledge/cs/os/os-thread-sync.md)

- [Nginx 反向代理与负载均衡](../../../knowledge/backend/devops/nginx-proxy.md)

- [RAG 评估与优化](../../../knowledge/llm/rag/rag-evaluation.md)

- [Transformer 架构原理](../../../knowledge/llm/basics/transformer-arch.md)

- [Few-Shot 与 Zero-Shot 提示](../../../knowledge/llm/prompt/prompt-few-shot.md)

- [Reflection、Plan-and-Execute 与 Tool-Use](../../../knowledge/llm/agent/agent-paradigms.md)

- [Rerank 重排序原理与实践](../../../knowledge/llm/rag/rag-reranking.md)

- [LoRA 与参数高效微调：目标、增量与资源](../../../knowledge/llm/basics/llm-lora-peft.md)

- [RLHF、RLAIF 与 DPO 的差异](../../../knowledge/llm/basics/llm-rlhf-dpo.md)
