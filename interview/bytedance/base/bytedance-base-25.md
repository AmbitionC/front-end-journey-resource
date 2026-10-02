公司：字节跳动；岗位：AI Agent 研发工程师、AI 算力基础设施，方向为 Agent Infra / Runtime；招聘场景：27 届秋招。原文给出 2026.9.17，未明确轮次序号。

背景、经历和提问范围来自候选人自述，未独立证实。以下问题按原文归纳；答题思路为独立教学整理，不代表作者现场作答或企业标准答案。

## 教学演算：LRU的一次访问为什么要移动节点

教学设定容量为2，链表从最近到最旧排列。put(A,1)得到[A]，put(B,2)得到[B,A]；get(A)先由哈希表定位A，再将节点移到头部，得到[A,B]；put(C,3)得到[C,A,B]，超容量时删除尾部B并移除其哈希条目，最后[C,A]。更新A的值不新增容量，但仍移到最近端。这个手工状态演算未在完整程序运行；哈希查找平均常数时间不等于最坏情况保证，线程安全也需另加同步合同。

#### （1）Agent Loop 需要哪些模块，Harness 最重要解决什么问题？

循环接收目标和当前状态，模型提出下一步行动，运行时校验权限、参数和预算后执行工具，把结果记录为观察，再判断是否继续。Harness 为循环提供上下文、工具、状态、隔离、停止与验收边界；工具执行成功不等于用户任务完成。关键不是框架名称，而是谁持有状态、谁允许副作用以及失败后怎样恢复。

知识导航：[Agent Run Loop、轮次与终止条件](../../../knowledge/llm/agent/agent-run-loop.md)、[从零构建 Agent 运行时](../../../knowledge/llm/agent/build-agent-framework.md)、[Agent 工具契约、Schema 与错误语义](../../../knowledge/llm/agent/agent-tool-design.md)。

#### （2）了解哪些框架，LangChain 与 LangGraph 有何关系？

LangChain 提供模型、工具等集成及 Agent 组件；LangGraph 适合显式状态、分支、持久化和恢复编排。当前 LangChain 的 Agent 建立在 LangGraph 之上，但并非每个项目都需直接写图；固定链路可以用普通代码。原帖还问使用LangChain构建Agent的模块：模型接口接收上下文并提出动作，工具层定义Schema与执行合同，状态层保存观察，运行时串起循环与停止条件；这里归并展开模块问，不补实习项目接口。按状态控制、恢复、依赖和维护成本选型，框架不替代业务幂等与授权。

知识导航：[工作流状态、检查点与断点续跑](../../../knowledge/llm/agent/agent-workflow-state.md)、[确定性 Workflow 与 Agent 的组合](../../../knowledge/llm/agent/agent-deterministic-workflow.md)。

#### （3）Agent Memory 通常怎样分类？

短期状态服务本次会话，包括目标、近期消息、计划和工具证据；长期记忆保存跨会话仍有效的偏好、事实或经验。保存原始事件与来源，按权限、相关性和时效检索，摘要只是工作视图。不能把所有长期内容无条件注入每轮上下文。

知识导航：[短期记忆、长期记忆与检索](../../../knowledge/llm/agent/agent-memory.md)、[会话摘要、压缩与记忆提炼](../../../knowledge/llm/agent/agent-memory-summarization.md)。

#### （4）MCP、Skill 和沙箱分别解决什么问题，是否用过 E2B SDK？

MCP 约定客户端与服务器交换工具等能力，Skill 提供任务说明和使用条件，沙箱提供受限执行环境。加载说明或生成调用参数均不授予权限，执行器仍要校验。使用 E2B 或其他实现的经验只报告实际版本与做过的任务，原帖未给 SDK 调用细节，本文不替作者补造。

知识导航：[MCP / A2A 智能体通信协议](../../../knowledge/llm/agent/mcp-protocol.md)、[Agent Skill：渐进式披露、热插拔与版本治理](../../../knowledge/llm/agent/agent-skill-design.md)、[代码执行、浏览器与文件操作沙箱](../../../knowledge/llm/agent/agent-sandbox.md)。

#### （5）平时使用 Go、MySQL、Redis 的经验怎样讲？

说明真实场景、负责的组件、接口合同、遇到的故障与验证。用读缓存或异步任务举例时，先界定权威数据与允许旧值窗口，再讨论并发和恢复；原帖没有披露项目性能数据，不填数字。

知识导航：[Redis 缓存策略与一致性](../../../knowledge/backend/database/redis-cache.md)。

#### （6）MySQL 的四种事务隔离级别是什么？

分别是读未提交、读已提交、可重复读、串行化。以 InnoDB 为讨论对象，普通一致性读的快照规则与锁定读/写不同；隔离级别改变可见性与锁行为，不能只背异常名称。业务选择要结合事务范围、并发和可容忍异常验证。

知识导航：[事务、隔离级别与锁](../../../knowledge/backend/database/db-transaction-lock.md)。

#### （7）索引有哪些类型，唯一索引允许多个 NULL 吗？

区分按约束分类的主键、唯一、普通等索引与物理结构分类，避免混成同一维度。MySQL 8.4 的可空唯一索引允许多个 NULL；主键不可为 NULL。复合键中的 NULL 与业务去重语义也要明确，必要时用明确非空业务键，而非误以为 UNIQUE 自动合并所有未知值。

知识导航：[数据库索引原理与查询优化](../../../knowledge/backend/database/mysql-index.md)。

#### （8）什么情况导致索引没用，联合索引如何分析？

复合 B-tree 先按前导列排序；前导等值约束有助于收窄扫描区间。函数、隐式转换、前缀通配和宽范围可能改变可用路径，但“不走索引”“只用部分索引”“用了仍慢”要分开。条件书写顺序不是索引列顺序；用相同数据与参数的执行计划核对扫描、回表、排序和输出成本。

知识导航：[数据库索引原理与查询优化](../../../knowledge/backend/database/mysql-index.md)、[索引、执行计划与查询优化](../../../knowledge/data/sql/sql-index-optimize.md)。

#### （9）现场手写 LRU Cache，并解释整体思路。

哈希表把 key 定位到节点，双向链表维护最近访问顺序。访问或更新已存在键，把节点移到最近端；新增超过容量时从最久未访问端淘汰，并同步删除哈希条目。在平均哈希查找与常数指针操作条件下 get/put 为平均 O(1)。容量为零、更新已有 key、连续淘汰和链表首尾需要覆盖。

知识导航：[哈希表、缓存与去重](../../../knowledge/data-structure/algorithm/algorithm-hash.md)、[链表、指针与 LRU](../../../knowledge/cs/algorithm/algorithm-linked-list.md)。

## 原帖记录边界

原帖包含个人备考建议。本文只把“手写 LRU 并介绍思路”作为原题，其实现要点为整理说明，不将作者建议中的每一项冒充面试官逐条追问。实习项目细节未公开，团队评价为作者感受。

口述要点：表负责定位，链表负责访问顺序，淘汰时两种结构同步更新；索引问题同样先讲结构和具体查询，再用计划验证，避免把经验规则当定律。

教学模拟追问（非原题）：

- **容量为0怎么办？** 不存入任何节点，明确get未命中的返回合同；不要先加入后忘记淘汰。
- **唯一列可以为NULL，还能防止未知事件重复吗？** MySQL8.4允许多个NULL；要按业务使用明确非空身份，不能靠未知值合并事件。

## 整理依据

核验于2026-10-02。LRU状态变化是结构推演，框架说明以当前滚动文档为界，数据库说明限定MySQL8.4。

- [LangChain overview：Agent与LangGraph的关系](https://docs.langchain.com/oss/python/langchain/overview)
- [LangGraph Memory：短期与跨线程记忆](https://docs.langchain.com/oss/python/langgraph/add-memory)
- [MySQL8.4 CREATE INDEX：可空唯一索引](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/create-index.html)
- [MySQL8.4 Range Optimization：skip scan的条件](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/range-optimization.html)
