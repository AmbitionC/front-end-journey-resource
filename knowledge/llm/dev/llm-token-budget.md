上下文窗口不是可以随意塞满的“超长字符串”，而是指令、历史、检索证据、工具定义、当前输入和输出共同竞争的有限预算。只在接口报错后从开头截掉几条消息，会同时破坏安全指令、事实连续性和答案完整性。生产系统应在请求前分配预算，在响应后用真实 usage 校准。

## 一个可执行的预算公式

设模型允许的总上下文为 $W$，请求各部分 token 为：

$$
S + P + H + R + T + U + O + M \le W
$$

其中：

- $S$：系统与安全指令；
- $P$：受保护的业务事实、用户偏好或状态；
- $H$：会话摘要与近期历史；
- $R$：检索证据；
- $T$：工具定义和工具结果；
- $U$：当前用户输入；
- $O$：预留输出；
- $M$：估算误差和协议开销的安全余量。

预算器先锁定 $S$、$U$、最低 $O$ 和 $M$，再在 $P/H/R/T$ 之间按任务分配。不要把输出预留写成“剩多少用多少”；否则一个很长的检索上下文会让答案突然被截断。

![上下文窗口按优先级分配给系统、摘要、近期消息、检索、工具、用户输入和输出余量](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-token-budget-context-allocation-v1.webp)
*图：系统约束与输出预留受保护，溢出内容按显式优先级压缩或剔除。*

## Token 计数不是字符数除以四

Token 数受模型 tokenizer、语言、代码、JSON、图片/音频计量和消息序列化影响。英文经验值不能直接套到中文或工具 Schema。供应商的计数接口或兼容 tokenizer 可用于请求前估算，响应 usage 才是该次调用的计量事实。

截至 2026-07-15，OpenAI Cookbook 的[tiktoken 计数示例](https://developers.openai.com/cookbook/examples/how_to_count_tokens_with_tiktoken)、Anthropic 的[Token counting](https://platform.claude.com/docs/en/build-with-claude/token-counting)和 Gemini 的[Tokens 指南](https://ai.google.dev/gemini-api/docs/tokens)分别提供各自的计数能力或说明，但字段、模态和缓存计量不同。跨供应商路由时应由适配器调用目标模型的计数能力，不要用供应商 A 的 tokenizer 判断供应商 B 是否溢出。

## 把内容分成保护级别

建议至少有四级：

1. **不可删除**：安全规则、输出契约、当前用户输入、必要授权事实；
2. **任务关键**：直接支持当前问题的证据和工具结果；
3. **可压缩**：较早对话、重复说明、长工具输出；
4. **可丢弃**：过期候选、调试信息、与任务无关的寒暄。

同一来源内部也要细分。一个 30 KB 的工具 JSON 中可能只有 3 个字段需要进入模型；先在代码层投影字段，通常比让模型读完整对象再总结更可靠。

```ts
type BudgetItem = {
  id: string;
  kind: "instruction" | "history" | "retrieval" | "tool" | "user";
  tokens: number;
  priority: 0 | 1 | 2 | 3;
  compress?: () => Promise<BudgetItem>;
};

function pick(items: BudgetItem[], capacity: number) {
  return [...items]
    .sort((a, b) => a.priority - b.priority)
    .reduce<BudgetItem[]>((kept, item) => {
      const used = kept.reduce((sum, value) => sum + value.tokens, 0);
      return used + item.tokens <= capacity ? [...kept, item] : kept;
    }, []);
}
```

这只是示意。真实实现要先保证同一对话回合、工具调用与结果不被拆散，并在舍弃内容时记录原因。

## 截断顺序应该由任务决定

一个常见顺序是：

1. 删除重复检索块和低相关候选；
2. 投影工具结果，只保留任务字段；
3. 压缩旧历史，保留近期原文；
4. 缩短可选示例和描述；
5. 降低输出目标或转为分阶段任务；
6. 仍超限则明确失败或请求用户缩小范围。

不能从数组头部机械 `slice()`，因为最早位置常放系统规则。也不能从用户输入尾部静默截断，否定条件、日期或输出格式可能正好在最后。

## 摘要会引入新的错误

会话压缩不是无损编码。摘要可能遗漏约束、混淆说话者或把不确定内容写成事实。为摘要定义 Schema，例如目标、已确认事实、未决问题、用户偏好和禁止项；关键标识符、金额、日期和引用保留原文或结构化状态。

每次摘要记录来源消息范围、提示版本和模型版本。用回放测试比较“原始历史答案”和“压缩历史答案”，特别检查否定、撤回、权限和工具副作用。摘要更新采用替换已覆盖区间，而不是不断总结旧摘要形成信息漂移。

## 检索与工具也要有独立预算

检索不能按固定 top-k 盲塞。可以先去重、按文档/主题限制占比，再按证据价值与 token 成本选择；长文优先放支持声明的局部片段，并保留来源定位。

工具 Schema 本身可能很大。只暴露当前状态允许调用的工具，简化冗长描述；工具返回先在服务端校验和裁剪。需要完整数据时，让模型通过分页或后续工具按需取，而不是一次塞入全部记录。

## 观测与回归

按请求记录估算 token、实际输入/输出 usage、各预算区占比、压缩/丢弃原因、截断结束原因、模型与提示版本。关键指标包括：预算溢出率、回答因长度停止率、摘要启用率、检索利用率、每任务 token 和质量指标。

模型窗口变大不代表可以取消预算器。更长输入仍会增加费用和延迟，噪声还会稀释关键信息。升级模型时用同一评测集比较质量、用量和长上下文切片，再调整配额。

## 常见误区

- 用字符数或单一 tokenizer 估算所有模型；
- 先塞满输入，再把输出上限设成剩余空间；
- 按消息时间一刀切，破坏工具调用配对；
- 把摘要当无损事实存储；
- 为“以防万一”暴露全部工具和完整 Schema；
- 只监控总 token，不记录是哪一类内容膨胀；
- 看到大上下文窗口就停止检索去重和优先级管理。

## 小结

Token 预算是一套上下文资源调度机制：先保护规则、当前意图和输出余量，再让历史、检索和工具按价值竞争空间；估算用于预检，真实 usage 用于校准。显式优先级、可追溯压缩和质量回归，比报错后的随机截断可靠得多。

## 参考资料

- [OpenAI Cookbook — How to count tokens with tiktoken](https://developers.openai.com/cookbook/examples/how_to_count_tokens_with_tiktoken)
- [Anthropic — Token counting](https://platform.claude.com/docs/en/build-with-claude/token-counting)
- [Gemini API — Tokens](https://ai.google.dev/gemini-api/docs/tokens)
