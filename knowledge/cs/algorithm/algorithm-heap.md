堆是一棵满足局部顺序的不完全排序树：最小堆保证父节点不大于子节点，最大堆相反。这个不变量让极值始终位于根，并支持对数时间插入和删除，因此适合优先队列、调度和流式 Top-K；它不适合按任意键快速查找。

![二叉堆的数组索引、上浮下沉、线性建堆和流式 Top-K 维护过程](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/algorithm-heap-top-k-priority-v1.webp)
*图：完全二叉树紧凑映射到数组；插入沿父链上浮，删除根后沿子链下沉。*

## 数组表示与不变量

二叉堆是近似完全二叉树，除最后一层外全部填满，最后一层从左到右。因此无需指针即可存在数组。0-based 索引下：

```text
parent(i) = floor((i - 1) / 2)
left(i)   = 2i + 1
right(i)  = 2i + 2
```

[MIT 6.006 课程笔记](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2008/resources/lecture-notes/)介绍堆结构和操作。最小堆只承诺每个父节点 ≤ 子节点，不保证同层或左右子树整体有序。因此根是全局最小，但第二小未必在某个固定位置。

## 插入：先保形状，再修顺序

新元素追加在数组尾部，完全树形状仍成立；若比父节点小，就不断交换上浮，直到根或满足不变量。树高为 `floor(log₂ n)`，所以 push 最坏 O(log n)。

```js
function push(heap, value) {
  heap.push(value);
  let i = heap.length - 1;
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (heap[p] <= heap[i]) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
}
```

生产实现通常接收 comparator，使优先级和稳定 tie-break 显式。若优先级相同还需 FIFO，可比较 `(priority, sequence)`，因为普通堆不保证稳定顺序。

## 删除极值：末尾补根再下沉

pop 保存根，把最后元素移到根，再与更合适的子节点交换下沉。最小堆必须选择两个子节点中较小者，否则交换后可能仍违反另一侧不变量。peek O(1)，pop O(log n)。

删除任意元素需要先知道索引；若只有值，就要 O(n) 查找。支持 decrease-key 或取消任务时，可额外维护 id → index 映射，并在每次交换同步更新。惰性删除则给任务标记失效，pop 时跳过，但要监控垃圾比例和定期重建。

## 为什么建堆是 O(n)

把 n 个元素逐个 push 是 O(n log n)。更好的 `heapify` 从最后一个非叶节点开始向前下沉。虽然单次下沉最坏 O(log n)，但绝大多数节点靠近叶子，只走一两层；对各高度节点求和得到 O(n)。

这提醒我们不能仅看“循环 n 次、里面函数 O(log n)”就机械相乘，调用输入位置和实际高度分布也属于分析。

## 流式 Top-K

求最大 K 个元素时维护大小 K 的最小堆：根是当前 Top-K 中最小边界。新元素不大于根则丢弃；更大则替换根并下沉。时间 O(n log K)，空间 O(K)，不需保存全量。求最小 K 个则使用最大堆。

如果还要按最终大小排序，结束后对堆内容排序，或连续 pop。堆内数组本身不是有序 Top-K，直接输出会得到错误顺序。

## 优先调度的现实语义

调度器把 deadline、优先级或 nextRunAt 作为 key。更新优先级需要 decrease/increase-key，任务取消需要索引或惰性墓碑。多 worker 并发时，内存堆不提供持久性和租约；应把权威任务状态放在数据库/队列，堆作为单节点可重建索引。

优先级还会导致饥饿，可加入 aging：等待越久有效优先级越高。比较器必须形成一致的全序，否则浮点 NaN、随时间变化的 comparator 会破坏堆不变量。

## 与其他结构比较

若需要全部排序，一次 `O(n log n)` sort 更直接；若反复取极值，堆更合适；若同时需要最小和最大，可用双端优先队列或两堆；若查询任意 rank，平衡树或 order-statistic tree 更适合。

测试空堆、单元素、重复优先级、升降序输入、随机 push/pop，并在每次操作后验证所有父子关系。再把连续 pop 与完整排序结果比较。真正理解堆，就是能从两个不变量——完全树形状与父子顺序——推导每个操作和复杂度。

还应做属性测试：任意输入 heapify 后，连续 pop 必须等于同一 comparator 的排序结果；任意时刻 `size` 等于数组长度；索引表模式下每个 id 都指向真实位置。对 comparator 抛错、重复 id 和优先级更新不存在节点定义清晰失败语义，避免结构只坏一半。

## 参考资料

- [MIT OCW 6.006：Lecture Notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2008/resources/lecture-notes/)
