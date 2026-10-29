### 飞猪秋招一面：并发任务调度与 Agent 故障定位

原帖标题自述为飞猪秋招一面，并带有阿里标签；具体岗位、部门与面试日期未披露。

面试经历与轮次来自候选人自述，未独立认证。本文选录并发子任务与故障定位两题，短答和教学例子由编辑补充，不代表候选人现场回答或企业标准答案。

<details data-knowledge-key="agent-parallel-tools">
<summary>（1）工单分析 Skill 怎样安排并发子任务，哪些边界容易出错？</summary>
</details>
<p>先按数据依赖与共享副作用拆任务，输入已固定且互不冲突的分支才并行。设置有界并发、队列和整体及单任务截止时间，并让父任务收口子任务状态。汇合时校验任务ID、输入版本、状态与证据，预先约定必需分支失败和部分成功策略。重点检查竞态、迟到结果、遗漏取消与盲目重试；同时发出请求不会自动提供取消和重复安全。</p>

<p>教学例子（非原项目实现）：读取两份独立日志可以并行，故障结论要等待必需证据齐全；其中一份超时就按预定策略失败或标明缺口，不能把已返回的一份当成整个排查已经完成。</p>

技术核对：[Python：任务组与取消](https://docs.python.org/3/library/asyncio-task.html#task-groups)、[LangGraph：执行与更新屏障](https://docs.langchain.com/oss/python/langgraph/pregel)。

知识导航：[并行工具调用与依赖调度](../../../knowledge/llm/agent/agent-parallel-tools.md)。

<details data-knowledge-key="agent-debugging">
<summary>（2）入驻 Agent 填错商户资料并提交后，怎样定位问题出在哪一层？</summary>
</details>
<p>先控制后续错误提交并保全脱敏证据，明确哪个字段偏离了正确来源。冻结输入、提示词、模型与工具版本、状态和最终提交数据，用关联ID串起取数、生成、字段映射、校验、提交与落库，查找最早偏离证据的环节。分别验证模型、工具契约、陈旧或并发状态和下游写入等假设；日志时间或模型自报不能单独定责。在隔离环境用工具桩或受控结果重放，避免再次真实提交，最小修复后回归；证据不足时保留未知。</p>

<p>教学例子（非原项目故障）：同一字段的模型结果为A、发出的提交参数却为B，先检查两者之间的字段映射和状态读取，再核对后台最终写入。模型调用成功或商户投诉都不能单独证明错误由模型造成。</p>

技术核对：[W3C：跨组件追踪上下文](https://www.w3.org/TR/trace-context/)、[NIST：测量任务与方法局限](https://www.nist.gov/si-measurement-and-evaluation)。

知识导航：[Agent 调试方法与失败复现](../../../knowledge/llm/production/agent-debugging.md)。
