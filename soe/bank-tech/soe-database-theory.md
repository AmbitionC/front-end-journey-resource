数据库理论选择题需要把条件变成约束：哪些属性能唯一确定一行，哪些依赖导致重复，关系运算是在筛行还是选列，并发执行究竟出现了哪一种现象。本文补范式、ER 映射和关系代数；事务的工程机制复用[事务、隔离级别与锁](../../knowledge/backend/database/db-transaction-lock.md)及[PostgreSQL 事务、MVCC 与锁](../../knowledge/backend/storage/postgresql-transaction.md)，这里只保留判断题需要的边界和原创练习。

## 先区分关系、键与函数依赖

在本文采用的传统关系模型中，关系可理解为一组同结构的元组；属性对应列，元组对应一行。关系理论采用集合语义，没有重复元组，也不靠行的显示顺序表达含义。SQL 查询默认常用多重集语义，是否去重必须另外判断，不能直接把二者等同。

函数依赖 $X\to Y$ 的含义是：在所有满足业务约束的合法数据中，只要两行的 X 值相同，其 Y 值就必须相同。它来自题设规则，不是从几行样例恰好没有重复就能证明的。[《Database System Concepts》第 7 版作者课件，第 7 章“Functional Dependencies”](https://www.db-book.com/slides-dir/PDF-dir/ch7.pdf)

| 名称 | 判断条件 | 常见误区 |
| --- | --- | --- |
| 超键 | 属性集能唯一确定整个元组 | 可以包含多余属性 |
| 候选键 | 不含任何多余属性的超键 | “最小”指不能删属性，不要求所有候选键的属性数相同 |
| 主键 | 从候选键中选定的一个 | 不是唯一存在的候选键 |
| 主属性 | 出现在任意一个候选键中的属性 | 不能只看被选为主键的那一组 |
| 非主属性 | 不属于任何候选键的属性 | 复合主键之外的列未必都是非主属性 |

键与主键的定义参阅[作者课件第 2 章“Keys”](https://www.db-book.com/slides-dir/PDF-dir/ch2.pdf)；下面使用的属性闭包方法参阅[第 7 章“Closure of Attribute Sets”](https://www.db-book.com/slides-dir/PDF-dir/ch7.pdf)。

求键时可以计算属性闭包 $X^+$：从 X 出发，只要某个函数依赖的左侧已经全部具备，就把右侧加入，直到不能扩展。如果闭包覆盖全部属性，X 是超键；还要试着删除属性，才能判断是否为候选键。

## 原创模拟题 1：先求闭包，再判断候选键

关系 `R(S, C, Name, D, Phone, Score)` 的全部约束由下列函数依赖及其逻辑推论给出，且各属性取值不可再拆分：

```text
S → Name, D
D → Phone
S,C → Score
```

S 表示学生编号，C 表示课程编号，D 表示所属部门编号，Phone 是部门联系电话。哪一个是候选键？

- A. `{S}`
- B. `{C}`
- C. `{S,C}`
- D. `{S,C,D}`

**答案：C。** $S^+=\{S,Name,D,Phone\}$，缺少 C 与 Score；$C^+=\{C\}$。`{S,C}` 则能推出全部属性，删掉 S 或 C 都不再满足，所以是候选键。选项 D 是超键，却含有可由 S 推出的多余属性 D。

这里 S、C 都没有出现在任何给定依赖的右侧，不能由其他属性推出，因此每个候选键都必须包含它们。在这组明确约束下，候选键只有 `{S,C}`；若题干增添其他依赖，必须重新求闭包。

## 范式到底在排除哪种依赖

先判断键，再判断范式。本文的 1NF 采用常见教学约定：每个单元格在指定的属性域中取一个不可再拆的值，不在一格里塞入多个独立的课程编号。

| 范式 | 判断重点 | 不能简化成什么 |
| --- | --- | --- |
| 1NF | 属性值在本题约定的域中保持原子性 | 不是“有主键就够了” |
| 2NF | 满足 1NF，每个非主属性都完全依赖于每个候选键 | 不能只检查被选为主键的候选键 |
| 3NF | 对依赖闭包中的每个非平凡依赖 $X\to A$，X 是超键，或 A 是主属性 | “绝对没有传递依赖”不是完整定义 |
| BCNF | 对依赖闭包中的每个非平凡依赖 $X\to A$，X 都必须是超键 | 不再保留 3NF 对右侧主属性的例外 |

2NF 对“非主属性”和“每个候选键”的限定，还可核对 [Ron McFadyen 公开教材《Relational Databases and Microsoft Access》第 10.3 节](https://acs.uwinnipeg.ca/rmcfadyen/CreativeCommons/Relational%20Databases%20and%20Microsoft%20Access%20.pdf)。

上述 1NF 的域原子性约定及 3NF、BCNF 的形式定义依据[作者课件第 7 章“Atomic Domains and First Normal Form”“Third Normal Form”“Boyce-Codd Normal Form”](https://www.db-book.com/slides-dir/PDF-dir/ch7.pdf)。

其中“非平凡”表示 A 不属于 X。部分依赖指一个属性已能由候选键的真子集决定；完全依赖则不能再缩小决定它的那组键属性。判断题若把 2NF 说成“消除所有部分依赖”，还需检查它是否遗漏了**非主属性**这个限定。

### 原创模拟题 2：题 1 的关系最高满足什么范式

沿用题 1 的全部约束，该关系最高满足哪一项？

- A. 仅 1NF
- B. 2NF，但不满足 3NF
- C. 3NF，但不满足 BCNF
- D. BCNF

**答案：A。** 非主属性 Name、D 仅由候选键 `{S,C}` 的一部分 S 决定，Phone 也能由 S 经 D 推出，已经违反 2NF。无需等到检查 `D → Phone` 的传递依赖时才判断失败。

一种针对这些依赖的分解是：

```text
Student(S, Name, D)       主键 S
Department(D, Phone)     主键 D
Enrollment(S, C, Score)  主键 (S,C)
```

每个给定依赖都能在某张分解后的表中检查，属于依赖保持。就这些约束下的原关系而言，按 S、D 连接相应投影可以还原原元组，不会因拼接生成原先不存在的组合，属于无损连接分解。无损关注能否准确还原，依赖保持关注能否在局部检查约束，两者不是同一个性质；任意拆表也不自动保证二者。

### 原创模拟题 3：3NF 与 BCNF 的差别

关系 `R(A,B,C)` 满足 1NF，函数依赖由 `AB → C`、`C → B` 及其逻辑推论给出。下列哪项正确？

- A. 候选键只有 AB，因此不满足 2NF
- B. 候选键为 AB 和 AC，满足 3NF，但不满足 BCNF
- C. C 能推出全部属性，因此 C 是候选键
- D. 只要满足 3NF 就必然满足 BCNF

**答案：B。** AB 的闭包包含 ABC，AC 也能借 `C → B` 得到 ABC，而且两组都不能再删除属性；C 的闭包只有 BC，缺少 A。A、B、C 都是主属性，所以 `C → B` 的右侧 B 满足 3NF 的主属性例外，但左侧 C 不是超键，违反 BCNF。只检查“有没有传递依赖”的口号，很容易漏掉这类题。

## ER 图怎样落成关系表

ER 模型先表达实体和联系，再根据联系的基数、参与约束与业务唯一性映射成表。本文统一使用 `0..N` 表示可没有、也可有多条，`1` 表示恰好一条；图中的数值必须和题设一起读，不能只凭一根线猜必选或可选。[作者课件第 6 章：映射基数、参与约束及 ER 到关系模式的转换](https://www.db-book.com/slides-dir/PDF-dir/ch6.pdf)

下图采用原创情境：学生与课程通过选课联系，暂不考虑学期和重修。每条选课记录恰好属于一个学生和一门课程；一个学生或一门课程可暂时没有选课记录。

![学生与课程通过选课表形成多对多联系；选课表以 sid、cid 组成复合主键，并分别引用学生表与课程表](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/soe-database-theory-enrollment-er-v1.png)

| 联系 | 常见映射 | 必须额外核对什么 |
| --- | --- | --- |
| 1:N | 在 N 端保存指向 1 端的外键 | 外键是否允许空，取决于参与约束 |
| M:N | 建立联系表，保存两端的键和联系自身属性 | 两端键组合是否足以唯一标识一次联系 |
| 1:1 | 可在合适一侧放外键，并加唯一性约束 | 只有外键还不够限制为 1:1，是否允许空也需另定 |

外键负责引用有效性，不自动限制“同一对实体只能联系一次”。在图示情境下，`(sid,cid)` 的主键或等价唯一约束才负责排除同一学生同一课程的重复选课；若允许按学期重修，唯一性维度也需要相应变化。

### 原创模拟题 4：多对多不能只在一侧塞一列

沿用图示约束，要求记录每次选课的成绩，且同一学生同一课程最多一条记录。哪种设计满足要求？

- A. 在 Student 中增加一个 `cid` 列，每名学生只能写一个课程编号
- B. 在 Course 中增加一个 `sid` 列，每门课只能写一个学生编号
- C. 建 Enrollment，分别保存 `sid`、`cid` 外键，以 `(sid,cid)` 为复合主键，并保存 `score`
- D. 建 Enrollment，只设两个外键，不设任何唯一约束，就一定不会重复

**答案：C。** A 和 B 把多对多缩减为单侧只能记录一个对象；D 的两个外键只验证学生和课程存在，不能独立排除重复的同一组合。图中的 `score` 属于选课联系，而不是学生或课程单独就能决定的属性。

## 关系代数是在操作行、列，还是两张关系

选择、投影、并、差、积和连接的集合语义参阅[作者课件第 2 章“Relational Algebra”](https://www.db-book.com/slides-dir/PDF-dir/ch2.pdf)。除法的“对每个 Y 都存在对应元组”定义还可核对[官方文档中的关系模型背景说明](https://www.postgresql.org/docs/7.1/relmodel-oper.html)；该页为历史 7.1 文档，只用于数学定义，本文的产品隔离保证仍以 PostgreSQL 18 文档为准。

| 运算 | 符号 | 输入与输出的重点 |
| --- | --- | --- |
| 选择 | $\sigma_{条件}(R)$ | 按条件保留元组，属性集合不变 |
| 投影 | $\pi_{属性列表}(R)$ | 选择属性列；集合语义下去掉重复元组 |
| 并、交、差 | $\cup、\cap、-$ | 输入需要满足并相容条件，如对应属性域相容 |
| 笛卡尔积 | $R\times S$ | 组合每一对元组；属性重名时需重命名区分 |
| 连接 | $R\bowtie_{条件}S$ | 按连接条件组合元组 |
| 自然连接 | $R\bowtie S$ | 对同名属性取相等条件，并合并对应同名列 |
| 除 | $R(X,Y)\div S(Y)$ | 找出与 S 中每个 Y 都有对应关系的 X |

自然连接的同名列具有实际约束含义，不能把它当作自动猜测外键的普通连接。SQL 的 `SELECT` 这个关键字也不能直接与关系代数“选择”一一对应：SQL 的选列部分更接近投影，`WHERE` 中对行的过滤更接近选择，而默认去重语义仍可能不同。

### 原创模拟题 5：先选择还是先投影

关系 `E(sid,cid,score)` 包含以下元组：

| sid | cid | score |
| --- | --- | --- |
| s1 | c1 | 82 |
| s1 | c2 | 65 |
| s2 | c1 | 91 |
| s3 | c2 | 82 |

关系代数表达式 $\pi_{sid}(\sigma_{score\geq80}(E))$ 的结果是哪项？

- A. `{s1,s2,s3}`
- B. `{s1,s1,s2,s3}`
- C. `{c1,c2}`
- D. `{s2}`

**答案：A。** 先筛出成绩至少 80 的三行，再只保留 sid。选择条件不是要求“所有课程都至少 80”，因此 s1 的一门课为 65 不会把它的另一门合格选课一起排除。B 保留了被筛掉的行，而且也不符合投影后的集合语义。

### 原创模拟题 6：“所有”怎样用除法表达

仍用上题 E，令 `Required(cid) = {c1,c2}`。求选过所有 Required 课程的学生编号，成绩不作限制。哪项正确？

- A. $\pi_{sid,cid}(E)\div Required$，结果为 `{s1}`
- B. $\pi_{sid,cid}(E)\div Required$，结果为 `{s1,s2,s3}`
- C. $\pi_{sid}(E)$，结果为 `{s1}`
- D. $\sigma_{score\geq80}(E)$，结果为 `{s1}`

**答案：A。** s1 同时对应 c1、c2，s2 缺 c2，s3 缺 c1。条件要求“每一门都存在对应记录”，不是“至少选过其中一门”，也没有要求成绩合格。投影先得到二元关系，才能与单属性 Required 按本题的除法结构匹配。

## 隔离级别选择题先声明采用哪个口径

下表采用 SQL 标准框架的**最低现象排除要求**，依据[固定版本官方文档中的标准对照说明](https://www.postgresql.org/docs/18/transaction-iso.html)。表中的“可能允许”不表示每个数据库都会出现该现象，具体产品可以提供更强保证。

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | 不符合任一串行顺序的执行结果 |
| --- | --- | --- | --- | --- |
| Read Uncommitted，读未提交 | 可能允许 | 可能允许 | 可能允许 | 可能允许 |
| Read Committed，读已提交 | 排除 | 可能允许 | 可能允许 | 可能允许 |
| Repeatable Read，可重复读 | 排除 | 排除 | 可能允许 | 可能允许 |
| Serializable，可串行化 | 排除 | 排除 | 排除 | 排除 |

脏读涉及读取其他事务尚未提交的修改；不可重复读关注同一数据在重复读取时受其他事务提交的修改影响；幻读关注相同查询条件下，满足条件的行集合发生变化。不同教材对具体异常情境的描述可能有细节差异，作题时应以题干的执行步骤和已声明模型为准。

如果题干指定产品，就采用产品保证。例如 PostgreSQL 18 将 Read Uncommitted 按 Read Committed 处理，其 Repeatable Read 也排除了幻读，但仍不等于 Serializable。普通快照读、锁定读以及具体语句的差异，继续阅读前面链接的事务文章，不在本篇重新展开锁与 MVCC 的机制。

### 原创模拟题 7：用交错步骤识别脏读

初始余额为 80。T1 把余额改成 40 但未提交；T2 读到 40；随后 T1 回滚。按上述标准框架，T2 的读取属于哪种现象，排除此现象的最低隔离级别是什么？

- A. 脏读；Read Committed
- B. 不可重复读；Read Uncommitted
- C. 幻读；Repeatable Read
- D. 只要没有两次读取，就不属于任何并发现象

**答案：A。** T2 读取了后来被回滚的未提交版本，已经足以判断脏读，不需要它再读第二次。标准框架下 Read Committed 即排除脏读；这里没有指定某个产品的最低可配置行为。

### 原创模拟题 8：标准下界不等于产品上界

题干明确指定 PostgreSQL 18 的 Repeatable Read。下列哪一项符合其官方保证？

- A. 必然允许幻读，因为通用表在该格写着“可能允许”
- B. 不允许幻读，但仍可能出现串行化异常
- C. 与 Serializable 完全相同，无需考虑并发失败
- D. 普通查询必定通过锁住整张表实现隔离

**答案：B。** 通用表给的是标准框架下界，该产品可以更强；但排除幻读也不能推出所有并发执行都等价于某种串行顺序。A 把“允许”误读为“必然出现”，C 把一个被排除的现象扩大成了完整可串行化保证，D 则凭隔离级别臆测具体实现。

## 小结

范式题先求全部候选键，再检查依赖；ER 题把基数、参与条件与唯一约束分开；关系代数题明确行、列和集合语义；隔离题先判断执行现象，再区分标准框架与指定产品。四类题的共同方法，是先写清约束，避免用一个口号代替完整判断。

## 参考资料

- [Ron McFadyen：Relational Databases and Microsoft Access，第 10.3 节](https://acs.uwinnipeg.ca/rmcfadyen/CreativeCommons/Relational%20Databases%20and%20Microsoft%20Access%20.pdf)：2NF、候选键与部分依赖。
- [《Database System Concepts》第 7 版，作者课件第 2 章：Introduction to the Relational Model](https://www.db-book.com/slides-dir/PDF-dir/ch2.pdf)：键、关系代数与集合语义。
- [同教材第 6 章：Database Design Using the E-R Model](https://www.db-book.com/slides-dir/PDF-dir/ch6.pdf)：ER 基数、参与约束与关系模式映射。
- [同教材第 7 章：Normalization](https://www.db-book.com/slides-dir/PDF-dir/ch7.pdf)：函数依赖、闭包、范式及分解性质。
- [PostgreSQL 官方历史文档：Operations in the Relational Data Model](https://www.postgresql.org/docs/7.1/relmodel-oper.html)：关系代数，含除法定义；只作数学背景参考。
- [PostgreSQL 18：Transaction Isolation](https://www.postgresql.org/docs/18/transaction-iso.html)：SQL 标准隔离框架与具体实现差异。
