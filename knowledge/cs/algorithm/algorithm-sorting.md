选择排序算法不能只比较平均时间复杂度。还要问：是否需要稳定、能用多少额外内存、数据是否部分有序、key 是否有界、结果是否全部需要，以及数据能否放进内存。排序是对顺序契约的实现，不是算法名称竞赛。

![稳定与不稳定排序对相等键顺序的影响，以及外部归并排序生成有序 Runs 再多路合并](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/algorithm-sorting-stability-external-merge-v1.webp)
*图：稳定性保留同 key 的原始顺序；外部排序用内存内 runs 和顺序 I/O 处理超内存数据。*

## 比较模型与下界

比较排序只通过“a 是否小于 b”获得信息。[MIT 6.006 资料](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2008/resources/lecture-notes/)用决策树说明，一般比较排序需要区分 n! 种排列，因此最坏至少 Ω(n log n) 次比较。

计数、基数和桶排序能突破这个下界，因为它们利用整数范围、位数或分布等额外假设，不属于纯比较模型。若 key 范围巨大且稀疏，计数数组的空间可能不可接受。

## 常见算法的真实特征

插入排序最坏 O(n²)，但对很小或近乎有序数组常很好，许多混合排序用它处理小分段。归并排序 O(n log n)、易稳定，通常需 O(n) 额外空间。堆排序 O(n log n)、额外空间小，但不稳定且缓存局部性可能较差。

快速排序平均 O(n log n)，原地且局部性好；朴素 pivot 在有序或恶意输入可能 O(n²)。随机化、median-of-three 和 introsort（递归过深切堆排序）控制风险。实际语言标准库常采用 Timsort、introsort 或稳定变体，使用前应查契约而非猜实现。

## 手写插入排序：保持有序前缀

每轮开始时，前缀已按比较器有序；保存下一项，把前缀中严格大于它的项右移，再插入空位。下面返回副本，比较器要求稳定、传递，并对所处理key给出一致顺序。

```javascript
function insertionSort(values, compare = (a, b) => a - b) {
  const output = [...values];
  for (let i = 1; i < output.length; i += 1) {
    const current = output[i];
    let j = i - 1;
    while (j >= 0 && compare(output[j], current) > 0) {
      output[j + 1] = output[j];
      j -= 1;
    }
    output[j + 1] = current;
  }
  return output;
}
```

严格`> 0`使相等key不越过原先同key项，因此该实现稳定。逆序时移动总量为二次量级，最坏O(n²)时间；有序时只做线性次比较。因为示例复制输入，额外空间为O(n)；若直接在输入数组上执行同样插入过程，算法辅助空间才是O(1)，不能混淆。

验证空、单项、全相等、逆序与重复key对象，检查有序性、多重集合保持与相等key的原始顺序。此例仅交付插入排序，不声称已实现原题可能要求的快速、冒泡、归并、选择或桶排序全部算法。

## 稳定性为什么重要

稳定排序保证比较 key 相等的元素保持输入相对顺序。先按姓名稳定排序，再按部门稳定排序，最终同部门内仍按姓名；若第二次不稳定，第一次顺序会被破坏。

也可以一次比较复合 key `(department, name, originalIndex)` 获得确定顺序。分布式系统尤其需要 total tie-breaker，否则不同节点对相等 key 可能输出不同顺序，造成分页重复/遗漏和摘要不稳定。

## Comparator 契约

比较器应满足反对称、传递和一致性。返回随机值、读取不断变化的时间，或对 NaN/locale 处理不一致，会让任何排序算法行为不可预测。不要用 `a - b` 比较可能超出安全整数的值；字符串使用明确 locale 和 normalization。

排序期间不修改 key。若比较昂贵，先 decorate：为每个元素计算一次 sort key，排序后 undecorate，这就是 Schwartzian transform 的思路。

## 部分排序与选择

### 自定义比较器：拼接后的最大数字

先声明教学合同：输入是非空数组，每项为无前导零的非负十进制整数字符串，单独的 `"0"` 合法；输出为字符串，空数组、负数、小数和其他格式拒绝。实际面试没给这些条件时先问清，不能把这里的约定当作原题完整题面。

两个字符串 `a`、`b` 应比较 `a+b` 与 `b+a`，较大拼接排前。例如 `"9"` 在 `"34"` 前，`"3"` 在 `"30"` 前，不能简单按整数大小或字典序排列原字符串。交换一对相邻逆序项会让完整结果不变或变大，因此可以用该比较器排序。对非负整数值 A、B、位数 m、n，关系等价于 `A*(10^n-1) >= B*(10^m-1)`，也就是比较 `A/(10^m-1)` 与 `B/(10^n-1)`，由此可解释其传递性；实现无需计算这些可能很大的数。

```javascript
function largestConcatenation(values) {
  if (!Array.isArray(values) || values.length === 0 ||
      !values.every(v => typeof v === "string" && /^(0|[1-9][0-9]*)$/.test(v))) {
    throw new TypeError("expected nonempty canonical decimal strings");
  }
  const ordered = [...values].sort((a, b) => {
    const ab = a + b, ba = b + a;
    return ab === ba ? 0 : ab > ba ? -1 : 1;
  });
  return ordered[0] === "0" ? "0" : ordered.join("");
}
```

不把拼接转成 Number，避免超出数值精度；复制后排序以保留输入。[Array.sort 的比较器合同](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)约定负数表示 a 在 b 前。比较一次还要付出拼接长度成本，不能把它视为与位数无关的常数；选用 O(n log n) 比较排序时可按最大字符串长度 L 估算 O(n log n·L) 比较工作，并另计输出空间。

检查 `['3','30','34','5','9']` 得到 `9534330`、全零规范为 `0`、`['12','1212']` 的等价比较，以及拒绝空数组、负号和前导零。小输入可以穷举全排列核对最大结果；这只验证此教学合同，不证明某位候选人的现场实现通过。

只需最大 K 个时无需全排序：大小 K 的堆为 O(n log K)；需要第 k 小可用 quickselect，平均 O(n)。数据已按多个 runs 近似有序时，适应性排序能利用结构。先明确输出需求，往往比微调全排序更省。

## 外部归并排序

当数据超出内存，[MIT 6.006 2011 资料](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/pages/lecture-notes/)所涉及的外存思想强调 I/O 成本。External merge sort 分两阶段：读取能放入内存的块、内部排序写成 runs；再用小根堆对多个 run 做 k-way merge，顺序读写。

run 大小受内存和对象开销限制；merge fan-in 受文件句柄和缓冲影响。临时文件带 jobId、校验和和完成标志，失败后清理。若需要稳定，run 内排序和 merge 对相等 key 都使用原始序号作为 tie-break。

## 分布式排序

MapReduce 式 total order 常先采样确定 range partitions，再各分区内部排序。采样不代表真实倾斜时，热点 key 会让单分区拖尾；需要单独处理 heavy hitters 或更细分桶。分区边界和 comparator 版本必须固定，否则重跑结果漂移。

## 验证

测试空、重复、全相等、已升序、逆序、极端数值、NaN、Unicode 和大量相同 key。断言输出非降序、元素多重集合不变；稳定算法还断言相等 key 的原 index 递增。benchmark 使用不同规模与数据形状，并测比较次数、分配、峰值内存和 I/O。

排序选型的结论应是一组条件：在当前 key、稳定性、内存和输入分布下为什么合适，以及条件变化时切换到什么方案。

## 允许重复值的最多可排序块

[LeetCode 768](https://leetcode.com/problems/max-chunks-to-make-sorted-ii/)要求每块独立排序再拼接仍等于全数组排序，并允许重复值。排列版“前缀最大值等于下标”条件不适用于这里。

维护各块最大值的单调栈：新值不小于最后块最大值，可成为新块；否则它与前面块存在跨块逆序，必须向前合并，保留所合并块的最大值。每块进出栈至多一次，时间 O(n)、空间 O(n)。下面是对有限整数数组的教学实现。

```javascript
function maxSortedChunks(values) {
  const maxima = [];
  for (const value of values) {
    if (!maxima.length || value >= maxima[maxima.length-1]) maxima.push(value);
    else {
      const maximum = maxima.pop();
      while (maxima.length && value < maxima[maxima.length-1]) maxima.pop();
      maxima.push(maximum);
    }
  }
  return maxima.length;
}
```

例如包含重复值时，相等边界可以分开；降序数组只能合成一块。可用穷举所有切分、逐块排序并与整体排序比较的小输入校验，避免只测排列样例。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [阿里云 SRE 运维开发一面：部署、网络与最大拼接数](../../../interview/alibaba/ai/alibaba-ai-20.md)
- [字节 Agent 实习：生成质量、多智能体与缓存](../../../interview/bytedance/base/bytedance-base-52.md)
- [网易云音乐全栈一面：JavaScript、排序与 RAG](../../../interview/netease/fullstack/netease-fullstack-2.md)
- [58同城 Agent 开发一面：MCP、数据查询与后端基础](../../../interview/58tongcheng/ai/58tongcheng-ai-1.md)
<!-- interview-source-history:end -->

## 参考资料

- [MIT OCW 6.006（2008）：Lecture Notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2008/resources/lecture-notes/)
- [MIT OCW 6.006（2011）：Lecture Notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/pages/lecture-notes/)
- [MDN — Array.sort 比较器与原地排序](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
