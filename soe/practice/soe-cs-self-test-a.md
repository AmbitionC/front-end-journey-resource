本卷按**高频考点**出题，共 30 道单项选择题，每题四个选项，只有一个最佳答案。目标是检验能否根据题设区分概念、完成基础计算，并沿对应文章补齐理解。题目不表示任何招聘考试的题量、分值或出题概率；A、B 两卷可以独立作答。

计算以各题明确的位宽、算法和初始化条件为准。C 题采用 C11；Java 题涉及实现时单独指定 HotSpot 版本。第 26—30 题为金融科技与分布式常识；缺少现有专题的知识已在解析中完整说明，关联阅读会标清用途。

## 考点分布

| 模块 | 题号 | 题数 |
| --- | --- | --- |
| 计算机组成原理 | A01—A03 | 3 |
| 数据库 | A04—A06 | 3 |
| 操作系统 | A07—A09 | 3 |
| 计算机网络 | A10—A11 | 2 |
| C 语言 | A12—A13 | 2 |
| Java 基础 | A14—A16 | 3 |
| 数据结构与算法 | A17—A19 | 3 |
| 软件工程 | A20—A22 | 3 |
| 信息安全 | A23—A25 | 3 |
| 金融科技与分布式常识 | A26—A30 | 5 |

## 基础与应用

### 高频考点题 A01：三类总线分别传什么

在传统共享系统总线的教学模型中，CPU 从主存读取一个数据。以下分工正确的是哪项？

- A. 地址总线传读出的数据，数据总线传内存地址，控制总线只传时钟
- B. 地址总线给出访问位置，数据总线传回数据，控制总线传递读操作等控制信号
- C. 数据总线只能由 CPU 向主存单向传输
- D. 三类总线必须具有相同位宽，否则不能完成读操作

**答案：B。**

**解析：** 地址回答“访问哪里”，数据回答“传送什么”，控制信号回答“执行什么操作、何时有效”。在这个模型中，数据总线可用于读、写两个方向；控制信号也不限于时钟。三者位宽分别服务于地址编码、一次传输的数据量和控制需求，不要求相同。这里讨论逻辑功能，不把它当作所有现代片上互连的物理布线承诺。

**对应文章：** [计算机组成原理速览](../bank-tech/soe-computer-organization.md)提供 CPU 与访存前提，尚未专门讲三类总线；本题补足分工，依据[华盛顿大学课程：Buses](https://courses.cs.washington.edu/courses/cse451/TLKCopy/basics/hw.html)。

### 高频考点题 A02：补码位串的数值

将 `11010110` 按 **8 位补码有符号整数**解释，十进制值是多少？

- A. 214
- B. −41
- C. −86
- D. −42

**答案：D。**

**解析：** 先按无符号数读得 $128+64+16+4+2=214$。最高位为 1，补码值为 $214-2^8=-42$。A 忽略有符号解释，C 把最高位简单当成原码符号位，B 则漏掉取反后加一的关系。位串和解释规则必须同时给定。

**对应文章：** [计算机组成原理速览：数制、位宽与解释规则](../bank-tech/soe-computer-organization.md)。

### 高频考点题 A03：Cache 地址字段预算

某教学机器按字节寻址，主存地址为 32 位；Cache 数据区为 8 KiB，采用直接映射，块大小为 32 B。不计有效位等元数据，地址的“标记、行索引、块内偏移”分别占多少位？其中 1 KiB = 1024 B。

- A. `18、9、5`
- B. `19、5、8`
- C. `19、8、5`
- D. `24、3、5`

**答案：C。**

**解析：** 块内偏移为 $\log_2 32=5$ 位；行数为 $8192/32=256$，索引为 8 位；剩余标记为 $32-8-5=19$ 位。容量以字节给出，不能直接把 8 KiB 当作行数，也不能交换行索引与块内偏移。

**对应文章：** [计算机组成原理速览：存储层次与 Cache](../bank-tech/soe-computer-organization.md)。

### 高频考点题 A04：联合主键中的部分依赖

关系 `Line(order_no, item_no, item_name, qty)` 的属性均为不可再分的原子值。仅给定依赖 `(order_no, item_no) → qty`、`item_no → item_name`，其余非平凡依赖均由它们推导。在传统关系模型下，该关系达到的最高范式是什么？

- A. 1NF
- B. 2NF
- C. 3NF
- D. BCNF

**答案：A。**

**解析：** 唯一候选键是 `(order_no, item_no)`：两者都不能由其他属性推出，合在一起则能决定全部属性。非主属性 `item_name` 只依赖候选键的一部分 `item_no`，违反 2NF 的完整依赖要求，因此最高为 1NF。不能因为设计者写了联合主键，就推断其他范式自动满足。

**对应文章：** [数据库理论：函数依赖、候选键与范式](../bank-tech/soe-database-theory.md)。

### 高频考点题 A05：WHERE 的书写顺序与最左前缀

订单表有普通 B-tree 联合索引 `(tenant_id, status, created_at)`。查询条件写成 `WHERE status = 'PAID' AND tenant_id = 9`，两列类型匹配且没有函数包装。仅判断索引键的排序和等值前缀，哪项正确？

- A. `status` 写在前面，所以必须先建 `(status, tenant_id)` 才能利用两个条件
- B. 条件覆盖索引前两列的连续等值前缀，SQL 中 AND 两侧的书写次序不改变这一点
- C. 未指定 `created_at`，该索引必然完全无效
- D. 满足最左前缀就能保证优化器一定选择该索引且无须回表

**答案：B。**

**解析：** 最左指索引定义中的列序，而非 WHERE 文本顺序。两个前导列都有等值条件，可以按这两列定位；是否采用该访问路径仍取决于成本，是否覆盖还要看查询所需列。缺前导列时也不能一概断言不使用索引，部分产品存在 skip scan 等路径。

**对应文章：** [数据库理论](../bank-tech/soe-database-theory.md)与[MySQL 索引：最左前缀原则](../../knowledge/backend/database/mysql-index.md)。

### 高频考点题 A06：按查询与保留策略设计分区

PostgreSQL 18 中的审计表主要按 `occurred_on DATE` 查询某个月的数据，并按月归档过期记录。哪项设计最贴合这两种操作？

- A. 按随机事件编号 HASH 分区，认为每个自然月必定落入一个分区
- B. 按操作员姓名 LIST 分区，认为日期查询就能自动排除其他月份
- C. 每月建一个分区，因此取消全部查询索引，也无须检查执行计划
- D. 按日期做月度 RANGE 分区，使用不重叠的半开区间，并按查询需要保留索引

**答案：D。**

**解析：** RANGE 适合与日期条件及月度生命周期对齐，例如一个分区为 `[2026-11-01, 2026-12-01)`。分区裁剪排除不相关分区，分区内如何找行仍可能需要索引。按随机编号或姓名分区不能从月份条件直接得到同样的裁剪。PostgreSQL 18 若要在分区父表声明唯一约束或主键，还须满足包含全部分区键列等限制；分区也不会自动变成跨服务器分片。

**对应文章：** [数据库理论](../bank-tech/soe-database-theory.md)补关系约束，[分库分表：普通表分区与跨节点分片](../../knowledge/backend/database/db-sharding.md)补边界；月度设计、半开边界和唯一约束详见[PostgreSQL 18 分区表文档](https://www.postgresql.org/docs/18/ddl-partitioning.html)。

### 高频考点题 A07：同一访问序列的两种置换

页框数为 3，初始全空，访问序列为 `1, 2, 3, 1, 4, 1, 2, 5, 2, 1`。不预取，每次未命中均计一次缺页。FIFO 与 LRU 的缺页次数依次是多少？

- A. `7、6`
- B. `6、7`
- C. `4、3`
- D. `7、7`

**答案：A。**

**解析：** FIFO 在步骤 `1、2、3、5、6、7、8` 缺页；LRU 在 `1、2、3、5、7、8` 缺页。关键是第 4 步命中页 1：FIFO 不改变装入顺序，第 5 步淘汰页 1；LRU 更新最近使用顺序，第 5 步淘汰页 2，所以第 6 步的页 1 仍在。C 只数了装满后的淘汰，漏掉最初三次缺页。

**对应文章：** [操作系统选择题：页面置换计算](../bank-tech/soe-os-mcq.md)与[内存、虚拟内存与分页](../../knowledge/cs/os/os-virtual-memory.md)。

### 高频考点题 A08：读懂 /etc/fstab 的六个字段

某 Linux 系统的 `/etc/fstab` 有一行 `UUID=demo-data /srv/data ext4 defaults 0 2`。仅按 `fstab(5)` 的字段含义，哪项正确？

- A. `/srv/data` 是源设备，`UUID=demo-data` 是挂载点
- B. `0` 表示每天零点挂载，`2` 表示保留两份备份
- C. `ext4` 是文件系统类型，`defaults` 是挂载选项，末两列分别供 dump 与 fsck 使用
- D. `2` 表示该文件系统必须在根文件系统之前检查

**答案：C。**

**解析：** 六列依次为源设备标识、挂载点、文件系统类型、挂载选项、dump 标志、fsck 检查序号。第五列 0 表示不由 dump 据此安排备份；通常根文件系统的检查序号为 1，其他需检查的文件系统为 2，0 则表示不按该字段检查。它们不是备份份数或挂载时间。具体引导实现还可能由 systemd 等管理，不能仅凭一行配置保证启动一定成功。

**对应文章：** [操作系统选择题](../bank-tech/soe-os-mcq.md)提供系统复习入口，尚无 fstab 专节；完整字段解释见[Linux fstab(5)](https://man7.org/linux/man-pages/man5/fstab.5.html)。

### 高频考点题 A09：解除一个死锁必要条件

资源只能独占使用，进程必须持有已申请资源才能继续。系统现在规定：申请新资源前，先释放自己已持有的全部资源。该规定直接破坏哪个经典死锁必要条件？

- A. 互斥
- B. 不可剥夺
- C. 循环等待所需的进程编号顺序
- D. 占有并等待

**答案：D。**

**解析：** 进程不能一边占有资源一边等待新资源，直接破坏占有并等待。独占使用仍存在，主动释放也不等于系统可以强制剥夺。C 不是经典条件的规范表述；按统一资源顺序申请是另一种针对循环等待的办法。破坏必要条件可预防这类死锁，但可能牺牲资源利用率并造成反复竞争。

**对应文章：** [操作系统选择题](../bank-tech/soe-os-mcq.md)与[死锁、检测与避免](../../knowledge/cs/os/os-deadlock.md)。

### 高频考点题 A10：普通 IPv4 子网的边界

地址 `198.51.100.219/28` 位于普通 IPv4 广播子网。网络地址、定向广播地址、通常可分配主机数依次是哪组？

- A. `198.51.100.216、198.51.100.223、6`
- B. `198.51.100.208、198.51.100.223、14`
- C. `198.51.100.208、198.51.100.223、16`
- D. `198.51.100.192、198.51.100.255、62`

**答案：B。**

**解析：** 主机位为 $32-28=4$，每块 $2^4=16$ 个地址。219 落入 `[208,223]`，普通主机范围为 `.209—.222`，可分配 $16-2=14$ 个。A 使用了 /29 的块，D 使用了 /26。这里的减二有普通广播子网这一前提，不能直接推广到 /31 点到点链路。

**对应文章：** [计算机网络选择题：IPv4 前缀与地址计算](../bank-tech/soe-network-mcq.md)。

### 高频考点题 A11：慢启动与拥塞避免

采用 RFC 5681 的经典 TCP 教学模型：发送端始终有数据、接收窗口足够大、每个满长数据段均单独确认，不发生丢包。下列哪项正确？

- A. 慢启动指 cwnd 每个 RTT 只增长一个 MSS，拥塞避免则每个 RTT 翻倍
- B. 接收窗口 rwnd 足够大，就可以忽略拥塞窗口 cwnd
- C. 慢启动阶段 cwnd 可近似每 RTT 翻倍；拥塞避免阶段约每 RTT 增长一个 MSS
- D. 所有当前 TCP 实现都必须始终采用这条增长曲线

**答案：C。**

**解析：** cwnd 限制向网络投入的未确认数据量，rwnd 限制接收端可承受的未确认数据量，发送要同时服从两者。上述逐段确认且窗口受限的理想条件下，慢启动按 ACK 增长，形成近似指数增长；拥塞避免采用近似加性增长。达到阈值后阶段变化，延迟 ACK、应用受限及其他拥塞控制算法都可能改变曲线，因此不能把模型当作所有系统的默认实测行为。

**对应文章：** [计算机网络选择题](../bank-tech/soe-network-mcq.md)与[TCP、UDP 与传输场景](../../knowledge/network/tcpIp/tcp-udp.md)提供前提；增长机制在此补足，见[RFC 5681 §2、§3.1](https://www.rfc-editor.org/rfc/rfc5681.html#section-3.1)。

### 高频考点题 A12：指针差的单位

有 C11 代码 `int a[5] = {3, 6, 9, 12, 15}; int *p = a + 1;`。表达式 `*(p + 2)` 与 `(a + 5) - p` 的值依次是多少？只求表达式值，不涉及 printf 格式。

- A. `12、4`
- B. `9、4`
- C. `12、16`
- D. 两个表达式均因涉及尾后位置而没有定义

**答案：A。**

**解析：** `p` 指向 `a[1]`，再加 2 指向 `a[3]`，得到 12。同数组中的合法指针相减，以元素个数计，尾后位置 `a+5` 与 `a+1` 的差为 4。形成尾后指针、用它作这里的指针差合法，但不能解引用尾后位置；C 把元素差误当成某个平台的字节距离。

**对应文章：** [C 语言常考点：指针、数组与边界](../bank-tech/soe-c-language-mcq.md)。

### 高频考点题 A13：带尾部填充的结构体

某题指定布局规则：`char` 大小/对齐为 `1/1` B，`double` 为 `8/8` B，`short` 为 `2/2` B；成员按声明顺序放在各自对齐边界，结构体对齐取成员最大值，总大小补到该对齐的整数倍。对 `struct Record { char tag; double value; short code; };`，`code` 的偏移与结构体大小依次是多少？

- A. `9、11` B
- B. `16、18` B
- C. `8、16` B
- D. `16、24` B

**答案：D。**

**解析：** `tag` 占偏移 0，随后填充到偏移 8 放 `double`，占 `[8,16)`；`code` 放在偏移 16，占到 18。结构体按 8 B 对齐，还需补到 24 B。B 忽略尾部填充。题设给出的布局规则才决定这些数值，C11 本身没有保证所有平台都采用同样的大小与 ABI。

**对应文章：** [C 语言常考点：结构体对齐与内存](../bank-tech/soe-c-language-mcq.md)。

### 高频考点题 A14：数组和 String 的参数语义

调用者把一个数组引用和一个 String 引用传给 Java 方法。方法先通过数组形参修改某元素，再把数组形参重新绑定到新数组，同时把字符串形参重新绑定到拼接结果。调用返回后，哪项正确？

- A. Java 对数组按引用传递，所以调用者的数组变量必定随形参重绑
- B. 原数组元素的修改可被调用者观察；两个形参的重新绑定均不会直接改变调用者变量
- C. String 不能重新赋给形参，因为字符串对象不可变
- D. Java 对 String 按值传递，对数组按引用传递，是两种参数传递规则

**答案：B。**

**解析：** Java 始终按值传递；这里复制的是引用值。双方起初可指向同一数组，修改共享对象的元素可见；给形参赋另一个引用只改形参。String 不可变约束已有字符串对象内容，不禁止变量改为指向拼接所得字符串。因此“可改数组元素”不能作为按引用传递的证明。

**对应文章：** [Java 基础选择题：数组与 String](../bank-tech/soe-java-mcq.md)与[Java 值语义](../../knowledge/backend/java/java-value-semantics.md)。

### 高频考点题 A15：动态生成类与元空间

一个 HotSpot JDK 21 服务持续定义新的普通命名类，定义这些类的类加载器一直被缓存保活，并配置了有限的 `MaxMetaspaceSize`。即使普通业务对象数量稳定，仍可能出现哪种问题？

- A. 只能耗尽 Java 堆，因为所有类元数据都在堆内
- B. 必定报告 `PermGen space`，因为 JDK 21 仍使用永久代
- C. 持续存活的类元数据可能耗尽元空间；旧版永久代的名称不能直接套用
- D. 只要业务实例被回收，所有对应类元数据就会立即卸载

**答案：C。**

**解析：** HotSpot 自 JDK 8 起移除永久代，类元数据主要转向本地内存中的元空间。对题设的普通命名类，类加载器被保活使这些类不能满足相应卸载条件，持续增长就可能触及元空间上限。JDK 7 的永久代故障要结合旧实现讨论；动态生成类也不等于每次必然溢出，增长量、存活条件和容量共同决定结果。

**对应文章：** [Java 基础选择题：永久代与元空间](../bank-tech/soe-java-mcq.md)与[JVM 内存、类加载与 OOM 定位](../../knowledge/backend/java/java-runtime-memory.md)。

### 高频考点题 A16：固定长度列表与不可修改列表

Java 21 中，`list = Arrays.asList(array)`，其中 `array` 是非空 `String[]`，且下标合法。以下哪项符合 API 合同？

- A. `list.set(...)` 可以替换元素并反映到原数组；`list.add(...)` 不支持增加长度
- B. 固定长度表示 `set`、`add`、`remove` 都支持，只是效率较低
- C. 该列表与原数组完全脱离，数组修改不会被列表观察到
- D. 所有 List 实现都具有与它相同的可修改性

**答案：A。**

**解析：** `Arrays.asList` 返回由原数组支持的固定长度列表，替换已有元素与改变长度是两类操作。`set` 可用，增加或删除元素不受支持并抛出相应异常；它也不同于 `List.of` 的不可修改列表。只记住“List 有 add 方法”不足以推出每个实例都允许该操作。

**对应文章：** [Java 基础选择题：集合合同](../bank-tech/soe-java-mcq.md)与[Java 集合：接口分类与选型](../../knowledge/backend/java/java-collections.md)。

### 高频考点题 A17：用先序和中序推后序

二叉树各结点标识互不相同。先序为 `Q M H P W T Z`，中序为 `H M P Q T W Z`，后序是哪项？

- A. `H P M Z T W Q`
- B. `M H P W T Z Q`
- C. `H P M T Z W Q`
- D. `Q M P H W Z T`

**答案：C。**

**解析：** 先序首项 Q 是根，中序将它分成左侧 `H M P` 与右侧 `T W Z`。左子树根为 M，其后序为 `H P M`；右子树根为 W，其后序为 `T Z W`；最后输出根 Q。不同标识使这组先序、中序可以唯一重建，不能将该结论不加条件地改成“任意两种遍历都唯一”。

**对应文章：** [数据结构选择题：遍历序列](../bank-tech/soe-data-structures-mcq.md)与[树结构与遍历](../../knowledge/data-structure/algorithm/algorithm-tree.md)。

### 高频考点题 A18：不等长编码的总位数

五种符号出现次数分别为 `3、5、8、10、14`，采用二元哈夫曼编码。只计算编码这批符号的比特总数，不计码表与填充，最少是多少？

- A. 78
- B. 80
- C. 120
- D. 88

**答案：D。**

**解析：** 反复合并两个最小权值：`3+5=8`，`8+8=16`，`10+14=24`，`16+24=40`。合并权值之和为 $8+16+24+40=88$，等于带权路径长度。五种符号若用固定 3 位编码，总位数为 $40\times3=120$，并非哈夫曼最优值；等权时码字形状可能不同，但最优总位数不变。

**对应文章：** [数据结构选择题：哈夫曼与前缀编码](../bank-tech/soe-data-structures-mcq.md)。

### 高频考点题 A19：分治的层数与每层工作量

令 n 为 2 的幂，`T(1)=S(1)=1`。若 `T(n)=2T(n/2)+n`，`S(n)=S(n/2)+1`，两者的渐近紧确界依次是哪项？

- A. `Θ(n log n)、Θ(log n)`
- B. `Θ(log n)、Θ(n log n)`
- C. `Θ(n²)、Θ(n)`
- D. `Θ(n)、Θ(1)`

**答案：A。**

**解析：** T 的递归树有 $\log_2 n$ 层内部层，每层非递归工作共 n，再加 n 个常量叶子，得到 $n\log_2 n+n$。S 每层只保留一个规模减半的子问题，得到 $1+\log_2 n$。两者都“分成一半”，但子问题数量和合并成本不同，不能只按层数给所有分治算法定复杂度。

**对应文章：** [数据结构选择题：递推式与分治](../bank-tech/soe-data-structures-mcq.md)与[算法复杂度](../../knowledge/cs/algorithm/algorithm-complexity.md)。

### 高频考点题 A20：以风险分析驱动迭代

一个项目每轮先识别主要技术风险，必要时用原型验证，再计划下一轮工程活动。哪种经典生命周期模型最贴合这一特征？

- A. 严格顺序推进且阶段完成后不再回看前序活动的瀑布式安排
- B. 螺旋模型
- C. 只描述对象静态关系的 UML 类图
- D. 只确认缺陷修复的确认测试

**答案：B。**

**解析：** 螺旋模型以风险分析与风险消减组织反复迭代，原型可以作为验证手段。出现原型不代表整个流程必然是某种单独的原型模型，应看活动由什么驱动。类图是建模视角，确认测试是测试目的，它们与生命周期模型不在同一分类层面。

**对应文章：** [软件工程基础：生命周期模型](../bank-tech/soe-software-engineering-mcq.md)。

### 高频考点题 A21：UML 图的观察对象

需要分别表达“账户类与交易类的结构关系”“一次转账中各对象的消息先后”“审批步骤的条件分支”。依次最合适的 UML 图是哪组？

- A. 时序图、类图、部署图
- B. 状态机图、用例图、类图
- C. 部署图、活动图、时序图
- D. 类图、时序图、活动图

**答案：D。**

**解析：** 类图表达类型结构及关联；时序图强调参与者之间的消息顺序；活动图表达活动流、判断与并发等。状态机图则更适合讨论一个对象随事件发生的状态迁移。题目先看要表达的对象和关系，不能仅因为都包含箭头就混用图种。

**对应文章：** [软件工程基础：UML 视角与符号](../bank-tech/soe-software-engineering-mcq.md)。

### 高频考点题 A22：短路条件的覆盖分母

代码判定为 `if (x >= 0 && y >= 0)`，采用从左到右短路求值。测试输入只有 `(1,1)` 与 `(-1,1)`。判定覆盖统计整个 if 的真/假结果；条件覆盖仅统计两个原子条件**实际被求值**时的真/假结果。两种覆盖率依次是多少？

- A. `50%、100%`
- B. `100%、100%`
- C. `100%、75%`
- D. `50%、75%`

**答案：C。**

**解析：** 第一组两个条件都执行为真，整个判定为真；第二组第一个条件为假，第二个未求值，整个判定为假。因此判定两种结果均覆盖，为 100%；条件结果只覆盖“x 条件真、x 条件假、y 条件真”，共四种目标中的三种，为 75%。第二组输入中的 y 虽然是正数，也不能算作执行过 y 条件；更没有覆盖 y 条件为假。

**对应文章：** [软件工程基础：白盒覆盖与短路求值](../bank-tech/soe-software-engineering-mcq.md)。

### 高频考点题 A23：签名证明什么

接收方确认签名公钥属于预期发送方，使用安全的数字签名方案验签通过，并正确核对了签名所覆盖的消息。可以直接据此得到哪项结论？

- A. 消息具备相应的来源与完整性证明，但不因此自动保密
- B. 没有私钥的人一定看不到消息明文
- C. 签名证明发送方账户当前仍有访问该接口的业务权限
- D. 签名通过即可证明接收方不会重复处理同一请求

**答案：A。**

**解析：** 验签与可信公钥绑定支持来源认证和完整性检查，不把明文自动变为密文。接口授权还要检查主体权限，重复处理还要使用合适的新鲜度、请求标识或幂等机制。不能把数字签名统称为“私钥加密”，再据此推导保密性。

**对应文章：** [信息安全基础：加密、摘要与数字签名](../bank-tech/soe-information-security-mcq.md)。

### 高频考点题 A24：已登录仍须检查对象权限

某接口已确认用户登录，却仅按请求中的账单 ID 返回记录，未校验账单所属用户。攻击者改 ID 后读到他人账单，直接缺少的是哪项控制？

- A. 把认证令牌改成更长的字符串
- B. 对账单对象执行访问控制，确认当前主体具有读取权限
- C. 把 GET 改成 POST，其他逻辑保持相同
- D. 只在页面上隐藏“他人账单”按钮

**答案：B。**

**解析：** 登录鉴别回答“是谁”，对象授权回答“能访问这一份数据吗”。服务端要在实际取数路径约束所有者、租户和业务授权范围。改方法、隐藏按钮或增加令牌长度，都不能替代对象级权限检查；记录 ID 不可猜测也只是附加措施。

**对应文章：** [信息安全基础：身份鉴别与访问控制](../bank-tech/soe-information-security-mcq.md)。

### 高频考点题 A25：参数化查询的边界

报表接口接收筛选值 `status` 与排序列名 `sortColumn`。哪项实现最合理？

- A. 将两者直接拼入 SQL，因为它们来自已登录用户
- B. 对任意输入删除空格，就能安全地拼接为 SQL
- C. 所有数据库都允许用同一种值占位符直接替代任意列名与关键字
- D. 筛选值使用绑定参数；排序列由服务端将有限枚举映射为预定列名

**答案：D。**

**解析：** 绑定参数用于数据值，不能据此假定它能替代 SQL 语法位置。列名、排序方向等要使用受控映射构造，未知项拒绝；同时保留数据库最小权限。已登录、删除某些字符或扫描关键词，都不能提供代码与数据分离的保证。

**对应文章：** [信息安全基础：SQL 注入与参数化边界](../bank-tech/soe-information-security-mcq.md)。

## 金融科技与分布式常识

### 高频考点题 A26：共识机制与故障模型

关于区块链及分布式复制中的 RAFT（通常写作 Raft）、PoW、PoS，以及 CFT/BFT，哪项正确？

- A. Raft 是 PoW 的一种实现，节点靠反复计算哈希竞争领导者
- B. CFT 已经包含恶意节点发送矛盾消息的全部情形，所以与 BFT 等价
- C. Raft 通常针对崩溃故障；PoW 使用工作量，PoS 使用权益参与机制，是否容忍拜占庭行为还须看完整协议与假设
- D. 任何标注 PoS 的系统都具有同一确认规则、同一故障阈值和同一最终性

**答案：C。**

**解析：** CFT 是崩溃容错，主要考虑节点停止服务等非任意作恶故障；BFT 还考虑节点可能恶意发送矛盾信息等行为。Raft 在成员明确、节点按协议执行等前提下依靠选主和多数派复制，不靠挖矿，也不提供任意作恶容错保证。PoW 以满足难度条件的计算工作参与竞争；PoS 以权益与相应验证、奖惩规则参与共识。PoW/PoS 的资源机制与 CFT/BFT 的故障假设不是同一分类轴，不能只看名字推导完整安全保证。

**对应文章：** [信息安全基础](../bank-tech/soe-information-security-mcq.md)仅补信任与身份前提，现有文章无共识专题。本题机制依据[Hyperledger Fabric：Raft 与 BFT 排序服务](https://hyperledger-fabric.readthedocs.io/en/latest/orderer/ordering_service.html)、[Bitcoin 原始论文 §4](https://bitcoin.org/bitcoin.pdf)及[Ethereum：PoS](https://ethereum.org/developers/docs/consensus-mechanisms/pos/)。

### 高频考点题 A27：SAGA 与 TCC 的业务动作

跨服务业务中，一种方案先让每步本地事务提交，后续失败时执行退款等补偿；另一种先预留资源，再确认使用或取消预留。以下对应关系哪项正确？

- A. 前者是 SAGA 的典型思路，后者是 TCC 的典型思路
- B. 前者是 TCC，后者是 SAGA，二者都不需要业务代码参与
- C. SAGA 补偿等于数据库回滚，可以让已被外界观察到的事实从未发生
- D. TCC 的 Try 阶段通常不需要检查与预留资源，直接无条件回复成功即可

**答案：A。**

**解析：** SAGA（Saga）由已提交的本地事务组成，失败时用业务补偿恢复可接受状态，例如退款是新的业务动作，并非抹去原支付事实；补偿也可能失败，需要重试、幂等和恢复记录。TCC 是 Try/Confirm/Cancel：Try 检查并预留资源，Confirm 确认，Cancel 释放预留。两者都不能仅凭名称保证所需隔离或对外原子性，必须设计并发和失败合同。

**对应文章：** [分库分表：分布式事务的选择边界](../../knowledge/backend/database/db-sharding.md)与[持久工作流：补偿不是回滚时间](../../knowledge/llm/agent/agent-workflow-state.md)已有基础；完整对比在此补足，见[Seata Saga](https://seata.apache.org/docs/user/mode/saga/)与[Seata TCC](https://seata.apache.org/docs/user/mode/tcc/)。

### 高频考点题 A28：容器化与无状态应用

一个容器化 API 的多个副本会被负载均衡随机选中，也会随时被替换。若要使用户下一次请求不依赖上一台副本仍存活，哪项做法最合适？

- A. 只要打包成镜像，进程内会话就会自动在各副本间同步
- B. 将必须保留的会话与业务状态放入有明确一致性、恢复合同的外部存储，副本按稳定标识读取
- C. 将上传文件只写入容器可写层，再依靠删除并重建容器恢复文件
- D. 采用无状态应用后，系统就不能再使用数据库

**答案：B。**

**解析：** 无状态说的是某个服务实例不独占后续请求必须依赖的持久状态，不是整个系统没有状态。容器有可写层，容器化本身不提供状态复制或持久化。把必要状态外置，并正确处理并发、幂等和权限，才使副本更易替换；数据库、对象存储和卷仍可作为系统中的有状态部件。

**对应文章：** [Agent 状态存储与恢复](../../knowledge/backend/storage/agent-state-storage.md)可复习状态外置；容器生命周期依据[Docker 存储](https://docs.docker.com/engine/storage/)，无状态副本示例见[Kubernetes Deployment 教程](https://kubernetes.io/docs/tasks/run-application/run-stateless-application-deployment/)。

### 高频考点题 A29：联邦学习是否自动保护隐私

多家机构希望在原始训练样本不集中汇入同一训练库的条件下协作训练。按经典的本地训练、上传模型更新再聚合的联邦学习方式，哪项正确？

- A. 每轮必须把所有原始样本传到服务器，否则无法聚合
- B. 只要没有传原始样本，模型更新就绝不可能泄露参与方信息
- C. 联邦学习就是把同一台服务器拆成多个进程，与数据所在位置无关
- D. 可以在参与方本地训练并聚合更新，但隐私保证仍需威胁模型和额外机制支持

**答案：D。**

**解析：** 经典联邦学习把训练计算移向分散的数据，协调方汇总更新形成新模型，减少集中收集原始样本的需要。但“传更新”不等于“更新不含可推断的信息”，服务器、其他参与方和最终模型的可见内容都影响风险。安全聚合可限制对单方更新的直接观察，差分隐私在明确参数与假设下约束信息泄露；它们各有适用范围，不能只靠“联邦”名称承诺绝对隐私。

**对应文章：** [大模型训练全流程概览](../../knowledge/llm/basics/llm-training-overview.md)只提供训练前提，未专讲联邦学习。本题依据[联邦学习原始研究：分散数据上的模型平均](https://research.google/pubs/communication-efficient-learning-of-deep-networks-from-decentralized-data/)与[Google Research：联邦学习的隐私保证与验证](https://research.google/blog/toward-provably-private-learning-from-federated-data/)。

### 高频考点题 A30：通信距离要带上场景

这里的 WiFi 指常见室内 2.4/5 GHz Wi-Fi 局域网，不含 HaLow 等扩展；Zigbee 区分单跳与多跳网络。以下对 NFC、NB-IoT、Wi-Fi、Zigbee 的描述哪项最合理？

- A. NFC 是蜂窝广域通信，适合直接替代 NB-IoT 连接远处水表
- B. Zigbee 的整张 mesh 网络跨度必定等于一个无线单跳的距离
- C. NFC 面向厘米级近场；NB-IoT 面向蜂窝广域；常规 Wi-Fi 与 Zigbee 属局域通信，覆盖范围可重叠且受环境影响
- D. 只凭四个协议名称，就能给出对所有设备和部署都成立的严格距离排序

**答案：C。**

**解析：** NFC 的典型交互在厘米尺度；NB-IoT 是低功耗蜂窝广域技术，依赖运营商网络覆盖。常规 Wi-Fi 用于局域联网，Zigbee 常用于低功耗局域 mesh，后者可通过多跳扩展整体跨度，但不能据此增加每一跳的无线距离。功率、频段、天线、障碍物及网络拓扑都会影响可用距离，因此不把 Wi-Fi 与 Zigbee 排成永远成立的长短关系，也不给协议虚构统一最大米数。Wi-Fi 家族的 HaLow 等变体还会改变比较前提。

**对应文章：** [计算机网络选择题](../bank-tech/soe-network-mcq.md)只提供网络基础，未含这四种技术专题；见[NFC Forum：NFC 技术](https://nfc-forum.org/learn/nfc-technology/)、[GSMA：NB-IoT](https://www.gsma.com/solutions-and-impact/technologies/internet-of-things/mobile-iot-technology-nb-iot/)、[CSA：Zigbee](https://csa-iot.org/all-solutions/zigbee/)及[Wi-Fi Alliance：Wi-Fi 技术与 HaLow](https://www.wi-fi.org/wi-fi-macphy)。

## 答案速查

| 题号 | 答案 | 题号 | 答案 | 题号 | 答案 |
| --- | --- | --- | --- | --- | --- |
| A01 | B | A11 | C | A21 | D |
| A02 | D | A12 | A | A22 | C |
| A03 | C | A13 | D | A23 | A |
| A04 | A | A14 | B | A24 | B |
| A05 | B | A15 | C | A25 | D |
| A06 | D | A16 | A | A26 | C |
| A07 | A | A17 | C | A27 | A |
| A08 | C | A18 | D | A28 | B |
| A09 | D | A19 | A | A29 | D |
| A10 | B | A20 | B | A30 | C |

## 参考资料

各题“对应文章”链接用于复习；对现有文章尚未完整讲解的内容，本卷直接使用以下资料核对机制。

- [华盛顿大学课程：系统总线](https://courses.cs.washington.edu/courses/cse451/TLKCopy/basics/hw.html)
- [PostgreSQL 18：分区表](https://www.postgresql.org/docs/18/ddl-partitioning.html)
- [Linux fstab(5)](https://man7.org/linux/man-pages/man5/fstab.5.html)
- [RFC 5681：TCP 拥塞控制](https://www.rfc-editor.org/rfc/rfc5681.html)
- [Hyperledger Fabric：排序服务的 CFT 与 BFT](https://hyperledger-fabric.readthedocs.io/en/latest/orderer/ordering_service.html)
- [Bitcoin 原始论文：工作量证明](https://bitcoin.org/bitcoin.pdf)
- [Ethereum：权益证明](https://ethereum.org/developers/docs/consensus-mechanisms/pos/)
- [Seata：Saga 模式](https://seata.apache.org/docs/user/mode/saga/)
- [Seata：TCC 模式](https://seata.apache.org/docs/user/mode/tcc/)
- [Docker：存储与容器可写层](https://docs.docker.com/engine/storage/)
- [Kubernetes：以 Deployment 运行无状态应用](https://kubernetes.io/docs/tasks/run-application/run-stateless-application-deployment/)
- [Communication-Efficient Learning of Deep Networks from Decentralized Data](https://research.google/pubs/communication-efficient-learning-of-deep-networks-from-decentralized-data/)
- [Google Research：Toward provably private learning from federated data](https://research.google/blog/toward-provably-private-learning-from-federated-data/)
- [NFC Forum：NFC Technology](https://nfc-forum.org/learn/nfc-technology/)
- [GSMA：NB-IoT](https://www.gsma.com/solutions-and-impact/technologies/internet-of-things/mobile-iot-technology-nb-iot/)
- [Connectivity Standards Alliance：Zigbee](https://csa-iot.org/all-solutions/zigbee/)
- [Wi-Fi Alliance：Wi-Fi MAC/PHY 与 HaLow](https://www.wi-fi.org/wi-fi-macphy)
