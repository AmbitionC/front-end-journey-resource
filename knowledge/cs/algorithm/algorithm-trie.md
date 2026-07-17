Trie 把字符串的公共前缀共享成路径。查找成本主要取决于 key 长度，而不是词典中有多少单词，因此适合前缀检索、路由和自动补全。代价是节点与子边可能占用大量内存；排序和推荐质量也不是 Trie 自动提供的。

![Trie 从字符路径、终止标记到前缀定位、候选遍历和自动补全排名](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/algorithm-trie-prefix-search-v1.webp)
*图：到达 prefix 节点只确定候选子树；终止标记区分完整词，频次与新鲜度等元数据决定排序。*

## 节点与终止标记

每个节点保存从字符/字节到子节点的映射，以及 `isTerminal`。插入 `car` 与 `cart` 时两者共享 c-a-r，r 节点标为单词结束，再向下连接 t。没有终止标记，就无法区分某路径只是前缀还是完整 key。

[Princeton Algorithms：Tries](https://algs4.cs.princeton.edu/52trie/)介绍 trie 和相关字符串检索。若 key 长度为 L，精确查找和插入通常 O(L)，但这里“字符”的定义很重要：UTF-8 字节、Unicode code point 和用户感知字素会产生不同路径与规范化结果。

## 精确查找与前缀查找

精确查找沿 key 逐步转移，任一边缺失则不存在，走完还要检查 terminal。前缀查询只需确认路径存在，再遍历该节点子树收集终止节点。

```js
function findNode(root, text) {
  let node = root;
  for (const ch of text.normalize('NFC')) {
    node = node.children.get(ch);
    if (!node) return null;
  }
  return node;
}
```

收集所有候选的成本还与结果规模有关，不能宣称自动补全始终 O(L)。设置 limit、deadline，并在节点缓存 top suggestions，才能避免热门短前缀遍历巨大子树。

## 子边表示的权衡

固定小字母表可用长度 R 的数组，转移 O(1) 且常数小，但稀疏节点浪费空间。HashMap 只存存在边，节省稀疏空间却有对象和哈希开销；有序数组或平衡树支持按字典序遍历。

Ternary Search Trie 每节点一个字符与三向指针，以比较换内存。Radix/Patricia Trie 把只有一个孩子的连续路径压成字符串片段，大幅减少节点；插入时可能需要拆边，实现更复杂。

## 删除与引用计数

删除单词先取消 terminal，再从叶向上清理“不 terminal 且无孩子”的节点。`car` 和 `cart` 共用路径，删除 car 不能删掉 r 节点。若支持频次或多来源，可保存 terminal count/source set，只有引用归零才取消。

并发更新可采用读写锁、copy-on-write 根指针或批量构建新版本后原子切换。在线逐节点修改时，读者可能看到半成品；不可变 snapshot 更容易保证一致查询。

## 自动补全还需要排名

Trie 只快速找到 prefix 对应子树。推荐顺序可能综合历史频次、新鲜度、个性化、编辑距离和安全过滤。可以在每个节点缓存 top-K terminal IDs，查询 O(L+K)，但每次词频变化需更新祖先路径。

高频更新可把候选生成与 ranking 分离：Trie 返回较大候选集，排序服务用特征打分。缓存记录 rankingVersion，敏感或已删除词要能立即过滤，不能等待整棵 Trie 重建。

## 模糊搜索和路由

拼写纠错可在 Trie DFS 中同时推进编辑距离动态规划行，超过阈值就剪枝；成本与阈值和词典分支有关。IP 前缀路由使用 bitwise trie，选择最长匹配前缀；URL router 则按 path segment 建树，并定义静态、参数和通配符优先级。

这些场景共享“前缀路径”，但 alphabet、匹配规则和 terminal payload 不同，不应把单词 Trie 原样套用。

## 规范化与测试

大小写、重音、全半角和 Unicode 组合形式必须在写入和查询使用同一版本规则，并保留展示原文。中文自动补全可能按汉字、拼音或分词 token 建多路索引，需明确用户输入如何映射。

测试空串、前缀也是完整词、重复插入、删除共享前缀、Unicode 规范化、limit、排名更新和版本切换。用 Map/排序数组作为小规模参考实现随机对比。Trie 的正确性来自两个条件：路径完整表示 key，terminal 准确表示结束；性能则取决于边表示和候选控制。

容量评估不要只数 key。应记录节点数、边数、每节点对象开销、缓存候选大小和构建峰值；真实语言词典中公共前缀多少会显著改变成本。发布新版本时同时比较查询 p95、未命中率、候选截断率和推荐质量，防止只因节点变少就误判优化成功。

## 参考资料

- [Princeton Algorithms：Tries](https://algs4.cs.princeton.edu/52trie/)
