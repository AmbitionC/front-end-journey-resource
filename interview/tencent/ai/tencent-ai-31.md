腾讯后台开发暑期实习一面，内容依次为字符串算法、Java 基础与 RAG 项目。原记录只给出发帖时间，面试日期未注明；后续自述约到二面、二面未通过，没有二面题目。

本文仅整理已见文字。以下短答为编辑补充的备考思路；除使用 JDK 17 外，原记录未提供完整现场回答。项目的 FAISS 索引类型与数据库规模未披露。

## 算法与 Java 基础

<details data-knowledge-key="algorithm-array"><summary>（1）给定字符串 s，求其中不含重复字符的最长子串长度。0 ≤ s.length ≤ 5*104（原文记法），s 由英文字母、数字、符号和空格组成。</summary></details>
<p>维护无重复字符的滑动窗口和每个字符的最近位置，遇到窗口内重复时把左边界推进到上次位置之后，且左边界不能回退。每次更新最大窗口长度；空串返回 0，在哈希操作平均常数时间的模型下总时间 O(n)。</p>

<details data-knowledge-key="java-runtime-memory"><summary>（2）Java 使用什么版本，为什么选择 JDK 17？</summary></details>
<p>原记录回答了 JDK 17，但没有说明当事人的选型原因。准备时应结合所需能力、框架与构建工具兼容性、部署环境和迁移验证说明取舍，避免仅凭版本号断言更快或更稳定。</p>

<details data-knowledge-key="algorithm-hash"><summary>（3）HashMap 怎样解决哈希冲突？追问：为什么可能出现死循环，没有并发安全保护吗？</summary></details>
<p>先按版本说明桶数组、链表或树桶的冲突处理，再区分碰撞与线程安全。历史上 JDK 7 的并发扩容可因共享链节点的头插迁移交错而成环；这不是 JDK 17 的同一实现路径，但 HashMap 仍不提供共享结构修改的并发保护，应选择外部同步或适合的并发容器。</p>

<details data-knowledge-key="algorithm-hash"><summary>（4）ConcurrentHashMap 怎样保证并发安全？</summary></details>
<p>先限定实际 JDK 版本，再沿桶定位、CAS 发布、桶级协调和扩容协作说明更新协议，不能概括成所有操作只靠 CAS。读取的可见性、单 key 原子操作与多个调用组成的业务不变量要分开；容器安全也不会自动保护 value 内部的任意修改。</p>

<details data-knowledge-key="java-runtime-memory"><summary>（5）JVM 中哪些运行时数据区由线程共享，哪些由线程独占？</summary></details>
<p>先区分运行时数据区与约束读写可见性的 JMM，再说明堆、方法区是共享逻辑区域，PC 与 JVM 栈属于线程执行状态，本地方法栈依实现提供。局部变量持有共享对象的引用并不会令对象自动线程隔离。</p>

<details data-knowledge-key="java-runtime-memory"><summary>（6）原题称“共享区在 JDK 8 之后变成元空间”，这一变化的背景和收益是什么？</summary></details>
<p>先纠正前提：JDK 8 的 HotSpot 移除永久代，类元数据改用本地内存；整个共享区并没有都变成元空间。变化减少了永久代容量调优负担，但没有消除类加载器保留、元数据增长或本地内存耗尽问题。</p>

<details data-knowledge-key="java-runtime-memory"><summary>（7）为什么要区分 JVM 栈和本地方法栈？追问：本地方法栈支持非 Java 的方法吗，Java 运行会涉及 C/C++ 吗？</summary></details>
<p>JVM 栈用于方法调用帧、局部变量和计算状态；本地方法栈可支持由 C/C++ 等非 Java 语言实现的 native 方法或解释器需求。规范区分执行职责，但不要求所有 JVM 必须有两个独立物理栈，也不能据此认为每个 Java 方法都会先变成 C/C++ 执行。</p>

<details data-knowledge-key="java-runtime-memory"><summary>（8）Java 有垃圾回收，为什么仍会内存泄漏？哪些场景可能出现？</summary></details>
<p>垃圾回收无法替应用识别仍被长期引用、却已无业务用途的对象。无界缓存、静态集合、线程池 ThreadLocal 或监听器都可能成为持有路径，需要结合持续增长与堆快照引用链验证；未释放的本地资源还需单独取证。</p>

## RAG 项目

<details data-knowledge-key="rag-pipeline"><summary>（9）RAG 主要解决什么问题？</summary></details>
<p>RAG 在生成前检索外部证据，主要支持知识更新、私有数据使用和来源追踪。回答应沿检索、证据装配与生成说明边界：它不自动消除幻觉，仍依赖数据质量、权限、召回效果与引用验证。</p>

<details data-knowledge-key="vector-database-internals"><summary>（10）项目使用 FAISS 的哪种索引，数据库规模多大？</summary></details>
<p>原记录没有给出索引类型和规模，无法替当事人填写。准备时应先核对实际索引类、向量数量与维度、距离函数，再解释精确搜索或 ANN 的召回、延迟和内存取舍；不能由使用 FAISS 推断一定采用 HNSW 或 IVF。</p>

<details data-knowledge-key="rag-hybrid-search"><summary>（11）为什么叫倒排索引，它的基本原理是什么？</summary></details>
<p>先用“文档到词”与“词到文档列表”比较访问方向：查询词可以直接定位包含它的候选文档。词频和词位置等附加信息支持评分或短语查询；倒排结构与 BM25 评分要区分，分词和归一化也会改变能否命中。</p>

<details data-knowledge-key="rag-chunking"><summary>（12）原始文档怎样变为向量索引，文本切分如何做？</summary></details>
<p>先解析清洗并保留标题和来源，再沿结构边界切分，超长段按模型 token 限制细分，并按需要设置有限重叠。对块生成兼容的 embedding 后连同版本和元数据入索引；块大小、重叠与检索质量需要用真实查询评测，没有通用最优数值。</p>

## 延伸学习

- [数组、字符串与双指针](../../../knowledge/data-structure/algorithm/algorithm-array.md)
- [哈希表、缓存与去重](../../../knowledge/data-structure/algorithm/algorithm-hash.md)
- [JVM 内存、类加载与 OOM 定位](../../../knowledge/backend/java/java-runtime-memory.md)
- [RAG 完整流程实战](../../../knowledge/llm/rag/rag-pipeline.md)
- [向量数据库索引、过滤与一致性](../../../knowledge/data/storage/vector-database-internals.md)
- [Hybrid Search 混合检索](../../../knowledge/llm/rag/rag-hybrid-search.md)
- [文本分块策略（Chunking）](../../../knowledge/llm/rag/rag-chunking.md)
