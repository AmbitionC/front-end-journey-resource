这一篇只做一件事：不用框架，亲手写出一个最小的 Thought–Action–Observation 循环。写完后你会发现，智能体最核心的部分不是一个神秘类名，而是**模型提出动作、程序执行工具、结果回到上下文、循环决定继续还是结束**。

## 一、先理解三个词

- **Thought**：模型基于目标和当前轨迹选择下一步。工程上不需要保存或展示模型的私有长推理，只需保留可审计的决策摘要和结构化动作。
- **Action**：模型提出的工具调用，例如查询天气、搜索文档或读取订单。
- **Observation**：程序真实执行工具后得到的结果或错误，它会成为下一轮输入。

ReAct 论文将推理轨迹与任务动作交错，让外部观察反过来更新后续计划。[ReAct 论文](https://arxiv.org/abs/2210.03629) 现代 API 通常以结构化 Tool Calling 实现 Action，不必让模型手写一行容易解析失败的文本。

![最小智能体按照模型、Action、工具执行、Observation 的顺序循环，并由停止条件限制运行](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-first-demo-loop-v2.png)

## 二、我们要完成什么

任务是：

> 查询北京天气，并给出一句出行建议。

工具只有一个：getWeather。为了让示例可以直接运行，我们先用一个可预测的 demo model 模拟“模型决定”；之后只需把它替换为任意支持结构化工具调用的模型接口，循环本身不用改。

## 三、先定义结构化协议

~~~ts
type ToolName = "getWeather";

type Decision =
  | {
      type: "action";
      tool: ToolName;
      args: { city: string };
      summary: string;
    }
  | {
      type: "final";
      answer: string;
    };

type TraceItem =
  | { type: "action"; tool: ToolName; args: { city: string } }
  | { type: "observation"; tool: ToolName; result: unknown };

interface Model {
  decide(input: {
    task: string;
    trace: TraceItem[];
    tools: ToolName[];
  }): Promise<Decision>;
}
~~~

Decision 使用判别联合类型，程序不需要从自由文本里猜“这次到底是回答还是工具调用”。summary 只记录简短的决策理由，例如“需要先获取天气”，不是要求模型暴露隐藏思维链。

## 四、实现工具注册表

~~~ts
type ToolContext = {
  userId: string;
  signal: AbortSignal;
};

type WeatherResult = {
  city: string;
  condition: "sunny" | "rainy";
  temperatureC: number;
};

const tools = {
  async getWeather(
    args: { city: string },
    context: ToolContext,
  ): Promise<WeatherResult> {
    if (context.signal.aborted) {
      throw new Error("ABORTED");
    }

    if (!args.city.trim()) {
      throw new Error("CITY_REQUIRED");
    }

    // 教学用固定结果；生产中改为真实天气 API。
    return {
      city: args.city,
      condition: "sunny",
      temperatureC: 28,
    };
  },
};
~~~

工具函数不直接信任模型参数。即使只有一个 city，也要校验空值、超时和取消信号。真实写操作还应校验身份、权限、幂等键和审批状态。

## 五、写一个可运行的 Demo Model

~~~ts
const demoModel: Model = {
  async decide({ task, trace }) {
    const lastObservation = [...trace]
      .reverse()
      .find(
        (item): item is Extract<TraceItem, { type: "observation" }> =>
          item.type === "observation",
      );

    if (!lastObservation) {
      return {
        type: "action",
        tool: "getWeather",
        args: { city: task.includes("北京") ? "北京" : "" },
        summary: "回答前需要获取目标城市的天气。",
      };
    }

    const weather = lastObservation.result as WeatherResult;
    const advice =
      weather.condition === "rainy"
        ? "记得带伞，并预留通勤时间。"
        : "天气晴朗，注意防晒和补水。";

    return {
      type: "final",
      answer: `${weather.city} ${weather.temperatureC}℃，${advice}`,
    };
  },
};
~~~

它不是大模型，却严格遵守与大模型相同的 Decision 协议。这样做的价值是：你可以先对循环、工具与错误处理写单元测试，再接入真实模型，而不是把所有问题混在一次 API 调用里。

接入真实模型时，应把工具名称、描述和参数 JSON Schema 传给 SDK，并将 SDK 返回的 tool call 映射为 Decision。不要用正则解析“Action: xxx”。

## 六、实现 Agent Loop

~~~ts
async function runAgent(params: {
  task: string;
  model: Model;
  userId: string;
  maxSteps?: number;
  timeoutMs?: number;
}) {
  const {
    task,
    model,
    userId,
    maxSteps = 5,
    timeoutMs = 10_000,
  } = params;

  const trace: TraceItem[] = [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    for (let step = 0; step < maxSteps; step++) {
      if (controller.signal.aborted) {
        throw new Error("AGENT_TIMEOUT");
      }

      const decision = await model.decide({
        task,
        trace,
        tools: ["getWeather"],
      });

      if (decision.type === "final") {
        return {
          status: "completed" as const,
          answer: decision.answer,
          steps: step + 1,
          trace,
        };
      }

      if (!(decision.tool in tools)) {
        throw new Error(`UNKNOWN_TOOL: ${decision.tool}`);
      }

      trace.push({
        type: "action",
        tool: decision.tool,
        args: decision.args,
      });

      let result: unknown;

      try {
        result = await tools[decision.tool](decision.args, {
          userId,
          signal: controller.signal,
        });
      } catch (error) {
        result = {
          ok: false,
          error:
            error instanceof Error ? error.message : "UNKNOWN_TOOL_ERROR",
        };
      }

      trace.push({
        type: "observation",
        tool: decision.tool,
        result,
      });
    }

    return {
      status: "stopped" as const,
      reason: "MAX_STEPS_REACHED",
      trace,
    };
  } finally {
    clearTimeout(timer);
  }
}
~~~

调用它：

~~~ts
const result = await runAgent({
  task: "查询北京天气，并给出一句出行建议",
  model: demoModel,
  userId: "user-123",
});

console.log(result);
~~~

循环只有四个关键分支：

1. 模型返回 final，正常结束。
2. 模型返回 action，程序校验并执行工具。
3. 工具成功或失败，都形成 Observation 回到轨迹。
4. 达到超时或最大步骤，强制停止。

## 七、为什么工具失败也要进入 Observation

如果工具错误直接抛到循环外，模型没有机会换参数、改用其他工具或向用户解释。把可恢复错误转换为结构化 Observation，下一轮就能做出选择。

不过，不是所有错误都值得重试：

| 错误类型 | 建议处理 |
|---|---|
| 临时网络超时 | 有上限地重试，使用退避 |
| 参数缺失 | 请求模型修正或向用户澄清 |
| 权限不足 | 立即停止，不允许模型绕过 |
| 预算耗尽 | 立即停止 |
| 不可逆写操作失败 | 查询真实状态后再决定，禁止盲目重复 |

## 八、把 Demo Model 换成真实模型时注意什么

真实模型适配器需要完成三件事：

1. 把 task、必要 trace 和工具 Schema 组成请求。
2. 把结构化 tool call 转成 Decision。
3. 把最终回答转成 final。

传给模型的轨迹应保留任务需要的信息，但不要无限追加原始响应。工具返回可能很大，应先裁剪为关键字段，并保存完整日志到可审计存储，而不是全部塞进 context window。

OpenAI 的 Agents SDK 将 agent 定义为模型、指令、工具与运行行为的组合；Anthropic 的工程文章则建议从简单可理解的循环开始，在确有收益时再引入复杂编排。[OpenAI：Agent definitions](https://developers.openai.com/api/docs/guides/agents/define-agents) [Anthropic：Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)

## 九、给循环补上生产护栏

最小 Demo 能跑，不代表能上线。至少还要增加：

- 输入 Schema 与工具参数校验；
- 身份认证和服务端权限判断；
- 步骤、token、时间和费用预算；
- 写操作的幂等键、预览与人工批准；
- 工具白名单和任务级最小暴露；
- trace、指标、错误切片和回放；
- 敏感信息脱敏与数据保留策略；
- 最终答案的事实、引用和策略校验。

有副作用的 Action 应采用“模型提议 → 程序验证 → 用户批准 → 工具执行”，不能让一段生成文本直接变成真实操作。

## 常见误区

- **要求模型输出完整 Thought**：生产系统需要可审计决策，不需要展示隐藏推理。
- **正则解析 Action**：格式稍有变化就会失败，应使用结构化工具调用。
- **工具成功就等于任务完成**：还要让模型或规则检查验收标准。
- **只设 while(true)**：必须有步骤、时间和费用上限。
- **所有错误都自动重试**：权限和不可逆操作尤其危险。
- **把整个工具响应塞回模型**：会浪费上下文并放大提示注入风险。
- **先上复杂框架再理解循环**：框架隐藏不了错误边界和授权问题。

## 小结

最小智能体就是一个受控循环：模型提出 Action，程序执行工具并得到 Observation，再把必要结果交给下一轮决策，直到返回 Final 或触发停止条件。理解这段循环后，框架、状态图、记忆和多智能体只是对同一核心机制的扩展。

## 参考资料

- [Yao et al.：ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)
- [Google Research：ReAct](https://research.google/blog/react-synergizing-reasoning-and-acting-in-language-models/)
- [Anthropic：Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [OpenAI：Agent definitions](https://developers.openai.com/api/docs/guides/agents/define-agents)
