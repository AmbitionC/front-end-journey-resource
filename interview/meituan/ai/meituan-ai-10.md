### 美团一面：消息保序与双跑边界

候选人自述为美团一面，岗位、部门与面试日期未披露。原问涉及 Agent 对话、消息同步、系统融合和 AI Coding；本页选录消息顺序与双跑边界。

面试经历、岗位与轮次来自候选人自述，未独立认证。短答和教学例子为编辑补充，不代表候选人现场回答或企业标准答案。

<details data-knowledge-key="async-job-queue">
<summary>（1）怎样用分区缓解MQ乱序，分区键的粒度如何选择？</summary>
</details>
<p>先定义要保序的业务实体，再用稳定key把相关事件路由到同一保序分区，并让该实体串行处理到持久提交。分区内读取顺序不等于并发任务的提交顺序，还需事件身份、预期版本和缺口处理，重试与迁移也遵守同一规则。不同实体可并行，但跨分区没有天然全局顺序；粒度过粗会形成热点，过细可能拆散共同约束，应按业务依赖与负载验证。</p>

<p>教学例子（非原项目事件）：某实体已处理到版本7，却先收到9、缺少8，不能只因9较新就直接跳过依赖；应按合同等待或补查缺口，再条件更新。另一个独立实体可继续处理，避免一把全局串行锁拖住所有业务。</p>

技术核对：[RabbitMQ：消息顺序](https://www.rabbitmq.com/docs/queues#message-ordering)、[Kafka：分区与事件顺序](https://kafka.apache.org/intro/)。

知识导航：[消息队列、异步任务与后台 Job](../../../knowledge/backend/api/async-job-queue.md)。

<details data-knowledge-key="agent-canary-release">
<summary>（2）哪些环节适合双跑，支付、额度和库存怎样避免双重副作用？</summary>
</details>
<p>可先双跑只读查询或纯计算，对比计划、校验与输出；真实支付、扣额度和库存应由受控主链路提交，影子写接口用模拟器或dry-run，并隔离资源与写权限。仅丢弃影子响应不会阻止后端副作用。真实灰度还需稳定分桶、同期对照、观察窗口和状态兼容；回滚路由不会撤销已提交写入，仍要按业务合同对账或补偿，不能用双跑替代幂等与一致性设计。</p>

<p>教学例子（非原支付系统）：两路计算订单价格可供比较；若两路分别调用真实扣款，即使影子响应被丢弃，也可能产生重复效果。应阻断影子写入，并对主链路按真实业务幂等和结果查询合同验证。</p>

技术核对：[Google SRE：Canary发布](https://sre.google/workbook/canarying-releases/)、[Istio：流量镜像](https://istio.io/latest/docs/tasks/traffic-management/mirroring/)。

知识导航：[灰度、Canary 与模型版本发布](../../../knowledge/llm/production/agent-canary-release.md)。
