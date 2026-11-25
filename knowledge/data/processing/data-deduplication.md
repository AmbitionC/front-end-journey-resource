数据去重首先是“什么算同一个”的领域定义，其次才是算法。订单按业务单号相同、文档按内容完全相同、图片近似相同，使用的是三种不同等价关系。若不保留规则、来源和处置记录，去重会从质量工具变成无法解释的数据删除器。

![数据从规范化、精确键与内容指纹到近重复候选、复核和可审计决策的管线](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/data-deduplication-exact-near-duplicate-v1.webp)
*图：精确去重直接判断身份；近重复先召回候选再精排，所有决策保留来源与代表样本。*

## 三类重复问题

实体重复表示两个记录指向同一现实对象，例如格式不同的手机号；内容重复表示字节或规范化文本一致；近重复表示内容高度相似但有局部编辑。三者的误判成本不同：重复日志多算一次可能影响指标，错误合并两个客户则可能造成权限与隐私事故。

先写 dedup contract：匹配字段、规范化版本、时间窗口、阈值、代表记录选择规则、哪些字段允许合并、谁能撤销。对高风险实体，算法只生成候选，最终合并需要确定规则或人工审核。

## 精确键与内容指纹

[PostgreSQL 唯一约束](https://www.postgresql.org/docs/18/ddl-constraints.html)可在并发写入时强制精确业务键唯一。不要只在写入前 `SELECT` 检查，因为两个请求可能同时发现“不存在”再插入。使用唯一索引，冲突后读取已有记录；幂等 API 将 caller 提供的 idempotency key 与请求摘要一起保存，防止同一键被不同请求复用。

内容级去重先定义 canonicalization：Unicode 归一化、换行、空白、大小写和元数据是否参与。对规范化字节计算加密摘要可快速发现完全相同内容，但 hash 相同只表示该规范化规则下相同。保留原始对象和规则版本，升级规范化算法时可重算。

## 近重复：召回候选再确认

对大规模文档做全量两两比较是平方复杂度。常见流程把文档切成 shingles，计算集合相似度，用 MinHash 近似 Jaccard，再通过 LSH 把可能相似的样本放入同一候选桶。相关[MinHash 与 Jaccard 研究](https://research.google/pubs/maximally-consistent-sampling-and-the-jaccard-index-of-probability-distributions/)说明哈希碰撞可用于估计集合相似性。

LSH 是候选生成，不是最终判断。候选对还要用精确 Jaccard、编辑距离、语义模型或领域特征复核。阈值通过标注集校准，并分别观察 false merge 与 missed duplicate。短文本、模板页和多语言内容应分层评估，不能共用一个全局阈值。

```text
原始记录
  → 规范化与分词
  → exact key / content hash
  → MinHash/LSH 候选
  → 精确相似度与业务规则
  → keep / link / merge / review
```

## 代表样本与合并策略

发现重复后不应简单保留第一条。选择 canonical record 时可考虑来源可信度、完整性、更新时间和下游引用。更安全的做法是给重复记录分配 clusterId，保留每个 source record 和 merge edge；查询层读取代表值，审计时仍能追溯。

字段合并需逐字段策略，例如邮箱不做猜测合并，地址保留版本，统计量重新聚合。删除只在保留期和撤销窗口后执行。近重复样本可能各自包含唯一片段，训练数据也应明确是删除、降权还是保留一份。

## 防止训练与评估泄漏

[Deduplicating Training Data Makes Language Models Better](https://research.google/pubs/deduplicating-training-data-makes-language-models-better/)展示了训练数据重复对模型的影响。机器学习管线还要注意 split-aware：若先随机切分、再只在每个集合内部去重，同一近重复簇可能同时进入训练和测试，造成虚高评估。

更合理的顺序是先在全量数据生成重复簇，再以簇为单位分配 train/validation/test；时间评估则保持时间边界并标记跨期重复。去重规则、簇 ID 和数据版本进入训练 lineage，确保模型结果可复现。

## 增量处理与监控

批量去重可全局建索引，流式写入则查询已有指纹和候选索引。为避免竞态，最终 exact key 仍由事务唯一约束保证；近重复索引允许最终一致，但记录 decision version。规则升级时并行构建新索引，对比差异后切换，不能直接覆盖旧结论。

监控输入量、exact duplicate rate、候选数、簇大小分布、阈值附近样本、人工推翻率和按来源的变化。突然高重复可能是上游重放，也可能是规范化 bug。测试哈希冲突处理、并发插入、超大簇、跨语言、规则升级和撤销合并。完成标准是既减少冗余，又能解释每条记录为何被关联、保留或删除。

## 练一练

### 高频考点题 1：先定义什么

做数据去重，第一步应该是？

- A. 先选好 MinHash 的参数
- B. 先删掉所有看起来相似的记录再说
- C. 直接对所有字段算哈希后去重
- D. 定义"什么算同一个"的等价关系

**答案：D。** 订单按业务单号、文档按内容、图片按近似相同，是三种不同的等价关系；还要写清规范化版本、阈值和代表记录规则。

### 高频考点题 2：并发写入去重

要保证业务单号不重复，下面哪种做法在并发写入时可靠？

- A. 写入前先 SELECT 一下是否已存在
- B. 交给数据库的唯一约束来保证
- C. 应用内存维护已写入集合
- D. 每天跑一次离线任务删掉重复的行

**答案：B。** 两个请求可能同时查到"不存在"再都写入；唯一约束在事务层面强制精确业务键唯一。

### 高频考点题 3：LSH 的角色

近重复去重中，MinHash 加 LSH 起什么作用？

- A. 直接给出最终是否重复的判定
- B. 把相似度计算变成精确的两两比较
- C. 只生成候选对，之后还要复核确认
- D. 只用来压缩存储

**答案：C。** LSH 把可能相似的样本放进同一桶，避免平方复杂度；候选还要用精确相似度或领域规则确认，阈值用标注集校准。

## 参考资料

- [PostgreSQL：Constraints](https://www.postgresql.org/docs/18/ddl-constraints.html)
- [Google Research：Maximally Consistent Sampling and the Jaccard Index](https://research.google/pubs/maximally-consistent-sampling-and-the-jaccard-index-of-probability-distributions/)
- [Google Research：Deduplicating Training Data Makes Language Models Better](https://research.google/pubs/deduplicating-training-data-makes-language-models-better/)
