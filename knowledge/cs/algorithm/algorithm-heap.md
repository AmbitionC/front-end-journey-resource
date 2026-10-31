二叉堆在完全二叉树的形状上维持局部堆序：最小堆保证父节点不大于子节点，最大堆相反；堆内元素不保证整体有序。这个不变量让极值始终位于根，并支持对数时间插入和删除，因此适合优先队列、调度和流式 Top-K；它不适合按任意键快速查找。

<iframe
  src="https://www.agent-journey.cn/archify/minheap-operations-largest-topk.html"
  title="最小堆上浮、下沉与流式最大 Top-K"
></iframe>

*图：0-based 二叉最小堆，节点标为“索引:值”，数组按层序存放。插入 1 沿父链上浮；删除 1 后以末项补根，再与较小子交换下沉。灰色快照是待修复状态。底部用恰好 5 项的最小堆保留已见数据中最大的 5 个值（按出现次数计），根是入选阈值；堆内数组并非有序输出。*

[旧配图勘误存档](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/algorithm-heap-top-k-priority-v1.webp)：旧图含上浮/下沉数值及 K=5 节点数量错误，保留链接供核对；本页教学以当前图和正文为准。

## 数组表示与不变量

二叉堆是一棵完全二叉树，除最后一层外全部填满，最后一层的节点从左到右排列。因此无需指针即可存在数组。0-based 索引下：

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

对 n 个可比较值，若 2≤K≤n，求最大的 K 个元素（按出现次数计）可维护大小至多 K 的最小堆：先填充至 K 项，根是当前 Top-K 的最小边界。之后新元素不大于根可保留原堆；更大则替换根并下沉。扫描时间 O(n log K)，附加空间 O(K)，不需保存全量。K=1 时一次线性扫描求最大值；K≤0、K>n 和非法输入按调用合同处理。求最小 K 个则使用最大堆。

如果还要按最终大小排序，结束后对堆内容排序，或连续 pop。堆内数组本身不是有序 Top-K，直接输出会得到错误顺序。

## 多个升序数组：每路只保留当前头

设有 N 路已经按同一比较规则升序排列的输入，总元素数为 L，起初非空的路数为 C。每个堆条目保存 `(当前值, 路编号, 路内位置)`；**不变量是每条尚未耗尽的输入恰有一个条目，且它是该路尚未输出的第一个值**。因为每路后面的值都不小于当前头，所有未输出值的最小者必在这些头中，堆根就是下一项。

初始化时收集各非空路的首项，线性 `heapify`。每次输出堆根，只从该根所属的路推进一项并修复堆；该路耗尽就移除条目。重复值照常输出，不能因键相同就去重；若对象需要确定的同值顺序，可用路编号和路内位置作 tie-break，并明确这不是不同输入之间天然共有的时间顺序。[Python 3.13 `heapq.merge`](https://docs.python.org/3.13/library/heapq.html#heapq.merge)要求各输入预先有序并惰性输出；其[维护者实现](https://github.com/python/cpython/blob/3.13/Lib/heapq.py)也只保存各路当前头，采用建堆、替换根和移除耗尽路的过程。

按常数时间读取下一项、比较和输出计，扫描 N 路并建堆后，总时间可写为 `O(N + L log(C+1))`，辅助堆空间 `O(C)`；若收集完整结果，输出另占 `O(L)`。当 N≥2、每路恰有 M 项时，L=NM，得到 `O(N + NM log N)` 的上界。若初始化逐项 push，建堆项变为 `O(C log C)`，不能仍声称线性建堆。N=0 或全部为空时输出为空；只有一路非空时可直接顺序输出，时间仍含这 L 项，不能因 `log 1=0` 把输出成本抹掉。

将 L 项全部放入堆再逐个取出，通常要 `O(L log L)` 时间和 `O(L)` 辅助空间，没有利用“每路已排序”的条件。教学例子 `[1,4]`、空路、`[1,3]` 的归并结果为 `[1,1,3,4]`：取出一路的 1 后只补该路的 4，另一条 1 仍留在堆中。这里说明的是多路归并机制，不是某道来源面试题未披露的接口或返回格式。

## K 个有序链表的中位数：归并到中间即可

前面的“每路一个当前头”也适用于链表：弹出某路当前节点后，把它的 `next` 加入堆，不需要随机下标访问。先明确合同：各链表有限、无环，按同一规则升序；重复值分别计数，不修改输入。总节点数为 L，非空链表数为 C，K 还包括空链表。

若 L 未提供，先遍历计数；总数为零时中位数未定义，应按接口约定返回空结果或报错。0 基下，中间位置为 `floor((L-1)/2)` 和 `floor(L/2)`。初始化各非空头节点的最小堆，按归并顺序输出到后一个位置，保留这两个位置的值即可：奇数时同一位置，偶数时按题目规定取两值平均或分别返回。

[Python `heapq.merge` 的官方合同](https://docs.python.org/3.13/library/heapq.html#heapq.merge)要求输入各自有序，并惰性产生归并结果；将链表封装成按 `next` 推进的迭代器，可以采用同样的当前头不变量。这里是算法说明，不假设面试指定 Python 或某个库。

例如 `[-3,2]`、空链表、`[-1,4]` 归并为 `[-3,-1,2,4]`，数值中位数为 0.5。无须构造完整合并链表或数组。扫描 K 个头、线性建堆、必要的 L 项计数和约一半归并，总时间上界为 $O(K+L+L\log(C+1))$，辅助堆空间 $O(C)$；若长度已可靠提供，可以省去计数遍历，仍不能把“只取一半”说成从线性降到对数。只有一路非空时也有读到中间的线性成本。

更快方法必须说明额外条件。有序数组的随机访问、已知值域或预建顺序统计索引可能改变选择算法，但原始单链表没有 $O(1)$ 下标跳转。题面未给这些能力时，不承诺通用的次线性精确方案；偶数求平均还需核对数值溢出和精度。

## 十亿条 URL：先在外存精确计数，再选 Top-100

“十亿条 URL、内存 1 GB、求出现次数最多的 100 个 URL”需要先按 URL 聚合。大小为 100 的堆只能保存已经得到准确频次的候选，不能代替全局计数；不同 URL 的数量、字符串长度和哈希表开销未知时，不能承诺把所有键放进 1 GB。

先约定允许使用外部存储，并明确输入编码、记录边界和 URL 相等规则。例如按完整 UTF-8 字节相等计数时，不能擅自把大小写、转义形式或查询参数不同的记录合并。内存预算还要覆盖读写缓冲、键、计数器、哈希表和堆，不能只计算原始字符串大小；单条记录也要符合可处理长度的约定。

有两条精确路径：[CMU 数据库课程的外部排序与聚合笔记](https://15445.courses.cs.cmu.edu/fall2022/notes/10-sorting.pdf)介绍了排序后顺序聚合，以及哈希分区后逐分区聚合；后者要求正在处理的分区确实能放进内存。

1. **哈希分区**：扫描输入，用稳定分区函数把相同 URL 写入同一磁盘分区。分区内以完整 URL 为键累加频次，哈希值只负责定位，不能把哈希碰撞的不同 URL 当成同一个键。得到某个 URL 的完整计数后，再送入全局 Top-100 堆。
2. **外部排序**：分块生成有序磁盘段，再按完整 URL 做多路归并；相同 URL 在归并流中相邻，便可顺序累加，遇到下一个 URL 时输出一条 `(URL, count)`，随即更新 Top-100 堆。[排序聚合的原始研究](https://arxiv.org/abs/2010.00152)也区分了有序输入上的流式聚合与需要临时分区的哈希聚合。

哈希分区的数量不能凭“平均每桶大小”确定。倾斜输入、碰撞或大量不同键可能使某分区的聚合状态超预算；要检查实际内存占用，再递归分区，或改用外部排序。若继续分区不能有效缩小问题，应终止这种尝试并走排序等有界路径。外部排序不依赖哈希分布均匀，但仍需给每段、归并路数和缓冲设置上限；超长单条记录也需要专门支持或明确拒绝，不能假装普通内存排序自动解决。

聚合结束的每个 URL 只提交一次完整频次。堆最多保留 100 项，根是入选者中最差的一项：频次较低者更差，同频时按预先约定的规则比较。例如同频时取 URL 字节序较小者，根在同频候选中应是字节序最大的那一项。新候选更好才替换根；最后按相同规则排序输出。计数器采用足够宽的整数并检查溢出，不能用会丢失整数精度的数值类型默默累加。

```text
完整 URL 记录
  → 外部排序并归并 / 经内存检查的磁盘分区聚合
  → 每个 URL 的精确总次数
  → 大小至多 100 的候选堆
  → 明确同频规则的有序结果
```

这里的堆选择阶段是对不同 URL 数量 U 做 `O(U log 100)` 工作、保存至多 100 个候选；外部聚合另有磁盘与内存成本。近似重频方法有自己的误差条件，不能把它们的结果直接称为这道题的精确答案。验证时应覆盖哈希碰撞、分区倾斜、全不同键、重复键、同频和超长记录边界，而不只是均匀随机数据。

## 实时商品排行榜不是独立记录的 Top-K

排行榜按商品 ID 聚合，每次销量变化要更新同一个条目，不能把同一商品的多个历史分数当多个候选。只增不减时可维护总量映射与索引堆；交换时同步 id 到位置，更新堆内商品后修复堆序。若允许退货扣减，某个 Top-K 成员下降后可能被堆外商品替代，仅保存 K 个候选不足以恢复精确全局结果，应维护全量有序索引或可查询的候选结构。

[Redis Sorted Set 的 ZADD](https://redis.io/docs/latest/commands/zadd/)可更新同一 member 的 score；排序还须定义同销量的稳定顺序。分片榜单要明确聚合时间和版本，销量分散到多个分片时不能只把局部候选直接合并就称全局精确。

## 优先调度的现实语义

调度器把 deadline、优先级或 nextRunAt 作为 key。更新优先级需要 decrease/increase-key，任务取消需要索引或惰性墓碑。多 worker 并发时，内存堆不提供持久性和租约；应把权威任务状态放在数据库/队列，堆作为单节点可重建索引。

优先级还会导致饥饿，可加入 aging：等待越久有效优先级越高。比较器必须形成一致的全序，否则浮点 NaN、随时间变化的 comparator 会破坏堆不变量。

## 与其他结构比较

若需要全部排序，一次 `O(n log n)` sort 更直接；若反复取极值，堆更合适；若同时需要最小和最大，可用双端优先队列或两堆；若查询任意 rank，平衡树或 order-statistic tree 更适合。

测试空堆、单元素、重复优先级、升降序输入、随机 push/pop，并在每次操作后验证所有父子关系。再把连续 pop 与完整排序结果比较。真正理解堆，就是能从两个不变量——完全树形状与父子顺序——推导每个操作和复杂度。

还应做属性测试：任意输入 heapify 后，连续 pop 必须等于同一 comparator 的排序结果；任意时刻 `size` 等于数组长度；索引表模式下每个 id 都指向真实位置。对 comparator 抛错、重复 id 和优先级更新不存在节点定义清晰失败语义，避免结构只坏一半。

## 二维接雨水：从最低可逃逸边界向内扩展

[LeetCode 407](https://leetcode.com/problems/trapping-rain-water-ii/)输入二维高度网格，求格子上方水的体积，不是一维双指针题。一个内部格子的水位由通向外界路径上的最低可行瓶颈决定，不能只看四个最近邻的最大高度。

把所有边界格放入最小堆，堆中高度表示当前有效边界。每次弹出最低边界 h，访问尚未入队的邻格 v：新增水量为 max(0,h−v)，随后以 max(h,v) 作为新边界入堆。入队时标记，避免从不同方向重复计水。矩形非负有限高度输入下，总时间 O(mn log(mn))、空间 O(mn)。

```javascript
class CellMinHeap {
  data = [];
  push(cell) {
    const a = this.data; a.push(cell);
    for (let i = a.length - 1; i > 0;) {
      const p = Math.floor((i - 1) / 2);
      if (a[p][0] <= a[i][0]) break;
      [a[p], a[i]] = [a[i], a[p]]; i = p;
    }
  }
  pop() {
    const a = this.data;
    if (!a.length) return undefined;
    const root = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      for (let i = 0;;) {
        let j = i, l = 2 * i + 1, r = l + 1;
        if (l < a.length && a[l][0] < a[j][0]) j = l;
        if (r < a.length && a[r][0] < a[j][0]) j = r;
        if (j === i) break;
        [a[i], a[j]] = [a[j], a[i]]; i = j;
      }
    }
    return root;
  }
}
function trapRainGrid(grid) {
  const m = grid.length, n = grid[0]?.length ?? 0;
  if (m < 3 || n < 3) return 0;
  const seen = Array.from({length:m}, () => Array(n).fill(false));
  const heap = new CellMinHeap();
  function add(r,c,h) { seen[r][c] = true; heap.push([h,r,c]); }
  for (let r=0; r<m; r++) for (let c=0; c<n; c++) {
    if (r===0 || r===m-1 || c===0 || c===n-1) add(r,c,grid[r][c]);
  }
  let total = 0;
  while (heap.data.length) {
    const [h,r,c] = heap.pop();
    for (const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nr=r+dr, nc=c+dc;
      if (nr<0 || nr>=m || nc<0 || nc>=n || seen[nr][nc]) continue;
      total += Math.max(0,h-grid[nr][nc]);
      add(nr,nc,Math.max(h,grid[nr][nc]));
    }
  }
  return total;
}
```

例如外圈高度 3、中心高度 0 的 3×3 网格可存 3 单位水；若外圈存在通向中心的低缺口，则水位下降。测试低缺口与非矩形非法数据的契约，不能把示例的输入假设默默扩展到任意对象。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 AI 全栈实习一面：多 Agent 编排与海量 URL Top-K](../../../interview/bytedance/base/bytedance-base-68.md)
- [快手春招多轮面经：信号量、Top-K 与实验分流](../../../interview/kuaishou/ai/kuaishou-ai-13.md)
- [腾讯营销后端一面：Skill 加载、上下文压缩与多路归并](../../../interview/tencent/ai/tencent-ai-21.md)
- [阿里淘天 AI 应用研发一面：RAG、限流 Top-K 与优惠策略](../../../interview/alibaba/ai/alibaba-ai-5.md)
- [百度 AI 测开一面：LLM 评测、压测与有序链表](../../../interview/baidu/ai/baidu-ai-13.md)
- [字节 Agent：任务取消、Spring 配置与并发执行](../../../interview/bytedance/base/bytedance-base-45.md)
- [字节搜广推引擎架构一面：JSON 输出、并发与系统基础](../../../interview/bytedance/base/bytedance-base-74.md)
<!-- interview-source-history:end -->

## 参考资料

- [MIT OCW 6.006：Lecture Notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2008/resources/lecture-notes/)
