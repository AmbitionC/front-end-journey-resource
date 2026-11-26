记录为米哈游服务端线下直通面，具体轮次和面试日期未注明。原帖发表于 2026 年 4 月，以下只整理这一独立面试过程的四道设计题；短答为编辑教学思路，不代表作者现场回答或公司的实际实现。

<details data-knowledge-key="api-idempotency"><summary>（1）一个装备合成接口怎样设计，怎样保证不会吞掉玩家的材料？</summary></details>
<p>先明确合成规则，把“材料扣除与对应产物发放共同成功或共同撤销”作为业务不变量。在可落到同一数据库事务的前提下，原子校验材料数量、扣材料、生成产物并保存合成记录；同一次合成的重试复用稳定操作 ID，防止重复扣除。响应丢失时按原操作 ID 查询结果，不能把超时直接当作失败再扣一次；若库存与产物跨系统，需另行明确一致性和恢复方案。</p>

<details data-knowledge-key="distributed-saga-consistency"><summary>（2）玩家 A、B 分别位于两台服务器，怎样保证交易系统的可靠性？</summary></details>
<p>先确认资产由谁权威存储，以及交易要求立即原子完成，还是允许可恢复的中间态；两台服务器并不必然对应两个数据库事务。若必须跨独立存储，可围绕交易 ID、资产预留、持久状态和幂等步骤讨论提交与恢复；只有业务允许中间态与补偿时才考虑 Saga。超时先核实双方结果，补偿失败继续留有恢复记录；Saga 不提供全局隔离，不能靠“失败就补偿”保证任何时候都没有半完成交易。</p>

<details data-knowledge-key="agent-coding"><summary>（3）怎样通过手机上的聊天或通讯软件，遥控 PC 上的 agent 完成代码编写？每一步怎样设计？</summary></details>
<p>先确定通讯软件提供的接入能力、操作者身份，以及可以操作的 PC 和代码仓库范围，再把获准消息转换成带稳定任务 ID 与验收要求的请求。一种教学方案是由任务服务持久保存请求，PC 端通过认证通道领取任务，在受限工作区调用 Coding Agent 读代码、修改和测试，并回传进度、Diff 与验证结果。重复消息按任务 ID 去重，断线后先查询已有任务状态；推送、部署等动作按授权单独处理，不能把任意聊天文本直接当作本机命令。</p>

<details data-binding-status="pending_semantic_verification"><summary>（4）怎样设计组队匹配系统，让 1～4 人组队进入一个 100 人的场景服务器？给你一个 agent，如何完成这个需求？</summary><p>关联知识点待核实。</p></details>
<p>先澄清题中 agent 的含义、职责及可用接口，再确认队伍如何保持完整、场景容量如何约束，以及匹配成功的验收条件。原文没有交代 agent 是辅助开发工具还是系统中的某个角色，也未给出匹配规则，因此保留待核实，不据此补造智能体编排、匹配算法或并发规模。</p>

## 技术核对资料

- [AWS：通过稳定请求身份让重试安全](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)
- [Microsoft：Saga 的本地事务、补偿与隔离边界](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga)
- [GitHub：Agent 的权限边界及生成代码验证责任](https://docs.github.com/en/copilot/responsible-use/agents)

## 关联复习

- [接口幂等与结果确认](../../../knowledge/backend/api/api-idempotency.md)
- [跨服务事务与补偿边界](../../../knowledge/backend/storage/distributed-saga-consistency.md)
- [Coding Agent 执行与验证](../../../knowledge/llm/agent/agent-coding.md)
