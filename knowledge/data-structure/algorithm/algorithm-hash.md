哈希表把“按 key 查找”转化为“计算桶位置，再解决冲突”。平均 O(1) 不是魔法，也不是无条件保证；它依赖哈希函数、负载因子、冲突策略和扩容行为。

![键经过哈希函数进入桶，碰撞由链或探测序列解决，负载因子升高后扩容并重新分布](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/hash-table-bucket-collision-resize-v1.webp)
*图：两个 key 落入同一 bucket 形成 collision；resize 增加桶数后必须 rehash，不能只复制旧下标。*

---

## 从 key 到 bucket

[NIST 的 hash table 定义](https://xlinux.nist.gov/dads/HTML/hashtab.html)包含 table、bucket、hash function 与 collision resolution。一个典型位置计算为：

```text
hashCode = hash(key)
index = normalize(hashCode) mod bucketCount
```

哈希函数要求同一个 key 稳定得到同一 hash，并尽量把实际 key 集合均匀分散。它不要求不同 key 的 hash 永不相同；有限桶容纳无限可能 key，碰撞必然发生。判定最终相等仍需要 key equality，hash 相等只能说明“可能相等”。

## 两类冲突处理

拉链法让每个 bucket 指向一个小集合，碰撞项存入链表、数组或树；开放寻址则把所有元素放在表内，发生碰撞后按线性、二次或双重哈希探测其他槽位。

负载因子 `α = entries / buckets` 上升时，链或探测序列通常变长。实现会在阈值附近扩容，然后按新 bucketCount 重新计算所有位置。扩容单次可能是 O(n)，但把成本摊到多次插入后，常得到摊还 O(1)。

最坏情况下，大量 key 落入同一桶，查找可退化到 O(n)。面对不可信输入还要考虑碰撞攻击；运行时可能随机化字符串哈希或把长链转成平衡结构，但应用不能依赖未公开实现细节。

## 正确的最小映射

教学实现应先处理“相同 key 更新 value”，而不是每次追加：

```javascript
class HashMap {
  constructor(size = 16) {
    this.buckets = Array.from({ length: size }, () => []);
    this.count = 0;
  }

  indexFor(key) {
    let hash = 2166136261;
    for (const char of String(key)) {
      hash ^= char.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) % this.buckets.length;
  }

  set(key, value) {
    const bucket = this.buckets[this.indexFor(key)];
    const pair = bucket.find(([storedKey]) => Object.is(storedKey, key));
    if (pair) {
      pair[1] = value;
      return;
    }
    bucket.push([key, value]);
    this.count += 1;
  }

  get(key) {
    const bucket = this.buckets[this.indexFor(key)];
    return bucket.find(([storedKey]) => Object.is(storedKey, key))?.[1];
  }
}
```

这个示例仍省略 resize、delete、迭代顺序和通用对象 key 的稳定哈希，所以只能用于理解结构，不能替代标准库。

## 用不变量解题

哈希题的关键是定义 key、value 与写入时机。

两数之和中，key 是已见过的数，value 是索引。先查询补数再写入当前数，保证同一元素不会被复用：

```javascript
function twoSum(nums, target) {
  const indexByValue = new Map();
  for (let i = 0; i < nums.length; i += 1) {
    const need = target - nums[i];
    if (indexByValue.has(need)) return [indexByValue.get(need), i];
    indexByValue.set(nums[i], i);
  }
  return null;
}
```

计数问题的 value 是频次；分组问题的 key 是规范化签名；去重只关心成员关系，使用 Set 更直接。若问题要求稳定输出、全部配对或保留重复位置，value 就可能是数组而不是单个索引。

## 前缀和：为什么保存最早位置

要求连续子数组和为 `k` 时，定义 `prefix[i]` 为下标 `0..i` 的和。若之前位置 `j` 的前缀和等于 `prefix[i] - k`，则 `j+1..i` 的和为 `k`。哈希表的 key 是前缀和，value 应保留它第一次出现的位置：对同一右端点，越早的左边界产生越长区间。

先放入 `0 → -1`，这样从数组第0项开始的解也能用同一规则处理。先查询再记录当前前缀和；相同前缀和不覆盖旧位置。下面的 Number 示例假设输入值、`k` 和所有前缀和均为安全整数；超出范围应改用一致的精确整数表示。

```javascript
function longestSubarraySum(nums, k) {
  const earliest = new Map([[0, -1]]);
  let sum = 0;
  let longest = 0;
  for (let i = 0; i < nums.length; i += 1) {
    sum += nums[i];
    if (earliest.has(sum - k)) {
      longest = Math.max(longest, i - earliest.get(sum - k));
    }
    if (!earliest.has(sum)) earliest.set(sum, i);
  }
  return longest;
}
```

例如 `[1, -1, 5, -2, 3]`、`k=3`，处理到下标3时前缀和为3，匹配初始的 `0 → -1`，得到长度4。负数让区间和无法按窗口长度单调变化，因此不能无条件套只适用于正数等约束的滑动窗口。哈希操作平均常数时间时，总时间为O(n)、额外空间为O(n)；没有非空解时返回0。

## 无序流、Bitmap 与空间边界

有限无序输入可把较小一侧放入哈希集合，再扫描另一侧查成员；需要多重集合交集时，保存计数并在命中后扣减。若流没有结束标记，就不能声称已得到完整交集：未来元素仍可能与过去匹配。面对无界值域和无界历史，精确成员判断需要保留区分已见集合的信息，固定内存不能无条件处理任意增长的唯一元素。

Bitmap 以整数值对应位下标，已知有限值域 `[0,U)` 时用 U 位表达成员，空间约为 U/8 字节（另有结构开销），而不是只与已出现数量有关。Java `BitSet` 可增长，但容量增长仍要分配空间；这种 API 不会把巨大稀疏值域变成固定空间。[Java 21：BitSet 的下标与容量](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/BitSet.html)。

因此先确认值域、是否有序、窗口、是否可外存和何时算完成。可用哈希集合适应稀疏值，或在明确有限窗口内计算交集；分批需要持久保存跨批匹配信息，不能凭“每批很小”证明总空间有界。近似成员结构可能给出误报，若要求精确结果还需回查；不要把近似方案冒充精确交集。
## JavaScript Map、Set 与 Object

JavaScript 的 Map 支持任意值作为 key，并提供明确的 `has`、`size` 与插入顺序迭代。Set 只保存唯一成员。[Python 映射类型文档](https://docs.python.org/3/library/stdtypes.html#mapping-types-dict)同样强调 key 必须可哈希，并说明字典操作与插入顺序语义；这些是语言契约，不能反推运行时必须采用某一种哈希表内部布局。

普通 JavaScript 对象适合固定字段记录；属性 key 是字符串或 Symbol，还涉及原型链。把用户输入当字典 key 时使用 Map 或无原型对象，避免继承属性和 prototype pollution。内存中的 Map/Object 不具有持久化能力，不能“模拟 localStorage 持久化”；进程或页面结束后内容会消失。

## 复杂度与验证

平均查找、插入和删除常按 O(1) 分析，遍历为 O(n)，扩容单次为 O(n)。测试不仅覆盖命中/未命中，还应覆盖相同 key 更新、故意碰撞、删除后再插入、扩容前后全部 key 可查，以及特殊值的相等规则。

如果任务只需要几十个固定字段，数组或对象可能更简单；需要有序范围查询时，树结构更合适。哈希表擅长精确 key lookup，不天然支持前缀、最小值或区间扫描。

## Java HashMap：遍历删除不是并发协议

HashMap 的集合视图迭代器对结构变化执行尽力而为的 fail-fast 检查；在迭代器建立后直接增删 map，可能触发 ConcurrentModificationException。单线程正确删除应通过迭代器自身 remove，或让集合视图 removeIf 按其契约处理；仅更新已有 key 的 value 与增删映射不是同一类结构修改。[JDK 21 HashMap 契约](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html)同时指出，不能依赖该异常证明程序并发正确。

下面只展示操作顺序的伪代码，本机无 JDK，不冒充已编译运行的 Java：

```text
iterator = map.entrySet().iterator()
while iterator.hasNext():
    entry = iterator.next()
    if shouldRemove(entry):
        iterator.remove()  // 删除刚由 next 返回的映射
```

一次 next 后最多删除该项一次，先 remove 或重复 remove 不符合迭代器状态。增强 for 隐含使用迭代器，但循环内直接 map.remove 并不是这个迭代器的 remove。多线程共享 HashMap 还需外部同步或采用具有合适契约的并发集合；“没抛异常”不是线程安全证据。

## 单例服务中的 Map：并发安全与容量是两件事

以 Spring Controller 为教学场景：默认 singleton 是同一容器中同一 bean 定义共享一个实例，并不是每次请求新建对象，也不是跨所有进程唯一。[Spring 7.0.5 的作用域说明](https://github.com/spring-projects/spring-framework/blob/v7.0.5/framework-docs/modules/ROOT/pages/core/beans/factory-scopes.adoc)区分 singleton 与 request 等作用域。因此实例字段中的可变 Map 可能同时被多个请求访问，须先辨认它保存请求临时数据、共享业务状态还是缓存。

临时数据优先放在请求内的局部变量或明确的请求状态中；真正共享的数据应为所有相关读写选择一致的同步协议。普通 HashMap 不提供并发安全，`containsKey` 后再 `put` 的复合判断也不能只凭换一个容器就认定原子。若一个业务不变量涉及多项、外部数据库或多个服务实例，还需对应的锁、事务或权威状态合同；内存 Map 不承担跨进程事实源。

容量另行设计：不断加入新 key、没有淘汰或删除的 Map 会保留可达对象；采用并发容器不等于获得 TTL、容量上限或租户隔离。缓存要明确最大条目/字节预算、过期与失效、热点和拒绝/淘汰策略，并监控条目数、内存和 GC。原始 Controller 代码未给出时，只能按这些方向审查，不能断言已经发生某个具体竞态或给出假装测试过的补丁。[JDK 25 HashMap 契约](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/HashMap.html)说明同步与 fail-fast 的范围；这里的服务设计是教学分析。


## 出现于（热度来源）

<!-- interview-source-history:start -->
- [美团容器平台 JAVA 一二面：消息一致性、MCP 权限与代码审查](../../../interview/meituan/ai/meituan-ai-5.md)
- [字节 Agent 一面：会话记忆、并发更新与算法](../../../interview/bytedance/base/bytedance-base-29.md)
- [蚂蚁后端一面：多级缓存、库存容灾与消息选型](../../../interview/antfin/base/antfin-base-1.md)
- [字节全栈一面：RAG、Java 与线程池](../../../interview/bytedance/base/bytedance-base-37.md)
- [字节 Managed Agent 校招一面：评测、运行链路与后端基础](../../../interview/bytedance/base/bytedance-base-26.md)
- [字节 Agent 开发一面：上下文工程、协作与编程基础（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-19.md)
- [字节 Agent Infra 校招：运行时、MySQL 与 LRU](../../../interview/bytedance/base/bytedance-base-25.md)
- [腾讯 AI Agent 应用开发一面：上下文、强化学习与系统基础](../../../interview/tencent/ai/tencent-ai-11.md)
- [海康威视 AI Agent 开发一面：可靠工具与任务状态](../../../interview/hikvision/ai/hikvision-ai-1.md)
- [字节 AML / 火山方舟 AI Infra 一面：Agent Runtime、OS 与网络（2026 年 8 月）](../../../interview/bytedance/base/bytedance-base-17.md)
<!-- interview-source-history:end -->

## 参考资料

- [NIST Dictionary of Algorithms and Data Structures: hash table](https://xlinux.nist.gov/dads/HTML/hashtab.html)
- [Python dictionary view objects and mapping types](https://docs.python.org/3/library/stdtypes.html#mapping-types-dict)

- [JDK 25 — HashMap](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/HashMap.html)
- [Spring 7.0.5 — Bean scopes](https://github.com/spring-projects/spring-framework/blob/v7.0.5/framework-docs/modules/ROOT/pages/core/beans/factory-scopes.adoc)
