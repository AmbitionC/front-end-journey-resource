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

## 前缀状态：只含 ? 和 * 的通配匹配

先限定语法：`?` 匹配一个字符，`*` 匹配零个或多个字符，其余字符逐字相等；这是通配匹配，不是正则。Python `fnmatch` 文档提供这两种符号的语义，本文只采用这个子集，不实现其方括号模式或平台大小写规则。[Python：通配符语义](https://docs.python.org/3/library/fnmatch.html)。

令 `dp[i][j]` 表示输入前 i 个字符能否被模式前 j 个字符完全匹配。普通字符或 `?` 消耗双方一个字符，依赖左上角；`*` 要么匹配空串（左侧状态），要么继续消费一个输入字符（上侧状态）。空输入只匹配全部由 `*` 组成的模式前缀。

```javascript
function wildcardMatch(text, pattern) {
  const s = Array.from(text), p = Array.from(pattern);
  const dp = Array.from({ length: s.length + 1 }, () => Array(p.length + 1).fill(false));
  dp[0][0] = true;
  for (let j = 1; j <= p.length; j++) dp[0][j] = p[j - 1] === '*' && dp[0][j - 1];
  for (let i = 1; i <= s.length; i++) {
    for (let j = 1; j <= p.length; j++) {
      dp[i][j] = p[j - 1] === '*'
        ? dp[i][j - 1] || dp[i - 1][j]
        : (p[j - 1] === '?' || p[j - 1] === s[i - 1]) && dp[i - 1][j - 1];
    }
  }
  return dp[s.length][p.length];
}
```

时间和表空间 O(nm)。示例按 Unicode code point 处理，“一个字符”不等于用户感知的字形簇；空串、连续星号和模式比输入长都要测试。自顶向下缓存同样的 `(i,j)` 状态也能避免重复搜索，区别是求值顺序而非匹配语义。

## 后缀状态与路径恢复：keep、delete、add

把旧行数组变成新行数组，若只允许保留相同行、删除旧行和添加新行，并最小化新增与删除总数，可以寻找最长公共子序列（LCS）作为保留骨架。子序列要求相对顺序一致，不要求连续；它与最长公共子串不同。[NIST：最长公共子序列](https://xlinux.nist.gov/dads/HTML/longestCommonSubsequence.html)。

令 `dp[i][j]` 为旧数组从 i 开始与新数组从 j 开始的 LCS 长度。行相同时可以保留，值为 `1+dp[i+1][j+1]`；不同时选择跳过旧行或新行的较大者。沿这些选择恢复路径，就能输出操作，而不只是一个长度。

```javascript
function diffLines(oldLines, newLines) {
  const n = oldLines.length, m = newLines.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = oldLines[i] === newLines[j]
        ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const operations = [];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && oldLines[i] === newLines[j]) {
      operations.push({ type: 'keep', line: oldLines[i++] }); j++;
    } else if (j === m || (i < n && dp[i + 1][j] >= dp[i][j + 1])) {
      operations.push({ type: 'delete', line: oldLines[i++] });
    } else operations.push({ type: 'add', line: newLines[j++] });
  }
  return operations;
}
```

每次 keep 同时消费双方相同行，delete 只消费旧行，add 只消费新行；执行后的输出必须恰好等于新数组。最少新增与删除数为 `n+m-2*dp[0][0]`。若允许替换、移动或不同权重，就变成另一份优化契约。二维表时间、空间均为 O(nm)，输出路径另占 O(n+m)；重复行可产生多个同样最优的路径，示例固定在平局时先删除，避免把唯一输出当成正确性要求。
## 测试清单

- base case、最小非 base case 与非法输入；
- 规模度量是否每步严格下降；
- 无解、唯一解、多解以及结果是否重复；
- 回溯撤销后状态是否完全恢复；
- 剪枝前后小规模结果集合一致；
- memo key 是否包含所有结果依赖；
- 最大深度、最大状态数与内存预算。

## 目标和：先定义题目，再选计数状态

只有“目标和”题名时，不能推断完整输入输出。以下是明确标注的教学契约：对数组每一项都选择正号或负号，计数表达式和等于 target 的方案；空数组对 target=0 有一种空方案。若实际题目要求选子集、输出路径或输入含其他约束，应重新建模。

```javascript
function countTargetSigns(nums, target) {
  if (!Array.isArray(nums) || !Number.isSafeInteger(target) ||
      nums.some(value => !Number.isSafeInteger(value))) {
    throw new TypeError('Expected safe integers');
  }
  let counts = new Map([[0, 1n]]);
  for (const value of nums) {
    const next = new Map();
    for (const [sum, ways] of counts) {
      for (const total of [sum + value, sum - value]) {
        if (!Number.isSafeInteger(total)) throw new RangeError('Unsafe sum');
        next.set(total, (next.get(total) ?? 0n) + ways);
      }
    }
    counts = next;
  }
  return counts.get(target) ?? 0n;
}
```

状态保留“处理到当前项后，各个和有几种方案”，上一层的每种方案分别延伸正、负分支；滚动 Map 不会把同一元素反复使用。0 的两个符号在此契约中是两种选择，所以 `[0,0]`、target=0 得 4n。计数用 BigInt，但和仍用 Number，输入与中间和必须保持安全整数；极大和值需要另换表示或拒绝，不能靠 BigInt 计数解决和值精度。

若每项非负且总和为 S，正号集合之和 P 满足 `2P=S+target`；右侧为负、超过 2S 或奇数时无解，否则可转为子集计数。DFS加记忆化并非错误方法，关键是状态 `(index,sum)`、计数语义和约束；不能仅因题目叫 DP 就断言搜索一定错。Map 状态数在最坏情况下仍可能指数增长，应根据实际值域选择数组 DP 或其他方法。

## 100 扇门：先写模拟，再证明因数奇偶

第 r 轮切换 r 的倍数，因此第 k 扇门被切换的次数等于 k 的正因数数量。非平方数的因数可配成不同的 a 与 k/a；平方数只有平方根不与另一个不同因数配对。因此只有平方数被切换奇数次，初始关闭时最终打开。

这段证明是依据题目规则推导的教学解释，不是模型扩展出来的面试原题。100 门的答案为 1、4、9、16、25、36、49、64、81、100。下面独立模拟可验证该有限输入，并推广检查更多 n；证明说明为什么结果成立，模拟本身不能证明所有 n。

```javascript
function simulateDoors(n) {
  if (!Number.isInteger(n) || n < 0) throw new RangeError('Invalid door count');
  const open = Array(n + 1).fill(false);
  for (let round=1; round<=n; round++) {
    for (let k=round; k<=n; k+=round) open[k] = !open[k];
  }
  return open.flatMap((isOpen,k) => isOpen ? [k] : []);
}
```

按完全平方数直接列结果只需 O(√n) 次输出；模拟约有 n∑(1/r) 次切换。两者回答同一题，但前者利用结构，后者保留直观校验。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [阿里云 Agent Infra 一面：SGX、吞吐与日志写入（2026 年 9 月发帖）](../../../interview/alibaba/ai/alibaba-ai-8.md)
- [字节 Managed Agent 校招一面：评测、运行链路与后端基础（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-26.md)
- [字节 Agent 开发一面：上下文工程、协作与编程基础（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-19.md)
- [字节抖音电商 Agent 一面：分层、上下文与 GRPO（2026 年 9 月发帖）](../../../interview/bytedance/base/bytedance-base-21.md)
- [字节全栈二、三面：幂等、索引与字符串匹配](../../../interview/bytedance/base/bytedance-base-32.md)
- [字节财经保险 AI 全栈实习一面：项目设计、AI Coding 与 Diff](../../../interview/bytedance/base/bytedance-base-34.md)
- [字节全栈一面：RAG、Java与线程池](../../../interview/bytedance/base/bytedance-base-37.md)
- [字节全栈：多智能体导购、客户端与系统评测](../../../interview/bytedance/base/bytedance-base-43.md)
<!-- interview-source-history:end -->

## 参考资料

- [NIST Dictionary of Algorithms and Data Structures: recursion](https://xlinux.nist.gov/dads/HTML/recursion.html)
- [NIST Dictionary of Algorithms and Data Structures: backtracking](https://xlinux.nist.gov/dads/HTML/backtrack.html)
- [NIST Dictionary of Algorithms and Data Structures: memoization](https://xlinux.nist.gov/dads/HTML/memoize.html)
