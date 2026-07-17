链表把顺序编码在节点引用中，而不是连续内存位置。已知节点时插入和删除只需改常数个指针，但按下标访问必须从头走。它最有价值的场景不是替代所有数组，而是需要稳定节点身份和频繁局部重连，例如 LRU 的访问顺序。

![双向链表通过哨兵节点完成插入、删除、移动到头部，并与哈希表组成 LRU](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/algorithm-linked-list-lru-operations-v1.webp)
*图：哈希表 O(1) 找节点，双向链表 O(1) 改变最近使用顺序；头尾哨兵统一边界操作。*

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

Floyd 快慢指针检测环：slow 每次一步，fast 每次两步，有环时最终相遇。相遇后一个指针回到头，两者同速前进，相遇处为环入口。生产中出现环通常是结构损坏，遍历应有 size/步数保护，防止死循环。

## LRU：哈希表加双链表

[Redis LRU 说明](https://redis.io/glossary/lru-cache/)展示 LRU 基于最近使用顺序淘汰。经典实现用 Map 从 key O(1) 找节点，用双链表按新旧排序。get 命中或 put 更新时把节点移到头；容量超限时删除 tail.prev，并同步从 Map 删除。

```text
Map: key -> node
head <-> most recent ... least recent <-> tail
```

两种结构必须原子维护。只从链表删而忘记 Map 会内存泄漏；只从 Map 删会留下幽灵节点。并发实现还需要锁、分片或由单线程事件循环串行化，O(1) 不代表线程安全。

容量按条数还是字节决定淘汰语义。大对象差异明显时按 weight 维护总量。TTL 与 LRU 组合要在访问时先判断过期，再更新 recency；后台清理只是优化。

## 数组与链表的现实差异

链表节点分散分配，指针和对象头有额外内存，缓存局部性通常差；数组顺序遍历更快。即使链表理论插入 O(1)，如果先按下标找到位置 O(n)，整体仍是 O(n)。现代语言中应根据实际 workload benchmark，而非因为“插入多”就自动选链表。

链表的优势在节点引用稳定：移动节点不复制其他元素，splice 可重连一段已知区间。侵入式链表把 prev/next 放进业务对象，减少额外节点，却让对象难以同时属于多条链。

## 验证

每次变更后检查 head/tail、size、从前向后与从后向前节点集合一致，且 `node.next.prev === node`。用随机操作与参考数组比较顺序。LRU 测试命中提升、更新已有 key、容量 0、重复淘汰、TTL 与 weight。

链表题的本质不是画箭头，而是在任何中间步骤都不丢节点，并让表示不变量支持你承诺的复杂度。

## 参考资料

- [MIT OCW 6.006（2011）：Lecture Notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/pages/lecture-notes/)
- [Redis：LRU Cache](https://redis.io/glossary/lru-cache/)
