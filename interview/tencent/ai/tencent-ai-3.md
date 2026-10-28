### 腾讯后端 AI 开发实习面试：RAG、Agent 与基础工程

原帖发布于 2026 年 4 月，未披露具体面试日期和轮次。本文按主题选录可见技术问题，省略实习经历及个人最自豪事项；答案是教学整理，不代表候选人现场作答或项目实际数据。

原帖自述同时考察两道算法、数据工程、网络/数据库基础和 Agent 概念。原帖没有明确轮次，因此本文不补写轮次。

#### （1）层序遍历和原帖所称“数组深度遍历”怎样澄清并实现？

<details data-binding-status="pending_semantic_verification">
<summary>（1）层序遍历和原帖所称“数组深度遍历”怎样澄清并实现？</summary>
<p>关联知识点待核实。</p>
</details>

二叉树层序遍历使用队列，按每层当前队列长度依次出队并加入子节点，时间复杂度 $O(n)$。原帖“数组深度遍历”的示例类似排列输出，但题面与完整输出要求未给全，应先确认是否要求全排列、去重规则及输出形式。若确认为全排列，可使用回溯：每层选择一个尚未使用的元素，递归完成后撤销选择；有重复元素时先排序并跳过同层重复分支。

#### （2）怎样保证数据准确率和及时性？

<details data-binding-status="pending_semantic_verification">
<summary>（2）怎样保证数据准确率和及时性？</summary>
<p>关联知识点待核实。</p>
</details>

准确性需要明确数据契约、主键与幂等、Schema 校验、对账和血缘追踪；及时性需要定义 SLA，监控采集延迟、队列积压、处理耗时和下游可见时间。迟到/乱序数据要使用事件时间、水位线或补偿任务，不能只靠“多跑几次”。

#### （3）元数据和数据血缘是什么？

<details data-binding-status="pending_semantic_verification">
<summary>（3）元数据和数据血缘是什么？</summary>
<p>关联知识点待核实。</p>
</details>

元数据描述数据集的 Schema、负责人、口径、权限、更新频率和质量；血缘记录数据从来源经过哪些任务、字段转换到达哪些下游。完善数据资产的关键是从任务编排和查询日志自动采集，再让责任人确认业务语义，避免手工文档快速失真。

#### （4）RAG 应怎样落地？

<details data-binding-status="pending_semantic_verification">
<summary>（4）RAG 应怎样落地？</summary>
<p>关联知识点待核实。</p>
</details>

从可评测的问题集开始，经过解析分块、索引、查询改写、召回/重排和带引用生成。生产环境还要做文档权限、增量更新、删除传播、无答案拒答和失败诊断。回答项目时需要给出知识规模、质量指标和真实 bad case。

延伸阅读：[RAG 完整流程实战](../../../knowledge/llm/rag/rag-pipeline.md)。

#### （5）进程和线程有什么区别，线程是不是越多越好？

<details data-binding-status="pending_semantic_verification">
<summary>（5）进程和线程有什么区别，线程是不是越多越好？</summary>
<p>关联知识点待核实。</p>
</details>

进程通常提供独立地址空间与资源边界，同一进程内线程共享地址空间并分别保有执行状态。线程数量并非越多越好：CPU 密集任务的有效并行度受核心数限制；I/O 密集任务可以更多，但线程也消耗栈内存、调度和上下文切换。应根据任务模型、阻塞比例和下游容量设置线程池，并用队列、拒绝策略和监控形成背压。

#### （6）TCP 为什么三次握手？

<details data-binding-status="pending_semantic_verification">
<summary>（6）TCP 为什么三次握手？</summary>
<p>关联知识点待核实。</p>
</details>

双方都需要确认自己的发送能力和对方的接收能力，并同步初始序列号。两次握手不能让服务端确认客户端收到了自己的 SYN/ACK，也更难处理网络中滞留的旧连接请求。拥塞控制则通过慢启动、拥塞避免、快速重传/恢复等机制调节发送窗口；不要与接收方的流量控制混淆。

#### （7）怎样判断 SQL 慢且是否命中索引？

<details data-binding-status="pending_semantic_verification">
<summary>（7）怎样判断 SQL 慢且是否命中索引？</summary>
<p>关联知识点待核实。</p>
</details>

先从慢查询日志和真实参数定位，再用 `EXPLAIN`/`EXPLAIN ANALYZE` 看访问类型、候选/实际索引、扫描行数、排序和临时表。索引可能因函数/隐式转换、最左前缀不满足、选择性过低或统计信息不准而失效。`binlog` 主要记录逻辑变更用于复制/恢复，`redo log` 保证 InnoDB 崩溃恢复，两者角色不同。

#### （8）大模型、Agent、Function Call、MCP 和 Skill 有什么关系？

<details data-binding-status="pending_semantic_verification">
<summary>（8）大模型、Agent、Function Call、MCP 和 Skill 有什么关系？</summary>
<p>关联知识点待核实。</p>
</details>

大模型负责生成和决策；Agent 增加状态、循环、工具和控制边界；Function Calling 是一次模型输出结构化工具请求的能力；MCP 统一工具/资源的发现与调用；Skill 则封装特定任务的操作说明和可复用资源。它们是不同层次，不应互相替代。

延伸阅读：[MCP / A2A 智能体通信协议](../../../knowledge/llm/agent/mcp-protocol.md)、[Agent Skill 设计](../../../knowledge/llm/agent/agent-skill-design.md)。

#### （9）CPU 访问内存大致经过哪些环节？

<details data-binding-status="pending_semantic_verification">
<summary>（9）CPU 访问内存大致经过哪些环节？</summary>
<p>关联知识点待核实。</p>
</details>

程序发出的是虚拟地址；硬件结合 TLB 或页表完成地址转换，并按缓存一致性与内存层级查找数据，缓存未命中时访问更低层缓存或主存。页不在内存可能触发缺页并交给操作系统处理。实际转换与缓存查询可能重叠，不能把示意层级当成所有处理器都严格串行的时序。

#### （10）HTTPS 相比 HTTP 使用了什么协议？

<details data-binding-status="pending_semantic_verification">
<summary>（10）HTTPS 相比 HTTP 使用了什么协议？</summary>
<p>关联知识点待核实。</p>
</details>

HTTPS 在 HTTP 与传输层之间使用 TLS，握手中完成协议与密钥协商，并通过证书验证服务端身份，随后保护数据机密性与完整性。具体握手流程取决于 TLS 版本与是否恢复会话；HTTPS 不会自动保证应用授权、业务数据正确或终端安全。

#### （11）输入网页地址后会发生什么？

<details data-binding-status="pending_semantic_verification">
<summary>（11）输入网页地址后会发生什么？</summary>
<p>关联知识点待核实。</p>
</details>

先解析 URL 并检查可复用的缓存与连接，必要时做 DNS 解析、连接建立和 TLS 握手，再发送 HTTP 请求。响应经过状态码、重定向和缓存处理后，浏览器解析 HTML、获取依赖资源、构建与更新页面并完成布局绘制。实际路径会因缓存、协议和页面脚本而变化。

#### （12）协程是什么，与线程有什么关系？

<details data-binding-status="pending_semantic_verification">
<summary>（12）协程是什么，与线程有什么关系？</summary>
<p>关联知识点待核实。</p>
</details>

协程是可暂停和恢复的执行单元，通常由语言或运行时在用户态调度到线程上，适合表达大量等待任务。它不自动提供 CPU 并行，也不消除共享状态竞态；阻塞调用是否拖住线程、调度是否可抢占，都要结合具体运行时说明。

#### （13）怎样介绍自己熟悉的技术栈？

<details data-binding-status="pending_semantic_verification">
<summary>（13）怎样介绍自己熟悉的技术栈？</summary>
<p>关联知识点待核实。</p>
</details>

选实际做过的系统，说明语言、存储、通信和部署组件分别承担什么职责，挑一个决策解释约束、取舍和验证。区分熟练使用、读过原理和仅了解概念的部分；原帖没有列出这道题的完整作答，本文不替候选人填写语言、框架和熟练程度。
