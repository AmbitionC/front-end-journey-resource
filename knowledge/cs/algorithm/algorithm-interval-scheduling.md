区间调度把“时间冲突”抽象为一组区间 `[start, end)`：有时要选出最多互不重叠的会议，有时要计算同时进行的最少会议室。两题都从排序开始，却有不同目标函数；把它们混成一个贪心规则是面试中最常见的失分点。

![区间调度图展示按结束时间选择最多兼容会议，以及通过开始结束事件和最小堆计算峰值重叠数得到最少会议室](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/algorithm-interval-scheduling-v1.svg)
*图：最多参加会议关注“给下一场留下最早空档”；最少会议室关注“任一时刻的最大并发”。*

## 概览：先把题目翻译成目标

设每个会议为 `[s_i, e_i)`，半开区间表示一场在 `10:00` 结束、另一场在 `10:00` 开始时可以复用同一房间。若题目没有明确端点语义，先询问或在答案中声明它；`<=` 与 `<` 会直接改变边界样例结果。

两类基础题：

- **最多参加会议（activity selection）**：选择数量最多的两两兼容区间；
- **最少会议室（meeting rooms II）**：把所有区间分配到最少资源，使同一资源内不重叠。

前者的答案是一组区间，后者的答案是最大同时重叠数。相同输入、不同目标，算法自然不同。

## 核心模型：兼容性与峰值并发

### 最多参加会议：按结束时间最早优先

按 `end` 升序排序，扫描时若 `start >= lastEnd` 就选择该区间并更新 `lastEnd`。复杂度是排序的 `O(n log n)` 加扫描的 `O(n)`。

贪心为何正确：设贪心第一个选择的会议为 `g`，任一最优解的第一个会议为 `o`。因为 `g.end <= o.end`，把 `o` 换为 `g` 不会让后续可选区间减少；因此存在一个同样最优、且以 `g` 开头的解。对剩余兼容区间重复这个交换论证即可。这里不能改用“最早开始”或“最短时长”：它们都可能过早占用关键时间段。

### 最少会议室：峰值重叠就是下界，也是可达值

任何时刻同时进行的 `k` 场会议至少需要 `k` 个房间；反过来，只要把会议按开始时间处理，并把最早结束的房间优先复用，就不会超过这个峰值。因此答案等于最大重叠数。

这体现了区间图的一个特殊性质：冲突区间形成图，所需房间数等于最大团大小；对一般图该等式不必成立，但对区间结构成立。实现上可以使用最小堆，也可以把所有开始和结束时间拆成事件做 sweep line。

## 解题方法：排序、堆与扫描线

### 1. 最多参加会议

```ts
type Interval = readonly [start: number, end: number];

function maxMeetings(intervals: Interval[]) {
  const ordered = [...intervals].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const selected: Interval[] = [];
  let lastEnd = -Infinity;
  for (const item of ordered) {
    if (item[0] >= lastEnd) {
      selected.push(item);
      lastEnd = item[1];
    }
  }
  return selected;
}
```

示例 `[1, 4)、[3, 5)、[0, 6)、[5, 7)、[8, 9)` 中，先结束的 `[1, 4)` 留出了 `[5, 7)` 与 `[8, 9)`，可选三场。若先拿 `[0, 6)`，则会错过可组合的空间。

### 2. 最少会议室：最小堆

按开始时间排序。堆里只放“正在占用房间”的结束时间；对每场会议，先弹出所有 `end <= start` 的结束时间，再压入当前 `end`。扫描过程中的堆最大长度就是答案。虽然堆操作令复杂度为 `O(n log n)`，它还能自然扩展为“输出具体房间编号”。

```ts
function minRooms(intervals: Interval[]) {
  const ordered = [...intervals].sort((a, b) => a[0] - b[0]);
  const minHeap = new MinHeap<number>(); // 提供 peek / push / pop
  let answer = 0;
  for (const [start, end] of ordered) {
    while (minHeap.size && minHeap.peek() <= start) minHeap.pop();
    minHeap.push(end);
    answer = Math.max(answer, minHeap.size);
  }
  return answer;
}
```

### 3. 最少会议室：扫描线

把每个开始记为 `+1`、结束记为 `-1`，按时间排序并累计。端点相等时，半开区间应让结束事件排在开始事件之前，这样 `[1, 2)` 与 `[2, 3)` 不会被算成重叠。扫描线更直接说明“答案是峰值”，且不需要堆；若需要房间分配方案则选择堆。

## 失败边界：何时不能套这个贪心

- **带权区间调度**：目标变成最大总价值而不是最多数量，应按结束时间排序后用二分找前驱，再做动态规划；最早结束贪心不再保证最优。
- **固定数量会议室下选最大价值**：这是另一类资源受限问题，不能简单取峰值。
- **闭区间语义**：若 `[1,2]` 与 `[2,3]` 在 `2` 时冲突，兼容条件改为 `start > lastEnd`，扫描线的同刻排序也要改。
- **时间解析错误**：时区、夏令时和日期字符串排序会让正确算法得到错误输入。应先归一化为同一时基的时间戳。
- **溢出和比较器**：不要用 `a.end - b.end` 处理可能超过安全整数范围的数据；时间值应选择适合语言的 64 位类型或安全比较。

## 面试追问

1. **为什么最多会议按结束时间而不是开始时间？** 用交换论证说明“最早结束不会压缩后续空间”。
2. **最少会议室为什么等于最大重叠？** 最大重叠给下界；最早结束房间复用构造出同样数量，证明上界可达。
3. **如何返回每个会议的房间号？** 堆元素从结束时间扩展为 `{end, roomId}`，另维护可复用 roomId；取出最早结束的可用房间即可。
4. **如果每场会议有价值？** 指出要用 weighted interval scheduling DP，并解释 `p(i)`（第 i 场之前最后一个兼容会议）的二分查找。

## 小结

区间题的第一步不是写堆，而是确认目标：最多数量用最早结束的交换贪心；最少资源用最大重叠，堆和扫描线都是构造方法。把端点、权重和输出要求说清楚，才能判断这道题是否仍属于这两个基础模型。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [蚂蚁 AI 开发一面：协作式 Agent、交付门禁与后端基础（2026 年 8 月）](../../../interview/antfin/ai/antfin-ai-4.md)（cluster-910d0b20a897）
<!-- interview-source-history:end -->

## 参考资料

- [MIT OpenCourseWare：Lecture 1 — Overview, Interval Scheduling](https://www.ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/resources/lecture-1-course-overview-interval-scheduling/)
- [Princeton：Greedy Algorithms — Interval Scheduling / Partitioning](https://www.cs.princeton.edu/~wayne/kleinberg-tardos/pearson/04GreedyAlgorithms-2x2.pdf)
