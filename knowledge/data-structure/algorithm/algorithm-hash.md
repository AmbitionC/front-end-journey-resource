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

## JavaScript Map、Set 与 Object

JavaScript 的 Map 支持任意值作为 key，并提供明确的 `has`、`size` 与插入顺序迭代。Set 只保存唯一成员。[Python 映射类型文档](https://docs.python.org/3/library/stdtypes.html#mapping-types-dict)同样强调 key 必须可哈希，并说明字典操作与插入顺序语义；这些是语言契约，不能反推运行时必须采用某一种哈希表内部布局。

普通 JavaScript 对象适合固定字段记录；属性 key 是字符串或 Symbol，还涉及原型链。把用户输入当字典 key 时使用 Map 或无原型对象，避免继承属性和 prototype pollution。内存中的 Map/Object 不具有持久化能力，不能“模拟 localStorage 持久化”；进程或页面结束后内容会消失。

## 复杂度与验证

平均查找、插入和删除常按 O(1) 分析，遍历为 O(n)，扩容单次为 O(n)。测试不仅覆盖命中/未命中，还应覆盖相同 key 更新、故意碰撞、删除后再插入、扩容前后全部 key 可查，以及特殊值的相等规则。

如果任务只需要几十个固定字段，数组或对象可能更简单；需要有序范围查询时，树结构更合适。哈希表擅长精确 key lookup，不天然支持前缀、最小值或区间扫描。

## 参考资料

- [NIST Dictionary of Algorithms and Data Structures: hash table](https://xlinux.nist.gov/dads/HTML/hashtab.html)
- [Python dictionary view objects and mapping types](https://docs.python.org/3/library/stdtypes.html#mapping-types-dict)
