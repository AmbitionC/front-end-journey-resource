美团容器平台JAVA开发一二面自述，月日为9.2与9.7，年份未明示。一面前15分钟未录到，二面AI Coding没有题面，均不补写。

经历和岗位来自候选人自述，未独立认证；以下短答、详解与例子为编辑补充，不是候选人的现场答案或企业标准答案。未披露条件先澄清，教学假设会单独说明。

<details data-knowledge-key="async-job-queue">
<summary>（1）数据库事务提交后 MQ 发送失败，或消费者重复收到消息，怎样界定可靠性和幂等责任？</summary>
</details>

短答：事务内同时写业务与待发布事件，发布器可恢复投递；消费者用稳定业务事件键把去重和业务写入放在同一事务，提交后确认。重复交付是需要处理的正常情形。

详解：生产者确认只覆盖发布方与broker，消费确认覆盖消费端交付责任，二者不互相证明。发布成功而进度未保存可重复发，业务提交后ACK丢失可重复收。外部支付、发信等效果不属于这个本地事务，还需对端幂等、状态查询与对账，不能声称端到端恰好一次。

知识导航：[消息队列、异步任务与后台 Job](../../../knowledge/backend/api/async-job-queue.md)。

<details data-knowledge-key="agent-permission-model">
<summary>（2）Skill 同时读写且按用户与部门隔离时，权限应由哪一层校验，MCP 承担什么职责？</summary>
</details>

短答：从受信任身份解析用户/部门/租户，按资源和读写操作做授权。工具服务执行点必须强制校验；MCP可承载这个服务边界，但协议名本身不等于完整权限系统。

详解：可见工具清单先裁剪，真正读取或写入前仍重新检查当前权限、对象归属、状态和必要确认。独立策略服务与Server内模块是部署取舍，关键是调用路径不能绕过，属性不能由模型自报，委派也不能扩大权限。记录决策和实际效果，处理撤销、过期与参数变化；有权不代表重复执行安全。

知识导航：[最小权限、授权与工具调用确认](../../../knowledge/llm/production/agent-permission-model.md)。

<details data-knowledge-key="rag-production-ingestion">
<summary>（3）RAG 知识库中同一文档有多个版本时，怎样处理检索与使用边界？</summary>
</details>

短答：先区分业务内容版本和索引构建版本，并明确查询当前规则还是某个历史时点。检索只选符合发布、有效期、权限与删除规则的版本，引用保留版本和块位置。

详解：新上传不等于已生效，向量更相似也不能越过版本规则。词法和向量使用同一版本条件，缓存也携带版本口径。新构建在旁路校验完整性与质量后再切换，并检查逐动作错误和最终指向；删除/撤权应先阻断当前查询，回滚旧索引也不能恢复撤权。原文未给生效语义，以上为教学合同。

知识导航：[生产级文档解析、索引与增量更新](../../../knowledge/llm/rag/rag-production-ingestion.md)。

<details data-knowledge-key="algorithm-hash">
<summary>（4）审查单例 Spring Controller 的共享 HashMap 时，需要检查哪些并发与内存风险？</summary>
</details>

短答：先辨认Map保存请求临时数据还是共享状态。默认单例Controller的实例字段可能被多请求共用，普通HashMap不提供并发安全；换并发容器也不自动解决复合业务动作和无限增长。

详解：临时数据可放请求局部状态；确需共享时，所有相关读写使用一致的并发合同，跨实例事实回到外部存储。单例是每容器每bean定义，不是所有进程唯一。缓存另定容量、过期、失效和隔离，监控条目与内存。原代码没有给出，本文只提供审查方向，不断言具体漏洞或虚构已测试补丁。

知识导航：[哈希表、缓存与去重](../../../knowledge/data-structure/algorithm/algorithm-hash.md)。

## 参考资料

- [RabbitMQ：发布与消费确认](https://www.rabbitmq.com/docs/confirms)
- [NIST：ABAC定义](https://csrc.nist.gov/pubs/sp/800/162/upd2/final)
- [MCP：工具校验与访问控制](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
- [Elastic：别名逐动作结果](https://www.elastic.co/docs/manage-data/data-store/aliases#multiple-action-results)
- [Qdrant：过滤条件](https://qdrant.tech/documentation/search/filtering/)
- [Spring7.0.5：bean作用域](https://github.com/spring-projects/spring-framework/blob/v7.0.5/framework-docs/modules/ROOT/pages/core/beans/factory-scopes.adoc)
- [JDK25：HashMap](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/HashMap.html)
