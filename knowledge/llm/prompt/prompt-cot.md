# Chain-of-Thought 思维链技巧

Chain-of-Thought（CoT，思维链）是一种让 LLM 在给出最终答案之前，先输出推理过程的 Prompt 技术。研究表明，CoT 能显著提升模型在数学计算、逻辑推理、多步决策等复杂任务上的准确率。

## 为什么 CoT 有效

LLM 是自回归模型——每个 token 只能依赖之前生成的内容。如果直接要求输出答案，模型"没有机会"在生成过程中推演中间步骤。

CoT 的核心洞察：**让模型把中间步骤写出来，等于给自己提供了可依赖的"草稿纸"**。

```
不用 CoT：
Q: 一家店有 12 个苹果，卖出 3 个，又进货原来数量的一半，现在有几个？
A: 13（错误）

用 CoT：
Q: 一家店有 12 个苹果，卖出 3 个，又进货原来数量的一半，现在有几个？
A: 先分步计算：
   1. 卖出后：12 - 3 = 9 个
   2. 进货量 = 原来 12 的一半 = 6 个
   3. 现在 = 9 + 6 = 15 个
   答案是 15 个。（正确）
```

## CoT 的触发方式

### Zero-Shot CoT

最简单的方法：在 Prompt 末尾加一句魔法咒语。

```
请逐步思考，然后给出答案。
```

或者英文场景中常用的：

```
Let's think step by step.
```

```typescript
const prompt = `
以下代码有 bug，请找出原因并修复：

\`\`\`ts
function flatten(arr: any[]): any[] {
  return arr.reduce((acc, val) => acc.concat(val), [])
}
console.log(flatten([[1, [2]], [3]])) // 期望 [1, 2, 3]，实际输出 [1, [2], 3]
\`\`\`

请先分析问题所在，然后给出修复方案。
`
```

### Few-Shot CoT

提供带有推理过程的示例，引导模型模仿推理格式（与 Few-Shot 技术结合，详见 Few-Shot 文章）：

```
示例：
问：小明有 5 元，买了 2 元的糖，又收到 3 元压岁钱，现在有多少钱？
思考过程：
  - 初始：5 元
  - 买糖后：5 - 2 = 3 元
  - 收到压岁钱后：3 + 3 = 6 元
答案：6 元

现在你来回答：
问：仓库有 100 件商品，出库 30 件，又入库原来库存量的 20%，现在有多少件？
```

## CoT 的进阶变体

### Self-Consistency（自一致性）

单次 CoT 可能走歪。Self-Consistency 通过多次采样，取"最多数"答案：

```typescript
async function selfConsistency(
  client: Anthropic,
  question: string,
  samples: number = 5
): Promise<string> {
  const answers: string[] = []
  
  for (let i = 0; i < samples; i++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      temperature: 0.7,  // 非零温度以获得多样性
      messages: [{
        role: 'user',
        content: `${question}\n\n请逐步推理，最后一行只输出最终答案（数字/选项）。`
      }]
    })
    // 提取最后一行作为答案
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const lines = text.trim().split('\n')
    answers.push(lines[lines.length - 1])
  }
  
  // 取出现最多的答案（majority voting）
  const freq = new Map<string, number>()
  for (const ans of answers) {
    freq.set(ans, (freq.get(ans) ?? 0) + 1)
  }
  return [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0]
}
```

### Tree of Thoughts（ToT）

更进一步：生成多个推理路径，像树形搜索一样评估每条路径，选出最优解。适合需要回溯的规划类任务。实现复杂度较高，通常只用于离线高质量生成场景。

### ReAct（Reason + Act）

在 Agent 场景中，将 CoT 与工具调用结合：先推理（Reason）下一步该做什么，再执行（Act）工具，观察结果后继续推理——形成 Reason→Act→Observe 的循环。

```
Thought: 我需要查询当前用户的订单列表
Action: get_orders(user_id=123)
Observation: [{"order_id": "A001", "status": "shipped"}, ...]
Thought: 获取到了订单数据，现在整理输出
Final Answer: 用户有 1 条已发货订单 A001
```

## 适用场景与局限

**适合 CoT：**
- 数学计算、数量推理
- 多步骤逻辑推断
- 代码调试（逐步分析）
- 复杂决策（利弊权衡）

**不适合 CoT：**
- 简单分类、情感分析（CoT 反而可能引入噪声）
- 对延迟极敏感的实时场景（中间推理过程消耗大量 token）
- 创意写作（推理链可能让文章生硬）

## 实践注意事项

**控制推理长度：** CoT 会显著增加输出 token，进而增加成本和延迟。对于简单任务，用轻量模型直接回答往往更划算。

**让模型"先想后答"：** 有时可以要求模型把推理放在 `<thinking>` 标签内，最终答案放在 `<answer>` 标签，后处理时只取 `<answer>` 内容：

```
在 <thinking></thinking> 中写出你的推理过程，然后在 <answer></answer> 中给出最终答案。
```

**验证推理链的正确性：** CoT 改善准确率，但不能保证推理本身正确。对于关键任务，要对推理过程做程序化验证而非盲目信任。

## 面试常问

- 为什么 CoT 能提升推理准确率？从模型机制角度解释。
- Self-Consistency 和普通 CoT 有什么区别？
- 什么情况下 CoT 可能降低效果？
- ReAct 框架中 Reason 和 Act 分别对应什么？
- Tree of Thoughts 适合解决什么类型的问题？
