### 快手 AI 应用实习面试：模型服务、RAG 与分类评估

同一快手 AI 应用开发日常实习流程下的两份文字记录在此合并。一份自述二面，另一份含二面通知与技术清单，但没有逐题标明轮次；本页按技术主题整理，不把发帖日期当作面试日期，也不把全部补充题归为二面。

面试经历为个人自述，未经企业独立确认。以下短答为编辑整理的回答思路，不代表现场回答或实际系统实现。

本页只整理已核验文字；原帖图片尚未核验，未用于还原题目，记录可能仍有遗漏。

<details data-knowledge-key="rag-graph-rag"><summary><strong>（1）如何把文字抽取为图节点和关系，并处理图数据库中的推理查询？</strong></summary></details>
<p>先澄清查询目标和图 Schema。对文本识别实体、消歧并抽取有类型的关系，每条边保留原文证据与版本；查询时限制关系类型、跳数、权限和上下文预算，再沿路径回查证据。抽取出的边仍可能出错，不能把连通性直接当事实结论。原帖未披露具体图数据库或查询实例。</p>

<details data-knowledge-key="rag-latency-cost"><summary><strong>（2）RAG 每个环节的延迟怎么保证，例如查询改写和查询过程？</strong></summary></details>
<p>从端到端 SLO 分配改写、召回、重排与生成预算，把排队和网络也计入关键路径并观察长尾。独立检索分支可并行，有依赖的阶段不能盲目并发；设置共同截止时间、背压及有边界的缓存或降级，再检查质量与成本。预算是可测的服务目标，不是每次请求必达的承诺。</p>

<details data-knowledge-key="rag-evaluation"><summary><strong>（3）RAG 中怎么评价系统的改进效果？</strong></summary></details>
<p>固定业务查询集、证据标注、语料版本和权限条件，对新旧方案做配对比较。检索看相关证据是否找回与排序，生成看证据忠实度、引用和任务答案质量，同时报告延迟、成本与失败切片。自动评分需人工校准；一次只改变一个主要因素，再测组合效果，不能只用总分上涨证明改进。</p>

<details data-knowledge-key="algorithm-linked-list"><summary><strong>（4）怎样反转链表并说明空间代价？</strong></summary></details>
<p>用前驱、当前节点和临时后继逐个反转指针，保持剩余链表可达，最后返回新表头。若改用数组，应另说明 O(n) 额外空间及是否重建节点，不能把它和原地反转混为一谈。</p>

<details data-binding-status="pending_semantic_verification"><summary><strong>（5）怎样介绍 YOLO 模型部署（环境与配置待补）？</strong></summary>关联知识点待核实。</details>
<p>先说明实际模型版本、输入输出、运行环境与业务指标，再解释预处理、推理和后处理如何衔接。原文没有给出配置，不能推断推理引擎、精度或硬件。</p>

<details data-knowledge-key="python-model-serving-workers"><summary><strong>（6）Flask 服务的 worker、线程与容器 CPU 配额怎样选择？</strong></summary></details>
<p>先区分进程、线程和协程，再根据请求中的 CPU、网络与设备等待以及容器实际配额选择并发。通过负载测试检查排队、吞吐和尾延迟，增加 worker 不保证更快。</p>

<details data-knowledge-key="python-model-serving-workers"><summary><strong>（7）多 worker 是否各自持有模型权重，怎样检查内存和设备占用？</strong></summary></details>
<p>先确认启动方式、模型加载位置和设备，再测量每个进程及整体的内存与显存。进程间 CPU 页的共享条件不能直接套用到 GPU 权重，进程本地缓存也不能假定跨 worker 共享。</p>

<details data-knowledge-key="python-model-serving-workers"><summary><strong>（8）模型服务的 QPS 应怎样测量与解释？</strong></summary></details>
<p>固定输入尺寸、批量、质量约束和并发负载，再测量端到端吞吐、尾延迟与失败率。分别观察预处理、推理和后处理及 CPU/GPU 利用率，避免把单次模型推理速度当作服务容量。</p>

<details data-knowledge-key="websocket"><summary><strong>（9）什么场景适合使用 WebSocket？</strong></summary></details>
<p>先说明是否需要双向持续通信，再与普通请求响应或单向推送比较。交代连接状态、心跳、重连、鉴权和背压，不能仅因“大模型”就认定必须使用 WebSocket。</p>

<details data-knowledge-key="async-job-queue"><summary><strong>（10）异步交互怎样实现解耦？</strong></summary></details>
<p>将受理、执行和结果查询的职责分开，通过稳定任务标识和状态表达进度。设计超时、重复投递、失败重试与取消语义，异步返回成功不等于后台业务已经完成。</p>

<details data-knowledge-key="aigc-application"><summary><strong>（11）大模型应用的前端怎样与后端交互？</strong></summary></details>
<p>按请求、流式增量、最终结果和错误状态定义接口，明确谁持有模型凭据与会话状态。支持取消、重试与并发状态隔离，并检查断线时是否会重复触发副作用。</p>

<details data-knowledge-key="redis-data-structure"><summary><strong>（12）怎样理解 Redis 阻塞队列的适用边界？</strong></summary></details>
<p>先说明采用的结构和取任务方式，再检查消息是否需要确认、重投和持久化。阻塞取出只解决等待，可靠消费还要处理消费者崩溃、重复执行和积压，不能自动等同于完整消息队列协议。</p>

<details data-knowledge-key="redis-cache"><summary><strong>（13）缓存穿透、击穿和雪崩怎样分别处理？</strong></summary></details>
<p>先区分不存在数据的反复查询、热点 Key 失效和大量缓存同时失效，再选择空值或近似过滤、请求合并、过期分散及限流。核对各方案的一致性与失效边界，避免只给每个术语配一个固定组件。</p>

<details data-knowledge-key="redis-cache"><summary><strong>（14）缓存与权威数据的一致性怎样考虑？</strong></summary></details>
<p>先说明允许的陈旧窗口和数据权威，再设计写入顺序、失效传播、版本及补偿检查。异步通知或 TTL 不能直接提供强一致，故障、旧值回填和并发更新必须一起验证。</p>

<details data-binding-status="pending_semantic_verification"><summary><strong>（15）Redis 的单线程与多线程应怎样区分？</strong></summary>关联知识点待核实。</details>
<p>区分命令执行、网络 I/O 和后台工作，并说明实际版本与配置。不能用“Redis 单线程”概括所有模块，也不能因存在 I/O 线程就假定普通命令会并行执行。</p>

<details data-binding-status="pending_semantic_verification"><summary><strong>（16）时序预测怎样建模（任务与数据待补）？</strong></summary>关联知识点待核实。</details>
<p>先确认预测目标、时间跨度、采样频率和可用历史，再以时间顺序划分训练与验证。原帖没有给出具体任务，不能还原模型或特征，更要防止未来信息泄漏。</p>

<details data-binding-status="pending_semantic_verification"><summary><strong>（17）LSTM 输出怎样接入 Transformer（结构待补）？</strong></summary>关联知识点待核实。</details>
<p>先明确输出是全部时间步还是最终状态，再检查维度映射、位置和掩码及训练目标。原帖没有给出张量形状和结构，不能推断真实连接方式或效果。</p>

<details data-binding-status="pending_semantic_verification"><summary><strong>（18）CNN / AlexNet 的训练原理怎样说明？</strong></summary>关联知识点待核实。</details>
<p>先解释卷积与非线性如何形成表示，再沿损失、反向传播和参数更新说明训练。原帖没有公开网络配置与任务，具体结构和训练细节需另行核实，暂不建立不相关的知识绑定。</p>

<details data-knowledge-key="imbalanced-classification-evaluation"><summary><strong>（19）招聘意向场景怎样区分分类目标与排序目标？</strong></summary></details>
<p>先明确产品动作和标签含义，判断需要预测意向概率还是为候选对象排序，再选择对应目标和验收指标。特征只能使用预测时已知的信息，离线标签及未来行为不能泄漏进输入。</p>

<details data-knowledge-key="imbalanced-classification-evaluation"><summary><strong>（20）不平衡二分类怎样选择训练策略、判断指标与阈值？</strong></summary></details>
<p>先根据漏判、误判的业务代价定义指标，在代表目标分布的独立数据上查看精确率、召回率和混淆矩阵。比较类别权重或重采样，并在验证集选择阈值后冻结验收；高准确率不能证明少数类识别有效。</p>

<details data-knowledge-key="imbalanced-classification-evaluation"><summary><strong>（21）怎样判断某个特征是否重要？</strong></summary></details>
<p>在未参与训练的数据上比较移除或扰动特征后的指标变化，并检查相关特征之间的替代关系。结合稳定性与业务可获得性解释结果，模型重要性不是因果效应证明。</p>
