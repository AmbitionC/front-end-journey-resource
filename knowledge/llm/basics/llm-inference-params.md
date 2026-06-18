# LLM 推理参数：Temperature / Top-P / Top-K

LLM 每次生成 token 时，先计算词表上的概率分布，再按某种策略从中采样。Temperature、Top-P、Top-K 是控制这一采样过程的核心参数，直接影响输出的多样性、创意性和稳定性。

## 概率分布与采样

模型输出层经过 softmax 得到词表上的概率分布。假设候选词概率从高到低排列：

```
"the"    → 0.40
"a"      → 0.25
"this"   → 0.15
"some"   → 0.08
...（其余词共 0.12）
```

如何从这个分布采样，决定了生成文本的风格。

## Temperature

Temperature（温度）通过缩放 logits 来调节分布的"尖锐程度"：

$$p_i = \frac{\exp(z_i / T)}{\sum_j \exp(z_j / T)}$$

- **T < 1**：分布更尖锐，高概率词的优势被放大，输出更确定、更保守
- **T = 1**：分布不变，模型原始输出
- **T > 1**：分布更平坦，低概率词获得更多机会，输出更随机、更有创意

```typescript
// 不同场景的 temperature 推荐值
const configs = {
  factualQA: { temperature: 0.0 },       // 事实问答，要求确定性
  codeGeneration: { temperature: 0.2 },  // 代码生成，稳定为主
  chatAssistant: { temperature: 0.7 },   // 对话助手，自然流畅
  creativeWriting: { temperature: 1.0 }, // 创意写作，多样性高
  brainstorming: { temperature: 1.2 },   // 头脑风暴，发散思维
}
```

**T = 0** 是特殊情况：退化为贪心解码（Greedy Decoding），每次都取概率最高的词，输出完全确定。

## Top-K

Top-K 在采样前先裁剪候选集：只保留概率最高的 K 个 token，其余直接置零，再归一化后采样。

```
K = 3 时，只从 ["the", "a", "this"] 中采样
K = 50 时，保留前 50 个候选
```

**优点：** 简单直接，限制了离谱词汇出现的概率。

**缺点：** K 是固定值，无法自适应分布形状。分布集中时 K=50 仍可能引入噪声；分布均匀时 K=3 又过于保守。

## Top-P（Nucleus Sampling）

Top-P（也叫 Nucleus Sampling）解决了 Top-K 的硬截断问题：按概率从高到低累加，一旦累积概率超过 P，就停止并从这个动态集合中采样。

```
P = 0.9，从高到低累加：
"the"(0.40) → 0.40
"a"  (0.25) → 0.65
"this"(0.15)→ 0.80
"some"(0.08)→ 0.88
"its"(0.05) → 0.93 ← 超过 0.9，停止

候选集 = ["the", "a", "this", "some", "its"]
```

- 分布集中时，候选集小（精准）
- 分布均匀时，候选集大（多样）

Top-P 是目前最常用的采样策略，通常设在 0.8–0.95 之间。

## 三者组合使用

实际 API 中，Temperature、Top-P、Top-K 可以叠加：

```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const message = await client.messages.create({
  model: 'claude-opus-4-5',
  max_tokens: 1024,
  temperature: 0.7,   // 先缩放 logits
  top_p: 0.9,         // 再做 Nucleus 截断
  // top_k: 50,       // Claude API 也支持 top_k（以官方文档为准）
  messages: [{ role: 'user', content: '写一首关于秋天的短诗' }],
})
```

**常见组合：**
- 代码/事实任务：`temperature=0, top_p=1`（或 temperature 极低）
- 日常对话：`temperature=0.7, top_p=0.9`
- 创意生成：`temperature=1.0, top_p=0.95`

> 注意：同时设置 Top-P 和 Top-K 时，两者是 AND 关系（先 Top-K 再 Top-P，或反之，具体实现以框架文档为准）。建议只用其中一个来避免混乱。

## 其他相关参数

### max_tokens / max_new_tokens

限制输出长度上限，超出则截断。注意：不是"生成恰好这么多"，而是"最多生成这么多"。

### Repetition Penalty / Frequency Penalty / Presence Penalty

惩罚重复出现的 token，防止模型陷入循环生成。OpenAI API 中：
- `frequency_penalty`：按 token 出现频次惩罚（越常见惩罚越重）
- `presence_penalty`：只要出现过就惩罚（鼓励引入新词）

### Stop Sequences

指定终止字符串，模型生成到该序列时立即停止：

```typescript
// 用 stop 控制结构化输出的边界
const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: '...' }],
  stop: ['</answer>', '\n\n'],
})
```

## 参数调优速查

| 场景 | Temperature | Top-P | 说明 |
|------|------------|-------|------|
| 事实问答、提取 | 0–0.2 | 1.0 | 确定性优先 |
| 代码生成 | 0.1–0.3 | 0.95 | 稳定，偶尔探索 |
| 对话助手 | 0.6–0.8 | 0.9 | 自然流畅 |
| 内容创作 | 0.9–1.1 | 0.95 | 多样创意 |
| 调试/测试 | 0 | 1.0 | 完全复现 |

## 面试常问

- Temperature=0 和 Temperature 很小（如 0.01）有什么区别？
- 为什么 Top-P 被认为比 Top-K 更鲁棒？
- 如果想让模型每次输出完全相同，应该怎么设置参数？
- Repetition Penalty 是在 logits 层还是采样层起作用？
- 生产环境中如何确定合适的 temperature 值？
