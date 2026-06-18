Agent 的评估比普通 LLM 调用难得多：输出是非确定性的，执行路径是多步骤的，"对不对"本身就难以定义。没有系统性评估，Agent 的质量优化只能靠感觉。

## 为什么 Agent 评估难

1. **非确定性输出**：同一输入，不同运行可能产生不同的工具调用序列和最终结果
2. **多步骤依赖**：第 3 步的错误可能源于第 1 步的判断偏差，难以归因
3. **工具调用正确性**：不只是最终答案对不对，中间每一步的工具选择和参数是否合理都需要评估
4. **开放性任务**："写一份报告"没有标准答案，纯规则无法判断好坏

## 评估维度

### 任务完成率（Task Completion Rate）

最直接的指标：Agent 是否完成了用户要求的任务。

```ts
interface TaskResult {
  taskId: string;
  completed: boolean;          // 是否完成
  completionType: "success" | "partial" | "failed" | "timeout";
  stepCount: number;           // 执行了几步
  durationMs: number;
}

function computeCompletionRate(results: TaskResult[]): number {
  const completed = results.filter((r) => r.completionType === "success").length;
  return completed / results.length;
}
```

### 工具调用准确率（Tool Selection Accuracy）

对于有标准答案的任务，可以验证工具调用是否符合预期：

```ts
interface ToolCallExpectation {
  step: number;
  expectedTool: string;
  expectedArgsMatcher?: (args: unknown) => boolean;
}

function evaluateToolCalls(
  actual: ToolCall[],
  expected: ToolCallExpectation[]
): { precision: number; recall: number } {
  let correctTool = 0;
  for (const exp of expected) {
    const match = actual[exp.step];
    if (match?.name === exp.expectedTool) {
      if (!exp.expectedArgsMatcher || exp.expectedArgsMatcher(match.arguments)) {
        correctTool++;
      }
    }
  }
  return {
    precision: correctTool / actual.length,
    recall: correctTool / expected.length,
  };
}
```

### 轨迹正确性（Trajectory Evaluation）

不只看最终答案，而是评估完整执行路径是否合理：

```
黄金轨迹示例（"帮我预订明天下午 3 点的会议室"）：
Step 1: search_calendar(date="tomorrow", time="15:00")
Step 2: check_room_availability(rooms=["A101", "B202"], time="15:00")
Step 3: book_room(room="A101", time="15:00", duration=60)
```

实际轨迹与黄金轨迹的差异越小，得分越高。

### 响应质量（LLM-as-Judge）

用另一个 LLM 对 Agent 的最终回复打分：

```ts
async function llmAsJudge(params: {
  task: string;
  agentResponse: string;
  judgeModel: string;
}): Promise<{ score: number; reasoning: string }> {
  const judgePrompt = `
You are an impartial evaluator. Rate the following agent response on a scale of 1-5.

Task: ${params.task}
Agent Response: ${params.agentResponse}

Evaluate on:
- Correctness: Is the information accurate?
- Completeness: Does it fully address the task?
- Conciseness: Is it appropriately concise?

Return JSON: {"score": <1-5>, "reasoning": "<brief explanation>"}
  `;

  const result = await callLLM(params.judgeModel, judgePrompt);
  return JSON.parse(result);
}
```

## 评估方法

### 黄金数据集（Golden Dataset）

构建一批有标准答案的测试用例，覆盖典型场景和边界情况：

```ts
interface GoldenExample {
  id: string;
  input: string;
  expectedOutput?: string;           // 最终输出（可选）
  expectedTrajectory?: ToolCall[];   // 期望执行路径
  tags: string[];                    // 分类标签，如 ["booking", "edge-case"]
}

const goldenDataset: GoldenExample[] = [
  {
    id: "booking-001",
    input: "Book a meeting room for tomorrow 3pm",
    expectedTrajectory: [
      { name: "search_calendar", arguments: { date: "tomorrow", time: "15:00" } },
      { name: "book_room", arguments: { time: "15:00" } },
    ],
    tags: ["booking", "happy-path"],
  },
  // ...更多样本
];
```

黄金数据集要注意：定期更新（避免过拟合），覆盖失败场景，包含多样性输入。

### 确定性断言（Deterministic Assertion）

对结构化输出或工具调用参数做规则验证：

```ts
function assertToolCallValid(toolCall: ToolCall): void {
  if (toolCall.name === "book_room") {
    const args = toolCall.arguments as { room: string; time: string };
    if (!args.room) throw new Error("book_room missing required arg: room");
    if (!/^\d{2}:\d{2}$/.test(args.time)) {
      throw new Error(`book_room.time format invalid: ${args.time}`);
    }
  }
}
```

## 简单 Eval Runner 骨架

```ts
interface EvalCase {
  id: string;
  input: string;
  evaluate: (result: AgentResult) => EvalScore;
}

interface EvalScore {
  passed: boolean;
  score: number;    // 0-1
  details: string;
}

interface AgentResult {
  output: string;
  trajectory: ToolCall[];
  durationMs: number;
  tokenUsage: { input: number; output: number };
}

async function runEvalSuite(
  agent: (input: string) => Promise<AgentResult>,
  cases: EvalCase[]
): Promise<EvalReport> {
  const results = await Promise.allSettled(
    cases.map(async (c) => {
      const result = await agent(c.input);
      const score = c.evaluate(result);
      return { caseId: c.id, score, result };
    })
  );

  const scores = results
    .filter((r): r is PromiseFulfilledResult<typeof r extends PromiseFulfilledResult<infer T> ? T : never> => 
      r.status === "fulfilled")
    .map((r) => r.value);

  return {
    totalCases: cases.length,
    passedCases: scores.filter((s) => s.score.passed).length,
    avgScore: scores.reduce((sum, s) => sum + s.score.score, 0) / scores.length,
    details: scores,
  };
}
```

## 在 CI 中集成评估

```yaml
# .github/workflows/agent-eval.yml
- name: Run Agent Regression Tests
  run: npm run eval:agent
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    EVAL_THRESHOLD: "0.85"   # 低于此分数则 CI 失败
```

```ts
// eval/run.ts
const report = await runEvalSuite(agent, goldenDataset);
console.log(`Pass rate: ${report.passedCases}/${report.totalCases}`);
console.log(`Avg score: ${report.avgScore.toFixed(3)}`);

if (report.avgScore < Number(process.env.EVAL_THRESHOLD)) {
  console.error("Eval score below threshold! Blocking merge.");
  process.exit(1);
}
```

Prompt 变更后跑回归评估，防止"优化了一个场景，破坏了另一个场景"。

## 面试常问

**Q：如何评估 Agent 的"推理质量"？**
推理质量难以直接量化，常用代理指标：
1. 轨迹正确性——步骤是否合理，有无冗余或跳步
2. 中间输出的 LLM-as-Judge 评分（不只评最终答案）
3. 错误恢复能力——工具调用失败后，Agent 能否正确重试或转换策略
4. 自洽性测试——对语义等价的输入，输出是否一致

**Q：LLM-as-Judge 的偏差问题有哪些？**
- **位置偏差**：Judge 倾向于给先出现的答案更高分
- **长度偏差**：倾向于给更长的答案更高分（不管质量）
- **自我偏好**：同一厂商的模型互评时可能有偏袒
- **提示敏感性**：评分标准描述不同，结果差异大

缓解方法：多次评估取平均；随机化答案顺序；用多个不同的 Judge 模型；对 Judge 本身做一致性测试。

**Q：评估集多大合适？**
没有绝对标准。初期 50-100 条高质量样本比 1000 条低质量样本更有价值。关键是覆盖核心场景、边界情况、已知失败模式。随产品迭代不断扩充，将生产中发现的 Bug 转化为评估用例（Bug-Driven Dataset）。
