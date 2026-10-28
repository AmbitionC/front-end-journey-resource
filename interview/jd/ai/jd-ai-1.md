京东后端开发一面，原文给0811月日线索、约30分钟且无手撕，部门未注明。以下只讨论文字中可辨别的工程问题。

经历和岗位来自候选人自述，未独立认证；以下短答、详解与例子为编辑补充，不是候选人的现场答案或企业标准答案。未披露条件先澄清，教学假设会单独说明。

<details data-knowledge-key="agent-project-requirements">
<summary>（1）怎样用项目基线与可验收标准减少后续优化和返工？</summary>
</details>

短答：先说明知识树优化针对什么已观察问题，再把交付标准写成输入、输出、正确性、性能与失败约束，并给可重复验收集和现状基线。不要从后来优化倒推最初必定设计错误。

详解：例如可把“能搜索”细化为查询范围、结果正确性、更新时效与可接受响应时间，再按真实任务检查。上线后仍会因规模和需求变化优化，前置验收的目的在于减少可预见返工并保留回归证据，不是承诺再也不用优化。原文没有知识树结构或实际数据，本文只给方法。

知识导航：[从真实需求定义 Agent 项目](../../../knowledge/career/agent-project-requirements.md)。

<details data-knowledge-key="build-agent-framework">
<summary>（2）Agent 采用 LangGraph 自建与改造现有开源 Agent，怎样比较选型依据？</summary>
</details>

短答：先指出LangGraph本身也是复用：比较的是自己定义状态/工具，还是改造一个现成Agent应用。以同一任务核对恢复、权限、观测、集成、维护与迁移成本。

详解：短线性流程可能直接组合更清楚，长期分支、等待与恢复则要验证检查点和状态合同。框架提供持久化不等于外部副作用自动恰好一次，恢复仍可能重放。未给开源项目和版本时，不编造具体缺点，也不把自建或依赖少当作普遍更可靠的证明。

知识导航：[从零构建 Agent 运行时](../../../knowledge/llm/agent/build-agent-framework.md)。

<details data-knowledge-key="api-schema-validation">
<summary>（3）跨 Python/Java 服务边界时，怎样核对数据合同与容量？</summary>
</details>

短答：先测真实生产和消费速率及瓶颈，不预设Python低性能、Java高性能。双方固定字段、数值精度、空值、时间单位、批量大小和错误/重试合同。

详解：例如长整型ID经过binary64消费者可能丢精度，应按完整链路约定十进制字符串或精确类型。先检查序列化、网络、排队、数据库与计算开销；用有界批次和缓冲处理速率不匹配。JSON合法不代表业务语义一致，更不代表任意机器能接住无限输入；原文没给数据量和架构，不补性能数字。

知识导航：[API Schema 校验、错误码与契约测试](../../../knowledge/backend/api/api-schema-validation.md)。

## 参考资料

- [Google SRE：生产就绪检查](https://sre.google/sre-book/evolving-sre-engagement-model/)
- [LangGraph：恢复与幂等](https://docs.langchain.com/oss/python/langgraph/interrupts)
- [LangGraph：短期checkpointer与长期store](https://docs.langchain.com/oss/python/langgraph/persistence)
- [RFC8259：JSON互操作](https://www.rfc-editor.org/rfc/rfc8259.html#section-6)
- [OpenAPI3.2：接口描述](https://spec.openapis.org/oas/v3.2.0.html)
