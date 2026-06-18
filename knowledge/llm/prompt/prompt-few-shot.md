# Few-Shot 与 Zero-Shot 提示

Zero-Shot 和 Few-Shot 是 Prompt 设计的两种基本范式，描述了"向模型提供多少示例"来完成任务。理解两者的适用边界，是选择正确 Prompt 策略的起点。

## Zero-Shot 提示

Zero-Shot 是指不提供任何示例，只描述任务，直接让模型完成。

```typescript
// Zero-Shot 示例：情感分析
const prompt = `
判断以下评论的情感倾向，输出 "positive"、"negative" 或 "neutral"：

评论：「这款手机续航真的太棒了，用了两天才充一次电！」

情感：
`
```

**优点：**
- Prompt 简洁，token 消耗少
- 对通用任务（模型预训练时见过大量类似数据）效果已经很好

**局限：**
- 输出格式难以精确控制
- 对于罕见任务、特殊领域、或需要遵循特定约定的场景效果差
- 输出风格不一致

## Few-Shot 提示

Few-Shot 是指在 Prompt 中提供少量（通常 2–8 个）输入-输出示例，让模型从示例中"学习"期望的格式和行为。

```typescript
// Few-Shot 示例：统一的结构化情感分析
const prompt = `
判断评论的情感倾向，用 JSON 格式输出。

示例 1：
输入：「快递很快，包装完好，满意！」
输出：{"sentiment": "positive", "reason": "物流和包装均满足预期"}

示例 2：
输入：「等了三周才到，卖家态度也很差。」
输出：{"sentiment": "negative", "reason": "配送时间过长，服务态度差"}

示例 3：
输入：「东西就那样，说不上好也说不上坏。」
输出：{"sentiment": "neutral", "reason": "无明显正面或负面体验"}

现在请分析：
输入：「这次购物体验还不错，但价格稍高。」
输出：
`
```

示例引导了模型：输出必须是 JSON；reason 字段的风格；如何处理混合情感。

## 示例选择的要点

Few-Shot 的质量很大程度取决于示例的选择：

### 覆盖典型情况

示例应涵盖任务的主要类型，尤其是模型容易出错的边界情况：

```
# 分类任务的示例应覆盖所有类别
# 翻译任务的示例应包含领域术语
# 代码生成的示例应包含异常处理模式
```

### 格式完全一致

所有示例必须遵循完全相同的格式。不一致的示例会让模型困惑：

```
# 错误：格式不一致
示例 1 输出：positive
示例 2 输出：{"sentiment": "negative"}

# 正确：格式统一
示例 1 输出：{"sentiment": "positive"}
示例 2 输出：{"sentiment": "negative"}
```

### 示例数量

- 通常 3–5 个示例效果最佳
- 示例过少（1 个）：格式约束力弱
- 示例过多（10+）：消耗大量 token，性价比低；且可能分散对指令的注意力
- 对于复杂任务，质量 > 数量

### 示例顺序

研究显示，最后一个示例对模型影响最大（接近效应）。把最"典型"或"最复杂"的示例放在最后。

## Dynamic Few-Shot（动态示例选择）

硬编码固定示例有局限——面对多变的输入，固定示例未必总是最优。动态 Few-Shot 根据当前输入，从示例库中检索最相关的示例：

```typescript
import { OpenAI } from 'openai'

interface Example {
  input: string
  output: string
  embedding?: number[]
}

// 伪代码：基于向量相似度的动态示例选择
async function buildDynamicFewShotPrompt(
  userInput: string,
  examplePool: Example[],
  topK: number = 3
): Promise<string> {
  // 1. 获取 userInput 的 embedding
  const inputEmbedding = await getEmbedding(userInput)
  
  // 2. 计算与示例池的相似度，取 Top-K
  const relevantExamples = examplePool
    .map(ex => ({
      ...ex,
      score: cosineSimilarity(inputEmbedding, ex.embedding!)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
  
  // 3. 组装 Prompt
  const exampleText = relevantExamples
    .map(ex => `输入：${ex.input}\n输出：${ex.output}`)
    .join('\n\n')
  
  return `${exampleText}\n\n输入：${userInput}\n输出：`
}
```

## Few-Shot vs Fine-tuning

常有人问：Few-Shot 和 Fine-tuning 该选哪个？

| 维度 | Few-Shot | Fine-tuning |
|------|---------|-------------|
| 数据需求 | 3–20 条示例 | 数百到数千条标注数据 |
| 成本 | 低（只需调 Prompt） | 高（需要训练基础设施） |
| 灵活性 | 随时修改，快速迭代 | 修改需重新训练 |
| 推理成本 | 每次携带示例，token 多 | 知识已编码，Prompt 可更短 |
| 适合场景 | 快速验证、示例数据少 | 固定任务、高频调用、格式严格 |

**经验法则：先用 Few-Shot 验证可行性，当任务固定且高频时再考虑 Fine-tuning。**

## 实践技巧

**示例分隔符要清晰：**

```
---
输入：xxx
输出：xxx
---
```

使用一致的分隔符让模型更容易解析示例边界。

**Few-Shot + CoT 结合：**

在示例中也展示推理过程，形成 Few-Shot CoT：

```
示例：
输入：「数组 [3,1,4,1,5] 中的最大值是？」
思考：遍历数组，记录最大值。3→1（保持3）→4（更新到4）→1（保持4）→5（更新到5）。
输出：5
```

## 面试常问

- Zero-Shot 和 Few-Shot 分别在什么情况下更适合？
- Few-Shot 示例的质量比数量更重要吗？为什么？
- Dynamic Few-Shot 是什么，如何实现？
- Few-Shot Prompting 和 In-Context Learning 是同一回事吗？
- 什么时候应该从 Few-Shot 升级到 Fine-tuning？
