递归、分治、回溯和 memoization 不是四个互不相干的技巧。它们都在描述子问题图：怎样缩小问题、何时停止、怎样组合答案，以及是否会重复到达同一状态。

![问题递归拆分到 base case 后向上合并，另一侧搜索树在 choice point 失败时 prune、undo 并尝试下一分支](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/recursion-divide-conquer-search-tree-v1.webp)
*图：左侧递归树强调规模严格下降与 combine；右侧回溯强调选择、约束、撤销；重复子问题用 memo 汇合。*

---

## 递归正确性的三个条件

[NIST 对 recursion 的定义](https://xlinux.nist.gov/dads/HTML/recursion.html)强调用同类但更小的子问题求解原问题。一个递归函数必须回答：

1. base case 在什么状态直接返回；
2. 每次调用的度量如何严格接近 base case；
3. 子问题返回后如何组合为当前答案。

```javascript
function factorial(n) {
  if (!Number.isInteger(n) || n < 0) throw new RangeError('n must be a non-negative integer');
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
```

度量 n 每次减 1 且有下界 1，所以会终止。若参数可能在两个值之间循环，只有“写了 if”并不能证明终止。

调用栈保存参数、局部变量与返回位置。时间复杂度之外要估算最大栈深；深链表或攻击者控制的嵌套输入可能导致 stack overflow，此时显式栈的迭代实现更可控。

## 分治：拆分、求解、合并

分治把规模 n 拆成多个更小且相对独立的子问题，递归求解后合并。归并排序把数组二分，两个子问题规模约为 n/2，合并扫描为 O(n)，因此形成 O(n log n)。

复杂度来自递归树而不是“用了递归”本身。快速排序若 pivot 长期极不平衡，树高可从 log n 退化到 n；同一算法通过随机化或更好的 pivot 策略改变的是分割质量。

分治适用于子问题可独立求解且合并明确的场景。DOM 遍历只是树递归，不自动成为分治；动画、事件冒泡或文件上传也不能因为“看起来分步骤”就笼统归为分治。

## 回溯：带撤销的深度优先搜索

[NIST 的 backtracking 条目](https://xlinux.nist.gov/dads/HTML/backtrack.html)把它描述为：在 choice point 选择一条路径，失败后回退并尝试其他选择。标准状态由当前路径、候选集合和约束组成：

```javascript
function search(path, candidates, results) {
  if (isComplete(path)) {
    results.push([...path]);
    return;
  }

  for (const choice of candidates) {
    if (!isValid(path, choice)) continue;
    path.push(choice);
    search(path, nextCandidates(candidates, choice), results);
    path.pop();
  }
}
```

`push` 与 `pop` 必须成对，使下一分支看到进入本层前的状态。保存答案时复制 path，否则后续撤销会修改已经加入结果集的同一数组。

剪枝不是“感觉这条路不行”，而是证明某个部分状态不可能扩展为合法解或更优解。验证剪枝最直接的方法，是在小输入上对比不开剪枝的穷举结果集合。

## Memoization：把树压缩成状态图

不同路径若到达同一子问题，递归树包含重复计算。[NIST 对 memoization 的说明](https://xlinux.nist.gov/dads/HTML/memoize.html)使用缓存复用已计算结果。以 Fibonacci 为例，朴素递归反复求 `fib(k)`；缓存后每个 k 只求一次，时间由指数级降为 O(n)。

```javascript
function fib(n, memo = new Map([[0, 0], [1, 1]])) {
  if (memo.has(n)) return memo.get(n);
  const value = fib(n - 1, memo) + fib(n - 2, memo);
  memo.set(n, value);
  return value;
}
```

缓存 key 必须完整表达结果所依赖的状态。如果函数还依赖 remaining budget、当前位置和已选集合，却只用当前位置作 key，就会错误复用。适合 memo 的函数应接近纯函数；有外部副作用时要先分离计算与动作。

## 自顶向下与自底向上

Memoized recursion 是自顶向下：只访问从初始问题可达的状态，表达接近递推定义，但受调用栈限制。动态规划表是自底向上：按依赖顺序填表，内存布局和迭代通常更可控，但可能计算不可达状态。

选择时比较状态数量、转移成本、自然拓扑顺序、栈深和答案恢复需求。若只需最终值，可把完整二维表压缩为滚动行；若要重建路径，还需保留 predecessor 或重新计算决策。

## 测试清单

- base case、最小非 base case 与非法输入；
- 规模度量是否每步严格下降；
- 无解、唯一解、多解以及结果是否重复；
- 回溯撤销后状态是否完全恢复；
- 剪枝前后小规模结果集合一致；
- memo key 是否包含所有结果依赖；
- 最大深度、最大状态数与内存预算。

## 参考资料

- [NIST Dictionary of Algorithms and Data Structures: recursion](https://xlinux.nist.gov/dads/HTML/recursion.html)
- [NIST Dictionary of Algorithms and Data Structures: backtracking](https://xlinux.nist.gov/dads/HTML/backtrack.html)
- [NIST Dictionary of Algorithms and Data Structures: memoization](https://xlinux.nist.gov/dads/HTML/memoize.html)
