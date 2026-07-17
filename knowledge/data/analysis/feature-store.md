Feature Store 的价值是让同一特征定义在离线训练和在线推理中可发现、可复用、可回放，而不是再建一个键值数据库。它必须处理实体、事件时间、point-in-time join、物化延迟和版本；否则“共用一份定义”仍会产生训练—服务偏差和未来泄漏。

![Feature Store 从离线历史、点时正确 Join、在线物化到低延迟服务的一致性链路](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/feature-store-offline-online-consistency-v1.webp)
*图：训练读取 entity timestamp 之前可见的历史值；在线存储提供最新已物化值，两侧共享实体和特征版本。*

## 特征的身份

一项特征不只是列名。定义至少包含 name、entity keys、value type、event timestamp、transformation、source、owner、TTL、version、freshness 和默认/缺失语义。`user_purchase_count_7d` 必须说明窗口是否包含当前事件、退款怎样处理和时区。

实体 key 要稳定且作用域清晰。用户合并、匿名到登录身份映射可能造成历史重写，需要版本化 entity resolution。不要用可复用邮箱等不稳定标识直接作为在线 key。

## Offline 与 Online Store

[Feast 组件概览](https://docs.feast.dev/getting-started/components/overview)区分 offline store 的历史特征检索与 online store 的低延迟最新值服务。offline 通常在仓库或湖中保存长历史，支持训练集批量 join；online 按 entity key 存最近物化值，优化单条或小批低延迟读取。

在线 store 不是权威历史。物化任务从离线源或流更新 online，并带 event timestamp 和 feature version；旧事件晚到时不能覆盖更新值。监控 materialization lag、写入失败、online/offline value diff 和 key miss。

## Point-in-time Correctness

[Feast Point-in-time Joins](https://docs.feast.dev/getting-started/concepts/point-in-time-joins)针对每个 entity row 的 timestamp，查找当时已可见、且在 TTL 内最近的特征值。若训练订单是否欺诈，却 join 了订单一周后才计算的退款次数，模型看到了未来信息，离线成绩会虚高。

```text
training row: user=42, event_time=10:00
feature history: 09:55 -> 7, 10:05 -> 8
correct joined value: 7
```

还要区分 event time 与 created/available time。某笔交易 09:00 发生但 11:00 才入库，在 10:00 的线上决策中不可见；严格回放需要记录可用时间或摄取延迟，否则仍可能泄漏。

## 训练—服务偏差

偏差来源包括离线用 SQL、在线用另一套代码；时区或窗口边界不同；默认值不同；模型请求漏传 key；在线物化落后；预处理库版本不同。把 transformation 封装成共享代码能减少差异，但无法自动统一数据时钟与执行环境。

为代表性 entity/time 同时计算 offline 与 online 特征，比较值和缺失原因。模型制品绑定 feature service/version；上线前验证需要的特征在 online 已物化且 freshness 达标。不能让“latest feature set”随 catalog 修改改变已部署模型输入。

## On-demand 与流式特征

请求上下文特征如当前购物车金额可在推理时计算，并与预计算特征组合。它的 schema、代码和版本同样进入契约。低延迟流式特征要定义乱序、窗口状态、checkpoint 和与离线回放的等价性。

复杂实时 join 会增加故障面。只有业务收益需要毫秒级新鲜度时才承担该成本；很多特征按小时物化已足够。把 freshness 作为逐特征 SLO，而非全平台统一“实时”。

## 缺失、默认与回退

缺失可能表示新用户、物化延迟、key 错误或上游故障，不能全部填 0。返回值同时带 timestamp/version 或至少通过指标区分原因。模型训练包含与线上一致的缺失 indicator 和默认策略。

在线 store 故障时，可使用最近缓存、简化模型或拒绝高风险决策。回退必须经过离线评估和演练，UI/审计记录实际使用的模型与特征版本。

## 治理与验证

Catalog 展示 owner、描述、实体、来源、使用模型、成本、质量和弃用状态。删除特征前由 lineage 找到训练管线与在线模型，先停止新使用，再迁移现有消费者。敏感特征实施目的限制和访问审计。

测试 point-in-time fixture、晚到事件、TTL 边界、时区、重复实体、online 乱序写、物化中断和模型回滚。成熟 Feature Store 能为一次预测重建当时可见的特征值，并解释离线训练与线上服务为何一致。

## 参考资料

- [Feast：Point-in-time joins](https://docs.feast.dev/getting-started/concepts/point-in-time-joins)
- [Feast：Components overview](https://docs.feast.dev/getting-started/components/overview)
