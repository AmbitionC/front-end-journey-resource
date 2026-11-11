本卷为**原创模拟题**，共 30 道四选一单项选择题，每题只有一个最佳答案。与 A 卷采用相同模块配额，通过新的情境检验边界条件、失败处理与计算过程；两卷均可独立使用，不代表任何招聘考试的试卷结构。

计算仅采用题干给出的模型。C 题采用 C11，涉及字节数时显式规定类型大小；Java 题采用 Java 21 的语言或 API 合同。第 26—30 题为金融科技与分布式常识，现有文章不足以支撑的部分已在解析中补齐，并标明关联阅读的边界。

## 考点分布

| 模块 | 题号 | 题数 |
| --- | --- | --- |
| 计算机组成原理 | B01—B03 | 3 |
| 数据库 | B04—B06 | 3 |
| 操作系统 | B07—B09 | 3 |
| 计算机网络 | B10—B11 | 2 |
| C 语言 | B12—B13 | 2 |
| Java 基础 | B14—B16 | 3 |
| 数据结构与算法 | B17—B19 | 3 |
| 软件工程 | B20—B22 | 3 |
| 信息安全 | B23—B25 | 3 |
| 金融科技与分布式常识 | B26—B30 | 5 |

## 基础与应用

### 原创模拟题 B01：数据总线加宽能推出什么

某传统并行总线教学系统只把数据总线加宽，地址编码方式、地址线数和控制协议均保持不变。哪项判断正确？

- A. 一次传输可承载的数据位数增多，但不能据此推出可表示的地址数量增加
- B. 可表示的地址数量必定同比增加，因为地址由数据线决定
- C. 控制总线必须取消，否则无法区分新旧数据宽度
- D. 地址总线将从此只用于传输数据内容

**答案：A。**

**解析：** 三类总线的逻辑职责不同：地址线编码访问位置，数据线承载数据，控制线组织读写与时序。只改数据宽度，不增加地址编码的可选值。更宽也不保证程序性能按同样比例提升，实际还受事务开销、存储响应和工作负载限制。

**对应文章：** [计算机组成原理速览](../bank-tech/soe-computer-organization.md)提供前提，三类总线的职责由本题补足；依据[华盛顿大学课程：Buses](https://courses.cs.washington.edu/courses/cse451/TLKCopy/basics/hw.html)。

### 原创模拟题 B02：从 CPI 求 CPU 时间

某程序动态执行 $6\times10^6$ 条指令，测得该次执行的平均 CPI 为 1.5，CPU 时钟频率为 3 GHz。只按 `CPU 时间 = 指令数 × 平均 CPI / 时钟频率` 计算，结果是多少？

- A. 0.3 ms
- B. 2 ms
- C. 3 ms
- D. 30 ms

**答案：C。**

**解析：** 总周期数为 $6\times10^6\times1.5=9\times10^6$，除以 $3\times10^9$ 周期/秒得到 0.003 秒，即 3 ms。GHz 的十进制倍率与 KiB 的二进制倍率不同。本题给出的是这次程序执行的平均 CPI，不把它假定为该 CPU 运行所有程序时的固定常数。

**对应文章：** [计算机组成原理速览：CPU 时间](../bank-tech/soe-computer-organization.md)。

### 原创模拟题 B03：寻址单位决定容量

某教学机器有 24 位物理地址，各地址编码均可用，按字节寻址，每字节 8 位。不考虑地址空洞，地址空间总容量是多少？1 MiB = $2^{20}$ B。

- A. 2 MiB
- B. 16 MiB
- C. 24 MiB
- D. 128 MiB

**答案：B。**

**解析：** 可表示 $2^{24}$ 个不同地址，每个地址对应 1 B，因此为 $2^{24}/2^{20}=16$ MiB。不能把 24 位直接当作 24 MiB，也不能在已经按字节计量后再乘 8，混成字节容量。若改成按字寻址，还需要知道每字多少字节，结论才可能变化。

**对应文章：** [计算机组成原理速览：地址位数与寻址单位](../bank-tech/soe-computer-organization.md)。

### 原创模拟题 B04：达到 3NF 却未达到 BCNF

关系 `R(A,B,C)` 的属性均为原子值，函数依赖由 `A → B`、`B → A` 及其推论构成。哪项正确？

- A. 唯一候选键是 A，因此属于 BCNF
- B. 唯一候选键是 B，因此连 2NF 都不满足
- C. 候选键只有 AB，且 `A → B` 是对非主属性的部分依赖
- D. 候选键为 AC、BC；关系满足 3NF，但 A、B 都不是超键，故不满足 BCNF

**答案：D。**

**解析：** C 无法从其他属性推出，所以任何键都必须带 C；AC 通过 A 推出 B，BC 通过 B 推出 A，二者都是最小键。A、B、C 都是主属性，给定非平凡依赖的右部是主属性，符合 3NF；但 A 和 B 单独都推不出 C，不是超键，违反 BCNF。求全体候选键比只看一个指定主键更可靠。

**对应文章：** [数据库理论：闭包、主属性与范式](../bank-tech/soe-database-theory.md)。

### 原创模拟题 B05：范围条件之后的列

有 B-tree 联合索引 `(tenant_id, occurred_at, status)`，查询为 `tenant_id = 7 AND occurred_at >= :start AND occurred_at < :end AND status = 'DONE'`。明确只讨论普通连续前缀范围扫描，不使用 skip scan 等额外优化。哪项正确？

- A. 一旦遇到时间范围，整个索引就完全不能使用
- B. `status` 是等值条件，所以扫描范围天然与索引 `(tenant_id, status, occurred_at)` 完全相同
- C. tenant 等值与时间范围可限定扫描区间；status 仍可能用于索引内过滤，但不能机械视作连续的第三列等值前缀
- D. SQL 把 status 条件写到最前面，就能改变索引的物理排序

**答案：C。**

**解析：** 索引首先按 tenant 排序，再按时间，最后才是在相同前两列下按 status 排序。时间已跨一个区间，满足某个 status 的条目通常散布其中，不能按连续等值前缀的办法忽略其余 status。右侧条件仍可在索引中检查，覆盖查询也可能减少回表；实际产品还会有其他优化，题干已限定本题路径。

**对应文章：** [数据库理论](../bank-tech/soe-database-theory.md)与[SQL 索引优化：复合索引与最左前缀](../../knowledge/data/sql/sql-index-optimize.md)；规则与优化边界见[PostgreSQL 18 多列索引](https://www.postgresql.org/docs/18/indexes-multicolumn.html)。

### 原创模拟题 B06：分区边界与裁剪候选

PostgreSQL 18 表以 `event_day DATE` 做 RANGE 分区：P1 为 `[2026-01-01,2026-02-01)`，P2 为 `[2026-02-01,2026-03-01)`，P3 为 `[2026-03-01,2026-04-01)`。查询条件是 `event_day >= DATE '2026-02-01' AND event_day < DATE '2026-03-01'`。只按分区约束判断可能包含匹配行的分区，哪项正确？

- A. 只有 P2；上界不包含在前一个分区内
- B. P1 和 P2，因为 2 月 1 日同时属于两者
- C. P2 和 P3，因为小于 3 月 1 日也包含当天
- D. 必须包含三个分区，因为分区裁剪只由行级索引决定

**答案：A。**

**解析：** RANGE 下界包含、上界排除，所以 2 月 1 日归 P2，3 月 1 日归 P3，查询只与 P2 区间相交。分区约束足以证明另外两个分区没有匹配行，是否以及何时裁剪还要结合系统设置和执行计划；分区内的索引访问是另一层问题。半开区间使相邻月份边界无需重复或留缝。

**对应文章：** [数据库理论](../bank-tech/soe-database-theory.md)与[分库分表：表分区的边界](../../knowledge/backend/database/db-sharding.md)；现有文章未详解此日期算例，依据[PostgreSQL 18 分区表文档](https://www.postgresql.org/docs/18/ddl-partitioning.html)。

### 原创模拟题 B07：SRTF 平局时保留当前进程

单 CPU、无 I/O、切换开销为 0。P1 的到达时刻/服务时间为 `0/8`，P2 为 `1/3`，P3 为 `2/2`。采用 SRTF；剩余时间相同则保留当前运行者。平均等待时间是多少？

- A. 0
- B. 7
- C. $13/3$
- D. $7/3$

**答案：D。**

**解析：** 时间线为 `[0,1) P1 → [1,4) P2 → [4,6) P3 → [6,13) P1`。时刻 2，P2 剩余 2，与新到达 P3 相同，按约定继续运行 P2。P1、P2、P3 完成于 `13、4、6`，等待时间按 `完成−到达−服务` 分别为 `5、0、2`，平均为 $7/3$。C 把总运行时间误作等待总和，B 则只求和而没有平均。

**对应文章：** [操作系统选择题：调度规则与指标](../bank-tech/soe-os-mcq.md)与[进程、线程与协程](../../knowledge/cs/os/os-process-thread.md)。

### 原创模拟题 B08：页号与页内偏移

某教学分页系统按字节寻址，虚拟地址宽度为 16 位，页大小为 1 KiB，给定虚拟地址 `0x2BCD`。其虚拟页已有效映射到物理页框 5，无其他变换。物理地址是多少？1 KiB = 1024 B。

- A. `0x2BCD`
- B. `0x17CD`
- C. `0x140A`
- D. `0x5BCD`

**答案：B。**

**解析：** 1 KiB 需要 10 位页内偏移，`0x2BCD = 10×1024 + 973`，虚拟页号为 10，偏移为 `973 = 0x3CD`。物理地址为 $5\times1024+973=6093$，即 `0x17CD`。页表替换的是页号部分，并保留页内偏移，不能按十六进制首字符直接替换。

**对应文章：** [操作系统选择题](../bank-tech/soe-os-mcq.md)与[内存、虚拟内存与分页](../../knowledge/cs/os/os-virtual-memory.md)。

### 原创模拟题 B09：fstab 的 noauto 不等于禁止挂载

配置为 `UUID=demo-archive /archive ext4 defaults,noauto 0 2`。假设设备、权限与文件系统正常，仅按挂载选项的含义判断，哪项正确？

- A. noauto 使该文件系统永久禁止挂载，即使管理员显式请求也不行
- B. noauto 表示每两天自动挂载一次
- C. noauto 让 `mount -a` 跳过该项，但不因此禁止显式挂载该项
- D. 最后一个字段 2 覆盖 noauto，使 `mount -a` 必定挂载它

**答案：C。**

**解析：** `noauto` 控制批量自动挂载选择：`mount -a` 不挂载带这个选项的条目。它不同于权限控制或禁止所有显式挂载；管理员仍可在满足条件时按挂载点等方式显式请求挂载。最后两列涉及 dump 与 fsck，不负责把 noauto 改回 auto。还应区分 fstab 配置与某次实际挂载状态。

**对应文章：** [操作系统选择题](../bank-tech/soe-os-mcq.md)提供前提，现有文章未讲 noauto；依据[Linux fstab(5)](https://man7.org/linux/man-pages/man5/fstab.5.html)。

### 原创模拟题 B10：按主机需求选最小地址块

普通 IPv4 广播子网需要容纳 50 台主机，网络地址与定向广播地址均不分配给主机。以下哪个单一 CIDR 地址块最小且足够？

- A. /28
- B. /27
- C. /25
- D. /26

**答案：D。**

**解析：** 需要 $2^h-2\ge50$。5 位主机位只能分配 30 个，6 位可分配 62 个，故最小地址块为 $2^6=64$ 个地址，对应 `/26`。/25 也够，但其块更大，不符合“最小”。只看前缀数字大小而不算容量容易反选。

**对应文章：** [计算机网络选择题：子网容量与前缀选择](../bank-tech/soe-network-mcq.md)。

### 原创模拟题 B11：重传超时后用哪个量减半

采用经典 TCP 教学规则，所有窗口均以 MSS 为单位。超时前 `cwnd=12`，实际未确认数据量 `FlightSize=10`，接收窗口足够大。首次重传超时后，按 `ssthresh=max(FlightSize/2,2)`、`cwnd=1` 取值。新的 `ssthresh、cwnd` 依次是多少？

- A. `6、6`
- B. `5、1`
- C. `12、1`
- D. `5、5`

**答案：B。**

**解析：** 阈值按实际在途数据量取一半，$\max(10/2,2)=5$；题设超时后 cwnd 取 1，重新从慢启动恢复。不能直接把未用满的 cwnd 当作 FlightSize，也不能把超时与三个重复 ACK 后的快恢复混为同一状态。RFC 5681 对这里的阈值与丢失窗口给出上限要求；本题明确选择该公式和 1 MSS 的具体值，不将它说成所有 TCP 算法的唯一实现。

**对应文章：** [计算机网络选择题](../bank-tech/soe-network-mcq.md)与[TCP、UDP 与传输场景](../../knowledge/network/tcpIp/tcp-udp.md)补前提，超时规则在此自足说明；依据[RFC 5681 §3.1](https://www.rfc-editor.org/rfc/rfc5681.html#section-3.1)。

### 原创模拟题 B12：二维数组的行指针

C11 中声明 `short a[4][3]; short (*p)[3] = a;`。规定 `sizeof(short)=2` B，指针运算保持在合法数组边界内。`sizeof *p` 与 `p+2` 相对 `p` 所指位置前进的字节数依次是多少？

- A. `2、4`
- B. `6、4`
- C. `6、12`
- D. `24、48`

**答案：C。**

**解析：** `p` 指向一个含 3 个 short 的行数组，`*p` 的类型是 `short[3]`，大小为 $3×2=6$ B。行指针加 2 跨过两整行，即 $2×6=12$ B，不是跨两个 short。整个 `a` 为 $4×3×2=24$ B，也不能代替单行大小。

**对应文章：** [C 语言常考点：二维数组与指向行的指针](../bank-tech/soe-c-language-mcq.md)。

### 原创模拟题 B13：字符串长度与数组容量

C11 代码为 `char s[] = "cash";`，并已正确包含 `<string.h>`。`sizeof s` 和 `strlen(s)` 依次是多少？

- A. `5、4`
- B. `4、4`
- C. `5、5`
- D. 由指针位宽决定，无法判断

**答案：A。**

**解析：** 数组由四个字符及结尾空字符组成，`sizeof s` 为 5 B；`strlen` 数到第一个空字符之前，结果为 4。这里 s 是实际数组而非函数中调整后的数组形参，因此不依赖指针位宽。字符串字面量中的字符与空字符都用于初始化可修改数组，不表示允许修改字面量本身。

**对应文章：** [C 语言常考点：字符数组、字符串与 sizeof](../bank-tech/soe-c-language-mcq.md)。

### 原创模拟题 B14：静态类型决定受检异常合同

接口声明 `Object read() throws java.io.IOException`。实现类合法地以 `public String read()` 重写，未声明受检异常。调用者的变量静态类型是该接口，在普通方法中调用 `ref.read()`。哪项正确？

- A. 实际对象是实现类，所以编译器一定忽略接口上的受检异常声明
- B. 返回类型从 Object 变成 String 只能算重载，不能算重写
- C. 只要实现方法没有 throws，接口类型的变量就禁止调用该方法
- D. 编译时仍按接口方法合同处理 IOException；运行时执行相应重写实现

**答案：D。**

**解析：** 编译时的方法与异常检查依据表达式的静态类型及选定签名，因此调用方仍需捕获或声明适用的受检异常。实现允许采用协变引用返回类型，并减少受检异常范围；运行时动态分派不取消调用点的编译义务。若改用实现类静态类型调用，所见合同才可能不同。

**对应文章：** [Java 基础选择题：重写、分派与受检异常](../bank-tech/soe-java-mcq.md)。

### 原创模拟题 B15：对象后缀需要团队约定

本题团队明确约定：DO 表示领域对象，PO 表示持久化对象，DTO 表示跨边界传输对象，VO 表示页面展示对象。接口要向外返回账户摘要，并排除内部风控字段。哪项最合理？

- A. 给 PO 改名为 DTO 后，Java 编译器会自动隐藏所有内部字段
- B. 按接口合同显式映射需要的 DTO 字段，并核对序列化和权限；这些后缀本身不提供安全隔离
- C. VO 在所有项目都只能解释为 View Object，不能有其他约定
- D. DO、DTO、PO、VO 是 Java 语言内置的四种对象类型

**答案：B。**

**解析：** 本题先固定缩写含义，避免 DO、VO 在不同项目的其他解释造成歧义。对象划分服务于业务、存储和接口的变化边界，真正限制输出的是映射、序列化配置和访问控制，不是类名。另一些团队会把 DO 用作 Data Object，把 VO 用作 Value Object，阅读材料时应先确认上下文。

**对应文章：** [Java 基础选择题：DO/DTO/PO/VO 的约定边界](../bank-tech/soe-java-mcq.md)。

### 原创模拟题 B16：HashMap 键的稳定性

业务对象被用作 HashMap 的键，`equals` 与 `hashCode` 都使用一个可修改的账户编号字段。把键放入 Map 后又修改该编号，随后用“修改后相等”的另一个对象查找。哪项正确？

- A. HashMap 会监听字段变化，自动把旧条目搬到新的桶
- B. 只要两个对象此刻 equals 为真，查找就与字段修改前后无关
- C. 修改参与相等与散列计算的键状态会破坏原查找前提，应使用稳定键或在修改前移除后重新放入
- D. 给 Map 的 value 也改成相同编号，就能恢复所有查找保证

**答案：C。**

**解析：** HashMap 不会跟踪键内部字段变动并自动重排。条目按插入时的散列等信息组织，之后改变相关状态，可能导致按新散列查找不到它。稳定的不可变标识更适合作键；若确需改键，应在旧状态仍可正确定位时移除，再以新状态插入，并处理业务唯一性。

**对应文章：** [Java 基础选择题：集合与 key 相等性](../bank-tech/soe-java-mcq.md)及[Java 集合：接口分类与选型](../../knowledge/backend/java/java-collections.md)；键可变性的 API 边界见[Java 21 Map 合同](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html)。

### 原创模拟题 B17：最小生成树的总权重

无向连通图有顶点 A、B、C、D、E，边为 `AB=2、AC=6、BC=3、BD=5、CD=4、CE=7、DE=1、BE=8`，没有其他边。最小生成树总权重是多少？

- A. 9
- B. 10
- C. 11
- D. 13

**答案：B。**

**解析：** 按 Kruskal 从小到大选 `DE=1、AB=2、BC=3、CD=4`，每条都连通不同分量，最终以四条边连通五个顶点，总权重为 10。不能只为某个源点求最短路径，再当作全图生成树；也不能为了减小和而省去顶点。各边权不同还保证本图的最小生成树唯一。

**对应文章：** [数据结构选择题：最小生成树](../bank-tech/soe-data-structures-mcq.md)与[图与图算法](../../knowledge/cs/algorithm/algorithm-graph.md)。

### 原创模拟题 B18：二分查找比较了哪些键

有序数组为 `3,7,11,15,19,23,27,31,35,39,43,47`，下标从 0 开始。用闭区间 `[lo,hi]` 二分查找 35，初始 `lo=0, hi=11`，每轮 `mid=floor((lo+hi)/2)`，找到相等即停止。每轮只把访问一个中点元素计作一次键比较。哪项正确？

- A. 依次访问 23、35，共 2 次
- B. 依次访问 27、39、35，共 3 次
- C. 依次访问 23、31、35，共 3 次
- D. 共 12 次，因为数组有 12 个元素

**答案：A。**

**解析：** 首轮 mid 为 5，键为 23，目标更大，令 lo=6；下一轮 mid 为 8，键为 35，停止。这里计“访问中点键”的次数，不把具体代码中的小于、等于等多个布尔运算分别计数；更换中点取整规则也可能改变访问路径。

**对应文章：** [数据结构选择题：二分查找计数](../bank-tech/soe-data-structures-mcq.md)与[数组与查找](../../knowledge/data-structure/algorithm/algorithm-array.md)。

### 原创模拟题 B19：外部归并的轮数与 I/O

文件有 180 个磁盘块，内存共 6 块。初始阶段每次读最多 6 块内部排序后全部写出，不采用置换选择；之后每轮最多用 5 路输入归并，1 块作输出缓冲。规定每轮所有记录均完整读写，即使尾部某组只有一个段也复制到本轮输出，最终结果写回磁盘。不计其他 I/O。初始成段后还需几轮归并，全部过程块 I/O 总数是多少？

- A. `2 轮、1080`
- B. `3 轮、1080`
- C. `4 轮、1800`
- D. `3 轮、1440`

**答案：D。**

**解析：** 初始有 $180/6=30$ 段，最多五路归并的段数变化为 `30 → 6 → 2 → 1`，需 3 轮归并。加上初始成段，共 4 轮完整读写，每轮 $2×180=360$ 次块 I/O，总计 1440。不能漏掉初始写段或最终写盘，也不能把内存六块全部当作输入路数。本题对尾段的复制规定排除了复用旧文件等优化的计数歧义。

**对应文章：** [数据结构选择题：外部归并](../bank-tech/soe-data-structures-mcq.md)与[排序算法与外部排序](../../knowledge/cs/algorithm/algorithm-sorting.md)。

### 原创模拟题 B20：V 模型中的需求与验收

按软件工程教学中的 V 模型，团队要验证最终交付是否满足用户业务需要。哪项最贴合该目标？

- A. 只运行某个私有函数的单元测试，就等同完成业务验收
- B. 只检查类图箭头是否画对，不再执行系统
- C. 依据用户需求与验收准则组织验收测试，并保留需求与测试的追踪关系
- D. 只要更换了编译器，就自动满足所有需求

**答案：C。**

**解析：** V 模型用开发侧工作产物与相应验证活动建立联系，用户需求是验收的重要依据。组件测试、集成测试和系统测试仍有各自任务；一个层次的通过不能自动证明其他层次已完成。确认某个缺陷修复也不等于对整个业务需求验收。

**对应文章：** [软件工程基础：V 模型与测试层次](../bank-tech/soe-software-engineering-mcq.md)。

### 原创模拟题 B21：include 与 extend 的方向

UML 用例模型中，“提交申请”总要执行可复用的“核验必填项”；另有“补充担保”只在特定扩展条件下插入基本用例“办理授信”，基本用例在没有该扩展时仍可独立成立。哪项正确？

- A. `提交申请 --«include»--> 核验必填项`；`补充担保 --«extend»--> 办理授信`
- B. 两个箭头都从被复用或被扩展的用例指回调用方
- C. include 只描述条件附加，extend 则表示每次必须执行
- D. include 与 extend 都是类之间的继承关系，应画空心三角箭头

**答案：A。**

**解析：** include 从包含用例指向被包含用例，表达被纳入的复用行为；extend 从扩展用例指向被扩展的基本用例，附加行为受相应条件和扩展点约束。它们是用例关系，不能混成类的泛化。判断箭头先明确谁包含谁、谁向谁加行为，再看虚线与构造型文字。

**对应文章：** [软件工程基础：UML include 与 extend](../bank-tech/soe-software-engineering-mcq.md)。

### 原创模拟题 B22：带区间外邻居的边界值

某整数输入仅在闭区间 `[21,55]` 内有效。本题规定选取“两个端点、各自向有效区间内一步、各自向无效区间外一步”，去掉重复值。下列哪组刚好符合规则？

- A. `21、55`
- B. `20、21、22、54、55`
- C. `0、21、38、55、100`
- D. `20、21、22、54、55、56`

**答案：D。**

**解析：** 下端点附近为 `20、21、22`，上端点附近为 `54、55、56`，合起来六个互不相同的值。A 漏掉邻居，B 漏掉上界外的 56，C 混入了不在该规则中的远端值。不同边界值方法的选点数可能不同，本题明确给定规则，不把某种教材命名当作唯一前提。

**对应文章：** [软件工程基础：等价类与边界值](../bank-tech/soe-software-engineering-mcq.md)。

### 原创模拟题 B23：salt 能做什么

用户密码采用经评估的专用密码散列算法，并为每个账户生成独立随机 salt。数据库泄露后，salt 与散列均可被攻击者读取。哪项正确？

- A. salt 必须与密码一起保密，否则密码散列完全没有意义
- B. salt 限制跨账户复用相同预计算结果，但不能阻止攻击者逐账户离线猜测弱密码
- C. salt 是加密密钥，服务器可用它从散列还原密码
- D. 有 salt 就无需考虑算法成本、参数和用户密码强度

**答案：B。**

**解析：** salt 通常不需要作为秘密，它使相同密码在不同 salt 下产生不同散列，减少通用预计算表及跨账户重复工作的收益。攻击者仍可尝试候选密码并用已知 salt 计算核对，因此还要使用合适的密码散列算法与成本参数，并控制在线猜测风险。不能把普通快速摘要加 salt 自动当成足够的密码存储方案。

**对应文章：** [信息安全基础：密码存储与 salt](../bank-tech/soe-information-security-mcq.md)。

### 原创模拟题 B24：昵称作为纯文本显示

前端只需显示用户昵称，无任何富文本需求。昵称可能包含 `<`、`>` 等字符。哪项处理最符合该输出目标？

- A. 将昵称直接赋给 innerHTML，因为昵称字段比正文短
- B. 只删除字符串中的 `script` 单词后赋给 innerHTML
- C. 使用 textContent 等纯文本输出 API，让内容作为文本显示
- D. 只要响应头允许跨域访问，就自动消除昵称中的 XSS 风险

**答案：C。**

**解析：** 纯文本接口把输入当作字符内容，而非 HTML 结构，是本题最直接的输出边界。关键词删除无法覆盖各种可执行语法，字段长度也不是安全合同。富文本场景才需要额外评估受控清洗与上下文规则；CORS 管的是跨域读取等权限，不替代 XSS 防护。

**对应文章：** [信息安全基础：XSS 与输出上下文](../bank-tech/soe-information-security-mcq.md)及[常见 Web 攻击与防御](../../knowledge/network/security/web-attack.md)。

### 原创模拟题 B25：读不到响应仍可能发起跨站请求

某修改收款账户的接口依赖浏览器自动携带的会话 Cookie。假设跨站请求在当前 Cookie 策略下确实会携带会话，接口没有其他请求来源或意图校验。为什么仅禁止恶意站点通过 CORS 读取响应仍不充分？

- A. 某些跨站请求仍可被发出并触发副作用，需要合适的 CSRF token、来源校验及 Cookie 策略等配合
- B. CORS 会强制所有浏览器把会话 Cookie 发给任意站点
- C. 把接口响应改成空字符串就能阻止所有状态变更
- D. 用户已经登录，服务端就不必再验证这次操作是否出自可信上下文

**答案：A。**

**解析：** CSRF 利用浏览器代带身份信息触发操作，攻击目的不必包含读取响应。跨源读取限制不能单独证明请求发不出或副作用不会发生。应根据实际请求方式、Cookie 与部署条件设计 token 和来源检查，SameSite 也是辅助边界，不能把某个默认浏览器行为当作全部场景的唯一防线。

**对应文章：** [信息安全基础：CSRF 与 CORS 的边界](../bank-tech/soe-information-security-mcq.md)及[常见 Web 攻击与防御](../../knowledge/network/security/web-attack.md)。

## 金融科技与分布式常识

### 原创模拟题 B26：Raft 多数派与作恶节点

某固定成员的 Raft 集群有 5 个投票节点，其他前提符合标准 Raft 模型。先有 2 个节点崩溃且停止响应；剩下节点互通并最终能选出稳定领导者。随后有人提出“既然容忍了两个崩溃，也必然能容忍两个节点任意作恶”。哪项正确？

- A. 剩下 3 个节点不足多数，任何新日志都永远不能提交
- B. 只要存在一个存活节点，就总能提交新日志
- C. 给节点增加权益质押或 PoW 标签，就自动得到相同的 BFT 保证
- D. 剩下 3 个达到多数，满足其余条件时可继续推进；这不推出任意作恶容错保证

**答案：D。**

**解析：** 五节点多数派为 $\lfloor5/2\rfloor+1=3$，因此在题设的连通、选主和持久化等条件下，两个崩溃仍可保留推进所需多数。CFT 的停止故障不同于 BFT 所考虑的矛盾投票、伪造协议行为等。Raft 不能把“节点数够”当作恶意节点也会守约的证据；PoW 以计算工作、PoS 以权益及配套规则参与共识，也都须按完整协议和攻击假设分析。

**对应文章：** [信息安全基础](../bank-tech/soe-information-security-mcq.md)只补信任前提，现有文章无 Raft/PoW/PoS、BFT/CFT 专题；依据[Hyperledger Fabric：Raft 与 BFT](https://hyperledger-fabric.readthedocs.io/en/latest/orderer/ordering_service.html)、[Bitcoin 原始论文 §4](https://bitcoin.org/bitcoin.pdf)及[Ethereum：PoS](https://ethereum.org/developers/docs/consensus-mechanisms/pos/)。

### 原创模拟题 B27：TCC 的重试不是重复扣减

一个 TCC 服务的 Try 已预留资源，Confirm 因超时被重复投递；网络乱序也可能使 Cancel 先于相应 Try 到达。哪项设计合理？

- A. 每次 Confirm 都再次扣减资源，重复消息会自动互相抵消
- B. 用业务事务标识与状态记录保证 Confirm/Cancel 幂等，并处理空回滚和后到 Try；不把这些问题交给名称本身解决
- C. Cancel 未找到预留记录，就删除所有其他事务的预留以确保释放充分
- D. 改为 SAGA 后，补偿不会失败，也无须记录执行进度

**答案：B。**

**解析：** Confirm/Cancel 的重试必须识别同一业务分支，已经确认或取消时不能重复产生业务效果。Cancel 先到形成空回滚，随后 Try 还要识别已取消状态，避免再次预留形成悬挂。SAGA 则以本地提交后的补偿处理失败，仍需幂等、可恢复记录与补偿失败处理。TCC 的 Try 预留与 SAGA 的先提交后补偿不同，都要设计完整的失败路径。

**对应文章：** [分库分表：事务边界](../../knowledge/backend/database/db-sharding.md)与[持久工作流：幂等与补偿](../../knowledge/llm/agent/agent-workflow-state.md)只覆盖部分前提；本题 TCC 失败场景依据[Seata：幂等、空回滚与悬挂](https://seata.apache.org/blog/seata-tcc-fence/)，对比见[Seata Saga](https://seata.apache.org/docs/user/mode/saga/)。

### 原创模拟题 B28：同一容器重启与容器替换

应用文件仅写在 Docker 容器可写层，不挂载卷。运维分别执行“停止后启动同一容器”和“删除该容器，再用同镜像新建容器”。不考虑其他故障，哪项正确？

- A. 两种操作都会自动把旧可写层同步进镜像
- B. 停止同一容器必定清空全部可写层；删除后新建则必定恢复
- C. 同一容器的停止再启动通常保留其可写层；删除后新建不继承旧层，持久需求须另行设计
- D. 使用 Docker 就已证明应用无状态，文件放在哪里不影响恢复

**答案：C。**

**解析：** 镜像层与容器自己的可写层要分开。停止、启动同一容器没有删除它的可写层；删除容器则结束该层的生命周期，同镜像新容器会得到自己的新可写层。卷或外部存储可把状态寿命与实例分离，但需要备份、权限和并发合同。无状态应用强调副本可替换，不是容器平台自动替业务作出的保证。

**对应文章：** [Agent 状态存储与恢复](../../knowledge/backend/storage/agent-state-storage.md)补持久状态外置；生命周期依据[Docker 存储](https://docs.docker.com/engine/storage/)与[Docker：停止、启动与删除容器](https://docs.docker.com/learn/content/run-your-first-container/)。

### 原创模拟题 B29：联邦学习的数据异质性

多家参与方按经典联邦学习方式在本地训练并上传更新。各方的样本量和数据分布明显不同，部分设备还会间歇离线。哪项判断正确？

- A. 需要设计参与选择、聚合权重、离线恢复与评估；不集中原始样本也不能保证各方分布相同或训练自动收敛到相同效果
- B. 联邦学习会自动把所有机构样本变成独立同分布，无须检查偏差
- C. 一旦用安全聚合，就同时证明了各方训练数据质量、模型公平性与准确率
- D. 联邦学习与集中训练的唯一区别是把模型文件换一个后缀

**答案：A。**

**解析：** 经典联邦设置允许数据留在参与方，通过本地计算与更新聚合协作；样本不均衡、非独立同分布和参与不稳定是需要处理的实际条件。FedAvg 一类方法可按样本量等约定聚合，但不存在仅凭“联邦”名称得到的统一准确率保证。安全聚合限制单方更新暴露，差分隐私约束相应信息泄露，都不替代数据质量、效果和公平性评估，也不提供无条件隐私保证。

**对应文章：** [大模型训练全流程概览](../../knowledge/llm/basics/llm-training-overview.md)提供训练基础，现有文章未讲联邦专题；依据[联邦学习原始研究](https://research.google/pubs/communication-efficient-learning-of-deep-networks-from-decentralized-data/)及[Google Research：隐私与可验证保证](https://research.google/blog/toward-provably-private-learning-from-federated-data/)。

### 原创模拟题 B30：选通信技术时同时看距离与拓扑

四个场景分别为：手机贴近标签交互；有运营商覆盖的分散低速水表上报；使用既有室内 AP 的手持终端联网；依靠低功耗节点和路由设备扩展覆盖的楼内传感网。按常见适用场景，哪组匹配最合理？

- A. NB-IoT、NFC、Zigbee、Wi-Fi
- B. NFC、NB-IoT、Wi-Fi、Zigbee
- C. Wi-Fi、Zigbee、NFC、NB-IoT
- D. Zigbee、Wi-Fi、NB-IoT、NFC

**答案：B。**

**解析：** NFC 面向厘米级贴近交互；NB-IoT 面向低功耗蜂窝广域覆盖，仍须核查当地网络与业务容量；常规 Wi-Fi 适合既有 AP 的局域联网；Zigbee 常用于低功耗局域 mesh，靠合适的路由节点扩展多跳覆盖。局域单跳与整网跨度不能混为一谈。这里限定常见场景，不保证固定米数或 Wi-Fi 与 Zigbee 的绝对远近；例如 Wi-Fi HaLow 属于不同前提，联盟资料列举约公里级能力，也不能照搬到所有室内 Wi-Fi。

**对应文章：** [计算机网络选择题](../bank-tech/soe-network-mcq.md)只提供网络前提，四种通信技术在此补足；依据[NFC Forum](https://nfc-forum.org/learn/nfc-technology/)、[GSMA：NB-IoT](https://www.gsma.com/solutions-and-impact/technologies/internet-of-things/mobile-iot-technology-nb-iot/)、[CSA：Zigbee](https://csa-iot.org/all-solutions/zigbee/)及[Wi-Fi Alliance：Wi-Fi 与 HaLow](https://www.wi-fi.org/wi-fi-macphy)。

## 答案速查

| 题号 | 答案 | 题号 | 答案 | 题号 | 答案 |
| --- | --- | --- | --- | --- | --- |
| B01 | A | B11 | B | B21 | A |
| B02 | C | B12 | C | B22 | D |
| B03 | B | B13 | A | B23 | B |
| B04 | D | B14 | D | B24 | C |
| B05 | C | B15 | B | B25 | A |
| B06 | A | B16 | C | B26 | D |
| B07 | D | B17 | B | B27 | B |
| B08 | B | B18 | A | B28 | C |
| B09 | C | B19 | D | B29 | A |
| B10 | D | B20 | C | B30 | B |

## 参考资料

各题已列对应复习文章；以下资料用于核对扩展题与现有文章未完整解释的边界。

- [华盛顿大学课程：系统总线](https://courses.cs.washington.edu/courses/cse451/TLKCopy/basics/hw.html)
- [PostgreSQL 18：多列索引](https://www.postgresql.org/docs/18/indexes-multicolumn.html)
- [PostgreSQL 18：分区表](https://www.postgresql.org/docs/18/ddl-partitioning.html)
- [Linux fstab(5)](https://man7.org/linux/man-pages/man5/fstab.5.html)
- [RFC 5681：TCP 拥塞控制](https://www.rfc-editor.org/rfc/rfc5681.html)
- [Java 21：Map API 合同](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html)
- [Hyperledger Fabric：排序服务的 CFT 与 BFT](https://hyperledger-fabric.readthedocs.io/en/latest/orderer/ordering_service.html)
- [Bitcoin 原始论文：工作量证明](https://bitcoin.org/bitcoin.pdf)
- [Ethereum：权益证明](https://ethereum.org/developers/docs/consensus-mechanisms/pos/)
- [Seata：TCC 模式的幂等、空回滚与悬挂](https://seata.apache.org/blog/seata-tcc-fence/)
- [Seata：Saga 模式](https://seata.apache.org/docs/user/mode/saga/)
- [Docker：存储与可写层](https://docs.docker.com/engine/storage/)
- [Docker：停止、启动与删除容器](https://docs.docker.com/learn/content/run-your-first-container/)
- [Communication-Efficient Learning of Deep Networks from Decentralized Data](https://research.google/pubs/communication-efficient-learning-of-deep-networks-from-decentralized-data/)
- [Google Research：Toward provably private learning from federated data](https://research.google/blog/toward-provably-private-learning-from-federated-data/)
- [NFC Forum：NFC Technology](https://nfc-forum.org/learn/nfc-technology/)
- [GSMA：NB-IoT](https://www.gsma.com/solutions-and-impact/technologies/internet-of-things/mobile-iot-technology-nb-iot/)
- [Connectivity Standards Alliance：Zigbee](https://csa-iot.org/all-solutions/zigbee/)
- [Wi-Fi Alliance：Wi-Fi MAC/PHY 与 HaLow](https://www.wi-fi.org/wi-fi-macphy)
