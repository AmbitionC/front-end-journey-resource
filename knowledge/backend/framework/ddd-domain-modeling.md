DDD（领域驱动设计）把业务概念、规则和软件模型一起推敲。学习目标是从一个真实用例识别语言边界、对象身份与必须同时成立的规则，再决定代码职责；不把名词表直接翻译成数据库表或微服务。

## 为什么先讨论业务语言

同一个“账户”在登录系统里可能代表身份，在账务里代表余额与记账规则。限界上下文规定模型与术语在哪个范围内成立；不同上下文可以有各自正确的定义。先与领域专家讨论业务活动、例外与不可违反的规则，再画上下文关系。[Microsoft 的领域分析指南](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/domain-analysis)把领域分析与限界上下文放在战术对象设计之前，强调设计持续迭代。

## 从需求走到模型与代码

以“提交订单后不可任意改价”为教学需求，先明确谁能提交、价格从哪里来、提交失败怎么处理。再把订单的状态与改价规则放在同一责任边界内，确定依赖的支付、库存上下文和交互合同。最后用提交成功、重复提交、非法改价等用例检验模型，再落到代码与存储；这不是所有团队必须依次走一遍的机械流程。

![从业务用例和共同语言出发，确定上下文与不变量，再选择领域对象并通过用例测试反馈模型](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/ddd-domain-modeling-workflow-v1.png)

## 实体、值对象与聚合根怎样识别

实体靠持续身份区分，例如订单编号不随收货地址变化；值对象靠属性值定义，例如同币种同金额可视为相等的 Money。值对象通常设计为不可变，改变时创建新值。它们都可以封装行为，并不是“实体有逻辑、值对象只能装字段”。[战术 DDD 指南](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/tactical-domain-driven-design)分别定义了身份、值与聚合的一致性职责。

聚合把需要在一次事务中维护的不变量收拢起来，由聚合根控制修改入口。订单行可归订单聚合，但供应商、客户与库存不因存在关联就全放进同一聚合。跨聚合通常用标识引用，跨边界协调另用明确的一致性协议。聚合也可以只有一个实体；是否成为聚合根取决于规则与生命周期，不取决于表的外键数量。

## Application、Domain 与 Infrastructure 怎样分工

应用层编排用例、事务边界与依赖调用；领域层表达业务规则、状态变化、实体和值对象；基础设施层实现存储、消息和外部服务适配。领域服务容纳不自然属于某个对象、但仍属于领域规则的行为。不要把所有判断都塞进应用服务，留下只有 getter/setter 的所谓领域模型；也不要为了“充血”把 HTTP、数据库与日志细节全部放进实体。

贫血模型把状态和大部分业务行为分开，充血模型让对象维护自己的规则。对于简单 CRUD，数据加事务脚本可以是合适选择；问题是自称采用领域模型，却让复杂不变量散落各层，任何地方都能绕过。选择依据是规则复杂度、可测试性与变更成本，而非哪个术语听起来更高级。

## 防腐层与跨上下文语义

防腐层把外部模型翻译成当前上下文的模型，例如把旧系统中的金额单位、状态编码转成当前领域概念。它保护模型不被外部语义侵入，职责超出协议序列化；业务规则与流程编排仍放在适当的领域、应用位置。[Microsoft 防腐层模式](https://learn.microsoft.com/en-us/azure/architecture/patterns/anti-corruption-layer)明确区分模型语义映射与 API 协议暴露。

## 用一个问题检查设计

“任何调用方能不能直接修改订单行价格而绕过提交规则？”若可以，聚合入口或持久化适配仍有缺口。再检查两个上下文都叫“已完成”时含义是否相同，失败重试是否重复产生副作用，测试是否验证业务规则而非只断言字段被赋值。

DDD 不要求一张表对应一个实体，不要求一个上下文必定一个微服务，也不让跨服务更新自动成为原子事务。需要长事务补偿时另看 [Saga 与跨服务一致性](../storage/distributed-saga-consistency.md) 所在知识条目；本文只定义领域模型边界。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [阿里云后端与 Agent 二面：领域建模、训练并行与 Java 基础](../../../interview/alibaba/ai/alibaba-ai-28.md)
- [美团业务后台综合面：本体建模、Agent 评测与一致性](../../../interview/meituan/ai/meituan-ai-13.md)
<!-- interview-source-history:end -->

## 参考资料

- [Microsoft：领域分析与限界上下文](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/domain-analysis)
- [Microsoft：战术 DDD 模式](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/tactical-domain-driven-design)
- [Microsoft：Anti-Corruption Layer](https://learn.microsoft.com/en-us/azure/architecture/patterns/anti-corruption-layer)
