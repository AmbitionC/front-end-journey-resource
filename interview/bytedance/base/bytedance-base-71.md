公司：字节；方向：大模型应用开发；来源自述为秋招一面，部门与面试年份未明确。本文选录日志盲区、框架分工和图算法三题。图题只保留了 BFS、单源最短路与“距离为 1”的线索，没有完整题面；下文明确采用无权或等权图的教学模型。全部解答与例子均为编辑教学补充。

<details data-knowledge-key="logging-monitoring">
<summary>（1）系统出现问题却没有错误日志，怎样发现并继续定位？</summary>
</details>

先验证用户看到的异常，再判断是业务执行出了问题，还是日志没有被记录、采集或查到。用指标、调用追踪、业务状态和可控复现形成独立证据，再核对日志级别、采样、关联 ID 与采集链路；“没搜到 error”不能证明系统正常。

例如一个请求返回 200，却没有生成应有结果：可以先用获准的代表请求核对入口、依赖调用、持久写入与读取结果，确认在哪个边界偏离预期。再把异常开始时间与发布、配置和依赖变化对齐，用同一请求或业务操作 ID 关联证据；时间接近只产生假设，不能直接认定根因。

[Google SRE 的监控章节](https://sre.google/sre-book/monitoring-distributed-systems/)把用户可见行为的黑盒检测与内部白盒信号分开，也指出成功状态码仍可能返回错误内容。因此延迟、错误、流量和资源饱和可以帮助发现盲区，具体业务结果仍须单独核验。

若信号不足，可在受控范围增加针对性边界事件，或用脱敏样本复现。先提出要验证的问题，例如“写入是否确认、返回前等了哪个依赖”，再补最小埋点；不要为了找一个故障长期记录全部 Prompt、密钥或个人内容。原记录没有给实际事故，以上不代表作者完成过这次排障。

延伸阅读：[日志、指标、Tracing 与告警](../../../knowledge/backend/devops/logging-monitoring.md)。

<details data-knowledge-key="build-agent-framework">
<summary>（2）LangChain 与 LangGraph 各适合承担什么职责？</summary>
</details>

LangChain 提供模型、工具与 Agent 等集成和较高层构建能力；LangGraph 用状态、节点和边显式组织执行，可表达分支、并行、暂停与恢复。两者可以组合，当前 LangChain 的 Agent 抽象也构建在 LangGraph 上；不能概括成一个有状态、另一个永远无状态。

[LangChain 当前架构说明](https://docs.langchain.com/oss/python/langchain/philosophy)记载了其 v1 Agent 抽象与 LangGraph 的关系。对一个短小固定流程，可以先用清晰的函数组合或现成 Agent；需要跨步骤等待、人工中断、复杂分支或可恢复状态时，再明确图中的节点、路由与持久化职责。这个选择需要结合实际版本和任务，而不是只比较框架名称。

教学例子：资料任务先检索，再按证据是否充分选择补查或回答。图状态保存任务 ID、证据引用与待办；节点返回状态更新，字段的 reducer 决定覆盖还是合并。[LangGraph Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)的累加 reducer 并不会因收到空列表就清空旧值。

检查点也不代表外部副作用只执行一次。恢复可能重跑节点，工具写入仍需幂等、权限与结果核验；未实际实现过持久恢复，就不能把框架支持某能力说成自己的系统已经可靠具备。原文没有给选型或代码，此处只解释职责。

延伸阅读：[从零构建 Agent 运行时](../../../knowledge/llm/agent/build-agent-framework.md)。

<details data-knowledge-key="algorithm-graph">
<summary>（3）如何用 BFS 求单源最短路（按无权或等权模型教学）？</summary>
</details>

按每条边代价为 1 的教学模型，从源点以 FIFO 队列逐层扩展；第一次发现节点就记录距离、前驱并标记，得到到各可达点的最少边数。邻接表下时间为 O(V+E)，额外距离与队列空间为 O(V)；这些前提是教学模型，并非原帖保留的完整题设。

原记录只写了用 BFS 解决单源最短路，并留下“距离为 1”的片段，没有保留图的方向、全部边权、输入或返回要求。下面不复原这些条件，而是解释 [MIT 6.006 BFS 讲义](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/196a95604877d326c6586e60477b59d4_MIT6_006S20_lec9.pdf)中的按边数分层机制。

先置 dist[source]=0 并入队。取出 u 后，对每个尚未发现的邻居 v，令 dist[v]=dist[u]+1、parent[v]=u，再入队。因为更浅的一层先处理，第一次发现 v 时不会还藏着一条边数更少的未处理路径；入队时就标记也能避免同一节点被重复加入。

教学例子：s 连到 a、b，a 和 b 都连到 t，则 t 首次被发现的距离为 2；两条同长路径都可能正确，若要固定返回哪条，需要额外约定邻居顺序。不可达点保留未到达状态；路径可沿 parent 回溯。若边的代价不同，普通 BFS 的最少边数不能自动代表最小代价，应重新分析算法条件。

延伸阅读：[BFS、DFS、最短路与拓扑排序](../../../knowledge/cs/algorithm/algorithm-graph.md)。

## 参考资料

- [Google SRE：监控分布式系统](https://sre.google/sre-book/monitoring-distributed-systems/)。
- [LangChain：当前 Agent 与图工作流](https://docs.langchain.com/oss/python/langchain/philosophy)。
- [LangGraph：状态更新与 reducer](https://docs.langchain.com/oss/python/langgraph/graph-api)。
- [MIT 6.006：Breadth-First Search](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/196a95604877d326c6586e60477b59d4_MIT6_006S20_lec9.pdf)。
