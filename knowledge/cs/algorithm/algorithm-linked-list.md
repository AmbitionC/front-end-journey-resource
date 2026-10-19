链表把顺序编码在节点引用中，而不是连续内存位置。双链表在已知节点时，局部插入和删除只需改常数个指针，但按下标访问必须从头走。它最有价值的场景不是替代所有数组，而是需要稳定节点身份和频繁局部重连，例如 LRU 的访问顺序。

<iframe
  src="https://www.agent-journey.cn/archify/lru-map-doubly-linked-list.html"
  title="LRU：同 key 定位、双向重连与淘汰"
></iframe>

*图：四个 Map 条目分别定位同 key 节点，head/tail 哨兵不计容量；容量为 4 的教学示例中，get(30) 只移动该节点，再 put(50,E) 淘汰 40 并同步更新 Map。哈希定位平均 O(1)，已知双链表节点的局部重连为 O(1)；图只展示单机结构，不表示全局分布式顺序。*

[旧配图勘误存档](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/algorithm-linked-list-lru-operations-v1.webp)：旧图的 Map 连线没有保持 key 与节点身份一致，且未画出图注所称哨兵；保留链接供核对，不能继续作为正确关系图使用。

## 单链表与双链表

单链表节点包含 value 和 next，适合从头顺序扫描、头插。双链表再保存 prev，已知节点时可以 O(1) 删除；代价是更多内存和需要同时维护两向一致性。

[MIT 6.006 资料](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/pages/lecture-notes/)涵盖链表等基本数据结构。关键限定是“已知节点”：若只有值，仍需 O(n) 搜索；若只有单链表当前节点，没有前驱，也不能 O(1) 常规删除它。

## 指针重连的不变量

双链表删除 x：

```text
x.prev.next = x.next
x.next.prev = x.prev
```

插入 x 到 a、b 之间：

```text
x.prev = a
x.next = b
a.next = x
b.prev = x
```

更新顺序要避免中间状态丢失引用，实际代码先保存相邻节点，再统一重连。插入前确认 x 不在别的链表，删除后可清空 prev/next，帮助发现重复删除。

## 哨兵消除边界分支

使用不承载业务值的 head 和 tail sentinel，空表始终满足 `head.next === tail` 与 `tail.prev === head`。真实节点永远插在两者之间，删除首尾与删除中间使用同一代码，不需反复判断 null。

```js
function remove(node) {
  node.prev.next = node.next;
  node.next.prev = node.prev;
}

function insertAfter(head, node) {
  node.prev = head;
  node.next = head.next;
  head.next.prev = node;
  head.next = node;
}
```

哨兵不是免费魔法：size 只统计真实节点，遍历到 tail 停止，不能把哨兵暴露给调用方。

## 反转、环与双指针

反转单链表需要同时保存 `next`，再把当前节点指向 previous；若先覆盖 next 而未保存，剩余链条会丢失。时间 O(n)、额外空间 O(1)。

Floyd 快慢指针先判环，再定位入口。比较的是节点对象身份，值相同不算相遇。输入是有限条节点引用形成的链表，head 与末尾 next 可为 null；算法只读引用，不改节点。[LeetCode 142 的独立教学规格](https://leetcode.com/problems/linked-list-cycle-ii/)可用于核对返回入口、无环返回 null 的合同，不把该题号当作面经原帖事实。

```javascript
function detectCycle(head) {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    // 先移动再比较，避免把起点初始重合误判为有环。
    if (slow === fast) {
      let fromHead = head;
      while (fromHead !== slow) {
        fromHead = fromHead.next;
        slow = slow.next;
      }
      return fromHead;
    }
  }
  return null;
}
```

第一阶段中，fast 每轮走两步、slow 一步；fast 或 fast.next 为空时无环。有环且两者都进入环后，相对位置每轮改变一（模环长），所以会相遇。

用 mu 表示头到环入口的边数，用 lambda 表示环长。首次相遇时，slow 已走 t 步（t > 0），相遇点沿环前进方向距入口 x 条边，其中 0 <= x < lambda。fast 同时走了 2t 步，比 slow 多走的 t 步必须是完整的若干圈，所以 t = k * lambda（k 为正整数）。slow 从入口走到相遇点的步数是 t - mu；去掉完整圈后剩下 x，因此 mu + x 也是 lambda 的整数倍。

把一个指针重置到头，再让两个指针都每次走一步。各走 mu 步后，从头出发的指针到达入口；环内指针从位置 x 再走 mu 步，也恰好绕回入口。此前从头出发的指针仍在环外，所以两者不能提前相遇。这就是重置后同速前进可以找到入口的步数依据。

例如 mu = 2、lambda = 3：首次在 t = 3 步时相遇，环内位置 x = 1。重置后各走两步，x + mu = 3，恰好回到入口。若 mu = 0，重置时两个指针已经都在入口。空表、单节点无环、自环、入口在头和重复节点值都遵循同一合同。时间复杂度为 O(mu + lambda)，无环时为 O(n)；额外空间为 O(1)。生产中若环表示结构损坏，另行诊断的遍历仍应设置步数或资源预算，防止无界运行。

### 删除倒数第 k 个节点：固定间距不等于 Floyd 判环

本例采用明确的教学约定：输入是无环单链表，节点包含 value、next，末尾 next 为 null；允许重连原节点。k 从 1 开始，合法范围为 1 到链表长度。示例对空表或非法 k 抛出 RangeError。这些约定是为了给出可执行合同，不能说成原帖提供的条件或作者已完成的实现。

先增加一个 next 指向原头节点的哑节点，让快、慢指针都指向它。快指针先走 k+1 步，再让两者同速前进，直到快指针为 null。此时慢指针停在待删节点的前驱，绕过其 next 即可；返回哑节点的 next，也就统一处理了删除头节点的情况。

为什么是 k+1？把哑节点编号为0，真实节点编号为1到n，末尾 null 的位置记为n+1。快指针到n+1时，慢指针的位置是(n+1)-(k+1)=n-k；要删的倒数第k个节点编号为n-k+1，恰好是慢指针的后继。这是位置不变量，与“走一快一慢找到环”的 Floyd 机制不同。

```js
export function removeKthFromEnd(head, k) {
  if (!Number.isInteger(k) || k < 1) {
    throw new RangeError('k must be a positive integer');
  }
  const dummy = { next: head };
  let fast = dummy;
  let slow = dummy;
  for (let step = 0; step <= k; step += 1) {
    if (fast === null) {
      throw new RangeError('k exceeds list length');
    }
    fast = fast.next;
  }
  while (fast !== null) {
    fast = fast.next;
    slow = slow.next;
  }
  slow.next = slow.next.next;
  return dummy.next;
}
```

快指针推进和后续同速扫描总量为 O(n)，只使用常数个引用与哑节点，额外空间 O(1)。非法 k 的检查发生在重连之前，失败不会改写链表。

| 边界 | 应观察的结果 |
|---|---|
| 单节点、k=1 | 返回 null |
| k 等于长度 | 返回原第二个节点，或单节点时 null |
| k=1 | 只移除尾节点 |
| 中间节点 | 前驱连接到被删节点的后继 |
| 多节点值相同 | 仍按位置删除，保留其余节点身份 |
| 空表、k≤0、非整数或k超过长度 | 按本例约定抛错，原链表不变 |

## LRU：哈希表加双链表

[Redis LRU 说明](https://redis.io/glossary/lru-cache/)展示 LRU 基于最近使用顺序淘汰。经典实现用哈希表平均 O(1) 定位 key 对应节点，再用双链表按新旧排序；已知节点时，摘除与插入只需改常数个引用。get 命中或 put 更新时把节点移到头；容量超限时删除 tail.prev，并同步从 Map 删除。

```text
Map: key -> node
head <-> most recent ... least recent <-> tail
```

两种结构必须原子维护。只从链表删而忘记 Map 会内存泄漏；只从 Map 删会留下幽灵节点。并发实现还需要锁、分片或由单线程事件循环串行化，O(1) 不代表线程安全。

容量按条数还是字节决定淘汰语义。大对象差异明显时按 weight 维护总量。TTL 与 LRU 组合要在访问时先判断过期，再更新 recency；后台清理只是优化。

## 分片 LRU 与全局 LRU 的边界

扩展单机 LRU 前，先明确容量和“最近使用”的作用域。按 key 将请求路由到不同节点，每个节点维护自己的哈希表和双链表，是分片内 LRU；它没有维护跨节点的一条全局访问顺序。全局总容量与每分片预留容量也是不同合同，不能用同一个“分布式 LRU”名称混在一起。

一个教学反例可以看清差别：A、B 两个分片各能保存两项。按访问先后，B 中的 b1、b2 最久未用，A 中的 a1、a2 刚被访问。此时新 key a3 被路由到 A，分片方案会淘汰 A 内较旧的 a1；若合同是全局总容量四项、按全局顺序严格淘汰，则应淘汰 b1。这个手工推演没有运行网络服务，但已经说明两种语义不等价。

| 需要明确的合同 | 分片内 LRU | 全局严格 LRU |
|---|---|---|
| 访问顺序 | 每个分片独立维护 | 并发访问和淘汰要定义一致的全局次序 |
| 容量 | 每分片条数或字节上限 | 另行定义全局容量及节点容量约束 |
| 故障恢复 | 可从权威源重建值，旧访问顺序可能丢失 | 若承诺故障后仍严格，顺序与淘汰状态也要有可靠恢复合同 |
| 协调代价 | 通常可分片并行处理 | 维护顺序与容量需要跨节点协调，不能直接沿用单机 O(1) 承诺 |

分片中的 `get` 命中仍要提升节点顺序，`put`、淘汰和 Map 更新要在同一并发协议内维护不变量。请求重试还要区分两类问题：幂等键用于识别同一请求是否重复执行；条件版本检查或 CAS 用于拒绝旧结果覆盖新值。单独给请求加一个唯一 ID，不会自动拦住一个尚未执行过的旧写。[Redis 事务文档](https://redis.io/docs/latest/develop/using-commands/transactions/)以 WATCH 说明乐观条件更新：被监视的键变化时中止事务；这是条件校验的例子，不等于通用跨节点事务或所有权协议。

扩缩容时，路由应带分片版本或所有权 epoch，并明确迁移期间由谁接受读写、旧 owner 何时失去写入资格、怎样处理迟到请求。副本、超时和网络分区也要说明允许丢失多少值或访问历史，不能只说“一致性哈希加副本就解决了”。这些是工程设计条件，原题未给出具体负载和故障要求时，应先澄清再选方案。

如果业务只要求近似热点淘汰，可以明确采用近似策略。[Redis 的淘汰文档](https://redis.io/docs/latest/develop/reference/eviction/#approximated-lru-algorithm)说明其 LRU 通过抽样近似，并非精确维护全部键的严格顺序。这个事实不证明任意分布式方案都正确，只提供了一种以语义换取资源开销的选择。

## 数组与链表的现实差异

链表节点分散分配，指针和对象头有额外内存；连续布局通常更有利于顺序遍历，具体表现仍应按语言实现和负载测试。即使链表理论插入 O(1)，如果先按下标找到位置 O(n)，整体仍是 O(n)。现代语言中应根据实际 workload benchmark，而非因为“插入多”就自动选链表。

链表的优势在节点引用稳定：移动节点不复制其他元素，splice 可重连一段已知区间。侵入式链表把 prev/next 放进业务对象，减少额外节点，却让对象难以同时属于多条链。

## 验证

每次变更后检查 head/tail、size、从前向后与从后向前节点集合一致，且 `node.next.prev === node`。用随机操作与参考数组比较顺序。LRU 测试命中提升、更新已有 key、容量 0、重复淘汰、TTL 与 weight。

链表题的本质不是画箭头，而是在任何中间步骤都不丢节点，并让表示不变量支持你承诺的复杂度。

## k 个一组反转：先确认边界，再改指针

[LeetCode 25 的题目](https://leetcode.com/problems/reverse-nodes-in-k-group/)要求只改节点连接，不足 k 的末段保留。每组先找 kth，保存 groupNext，再把组内指针反转到 groupNext，最后连接前一组与新组头。以下代码也允许空链表或 k 大于长度，保持原状。

```javascript
function reverseKGroup(head, k) {
  if (!Number.isInteger(k) || k < 1) throw new RangeError('Invalid k');
  const dummy = {next:head};
  let before = dummy;
  while (true) {
    let kth = before;
    for (let i=0; i<k && kth; i++) kth = kth.next;
    if (!kth) break;
    const after = kth.next, oldHead = before.next;
    let prev = after, current = oldHead;
    while (current !== after) {
      const next = current.next;
      current.next = prev; prev = current; current = next;
    }
    before.next = kth;
    before = oldHead;
  }
  return dummy.next;
}
```

时间 O(n)、额外空间 O(1)，输入须无环。测试 k=1、整段反转、有残余尾段与节点身份不变，尤其检查有没有把 oldHead 接错而形成环。

重排链表是另一个原题：按 [LeetCode 143](https://leetcode.com/problems/reorder-list/)规格，把前后两端交替排列。可以先找中点、断开并反转后半，再交替合并；它不是简单整链反转，也不能通过只改节点值代替连接变更。

## 面试时怎样概括

经典 LRU 要同时解决“按 key 找到项”和“按最近使用顺序淘汰”。哈希表把 key 映射到稳定节点，双链表维护从最近到最久未用的顺序；命中后移动同一节点，超限时删尾部节点并同步移除 Map 引用。哈希定位的平均 O(1) 和已知双链表节点的局部 O(1) 重连都有前提，不表示按下标查找、并发同步或跨节点全局排序也免费。容量、过期、权重及访问顺序的作用域要分别约定；分片各自维护 LRU 并不会自动得到全局严格 LRU。

### 教学追问：只有单链表的当前节点，还能 O(1) 删除吗？

常规删除需要找到前驱才能绕过当前节点；只给当前节点而没有前驱时，通常要从头遍历。把后继值复制到当前节点再删后继，只适用于有后继且允许改变节点身份语义的场景，尾节点做不到。若任务依赖稳定节点身份，这种技巧也不满足原合同。双链表多保存 prev，才把“已知节点的常规删除”变成常数次重连。

### 教学追问：容量变成字节权重，并叠加 TTL，复杂度还都是 O(1) 吗？

先判断命中项是否过期；失效时同时更新 Map、链表和总权重，再决定是否提升访问顺序。写入或更新后若超出预算，可能需要连续淘汰多个节点，一次操作因此可能是 O(k)，其中 k 是本次淘汰项数，不能继续承诺每次 put 都是 O(1)。容量为 0 时不保留缓存项；单项权重大于整个预算时，应明确拒绝缓存或采用另一个已约定策略，不能无界淘汰。这里说明的是设计边界，未声称已运行带 TTL/weight 的服务。

### 教学追问：为什么分片和幂等键不能一起保证全局严格 LRU？

分片反例中，a3 到 A 会淘汰 a1，即使全局最久未用的是 B 的 b1；幂等键只能识别重复请求，无法建立跨分片的全局访问次序。若业务确实要求严格全局顺序和容量，就必须另行定义并协调访问与淘汰的先后关系，以及故障时的语义。迟到旧写又是另一个问题：没有执行过的旧请求不一定会被去重，资源侧还需版本条件、CAS 或所有权 epoch 等检查。本文的单机图与分片反例用于辨认这些合同差异，不充当已实现的分布式协议。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 AI 应用一、二面：MySQL、Redis 与编程基础](../../../interview/bytedance/base/bytedance-base-36.md)
- [字节后端与 Agent：运行链路、数据库与网络](../../../interview/bytedance/base/bytedance-base-55.md)
- [字节 Agent 开发一面：上下文工程、协作与编程基础（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-19.md)
- [字节 Agent 暑期实习一面：摘要、工具预算与链表](../../../interview/bytedance/base/bytedance-base-27.md)
- [字节 Agent Infra 校招：运行时、MySQL 与 LRU](../../../interview/bytedance/base/bytedance-base-25.md)
- [字节剪映 AI 前端一面：Agent 运行时、MCP 与性能](../../../interview/bytedance/base/bytedance-base-30.md)
- [快手 AI 应用开发一面：意图澄清、评测与 MCP 故障处理（2026 年 8 月）](../../../interview/kuaishou/ai/kuaishou-ai-3.md)
- [字节 Agent 全栈一面：工具、评测与编码](../../../interview/bytedance/base/bytedance-base-40.md)
- [美团 Keeta Agent 一面：客服流程、偏好数据与链表](../../../interview/meituan/ai/meituan-ai-1.md)
- [字节 Agent 实习：缓存一致性、定时任务与后端基础](../../../interview/bytedance/base/bytedance-base-47.md)
<!-- interview-source-history:end -->

## 参考资料

Redis 文档为滚动文档，本文仅引用通用 LRU、WATCH 条件校验与抽样淘汰机制，核验于 2026-10-16；不代表已运行分布式缓存服务。

- [MIT OCW 6.006（2011）：Lecture Notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/pages/lecture-notes/)
- [Redis：LRU Cache](https://redis.io/glossary/lru-cache/)
- [Redis：Transactions 与 WATCH 条件更新](https://redis.io/docs/latest/develop/using-commands/transactions/)
- [Redis：Key eviction 与近似 LRU](https://redis.io/docs/latest/develop/reference/eviction/)
- [LeetCode 142：Linked List Cycle II（独立教学题规格）](https://leetcode.com/problems/linked-list-cycle-ii/)
