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

## 从 Trie 到 AC 自动机：一遍扫描匹配多个模式

普通 Trie 常从文本的某个起点沿模式前缀尝试；Aho–Corasick（AC）自动机在 Trie 上增加 failure links 与输出信息，复用已读文本的后缀状态，适合用一个固定模式词典扫描长文本。它做的是精确多模式匹配，不会自动理解同义改写，也不直接完成向量召回或语义分类。[pyahocorasick 官方文档](https://pyahocorasick.readthedocs.io/en/latest/)说明其 Trie、failure links 与多模式搜索接口。

对非根状态 v，`fail(v)` 指向“v 所表示字符串的最长真后缀，且这个后缀也是词典中某条前缀”的状态。扫描字符 c 时：有子边就转移；没有则沿 fail 继续找；退到根仍没有就保持根。文本指针不因 fail 倒退。构建时通常按广度优先确定失败链接，使父状态的失败信息先准备好；根和根的直接孩子要按约定单独处理。

**输出也必须沿后缀关系传播或查询。** 模式集 `{he, she, hers}` 扫描 `ushers`：读到 `she` 时同时命中 `she` 与后缀 `he`；下一字符 r 无法从 she 直接前进，沿 fail 到 he 后消费这个 r 到 her，再读 s 命中 hers。若只报告当前状态的终止标记，就会漏掉 he；若只报告最长匹配，也会改变“返回全部匹配”的任务合同。

![模式 he、she、hers 的 Trie 结构，he、she、hers 是终止词，紫色虚线表示 she 的 fail 指向 he，提醒输出包含后缀词](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/algorithm-trie-ac-structure-20261115.png)
*图：只展开 she→he 这一条失败链接，其余状态的 fail 省略。实线是 Trie 子边，紫色虚线不消费字符；完整自动机还须构建其余失败链接并维护输出。*

若文本长度为 n、报告的匹配数为 z，在固定字母表及常数时间转移等通常假设下，扫描可达到 O(n+z)；不能忽略输出量。构建空间和时间还取决于模式总长度、字母表、稠密转移表还是稀疏边，以及怎样保存输出链；复制每个状态的全部输出可能占用额外空间，不应无条件说所有实现都只需线性空间。

实际工程先统一大小写、Unicode 规范化与字符单位，返回词条 ID、匹配区间和词典版本；重叠如何处理、短词边界和优先级另定规则。词典频繁变化时可以批量重建不可变版本并切换，评估峰值内存与切换语义。若把匹配结果送入分类器或 Agent，它只是带出处的规则信号；是否召回更多材料、调用其他模型以及允许执行什么动作，还需独立编排和校验，不能从“命中了关键词”推出业务结论。

## 规范化与测试

大小写、重音、全半角和 Unicode 组合形式必须在写入和查询使用同一版本规则，并保留展示原文。中文自动补全可能按汉字、拼音或分词 token 建多路索引，需明确用户输入如何映射。

测试空串、前缀也是完整词、重复插入、删除共享前缀、Unicode 规范化、limit、排名更新和版本切换。用 Map/排序数组作为小规模参考实现随机对比。Trie 的正确性来自两个条件：路径完整表示 key，terminal 准确表示结束；性能则取决于边表示和候选控制。

容量评估不要只数 key。应记录节点数、边数、每节点对象开销、缓存候选大小和构建峰值；真实语言词典中公共前缀多少会显著改变成本。发布新版本时同时比较查询 p95、未命中率、候选截断率和推荐质量，防止只因节点变少就误判优化成功。

## 练一练

### 高频考点题 1：查找成本

Trie 精确查找一个单词，成本主要取决于什么？

- A. 字典里单词的总数
- B. 字母表的大小平方
- C. 单词本身的长度
- D. 随机

**答案：C。** 沿着单词逐字符转移，与总词数基本无关。

### 高频考点题 2：终止标记

为什么 Trie 节点需要 `isTerminal` 标记？

- A. 为了节省内存
- B. 为了让节点有序
- C. 区分完整单词和前缀
- D. 为了支持一次删除整棵子树

**答案：C。** 比如插入了 apple，走完 app 路径时不能就认为 app 是一个单词。

### 高频考点题 3：子边用数组还是哈希表

子边用长度为 R 的数组表示，代价是？

- A. 转移很慢
- B. 不能再做前缀查找了
- C. 无法存中文
- D. 字母表大时浪费内存

**答案：D。** 数组转移 O(1) 常数小；字母表大或稀疏时，哈希表或 TST 更省内存。

## 参考资料

- [Princeton Algorithms：Tries](https://algs4.cs.princeton.edu/52trie/)
- [pyahocorasick：Trie、failure links 与多模式匹配](https://pyahocorasick.readthedocs.io/en/latest/)

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 AI 平台一面：Agent 评测、框架与数据结构](../../../interview/bytedance/base/bytedance-base-33.md)
- [华为后训练与强化学习实习一面：分类模型、训练并行与排序](../../../interview/huawei/ai/huawei-ai-4.md)
<!-- interview-source-history:end -->
