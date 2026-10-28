美团软件开发工程师（后端方向）暑期实习一面，原文只给4.29，年份未明示。以下选择四组可辨别的文字题。

经历和岗位来自候选人自述，未独立认证；以下短答、详解与例子为编辑补充，不是候选人的现场答案或企业标准答案。未披露条件先澄清，教学假设会单独说明。

<details data-knowledge-key="rag-hybrid-search">
<summary>（1）怎样设计 RAG 消融对比，并解释 BM25 与双路召回各自的作用？</summary>
</details>

短答：固定同一任务集、知识与权限版本，分别比较 BM25、向量、双路融合及加入重排后的结果。BM25保留精确词，向量补语义表达；混合是否有效由召回、答案质量、延迟与成本共同判断。

详解：例如错误码查询与自然语言改写应分片统计，不能只报一个平均分。RRF依据名次融合不同检索器，避免把不同比例的原始分数直接相加；候选未召回时重排无法补回。本文没有作者的语料、评测集和分数，只给实验合同，不把教学对照当作已完成消融。

知识导航：[Hybrid Search 混合检索](../../../knowledge/llm/rag/rag-hybrid-search.md)。

<details data-knowledge-key="mcp-protocol">
<summary>（2）Agent 怎样决定调用工具，MCP 的 stdio 与原问所称 SSE 传输如何区分？</summary>
</details>

短答：模型可建议工具及参数，应用决定是否允许执行并校验结果。stdio连接本地子进程；原问的SSE应先核对协议版本，不能与当前所有HTTP传输画等号。

详解：以2025-11-25为例，标准传输是stdio和Streamable HTTP，SSE可作为后者的流式响应，旧HTTP+SSE属于历史合同。2026-07-28又引入无状态发现，不能照搬旧初始化。工具被列出不等于授权，参数合法也不代表业务已完成；原文没有部署版本，不替作者选定。

知识导航：[MCP / A2A 智能体通信协议](../../../knowledge/llm/agent/mcp-protocol.md)。

<details data-knowledge-key="os-thread-sync">
<summary>（3）三个线程怎样依次打印 1—9，并各自负责 1/4/7、2/5/8、3/6/9？</summary>
</details>

短答：用同一锁保护next和打印，只有编号满足(next−1) mod 3的线程可以输出。其他线程在while中等待，打印后递增并通知，最后一次与取消路径也要唤醒等待者。

详解：唤醒只表示可以重新竞争锁，不表示轮到自己。假设三个可运行线程最终能被调度，不变量保证输出1到9且每线程分工正确；某线程中断退出时，应按共享取消合同让其余线程停止，避免等待一个永远不会出现的余数。这里只验证过抽象顺序模型，没有执行真实JVM线程。

知识导航：[锁、信号量与并发同步](../../../knowledge/cs/os/os-thread-sync.md)。

<details data-knowledge-key="redis-data-structure">
<summary>（4）Redis 怎样维护四个分项计数与一个总数，并满足一致性要求？</summary>
</details>

短答：先约定总数是否必须持久保存。可只存四个分项，一次HMGET后求和；必须同时维护总数时，相关更新与读取都要落在同一原子合同内。

详解：连续发两条原子自增不等于整体原子，也可能读到中间状态。脚本/函数先校验类型、范围和增量，再更新分项与总数；关注整数溢出、Cluster同槽与运行期错误恢复。客户端超时后重试仍可能重复加数，需要稳定事件去重；Redis内原子性不保证跨系统或故障切换后的零丢失。

知识导航：[Redis 数据结构与使用场景](../../../knowledge/backend/database/redis-data-structure.md)。

## 参考资料

- [Elastic：RRF公式与排名](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion)
- [RAGAs：检索/生成分层评价](https://aclanthology.org/2024.eacl-demo.16/)
- [MCP 2025-11-25：传输](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
- [MCP 2026-07-28：无状态发现](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)
- [MCP：工具校验与访问控制](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
- [OpenAI Docs：Function Calling严格模式](https://developers.openai.com/api/docs/guides/function-calling#strict-mode)
- [JDK25：wait与notify](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Object.html)
- [JDK25：Semaphore无所有者](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/Semaphore.html)
- [Redis：HINCRBY](https://redis.io/docs/latest/commands/hincrby/)
- [Redis：HMGET](https://redis.io/docs/latest/commands/hmget/)
- [Redis：脚本原子执行](https://redis.io/docs/latest/develop/programmability/)
- [Redis：事务错误边界](https://redis.io/docs/latest/develop/using-commands/transactions/)
