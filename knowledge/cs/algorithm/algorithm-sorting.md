选择排序算法不能只比较平均时间复杂度。还要问：是否需要稳定、能用多少额外内存、数据是否部分有序、key 是否有界、结果是否全部需要，以及数据能否放进内存。排序是对顺序契约的实现，不是算法名称竞赛。

![稳定与不稳定排序对相等键顺序的影响，以及外部归并排序生成有序 Runs 再多路合并](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/algorithm-sorting-stability-external-merge-v1.webp)
*图：稳定性保留同 key 的原始顺序；外部排序用内存内 runs 和顺序 I/O 处理超内存数据。*

## 比较模型与下界

比较排序只通过“a 是否小于 b”获得信息。[MIT 6.006 资料](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2008/resources/lecture-notes/)用决策树说明，一般比较排序需要区分 n! 种排列，因此最坏至少 Ω(n log n) 次比较。

计数、基数和桶排序能突破这个下界，因为它们利用整数范围、位数或分布等额外假设，不属于纯比较模型。若 key 范围巨大且稀疏，计数数组的空间可能不可接受。

## 常见算法的真实特征

插入排序最坏 O(n²)，但对很小或近乎有序数组常很好，许多混合排序用它处理小分段。归并排序 O(n log n)、易稳定，通常需 O(n) 额外空间。堆排序 O(n log n)、额外空间小，但不稳定且缓存局部性可能较差。

快速排序平均 O(n log n)，原地且局部性好；朴素 pivot 在有序或恶意输入可能 O(n²)。随机化、median-of-three 和 introsort（递归过深切堆排序）控制风险。实际语言标准库常采用 Timsort、introsort 或稳定变体，使用前应查契约而非猜实现。

## 稳定性为什么重要

稳定排序保证比较 key 相等的元素保持输入相对顺序。先按姓名稳定排序，再按部门稳定排序，最终同部门内仍按姓名；若第二次不稳定，第一次顺序会被破坏。

也可以一次比较复合 key `(department, name, originalIndex)` 获得确定顺序。分布式系统尤其需要 total tie-breaker，否则不同节点对相等 key 可能输出不同顺序，造成分页重复/遗漏和摘要不稳定。

## Comparator 契约

比较器应满足反对称、传递和一致性。返回随机值、读取不断变化的时间，或对 NaN/locale 处理不一致，会让任何排序算法行为不可预测。不要用 `a - b` 比较可能超出安全整数的值；字符串使用明确 locale 和 normalization。

排序期间不修改 key。若比较昂贵，先 decorate：为每个元素计算一次 sort key，排序后 undecorate，这就是 Schwartzian transform 的思路。

## 部分排序与选择

只需最大 K 个时无需全排序：大小 K 的堆为 O(n log K)；需要第 k 小可用 quickselect，平均 O(n)。数据已按多个 runs 近似有序时，适应性排序能利用结构。先明确输出需求，往往比微调全排序更省。

## 外部归并排序

当数据超出内存，[MIT 6.006 2011 资料](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/pages/lecture-notes/)所涉及的外存思想强调 I/O 成本。External merge sort 分两阶段：读取能放入内存的块、内部排序写成 runs；再用小根堆对多个 run 做 k-way merge，顺序读写。

run 大小受内存和对象开销限制；merge fan-in 受文件句柄和缓冲影响。临时文件带 jobId、校验和和完成标志，失败后清理。若需要稳定，run 内排序和 merge 对相等 key 都使用原始序号作为 tie-break。

## 分布式排序

MapReduce 式 total order 常先采样确定 range partitions，再各分区内部排序。采样不代表真实倾斜时，热点 key 会让单分区拖尾；需要单独处理 heavy hitters 或更细分桶。分区边界和 comparator 版本必须固定，否则重跑结果漂移。

## 验证

测试空、重复、全相等、已升序、逆序、极端数值、NaN、Unicode 和大量相同 key。断言输出非降序、元素多重集合不变；稳定算法还断言相等 key 的原 index 递增。benchmark 使用不同规模与数据形状，并测比较次数、分配、峰值内存和 I/O。

排序选型的结论应是一组条件：在当前 key、稳定性、内存和输入分布下为什么合适，以及条件变化时切换到什么方案。

## 参考资料

- [MIT OCW 6.006（2008）：Lecture Notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2008/resources/lecture-notes/)
- [MIT OCW 6.006（2011）：Lecture Notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/pages/lecture-notes/)
