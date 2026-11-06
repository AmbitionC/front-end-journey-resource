Java 集合选型先回答两件事：存的是一组元素，还是 key 到 value 的映射；最重要的操作是按位置访问、判断成员是否存在，还是取出下一项。接口表达这些语义，ArrayList、HashSet、HashMap 等实现类再决定具体的数据结构和成本。

## “集合的三个类型”应先确认分类口径

常见口述会用 List、Set、Map 概括“序列、去重成员、键值映射”。这个分组便于入门，但不是 Java 集合框架完整的接口继承图：**Map 不继承 Collection**；讨论 Collection 体系时，还必须认识 Queue，以及支持双端操作的 Deque。不能因为题目说了“三个”，就把 Queue 排除，或把 Map 说成 Collection 的子接口。[Oracle 集合接口教程](https://docs.oracle.com/javase/tutorial/collections/interfaces/index.html)明确把 Collection 和 Map 分成两个体系。

下面按常用操作说明角色，不声称只有这些接口。Java 21 还提供 SequencedCollection、SequencedSet、SequencedMap 等表示明确遍历顺序的接口，完整声明应查所用版本的 [java.util API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/package-summary.html)。

| 角色 | 保存的内容与主要语义 | 应先说明的需求 |
|---|---|---|
| List | 元素序列，通常允许重复，可按位置访问 | 第几个元素是否有意义，是否保留重复 |
| Set | 不含重复元素的成员集合 | 怎样判断同一成员，是否需要明确遍历顺序 |
| Queue | 等待处理的元素，提供队首查看、取出等操作 | 由什么规则决定下一项 |
| Deque | 可在两端插入、查看和移除元素；属于 Queue 体系 | 从哪端放、从哪端取，采用 FIFO 还是 LIFO |
| Map | key 到 value 的映射，一个 key 至多对应一个 value | key 的唯一性，以及重复 key 的更新规则 |

List 的“有序”主要指元素位置和遍历顺序，不等于按数值自动排序。Queue 也不保证一律先进先出，优先队列就是重要反例：下一项由优先级规则决定。Set 不重复，并不意味着所有 Set 都没有明确遍历顺序。这些差异先于实现类名称。[Oracle 接口说明](https://docs.oracle.com/javase/tutorial/collections/interfaces/index.html)分别限定了 List、Set、Queue、Deque 和 Map 的语义。

## 从操作需求走到实现类

先选择接口角色，再检查顺序、可修改性、null、并发与规模等约束。下面是选型过程，不是完整继承图；同一个业务可能同时需要序列和索引，而不是强行只选一个容器。

![先判断是否按 key 查 value；映射选择 Map，元素集合再按去重、位置访问或待处理操作选择 Set、List、Queue 或 Deque](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/java-collections-selection-archify-v1.png)
*图：接口先说明允许怎样操作，具体实现再承担性能和行为约束。*

ArrayList 是可变长数组实现的 List；LinkedList 同时实现 List 和 Deque。因此“它是链表”与“它提供 List 或 Deque 接口”是两个维度。HashSet 用哈希结构实现成员集合；LinkedHashSet 提供明确遍历顺序；HashMap 与 LinkedHashMap 同样要区分映射能力和遍历顺序。[Java 21 java.util 包说明](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/package-summary.html)列出了这些接口与实现的职责。

选实现时也不能只背“数组查询快、链表插入快”。按下标找到链表插入位置本身可能需要遍历；已有位置、连续扫描、内存占用和真实负载都会影响成本。哈希查找与 HashMap 冲突、树化、扩容的细节见[哈希表、缓存与去重](../../data-structure/algorithm/algorithm-hash.md)，这里不重复推导。

## 用同一份输入分清三个结果

以下是教学推演，不是来自某个项目的实现，也不是已编译运行的 Java 示例。输入依次为 `A、B、A`：

```text
需要保留每次出现的位置：List 保存 A、B、A，元素数为 3。
只问出现过哪些成员：Set 保存成员 A 和 B，成员数为 2；遍历顺序看实现。
按编码保存一份最新值：Map 先写 A→旧值，再写 A→新值，A 仍只有一项映射。
```

Map 的 value 可以重复，例如 A 和 B 都映射到同一个分类；“key 不重复”不等于“value 也不重复”。如果同一 key 必须保留多条记录，就应显式设计 `Map<K, List<V>>` 等结构，并定义追加、更新和删除的规则，而不是期待一次 put 自动保存历史。

另一类需求是待处理任务：用 Deque 的一端入、另一端出表达 FIFO；同端入、同端出可以表达栈式 LIFO。换成按优先级选择下一项的 Queue 时，语义已经改变，不能仍把插入顺序当成处理顺序。

## 选好容器之后仍须核对什么

接口不保证所有实现都允许修改，某些修改操作可以抛出 UnsupportedOperationException；Collection 与 Collections 也不同，后者是提供集合工具方法的类。null 支持、迭代顺序、线程安全和迭代时能否修改，都要检查具体实现，不能由 List、Set、Map 这几个名字推出。[集合接口教程](https://docs.oracle.com/javase/tutorial/collections/interfaces/index.html)说明了可选修改操作；[Java 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/package-summary.html)分别列出工具类和实现类。

普通容器不会因为放进 singleton 服务就自动线程安全；采用并发容器也不自动使多次调用构成一个原子业务动作。若问题真正关心多个线程同时更新，应进一步说明一致性协议，而不是把“选择 Map”当作并发设计的完成。

## 面试口述怎样保持准确

可以先说：“若按常见用途分，List 保存序列，Set 表达不重复成员，Map 表达键值映射；但 Map 不属于 Collection 继承体系。Collection 还包括 Queue，Deque 则支持双端操作。接着根据位置、唯一性、处理顺序、可修改性和并发需求选择实现。”

这段回答交代分类口径，也给追问留下清楚路径。问 HashMap 时转向哈希结构，问队列时说明队首规则，问‘有序’时澄清位置、遍历顺序与排序，避免把不同问题塞进同一张口诀表。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [商盟支付 Java 开发实习一面：交易去重、并发与消息](../../../interview/shangmeng/ai/shangmeng-ai-1.md)
<!-- interview-source-history:end -->

## 参考资料

- [Oracle Java Tutorials：集合接口体系及 Map、Collection 的区别](https://docs.oracle.com/javase/tutorial/collections/interfaces/index.html)（教程基于 JDK 8，本文只采用其基础接口语义）
- [Java SE 21 java.util：接口、实现类与 Sequenced 集合 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/package-summary.html)（2026-11-06 核验，版本固定为 Java 21）
