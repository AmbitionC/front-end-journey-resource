字符串算法首先要定义“字符”和“相等”，再选择扫描、窗口或模式匹配。直接套用 `split('')`、正则或反转数组，常会在 Unicode、转义和复杂度上产生隐藏错误。

![文本指针从左到右扫描，模式指针失配后依据 prefix table 回退而不回退文本，同时区分 code unit、code point 与 grapheme cluster](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/string-kmp-prefix-fallback-v1.webp)
*图：KMP 用已匹配前后缀决定 fallback；上方 Unicode 层次提醒“用户看到的字符”不一定等于一个索引单位。*

---

## “字符”有三个常见层次

JavaScript 字符串按 UTF-16 code unit 存储，`length` 与下标统计 code unit。迭代器 `for...of` 按 Unicode code point 前进，但一个用户感知的 grapheme cluster 仍可能由多个 code point 组成，例如字母加组合标记、肤色修饰或家庭 emoji。

[Unicode Standard Annex #29](https://unicode.org/reports/tr29/)定义了 grapheme、word 与 sentence 的默认分段算法。面向光标移动、字符上限或 UI 截断时，应使用 `Intl.Segmenter` 或等价实现：

```javascript
const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'grapheme' });
const graphemes = [...segmenter.segment('Á👨‍👩‍👧')].map(item => item.segment);
```

算法题若明确输入仅为 ASCII，可以按下标处理；产品代码必须把这个假设写进契约。

## 安全的常见变换

字符串没有原地 `reverse()`。按 code point 反转可以写成：

```javascript
const reverseCodePoints = value => [...value].reverse().join('');
```

它仍可能拆开 grapheme cluster；用户可见文本需要先分段。snake_case 转 camelCase 应明确大小写规则并真正删除分隔符：

```javascript
function snakeToCamel(value) {
  return value.toLowerCase().replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase());
}
```

若目标是替换字面量，优先 `replaceAll(search, replacement)`；把用户输入拼进 `new RegExp(search)` 会让 `.`、`[` 等改变模式语义，除非先正确转义且确实需要正则。

## 滑动窗口

连续子串问题常维护一个合法窗口。右指针扩张并更新状态，约束被破坏时移动左指针，直到不变量恢复。最长无重复子串的不变量是“窗口内每个 code point 最多一次”：

```javascript
function longestUnique(text) {
  const lastIndex = new Map();
  let left = 0;
  let best = 0;
  let right = 0;

  for (const char of text) {
    if (lastIndex.has(char)) {
      left = Math.max(left, lastIndex.get(char) + 1);
    }
    lastIndex.set(char, right);
    best = Math.max(best, right - left + 1);
    right += 1;
  }
  return best;
}
```

更新 `left` 时取 max，避免窗口因遇到窗口外的旧字符而向左倒退。若语义是 grapheme cluster，先分段再应用相同窗口。

## KMP 为什么不回退文本指针

朴素匹配在每个起点重新比较，最坏为 O(nm)。Knuth、Morris 与 Pratt 的[原始论文](https://www.cs.jhu.edu/~misha/ReadingSeminar/Papers/Knuth77.pdf)构造模式串的前缀信息：当已匹配 `pattern[0..j)` 却失配时，最长真前缀与后缀告诉我们哪些字符仍可复用。

```javascript
function buildLps(pattern) {
  const lps = Array(pattern.length).fill(0);
  for (let i = 1, length = 0; i < pattern.length;) {
    if (pattern[i] === pattern[length]) {
      lps[i] = ++length;
      i += 1;
    } else if (length > 0) {
      length = lps[length - 1];
    } else {
      i += 1;
    }
  }
  return lps;
}

function indexOfKmp(text, pattern) {
  if (pattern === '') return 0;
  const lps = buildLps(pattern);
  for (let i = 0, j = 0; i < text.length;) {
    if (text[i] === pattern[j]) {
      i += 1;
      j += 1;
      if (j === pattern.length) return i - j;
    } else if (j > 0) {
      j = lps[j - 1];
    } else {
      i += 1;
    }
  }
  return -1;
}
```

文本指针 i 不因失配回退，构建 lps 为 O(m)，搜索为 O(n)。示例按 UTF-16 code unit 匹配，适合明确的代码单元模式；自然语言等价还可能涉及 normalization、case folding 与 locale。

## 最小编辑距离：比较两个前缀的三种结尾

编辑距离先要约定允许的操作及其代价。这里采用 Levenshtein 距离的教学版本：把字符串 A 变成 B，只允许插入、删除、替换一个字符，每次代价为 1，相同字符保留时为 0；交换两个相邻字符不算一次操作。[NIST 的定义](https://xlinux.nist.gov/dads/HTML/Levenshtein.html)给出这三类编辑；仅有“最小编辑距离”题名时，不能推定字符范围、加权代价或交换规则。

令 `dp[i][j]` 表示 A 的前 i 个字符变成 B 的前 j 个字符的最少编辑次数，前缀长度包含 0。空串变成长为 j 的前缀要插入 j 次，所以 `dp[0][j] = j`；长为 i 的前缀变成空串要删除 i 次，所以 `dp[i][0] = i`。

接下来考察末尾如何对应。删除 A 的末字符，依赖上方 `dp[i-1][j] + 1`；插入 B 的末字符，依赖左方 `dp[i][j-1] + 1`；替换或保留双方末字符，依赖左上方 `dp[i-1][j-1] + cost`，其中相同字符的 cost 为 0，否则为 1。三者取最小，不能只因末字符不同就贪心地选替换。这是 [MIT 6.006 的前缀子问题思路](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/487dc976eabd0f9bcd6a3c385203ea27_MIT6_006S20_r16.pdf)；下表以 `cat` 变成 `cut` 为例，行、列分别表示两串的前缀：

| A 前缀 \ B 前缀 | 空串 | c | cu | cut |
|---|---:|---:|---:|---:|
| 空串 | 0 | 1 | 2 | 3 |
| c | 1 | 0 | 1 | 2 |
| ca | 2 | 1 | 1 | 2 |
| cat | 3 | 2 | 2 | 1 |

`ca` 到 `cu` 的左上方为 0，替换 a 为 u 后得到 1；最后两个 t 相同，沿左上方保留该值，右下角答案就是 1。每个状态只依赖更短前缀，按行填表时依赖都已求出。

```javascript
function editDistance(source, target) {
  const a = Array.from(source), b = Array.from(target);
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[n][m];
}
```

本例用 `Array.from` 按 Unicode code point 迭代，避免把 `😀` 的 surrogate pair 拆成两次删除，但仍可能拆开组合字素或家庭 emoji；[字符串迭代器文档](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Symbol.iterator)与前述 Unicode 分段规则说明了这个区别。这里逐 code point 精确比较，不自动归一化：`editDistance('é', 'e\u0301')` 为 2。若产品要求按用户感知字符计费或比较，应先约定归一化与 grapheme 分段，再对分段数组应用相同递推。

空串到空串为 0，空串到 `abc` 为 3，`ab` 到 `ba` 为 2，不能把交换当成一次编辑。字符长度为 n、m 时，完整表的时间和空间为 $O((n+1)(m+1))$，非空时通常写为 $O(nm)$。只求距离可压缩 DP 工作空间为 $O(\min(n,m)+1)$，字符数组仍占 $O(n+m)$；本例保留完整表以展示状态，但只返回距离，恢复具体操作还需回溯最优前驱。

## 设计与测试边界

先写清返回第一个位置、所有位置还是布尔值；是否允许重叠匹配；空模式如何处理；大小写与 normalization 是否敏感。测试至少包括空串、完全相同、找不到、模式比文本长、重复前后缀、重叠命中、surrogate pair 与组合字符。

短文本的一次搜索通常直接用标准库最清晰。KMP 的价值是理解如何利用已知匹配信息避免回溯，并在需要线性最坏界、流式扫描或大量重复前缀时提供可预测行为。

## 版本号分段比较：不要先转成浮点数

[LeetCode 165](https://leetcode.com/problems/compare-version-numbers/)比较用点分隔的非负整数字段，忽略前导零，缺失段当零；它不是带预发布标签的完整 SemVer。`1.10` 不能按小数与 `1.2` 比较，超长字段也不能直接 parseInt 后假定无溢出。

去掉前导零后，先比较数字字符长度，再比较等长 ASCII 数字串，便可避免整数范围问题。以下实现额外拒绝空字段等非法输入，合法输入下扫描与比较总时间 O(n+m)，拆分数组占 O(n+m) 空间。

```javascript
function compareVersions(a, b) {
  const valid = /^\d+(\.\d+)*$/;
  if (!valid.test(a) || !valid.test(b)) throw new TypeError('Invalid version');
  const x = a.split('.'), y = b.split('.');
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const left = (x[i] ?? '0').replace(/^0+/, '') || '0';
    const right = (y[i] ?? '0').replace(/^0+/, '') || '0';
    if (left.length !== right.length) return left.length < right.length ? -1 : 1;
    if (left !== right) return left < right ? -1 : 1;
  }
  return 0;
}
```

例如 `1.01` 与 `1.001` 相同，`1.0.0` 与 `1` 相同，`1.10` 大于 `1.2`。测试还应覆盖超出安全整数的字段和非法输入，不能只依赖原帖缺失截图。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节全栈实习：Session、权限与前端基础](../../../interview/bytedance/base/bytedance-base-46.md)
- [字节全栈与测试：JVM、并发与 SQL 排查](../../../interview/bytedance/base/bytedance-base-56.md)
- [字节 TRAE 后端秋招二面：项目逻辑、工具与编辑距离](../../../interview/bytedance/base/bytedance-base-76.md)
<!-- interview-source-history:end -->

## 参考资料

- [Fast Pattern Matching in Strings](https://www.cs.jhu.edu/~misha/ReadingSeminar/Papers/Knuth77.pdf)
- [Unicode Standard Annex #29: Text Segmentation](https://unicode.org/reports/tr29/)
- [NIST：Levenshtein distance](https://xlinux.nist.gov/dads/HTML/Levenshtein.html)
- [MIT 6.006：动态规划练习中的编辑距离](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/487dc976eabd0f9bcd6a3c385203ea27_MIT6_006S20_r16.pdf)
- [MDN：String.prototype[Symbol.iterator]()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Symbol.iterator)
