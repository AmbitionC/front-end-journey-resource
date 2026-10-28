### 华为 Agent 实习两轮记录：TCP、C 存储期与拓扑序

以下短答与教学示例由编辑补充，不代表原作者的现场回答、实际架构或实测结果。

公司为华为，具体 BG 未注明，岗位为 Agent 方向。作者自述 6 月中旬技术面约 50 分钟、7 月初主管面，月份未给年份；两轮按同一个实习流程整理。项目职责和面试结果仅为自述，不作外部认证。

选四组已见技术问题。原文还提到课程、竞赛、C 编译和项目架构追问，但没有展开部分项目细节；这些全部保留在私有库存。拓扑题没有完整输入、约束和样例，本页只讲通用方法，不复原原题。

<details data-knowledge-key="tcp-handshake">
<summary>（1）TCP 三次握手怎样进行，为什么不能只交换两次？</summary>
</details>

客户端发 SYN，服务端回 SYN 与 ACK，客户端再确认服务端的 SYN，用来同步双方的初始序列号并建立连接状态。第三步让服务端知道自己的 SYN 已被收到，并有助于处理滞留的旧连接请求；它不证明上层业务已健康。

教学例子：一个旧 SYN 延迟到达服务端，若收到请求并回包就立即视为完整连接，可能建立对方并不承认的连接。要求有效的后续确认，能把此类旧请求与当前建连过程区分。

技术核对：[RFC 9293 §3.5：建立连接](https://www.rfc-editor.org/rfc/rfc9293.html#name-establishing-a-connection)。

知识导航：[TCP 建连、断开与连接状态](../../../knowledge/network/tcpIp/tcp-handshake.md)。

<details data-knowledge-key="c-object-storage-duration">
<summary>（2）C 语言中“临时变量”的存储区域怎样判断？</summary>
</details>

先澄清“临时变量”具体指哪种对象。若指函数内没有 static、extern 或 _Thread_local 说明符的普通局部对象，C 规定的是自动存储期；实现中常用栈或寄存器，也可能在保持可观察行为的前提下消除。未同时声明 _Thread_local 的 static 局部对象具有静态存储期，不能因写在函数里就一律称为栈变量。

教学例子：函数里的 int x = 1 与 static int count = 0 生命周期不同；前者通常随该次块执行存在，后者跨函数调用保留。原题没给声明或代码，因此这里不能替面试官选定某一变量的实际地址。

技术核对：[C11 委员会草案 N1570 §6.2.4](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)、[GCC：优化可能改变变量的实际承载方式](https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html)。

知识导航：[C 对象的存储期与生命周期](../../../knowledge/cs/language/c-object-storage-duration.md)。

<details data-knowledge-key="algorithm-graph">
<summary>（3）已知任务是求拓扑序，可以怎样说明通用解法？</summary>
</details>

拓扑序要求每条依赖边的前置节点都排在后置节点前，只对有向无环图存在。通用 Kahn 方法统计入度，反复输出零入度节点并删除其出边；输出数量不足节点总数说明有环。用邻接表和普通队列时，构图与扫描为 O(V+E)。

教学例子：A→C、B→C 可以得到 A、B、C，也可以得到 B、A、C；只要每条边的顺序都满足即可。若再加 C→A 就有环，不能返回一段局部顺序并称完成。是否要求字典序、如何输入边，原帖均未给出。

技术核对：[Boost.Graph：DAG 与拓扑排序复杂度](https://www.boost.org/doc/libs/1_31_0/libs/graph/doc/topological_sort.html)。

知识导航：[BFS、DFS、最短路与拓扑排序](../../../knowledge/cs/algorithm/algorithm-graph.md)。

<details data-knowledge-key="agent-skill-design">
<summary>（4）RAG、Skill 和 MCP 各解决什么问题？</summary>
</details>

RAG 为生成提供按需检索的外部证据；Skill 封装一类任务的方法、说明与资源；MCP 规范应用和外部工具、资源之间的能力交互。三者可以组合，权限、状态和结果校验仍由运行系统落实，不能由术语名称自动保证。

教学例子：一个排障 Skill 指导先查内部手册，RAG 返回带版本的相关段落，再通过已授权的 MCP 工具读取日志。手册中的文字不能自行授予写操作权限，工具接入成功也不等于事故已经解决。

技术核对：[Agent Skills 规范](https://agentskills.io/specification)、[MCP 架构（2026-07-28）](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)。

知识导航：[Agent Skill：渐进式披露、热插拔与版本治理](../../../knowledge/llm/agent/agent-skill-design.md)。
