一致性哈希解决节点集合变化时，怎样减少键到节点映射的变化。学习目标是手算一次后继查找与加节点迁移，解释虚拟节点改善什么，再区分路由、复制和数据一致性。

## 普通取模为什么难以扩容

使用 `hash(key) % N` 分配节点时，N 改变会让许多键的结果变化，需要重新安置大量数据。一致性哈希把键和节点位置放到固定哈希空间；节点变化时只改变相关位置的归属。[Apache Cassandra 的 Dynamo 架构说明](https://cassandra.apache.org/doc/stable/cassandra/architecture/dynamo.html#dataset-partitioning-consistent-hashing)把这一做法与普通取模区分。

## 沿环找到后继

将固定哈希范围首尾相连。把节点 Token 排序，对键计算哈希，找到不小于它的第一个 Token；超过最大 Token 时回到最小 Token。这里选择顺时针后继规则作为教学合同；实际系统的区间端点约定要保持一致。

![键先计算哈希，在有序Token中查找后继并映射到物理节点；节点变化只重分配相应区间，复制和一致性另有协议](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/consistent-hashing-routing-v1.png)

假设教学环为 `[0,100)`，A、B、C 的 Token 分别为 10、40、80。哈希为 25 的键归 B，90 的键绕回 A。新增 D=30 后，仅原先由 B 持有的 `(10,30]` 改归 D；25 迁到 D，35 仍归 B。数字只解释规则，不代表某数据库的真实 Token 范围。

## 虚拟节点为什么有帮助

让一个物理节点拥有多个分散 Token，可以把其负载拆成多个小区间，让增减节点的迁移涉及更多旧节点，并减少少量随机 Token 带来的不均。不同节点可有不同数量或不同权重安排，但实际收益依赖 Token 分配、数据分布与容量。

虚拟节点不是新增硬件，也不是副本。多个 Token 指向同一机器，不能把它们当作独立故障域；选副本时还要保证物理节点与机架等约束。[Cassandra 文档](https://cassandra.apache.org/doc/stable/cassandra/architecture/dynamo.html)对此分别讨论路由、虚拟节点与复制。

## 它没有解决什么

一个极热的键仍映射到同一主归属范围，虚拟节点不自动拆开该键的请求。复制、读写一致性、故障检测、迁移期间双写/转发与旧路由失效也需要独立协议。名称中的“一致性”描述映射的变化性质，不等于数据库强一致、共识或分布式事务。

扩容计划要校验新旧路由、迁移字节、限速、容量与失败恢复，说明什么时候切流、如何处理迁移中的读写。路由计算正确还不能证明数据已经搬完或副本收敛。

## 检查理解

在上述环中删除 D 后，25 回到谁？回到 B。若 A 负责多个 Token，能把它们当多个可同时宕机的独立副本吗？不能，它们仍属同一物理故障域。若只有一个键占流量大半，需要另评估缓存复制、请求合并或业务拆分，不能只增加 Token 数。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [阿里云后端与 Agent 二面：领域建模、训练并行与 Java 基础](../../../interview/alibaba/ai/alibaba-ai-28.md)
<!-- interview-source-history:end -->

## 参考资料

- [Apache Cassandra：Dynamo 与 Token Ring](https://cassandra.apache.org/doc/stable/cassandra/architecture/dynamo.html)
