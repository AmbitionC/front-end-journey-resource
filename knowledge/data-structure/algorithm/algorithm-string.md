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

## 设计与测试边界

先写清返回第一个位置、所有位置还是布尔值；是否允许重叠匹配；空模式如何处理；大小写与 normalization 是否敏感。测试至少包括空串、完全相同、找不到、模式比文本长、重复前后缀、重叠命中、surrogate pair 与组合字符。

短文本的一次搜索通常直接用标准库最清晰。KMP 的价值是理解如何利用已知匹配信息避免回溯，并在需要线性最坏界、流式扫描或大量重复前缀时提供可预测行为。

## 参考资料

- [Fast Pattern Matching in Strings](https://www.cs.jhu.edu/~misha/ReadingSeminar/Papers/Knuth77.pdf)
- [Unicode Standard Annex #29: Text Segmentation](https://unicode.org/reports/tr29/)
