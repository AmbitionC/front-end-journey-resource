LLM API 按 token 计费，生产环境下不加控制很容易让成本失控。理解成本构成、系统性地应用优化策略，可以在不损失太多质量的前提下大幅降低开支。

## LLM 成本构成

| 类型 | 说明 | 典型占比 |
|------|------|---------|
| Input Token | 发送给模型的 Prompt（含 system prompt） | 通常占多数 |
| Output Token | 模型生成的内容 | 单价通常高于 Input |
| Embedding | 文本向量化，用于 RAG 检索 | 单次便宜，量大时可观 |
| Fine-tuning | 微调训练费用 + 微调模型推理费用 | 一次性 + 持续 |

Output token 的单价通常是 Input token 的数倍，控制输出长度往往比压缩 Prompt 效果更显著。

## 策略一：模型选择与降级路由

不同任务对模型能力的需求差异巨大。"用最贵的模型做所有事"是最大的浪费。

```ts
type TaskComplexity = "simple" | "medium" | "complex";

function selectModel(complexity: TaskComplexity): string {
  const modelMap: Record<TaskComplexity, string> = {
    simple: "gpt-4o-mini",      // 分类、摘要、格式化
    medium: "gpt-4o",            // 一般问答、代码生成
    complex: "claude-opus-4",    // 复杂推理、长文档分析
  };
  return modelMap[complexity];
}

// 通过启发式规则或轻量分类器判断任务复杂度
async function routeRequest(userMessage: string) {
  const complexity = await classifyComplexity(userMessage); // 用小模型分类
  const model = selectModel(complexity);
  return callLLM(model, userMessage);
}
```

**实践原则：**
- 意图分类、格式化、简单问答 → 小模型
- 代码生成、RAG 问答 → 中等模型
- 复杂多步推理、长文档理解 → 强模型
- 用小模型做路由器本身的成本极低

## 策略二：Prompt 优化

Prompt 长度直接决定 Input token 数量。

- **移除冗余描述**：删掉"你是一个有帮助的 AI 助手"之类的废话
- **System Prompt 复用**：利用 Prompt Cache（见下文），避免重复计费
- **Few-shot 精简**：3 个示例通常比 10 个效果差不多，但省了 70% 的 token
- **指令压缩**：用精确的动词替代冗长描述，如"列出 3 条" 替代 "请你帮我找一下并整理出三条"

## 策略三：Caching

### Prompt Cache（原生缓存）

主流 LLM 提供商（Anthropic、OpenAI）支持 Prompt Cache：当 Prompt 前缀完全相同时，缓存计算结果，后续请求只对新增部分计费。对于有长 System Prompt 的应用，可节省大量 Input token 费用。

### Semantic Cache（语义缓存）

对语义相近的问题返回缓存答案，无需再次调用 LLM：

```ts
import { createClient } from "redis";

interface CacheEntry {
  question: string;
  answer: string;
  embedding: number[];
  createdAt: number;
}

class SemanticCache {
  constructor(
    private redis: ReturnType<typeof createClient>,
    private embedFn: (text: string) => Promise<number[]>,
    private similarityThreshold = 0.92
  ) {}

  async get(question: string): Promise<string | null> {
    const queryEmbedding = await this.embedFn(question);
    // 在 Redis Vector Search 或向量库中查找最近邻
    const similar = await this.findSimilar(queryEmbedding);
    if (similar && similar.score >= this.similarityThreshold) {
      return similar.answer;
    }
    return null;
  }

  async set(question: string, answer: string): Promise<void> {
    const embedding = await this.embedFn(question);
    const entry: CacheEntry = {
      question,
      answer,
      embedding,
      createdAt: Date.now(),
    };
    // 存入向量库，设置 TTL
    await this.store(entry);
  }

  private async findSimilar(_embedding: number[]) {
    // 实际实现依赖具体向量库，以官方文档为准
    throw new Error("implement with your vector store");
  }

  private async store(_entry: CacheEntry) {
    throw new Error("implement with your vector store");
  }
}
```

### Exact Cache

对完全相同的请求（同 Prompt + 同参数）直接缓存响应，用 Redis 实现，TTL 根据内容时效性设置。

## 策略四：输出长度控制

Output token 贵，减少不必要的输出：

```ts
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [...],
  max_tokens: 500,            // 硬限制
  // 使用结构化输出，避免 LLM 自由发挥格式
  response_format: { type: "json_object" },
});
```

**技巧：**
- 明确要求"简洁回答"、"不超过 X 字"
- 用 JSON Schema 约束输出结构，减少 LLM 添加多余解释
- 流式输出（streaming）配合前端显示，可在用户满意时提前停止

## 策略五：批处理与异步

对于不需要实时响应的任务，批处理可以降低成本（部分提供商的 Batch API 有价格折扣）：

```ts
// 非实时场景：文章摘要、数据提取等
async function batchSummarize(articles: string[]): Promise<string[]> {
  // OpenAI Batch API 示例骨架（以官方文档为准）
  const requests = articles.map((article, i) => ({
    custom_id: `summary-${i}`,
    method: "POST",
    url: "/v1/chat/completions",
    body: {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: `Summarize: ${article}` }],
      max_tokens: 200,
    },
  }));

  // 提交批处理任务，异步等待结果
  // 具体 API 以 OpenAI 官方文档为准
  return submitBatch(requests);
}
```

## 策略六：RAG 替代 Long Context

将知识库外部化，按需检索，而非每次把整个知识库塞进 Prompt：

```
❌ 低效：system_prompt + 100页文档 + 用户问题 → 极长 context，每次都付完整费用
✅ 高效：向量检索相关片段（Top-K）→ 只传 3-5 段相关内容
```

RAG 不仅减少 token，还能提升回答质量（减少无关信息干扰）。

## 成本监控：设置预算告警

```ts
interface CostAlert {
  userId: string;
  dailyBudget: number;  // USD
  currentSpend: number;
}

async function checkBudget(alert: CostAlert): Promise<"ok" | "warning" | "exceeded"> {
  const ratio = alert.currentSpend / alert.dailyBudget;
  if (ratio >= 1.0) return "exceeded";
  if (ratio >= 0.8) return "warning";  // 80% 时告警
  return "ok";
}
```

在可观测平台（LangSmith / Langfuse）中设置成本指标告警，异常飙升时立即触发通知。

## 面试常问

**Q：如何在质量和成本间权衡？**
核心是任务分层：通过启发式规则或轻量分类器判断任务复杂度，简单任务用小模型，只有真正需要强推理能力的任务才调用昂贵模型。同时建立评估基准，确认降级后质量仍在可接受范围内。

**Q：Prompt Cache 是什么？**
Prompt Cache 是提供商级别的缓存机制。当多次请求的 Prompt 前缀相同时（如相同的 System Prompt），提供商缓存前缀的 KV 计算结果，后续请求只需计算新增部分的 token，缓存命中的前缀部分费率大幅降低（有些低至原价的 10%）。Anthropic 和 OpenAI 均支持此功能，具体折扣比例以官方定价为准。

**Q：Semantic Cache 的阈值如何设定？**
阈值过高（如 0.99）几乎没有缓存命中；过低（如 0.8）可能返回语义相近但问题不同的答案。通常从 0.90~0.95 开始，结合业务场景和人工抽检逐步调整，并记录缓存命中率和错误率。
