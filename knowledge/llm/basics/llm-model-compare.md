# 主流模型对比：GPT / Claude / Qwen / DeepSeek

当前 LLM 生态中有多条主要产品线，各自有不同的架构取向、能力侧重和使用场景。本文从工程师视角做定性对比，不列具体跑分数字与精确价格——基准测试结果和定价变化频繁，**以各官方最新文档为准**。

## 四大主流系列概览

### GPT 系列（OpenAI）

OpenAI 的 GPT 系列是目前生态最成熟的商业模型，涵盖从轻量到旗舰的多个档位。

**能力特点：**
- 多模态支持完善（文本、图像、语音、视频）
- 工具调用（Function Calling）和结构化输出生态最早成熟
- API 稳定性高，SDK 覆盖语言广，社区文档丰富
- Reasoning 模型（o 系列）在数学、逻辑推理任务上有专项优化

**适用场景：** 需要稳定生产级 API、多模态能力、或大量第三方生态集成（LangChain、LlamaIndex 等默认优先支持）时。

**局限：** 国内网络访问受限；高端模型成本相对较高；数据不出境敏感场景不适用。

---

### Claude 系列（Anthropic）

Anthropic 以"安全可控的 AI"为核心理念，Claude 在长文本理解和遵循复杂指令方面口碑较好。

**能力特点：**
- 超长 Context Window 是显著特色（支持数十万甚至更长 token）
- 在需要细致遵循指令、保持角色一致性的任务中表现稳定
- 代码生成能力强，尤其在理解大型代码库方面
- 对 Constitutional AI 原则的遵守使其拒绝率相对较高，某些场景需注意
- 支持 Computer Use 等 agent 能力

**适用场景：** 超长文档分析、代码审查与生成、需要严格遵循系统指令的 agent 任务。

**局限：** 国内同样访问受限；部分创意生成任务因安全约束相对保守。

---

### Qwen 系列（阿里云 / 通义千问）

Qwen 是阿里巴巴开源与商业双轨并行的模型系列，中文能力是其突出优势。

**能力特点：**
- 中文理解与生成质量高，对中文语境、文化背景处理自然
- 开源模型（Qwen2.5 等）可本地部署，满足数据不出境需求
- 多模态版本（Qwen-VL）支持图像理解
- 支持通过阿里云 DashScope 调用，国内延迟低
- 代码、数学能力在同量级模型中有竞争力

**适用场景：** 中文为主的业务场景、需要私有化部署、国内合规要求、阿里云技术栈集成。

```typescript
// DashScope 调用骨架（以官方文档为准）
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
})

const response = await client.chat.completions.create({
  model: 'qwen-plus', // 具体模型名以官方最新列表为准
  messages: [{ role: 'user', content: '你好' }],
})
```

**局限：** 英文及小语种能力相比 GPT/Claude 旗舰版仍有差距；生态工具链成熟度不及 OpenAI。

---

### DeepSeek 系列（深度求索）

DeepSeek 以高性价比和开源策略在技术社区引发广泛关注，其 MoE 架构在推理效率上有创新。

**能力特点：**
- DeepSeek-V 系列采用 MoE（Mixture of Experts）架构，推理成本相比稠密模型更低
- DeepSeek-R 系列专注推理（Reasoning），在数学、代码、逻辑类任务上表现突出
- 开源权重可商用（具体协议以官方为准）
- API 价格极具竞争力，适合高并发、成本敏感场景
- 与 OpenAI API 格式兼容，迁移成本低

**适用场景：** 成本敏感的批量处理、数学/代码推理任务、希望用开源模型自托管。

```typescript
// DeepSeek API 与 OpenAI SDK 兼容（以官方文档为准）
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
})

const response = await client.chat.completions.create({
  model: 'deepseek-chat', // 或 deepseek-reasoner，以官方最新列表为准
  messages: [{ role: 'user', content: 'Hello' }],
})
```

**局限：** 生态工具链相对较新；数据处理合规性需自行评估。

## 横向对比维度

| 维度 | GPT | Claude | Qwen | DeepSeek |
|------|-----|--------|------|----------|
| 中文能力 | 良好 | 良好 | 优秀 | 良好 |
| 长上下文 | 支持 | 特别强 | 支持 | 支持 |
| 推理能力 | 强（o 系列） | 强 | 良好 | 强（R 系列） |
| 开源可选 | 否 | 否 | 是 | 是 |
| 国内访问 | 受限 | 受限 | 友好 | 友好 |
| 生态成熟度 | 最成熟 | 较成熟 | 成长中 | 成长中 |
| 成本 | 中高 | 中高 | 中低 | 低 |

> 以上均为定性评估，具体能力和价格随版本迭代快速变化，**请以各官方最新文档和评测为准**。

## 选型思路

```
中文业务 + 合规要求高 → Qwen / DeepSeek（私有化部署）
成本敏感 + 高并发    → DeepSeek API
超长文档 + 复杂指令  → Claude
生态集成 + 多模态    → GPT
数学/代码推理        → DeepSeek-R 系列 / GPT o 系列
```

## 面试常问

- 为什么说 MoE 架构在成本上有优势？
- Claude 的长 Context Window 有什么实际局限？
- 开源模型和闭源 API 在商业场景下如何取舍？
- 不同模型的 API 格式为什么大多兼容 OpenAI 格式？
