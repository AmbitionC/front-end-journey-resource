公司：百度；方向：后端；来源自述为秋招一面，并写有 7 月 30 日，未明确年份与部门。本文选录上线延迟、多工具失败恢复和最长子串三组问题。原题缺失的系统细节与输入约定不复原，以下解答及例子均为编辑教学补充。

<details data-knowledge-key="logging-monitoring">
<summary>（1）接口上线后耗时突然增加，应怎样定位？</summary>
</details>

先确认受影响的版本、接口与请求范围，比较延迟分布、错误、流量和资源饱和，再沿同一请求的 tracing 分段找等待发生在入口、应用还是依赖。把发布变更与慢请求证据关联，验证具体假设后修复或回滚；只有耗时变长，不能直接判定是数据库或模型变慢。

例如教学场景中 p50 基本不变而 p99 上升，应进一步看慢请求是否集中在某租户、参数或实例，并分开排队时间、连接池等待、数据库执行、外部调用与序列化。使用可关联的 request_id/trace_id 对齐指标、跨度与日志，同时检查监控口径是否随发布改变。

[Google SRE 的监控章节](https://sre.google/sre-book/monitoring-distributed-systems/)以延迟、流量、错误和饱和度组织观察，也区分用户可见症状与内部原因。没有错误日志不意味着没有失败：可能是采集、日志级别、关联或错误传播出了问题，必要时在受控范围增加证据，避免无边界记录敏感内容或高基数标签。

回滚能帮助缩小与版本相关的范围，但不单独证明根因；还要复现触发条件、比较修复前后的相同请求合同与负载，并保留回归用例。原帖没有指标、调用链或真实根因，本文不能代填排查结论与改善比例。

延伸阅读：[日志、指标、Tracing 与告警](../../../knowledge/backend/devops/logging-monitoring.md)。

<details data-knowledge-key="agent-tool-timeout">
<summary>（2）Agent 多工具执行中途失败时，怎样恢复并安排人工介入？</summary>
</details>

保留每一步的输入、结果与执行状态，失败后先判断是否有副作用及结果是否已确定，再决定重试、查询状态、补偿或暂停。只在剩余时间与次数预算内重试可恢复故障；重复执行可能改变业务时需要幂等或核对。人工介入应带着当前状态恢复，不能把整个流程盲目从头再跑。

教学例子是一条“查库存→创建订单→发送通知”的流程。库存查询暂时失败可以有界重试；创建订单超时则可能已经成功，应按稳定业务请求身份查询或复用幂等结果，再决定下一步。撤销既成副作用属于补偿，补偿本身也可能失败，不能把一次异常处理称为全流程自动回滚。

[RFC 9110 对幂等的定义](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2)约束重复请求的预期效果，[AWS 的重试退避模式](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/retry-backoff.html)强调瞬时故障、幂等与重试负载。应把总 deadline 分配给各步骤，避免每层各自耗尽整段超时并层层叠加重试。

超过预算或结果无法确认时，把已完成、失败、未知状态及证据交给人工或业务恢复流程。[OpenAI 的人工审核与可恢复状态说明](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals)说明暂停后继续同一状态的方式；这不是对来源所用框架的认定。原帖仅保留了重试、异常处理和必要时人工介入的简答，以上是补充设计。

延伸阅读：[工具超时、取消与重试](../../../knowledge/llm/agent/agent-tool-timeout.md)。

<details data-knowledge-key="algorithm-array">
<summary>（3）怎样求无重复字符的最长子串？</summary>
</details>

维护一个不含重复字符的连续窗口，并记录每个字符最近出现的位置。读到重复字符时，将左边界推进到该字符上次位置之后，且左边界不能后退；每步更新最大窗口长度。在哈希操作平均 O(1) 的模型下，时间 O(n)，额外空间取决于出现的字符种类。

原记录只保留题目名称，没有输入输出或字符约定。下面教学函数返回按 Unicode 码点计的长度；子串必须连续，不能删掉中间字符后当作子串。

```javascript
function longestUniqueSubstringLength(text) {
  const lastSeen = new Map();
  let left = 0, right = 0, best = 0;
  for (const char of text) {
    const previous = lastSeen.get(char);
    if (previous !== undefined) left = Math.max(left, previous + 1);
    lastSeen.set(char, right);
    best = Math.max(best, right - left + 1);
    right += 1;
  }
  return best;
}
```

处理 abba 的最后一个 a 时，它上一次出现的位置已在窗口外，不能把 left 从 2 退到 1，因此必须取 max。空串返回 0，全部相同字符返回 1，abba 返回 2；这些是教学例子，不是原题测试数据。

[ECMAScript 的字符串迭代器规范](https://tc39.es/ecma262/multipage/text-processing.html#sec-string.prototype-@@iterator)规定按码点迭代，码点仍不等于用户可见的一个字素。若面试题要求 UTF-16 码元、字节、字素或实际子串，遍历、索引和输出都应采用同一单位，不能从题名推定 ASCII 或具体长度上限。

延伸阅读：[数组、字符串与双指针](../../../knowledge/data-structure/algorithm/algorithm-array.md)。

## 参考资料

- [Google SRE：监控分布式系统](https://sre.google/sre-book/monitoring-distributed-systems/)。
- [RFC 9110：幂等方法与自动重试](https://www.rfc-editor.org/rfc/rfc9110.html#name-idempotent-methods)。
- [AWS：Retry with backoff](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/retry-backoff.html)。
- [OpenAI：Guardrails and human review](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals)。
- [ECMAScript：String iterator](https://tc39.es/ecma262/multipage/text-processing.html#sec-string.prototype-@@iterator)。
