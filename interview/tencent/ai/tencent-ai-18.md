### 腾讯 AI 应用开发实习一面：事务快照与 B+树索引

腾讯AI应用开发实习一面记录，部门和面试年月未注明。以下选录MySQL事务与索引；数据库版本由教学假设单独说明。

以下短答、详解和示例均为编辑教学补充，不代表候选人现场回答、实际项目实现或企业标准答案。

<details data-knowledge-key="db-transaction-lock">
<summary>（1）MySQL 的事务与 MVCC 怎样实现？</summary>
</details>

以 MySQL 8.4/InnoDB 为例，事务用提交和回滚组织多步变更，MVCC 让普通一致性读按可见性规则读取记录版本，必要时利用 undo 重建旧值。RC 通常每次一致性读建立快照，RR 通常复用首次一致性读的快照；自己的写入、锁定读和更新语句需要分开分析。

**详解**

假设事务 A 先做普通查询，读到某行值为 10；事务 B 将它改为 20 并提交，随后 A 再查。在 A 不修改该行的这个教学时序中，RC 的第二次一致性读会建立新快照，可看到 20；RR 通常仍用第一次的快照，继续看到 10。快照时刻通常不是简单地等于执行 BEGIN 的时刻，`WITH CONSISTENT SNAPSHOT` 还有专门语义。[MySQL8.4 一致性读文档](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-consistent-read.html)给出了这些边界。

实现上，聚簇记录的事务信息、回滚指针与 undo 版本链帮助找到对当前 ReadView 可见的版本。undo 同时参与回滚和旧版本重建；redo 则面向崩溃恢复，不能把二者说成同一种日志。[InnoDB 多版本文档](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-multi-versioning.html)说明了记录与 undo 的关系。

MVCC 不等于所有读都无锁。`SELECT ... FOR UPDATE`、写语句和普通一致性读不使用同一套快照访问语义；本事务也能看见自己已做的修改。因此“RR 中任意两次查询都相同”太绝对。回答事务实现时，应把原子性所需的撤销、持久化恢复、版本可见性及冲突锁分开，再说明它们怎样协作。

知识导航：[事务、隔离级别与锁](../../../knowledge/backend/database/db-transaction-lock.md)。

<details data-knowledge-key="mysql-index">
<summary>（2）B+树索引、最左匹配与覆盖索引怎样联系起来？</summary>
</details>

B+树按键有序组织页，适合等值定位和范围扫描。InnoDB 的聚簇叶子保存行，二级索引还保存主键；联合键按列顺序排序，因此有最左前缀关系。所需列都在索引中时可减少取缺失列的回表，但覆盖列并不保证完全免除 MVCC 可见性检查。

**详解**

理解最左匹配可以从 `(a,b,c)` 的字典序出发：先按 a 分组，同一 a 内按 b，再在同一 a、b 内按 c。因此 `a=? AND b=?` 能定位连续范围；`a=? AND b>?` 的范围之后，c 仍可能参与过滤或覆盖，但通常不能像连续等值前缀一样进一步缩小同一查找区间。缺少前导列也不应直接断言“绝对不使用任何索引”，应查看是否采用索引全扫、skip scan等实际访问路径。[MySQL 联合索引](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/multiple-column-indexes.html)提供了基础定位规则。

在 InnoDB 中，主键通常确定聚簇索引，二级记录携带二级键和主键。如果已有 `(name, age)` 二级索引，查询只需 name、age及主键时具备覆盖条件；若还要其他未索引字段，通常需要按主键读行。[聚簇与二级索引文档](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-index-types.html)说明了这个结构。

覆盖回答的是“列值能否从索引取得”，MVCC 还要回答“这个版本能否被当前事务看到”。二级记录被删除标记或所在页被较新事务修改时，引擎可能读取聚簇记录并沿 undo 查旧版本，因此不能把 `Using index` 直接解释成运行时绝不访问聚簇页。[MySQL 多版本与二级索引](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-multi-versioning.html)明确列出了这种情况。原文未保留页大小或节点数量，不补一个固定数值来推算树高。

知识导航：[数据库索引原理与查询优化](../../../knowledge/backend/database/mysql-index.md)。
