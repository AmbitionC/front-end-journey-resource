复杂度分析是在输入规模增长时预测资源需求的模型。它不替代 benchmark，也不是只背 `O(n log n)`：需要先定义 n，数清关键操作，再区分最坏、平均、期望与摊还成本，最后把增长率换算成真实延迟、内存和 I/O 预算。

![不同复杂度增长曲线与输入规模、延迟、内存和 I/O 资源预算的对应关系](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/algorithm-complexity-growth-budget-v1.webp)
*图：渐近模型解释增长趋势；在具体机器、数据分布和并发下仍需测量常数与资源瓶颈。*

## 先定义输入规模

遍历数组的 n 是元素数，图算法可能同时依赖顶点 V 和边 E，矩阵乘法要写维度。字符串处理按字节、Unicode code point 还是 grapheme cluster，成本不同。若输入有两个独立集合，嵌套循环可能是 `O(nm)` 而非自动写成 `O(n²)`。

[MIT 6.006 课程资料](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/pages/lecture-notes/)系统介绍渐近分析与数据结构。推导时选择一个基本操作，如比较、hash 或边访问，写出它执行次数随规模的函数，再保留主导项。

## O、Ω 与 Θ

Big-O 给出渐近上界，Big-Ω 给出下界，Big-Θ 表示上下界同阶。`3n² + 20n + 7` 属于 `Θ(n²)`，因为 n 足够大时二次项主导。忽略常数是为了比较增长，不是说常数在生产中无关。

同一算法有 best、worst 和 average case。哈希表查询在合理哈希与负载下期望 `O(1)`，冲突极端时可退化；快速排序平均 `O(n log n)`，朴素 pivot 最坏 `O(n²)`。必须说明假设。

## 摊还分析

动态数组 append 大多是 `O(1)`，扩容时复制 n 个元素。若容量按倍数增长，连续 n 次 append 的总复制仍是 O(n)，所以每次摊还 O(1)。摊还不是概率平均，而是对一段操作序列分摊偶发昂贵步骤。

潜势法可以把数据结构中积累的“未来工作”建模为 potential。评价服务尾延迟时，摊还均值仍可能不够：某个用户恰好遇到扩容停顿，需预分配、渐进迁移或后台重建。

## 时间与空间一起看

[MIT 6.006 2020](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/)强调数据结构表示和操作成本。用 hash map 把查找从 O(n) 降到期望 O(1)，代价是额外内存；缓存预计算结果以空间换时间；外部排序用更多顺序 I/O 避免数据全部进内存。

递归算法还要算调用栈。DFS 时间 O(V+E)，递归栈最坏 O(V)；在深图上可能先栈溢出。原地算法的“额外空间 O(1)”也不代表总内存只有常数，它仍持有输入。

## 从 Big-O 到预算

假设服务 100ms 内完成，单次比较约有可测成本，n 上限为一百万。`O(n²)` 意味着约万亿级配对，显然不可接受；`O(n log n)` 约两千万量级，但对象分配、缓存 miss 和语言运行时会改变结果。

[MIT 6.172 性能工程](https://ocw.mit.edu/courses/6-172-performance-engineering-of-software-systems-fall-2018/)关注硬件与软件的实际性能。连续数组遍历可能比指针链表快很多，因为缓存局部性；磁盘随机 I/O、网络往返、GC 和锁竞争也可能主导。先用复杂度排除不可能方案，再用 profiling 找实际瓶颈。

## 常见推导方法

顺序语句成本相加取主导项；嵌套独立循环相乘；分治可写 recurrence，例如 merge sort `T(n)=2T(n/2)+O(n)` 得 `O(n log n)`；图遍历对每个点和边常数次访问为 O(V+E)。提前 break 的循环最坏仍可能遍历全部，但平均成本依赖数据分布。

不要把库函数当 O(1) 黑盒。数组 `shift` 可能搬移元素，字符串拼接可能复制，数据库查询的索引和返回行数都会影响成本。复杂度沿调用链组合。

## 验证方法

构造倍增输入 n、2n、4n，观察耗时与内存比率：线性约翻倍，平方约四倍，`n log n` 略高于两倍。先预热 JIT，固定数据分布，分离 setup 与核心操作，报告分位数和硬件。

代码评审时写明 n 的业务上界、最坏输入、时间/空间阶、关键假设和 benchmark 证据。复杂度分析的最终目的，是在上线前知道增长会在哪里越过预算，而不是给代码贴一个公式标签。

## 参考资料

- [MIT OCW 6.006（2011）：Lecture Notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/pages/lecture-notes/)
- [MIT OCW 6.006（2020）](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/)
- [MIT OCW 6.172：Performance Engineering](https://ocw.mit.edu/courses/6-172-performance-engineering-of-software-systems-fall-2018/)
