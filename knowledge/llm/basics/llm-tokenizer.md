Tokenizer 是文本与神经网络之间的“编译器”：它把字符串切成有限词表中的 token，再映射为整数 ID。模型真正接收和生成的是 token ID 序列，而不是人眼看到的字、词或句子。

## 为什么不直接按字或单词处理

纯单词词表会遇到开放词汇问题：新词、拼写变化、代码标识符和不同语言不断出现；纯字符或字节虽然覆盖完整，却会让序列很长。子词 token 在两者之间折中：常见片段保留为整体，少见词拆成更小单位。

[Neural Machine Translation of Rare Words with Subword Units](https://aclanthology.org/P16-1162/) 将 BPE 风格的子词用于神经机器翻译，展示了有限词表处理稀有词的路径。[SentencePiece](https://aclanthology.org/D18-2012/) 又把 BPE 与 unigram language model 等方法直接应用于原始文本，减少对语言特定预分词规则的依赖。

## 从字符串到 embedding

![文本经过规范化子词切分和ID映射再进入embedding的流程](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-tokenizer-segmentation-pipeline-v1.webp)
*图：示例 ID 只用于说明映射关系；真实切分和 ID 完全由具体模型的 tokenizer 与词表决定。*

一条常见流水线包含：

1. **规范化**：可能处理 Unicode、大小写或空白；不同 tokenizer 的规则不同。
2. **预切分**：按空白、标点、字节边界或正则得到候选片段。
3. **子词切分**：使用 BPE、unigram 等算法选择词表单元。
4. **ID 映射**：每个 token 查词表得到整数 ID。
5. **加入特殊 token**：例如序列开始、结束、分隔或对话角色标记。
6. **embedding 查表**：ID 变成向量，进入 Transformer。

解码时执行反向映射并拼接 token。只要 tokenizer 的设计保留了所需边界，便可恢复文本；但有损规范化可能让原始大小写或 Unicode 形式不可完全还原，所以“可逆”必须以具体配置为准。

## 三种常见子词思路

### BPE

BPE 从较小单元开始，反复合并训练语料中高频的相邻单元，直到达到目标词表规模。训练得到一组有顺序的 merge 规则；编码时按这些规则把文本组合成子词。

优点是概念直观、实现高效。缺点是局部贪心合并不直接优化整个句子的概率，不同预切分规则也会产生明显不同的结果。

### Unigram language model

Unigram 方法先准备较大的候选词表，为每个子词赋予概率，再逐步删除对语料似然影响较小的单元。编码时可通过动态规划寻找概率较高的切分，也能进行子词正则化采样。

### Byte-level 或 byte fallback

以字节作为最终兜底可以覆盖任意 Unicode 输入，避免未知 token；代价是某些语言或异常字符串可能被拆成很多 token。字节覆盖也不代表模型理解这些组合，只代表输入可编码。

## Token 数为什么重要

### 上下文与成本

上下文窗口和 API 计费通常按 token 计算。同一句话在不同 tokenizer 下的 token 数可能不同，不能用“中文字数 ÷ 固定常数”做可靠预算。生产系统应调用目标模型的官方 tokenizer 实测。

### 多语言公平性

词表训练数据偏向某些语言时，其他语言可能需要更多 token 表达相同信息。这会挤占上下文、增加延迟和成本，也会让模型在较长 token 路径上学习同一概念。

### 代码与结构化文本

缩进、换行、运算符和长标识符的切分会影响代码模型。JSON 看似字符不多，重复键名、转义和数字也可能消耗大量 token。

## 一个简化的 BPE 示例

假设初始单元是字符，语料中 `l` 与 `o` 经常相邻，训练可能先合并为 `lo`；随后 `lo` 与 `w` 又合并为 `low`。最终 `lower` 可能被编码为：

```text
low + er
```

另一个词表可能得到：

```text
lo + wer
```

两种切分都能表示原词，但 ID、长度和模型学到的统计关系不同。文章或提示中看到的“一个词”，并不是模型内部稳定的最小语义单位。

## 工程中最容易犯的错

- **服务端和客户端使用不同 tokenizer 估算长度**：会导致截断点、费用和缓存键不一致。
- **更换模型却复用旧 token ID**：ID 只对对应词表有意义，不能跨模型直接迁移。
- **按字符截断后再编码**：可能破坏代码块、结构或关键信息；应先编码，再按消息优先级管理预算。
- **把 token 当作词**：token 可能是词、子词、空格连同片段、字节或特殊控制标记。
- **忽略聊天模板**：角色、分隔符和工具 schema 也会占用上下文。

## 实践建议

保存模型名称、tokenizer 版本和聊天模板版本；在提交请求前用同源实现计算 token；对中英文、代码、emoji、URL 和异常 Unicode 建立回归样本；升级模型时重新测量长度分布与截断行为，而不是只看词表大小。

## 小结

Tokenizer 决定文本怎样变成模型可计算的序列。BPE、unigram 与 byte-level 各有取舍，切分会直接影响上下文、成本、多语言表现和代码处理。任何 token 预算和缓存设计，都必须绑定具体模型与 tokenizer 版本。

## 参考资料

- [SentencePiece: A simple and language independent subword tokenizer and detokenizer](https://aclanthology.org/D18-2012/)
- [Neural Machine Translation of Rare Words with Subword Units](https://aclanthology.org/P16-1162/)
- [google/sentencepiece 官方仓库](https://github.com/google/sentencepiece)
