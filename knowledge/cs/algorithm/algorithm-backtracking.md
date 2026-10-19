回溯是对决策树的深度优先搜索：选择一个候选，更新状态；若部分解已经违反约束，就剪掉整棵子树；否则继续，完成后撤销选择。它不会消除组合爆炸，但把约束尽早应用、把更可能失败的选择提前，可以让实际搜索量下降几个数量级。

![回溯决策树中的选择、约束检查、剪枝、得到解与撤销状态](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/algorithm-backtracking-decision-tree-pruning-v1.webp)
*图：每个可行完整解对应一条根到叶路径；剪枝只能删除已证明不可能产生合法或更优解的分支。*

## 通用框架

回溯状态包含当前部分解、剩余选择和约束所需辅助信息。经典模板：

```text
search(state):
  if complete(state): record answer; return
  choose next variable
  for value in ordered candidates:
    if violates constraint: continue
    apply(value)
    search(state)
    undo(value)
```

[Berkeley CS188 CSP 求解资料](https://inst.eecs.berkeley.edu/~cs188/textbook/csp/solving.html)将回溯用于约束满足问题。正确性来自：枚举每个可行选择且不重复；剪枝只排除不可能扩展成解的部分状态。

## 状态、选择与撤销

N 皇后中第 row 行是变量，column 是值；状态维护已占用列、主对角线 `row-col` 和副对角线 `row+col`。选择时把三个集合加入，返回后删除。约束检查 O(1)，比每次扫描棋盘更高效。

撤销必须与 apply 完全对称。若状态含计数而非布尔值，undo 应减一，不能直接删除；若保存数组长度，可记录 checkpoint 后截断。另一种方式是每层复制不可变状态，正确性简单但分配成本高。

## 剪枝的层次

可行性剪枝：当前已违反约束，例如皇后冲突。Bound 剪枝：即使剩余都取理论最好，也不可能超过当前最优，用于 branch-and-bound。重复状态剪枝：不同路径到达同一子问题时 memoize，但状态 key 必须包含影响未来的全部信息。

剪枝条件必须可证明。根据经验“这条看起来不好”直接丢弃会漏解；启发式只能改变探索顺序，除非有可靠 bound。

## 选择顺序与约束传播

在 CSP 中，MRV（minimum remaining values）先选合法值最少的变量，让矛盾尽早暴露；degree heuristic 在并列时选约束其他变量最多者；least-constraining value 先尝试对邻居限制最少的值。[AIMA 资源](https://aima.cs.berkeley.edu/)系统讨论搜索与约束问题。

forward checking 在赋值后删除邻居不可能的 domain；arc consistency 进一步传播。它们增加每节点工作，但减少分支数。最坏复杂度仍可能指数级，实际性能取决于分支因子、深度和剪枝强度。

## 排列、组合与去重

生成排列时用 `used[i]`，同一层对排序后相同值跳过，条件通常是 `i>0 && nums[i]===nums[i-1] && !used[i-1]`。生成组合时传 start index，下一层只看后续元素，自然避免顺序重复。

去重条件所在“层”很重要：同一树层去重避免选择同值作为同一位置；同一路径仍可能使用不同下标的相同值。把条件写错会漏合法答案。

## 找一个、找全部与优化

找任意解可在第一次成功后短路；找全部必须继续；求最优维护 incumbent 与 bound。接口应显式说明模式，并支持 maxSolutions、deadline 或 cancellation。组合空间巨大时，不能无界累积全部答案，可使用迭代器逐个产出。

递归深度可能超栈，显式 stack 保存 next candidate 和 undo 信息可替代。长期搜索保存 checkpoint 时，需记录决策路径、候选顺序版本和当前最优，保证恢复语义一致。

## 用给定数字构造上界以内最大数

先确认数字是否允许重复、是否可使用较少位数、0与前导零、严格小于还是不大于。以下只讲“十进制数字可重复、允许更短、除0本身外禁止前导零”的明确模型，不把这些条件补成所有来源的原题事实。

先把严格`< n`转换成`≤ n-1`。按位数从长到短尝试；同位数时维护是否仍与上界前缀相等，高位从大到小选择合法数字。前缀一旦更小，后缀就可取较大的数字；若保持相等走不通，回退上一个选择。先尝试较长位数和较大高位，使第一个完整合法结果就是最大数。

```javascript
function maxDigitsAtMost(n, digits, { strict = false } = {}) {
  if (typeof n !== 'bigint') throw new TypeError('n must be BigInt');
  if (!Array.isArray(digits) || !Array.from(digits).every(d => Number.isInteger(d) && d >= 0 && d <= 9)) {
    throw new TypeError('digits must be decimal digits');
  }
  const upper = n - (strict ? 1n : 0n);
  if (upper < 0n) return null;
  const choices = [...new Set(digits)].sort((a, b) => b - a);
  if (!choices.length) return null;
  const bound = upper.toString();
  for (let length = bound.length; length >= 1; length -= 1) {
    const path = [];
    const failed = new Set();
    function search(index, tight) {
      if (index === length) return true;
      const state = `${index}:${tight}`;
      if (failed.has(state)) return false;
      const limit = tight ? Number(bound[index]) : 9;
      for (const digit of choices) {
        if (digit > limit || (index === 0 && length > 1 && digit === 0)) continue;
        path.push(digit);
        if (search(index + 1, tight && digit === limit)) return true;
        path.pop();
      }
      failed.add(state);
      return false;
    }
    if (search(0, length === bound.length)) return path.join('');
  }
  return null;
}
```

例如`n=23121n`、数字`[2,4,9]`且严格小于，得到字符串`"22999"`。数字`[1,2]`、上界`12n`时，不大于可返回`"12"`，严格小于只能返回`"11"`；仅数字0、上界0时，不大于有解`"0"`，严格小于无解`null`。输出字符串避免大整数转Number丢精度。

在同一次位数尝试中，后续合法性只由位置和tight决定，才能记忆失败状态；若加上每个数字使用次数限制，就必须把剩余次数纳入状态。设上界L位、不同数字D个，各位数尝试的宽松总上界为O(L²D)，单次搜索的辅助状态和递归深度O(L)；超长输入需改显式栈或迭代实现以免递归溢出。用小上界和数字子集枚举所有合法整数对拍，而不是只验一个示例。

## 何时换算法

若子问题大量重叠，动态规划通常更合适；若只要最短层数，用 BFS；约束问题可交给 SAT/SMT/ILP；近似优化可用贪心、局部搜索或随机算法。回溯适合空间可控、约束能强剪枝或需要精确枚举的场景。

## 验证

小规模用 brute force 对比解集合，检查无重复、每解满足约束、已知解数一致。记录 visited nodes、pruned nodes、最大深度和分支分布，比较启发式效果。对 cancellation、解上限、重复输入和 undo 异常做测试。

写好回溯的关键是把“生成选择、验证约束、修改状态、撤销状态”分开，使每个剪枝都有可解释的正确性理由。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节一面：线程池、分布式锁与数字构造](../../../interview/bytedance/base/bytedance-base-58.md)
- [字节飞书 AI 应用一面：Runtime、评测与后端基础](../../../interview/bytedance/base/bytedance-base-24.md)
- [字节 Agent 开发一面：评分、Harness 与任务可靠性](../../../interview/bytedance/base/bytedance-base-57.md)
<!-- interview-source-history:end -->

## 参考资料

- [UC Berkeley CS188：Solving Constraint Satisfaction Problems](https://inst.eecs.berkeley.edu/~cs188/textbook/csp/solving.html)
- [Artificial Intelligence: A Modern Approach](https://aima.cs.berkeley.edu/)
