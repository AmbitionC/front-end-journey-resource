字节跳动 · Agent 开发 · 一面。面试经历为候选人自述，未独立证实；问题按主题归纳，短答为独立整理，不代表候选人现场回答。

<details data-knowledge-key="prompt-context-compression">
<summary>（1）滑动窗口和摘要压缩怎么选？窗口保留多少轮？</summary>
</details>

窗口保留近期原文，适合强依赖最近交互的任务；摘要压缩较早信息，但可能遗漏约束。轮数不是通用常量，应结合 token 预算、工具结果规模与任务评测选择。重要实体、否定、时间及调用结果关系要保留或能回源，不能只按轮数机械删除。

<details data-knowledge-key="api-idempotency">
<summary>（2）文档在线更新怎样保证幂等，为什么考虑消息队列？</summary>
</details>

给业务更新定义稳定操作标识，用唯一约束或版本条件写入防止重复与旧任务覆盖新状态，并记录处理结果。队列可解耦摄取和索引、承受突发与重试，但重复投递仍需消费者去重；需要即时完成且负载可控时，直接调用也可成立。 [AWS Builders Library：幂等请求与安全重试](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)。

<details data-knowledge-key="build-agent-framework">
<summary>（3）怎样介绍 DeepSeek Harness、Pi Agent，并判断是否结合或替换现有实现？</summary>
</details>

先确认所指项目的仓库与版本，再检查模型接入、工具执行、状态、上下文、预算、调试和恢复职责，用相同任务验证缺口。简称不足以唯一确定实现，不能凭名称编造功能；结合或替换应解决可复现问题，并比较迁移、权限和维护成本。

<details data-knowledge-key="agent-memory-summarization">
<summary>（4）调研过哪些厂商的 Agent 产品，怎样说明 Claude Code 的上下文压缩？</summary>
</details>

按所用版本说明压缩触发、保留信息、摘要怎样进入后续输入以及原始记录如何恢复。应区分实际观察与产品文档，不能把工作摘要当成无损全文或永久记忆。评价压缩看关键约束与任务结果是否保留，不能只比较长度。 [Claude Code：上下文与自动压缩](https://code.claude.com/docs/en/how-claude-code-works)。

<details data-knowledge-key="agent-sandbox">
<summary>（5）Computer Use 怎样操作本地或云端电脑？</summary>
</details>

运行环境提供截图或界面状态，模型提出点击、输入等动作，执行层按权限实施后再观察。区别主要在会话、文件和网络位于本地还是远端；都需隔离凭据、约束可操作范围、检查动作结果，并处理界面变化、超时与取消。

<details data-knowledge-key="agent-coding">
<summary>（6）AI Coding 开发遇到问题怎样处理，完整工作流如何组织？</summary>
</details>

先明确需求、仓库约束和验收条件，再检查现状、拆小改动、生成补丁并验证。出错时用最小复现、日志和 diff 定位原因，修复后运行相关测试并复核影响；更自动化的流程仍需要可观察的结果，不能用模型声称完成代替验收。

<details data-knowledge-key="database-models">
<summary>（7）常见数据库类型有什么区别？</summary>
</details>

按数据模型、访问方式和一致性需求区分关系型、键值、文档、搜索及向量存储。关系型适合结构化关联和事务，向量索引服务相似性检索，缓存侧重低延迟访问；一套系统可组合使用，但跨系统更新与权限不会自动一致。

<details data-knowledge-key="mysql-index">
<summary>（8）MySQL 索引为什么常用 B+ 树？</summary>
</details>

以常见 InnoDB 索引为例，高扇出降低树高，键有序便于等值和范围定位，叶层顺序访问适合扫描。效果还取决于选择性、联合索引顺序、回表和执行计划；不是所有查询都因存在索引而更快。 [MySQL：多列索引与最左前缀](https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html)。

<details data-knowledge-key="algorithm-tree">
<summary>（9）怎样判断二叉树 B 是 A 的子结构？</summary>
</details>

先在 A 的每个候选节点尝试匹配 B：B 的要求匹配完就成功，值不同或 A 提前为空就失败；同时继续检查 A 的其他起点。先确认空 B 是否按题目约定视为子结构，并区分子结构匹配与两棵树完全相等。

<details data-knowledge-key="algorithm-array">
<summary>（10）两个有序 List 怎样求共同元素并分析复杂度？</summary>
</details>

用双指针比较当前元素，相等时记录并推进，不等时推进较小一侧，每个元素最多扫描一次，时间为 O(n+m)。先确认是否保留重复次数以及输出空间是否计入；已排序条件是这条线性路径的前提。

<details data-knowledge-key="algorithm-hash">
<summary>（11）无限且无法整体排序的序列怎样求交集？Bitmap 的边界是什么？</summary>
</details>

先确认元素范围、是否有序、能否保留历史和是否有结束条件。无序且无界时，精确去重或交集可能需要无界存储；可用外部存储或明确窗口处理。Bitmap 空间随值域增长，值域巨大时未必合适；分批本身不能消除跨批匹配和正确性问题。

## 候选人反问（原帖记录）

<details data-knowledge-key="agent-role-landscape">
<summary>（12）反问：团队业务和 AI Coding 使用方式应怎样了解？</summary>
</details>

围绕真实用户、任务边界、交付物、评测方式和开发协作询问，并用回答判断岗位是否匹配自己的经验。记录中的反问不等于团队已给出某种统一实践，不能据此编造内部政策或工具使用比例。

## 参考资料

以下资料用于核对整理短答；滚动文档核验于 2026-10-03。

- [AWS Builders Library：幂等请求与安全重试](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)（设计原理）
- [Claude Code：上下文与自动压缩](https://code.claude.com/docs/en/how-claude-code-works)（滚动文档）
- [MySQL：多列索引与最左前缀](https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html)（MySQL 8.4）
