腾讯 CSIG 腾讯云技术与产品方向后台开发日常实习一面，未注明面试日期。原记录在算法环节后标注约 60 分钟；本页选 Skill/MCP 与有序查找两组，分布式 LRU 因合同不完整不展开。

经历、岗位与面试过程均来自候选人自述，未独立认证。以下短答、详解与例子为编辑补充，不是候选人的现场答案或企业标准答案；未披露条件会明确列为教学假设。

<details data-knowledge-key="mcp-protocol">
<summary>（1）Skill 与 MCP 各承担什么职责，使用时怎样组合？</summary>
</details>

短答：Skill 组织完成任务所需的说明、脚本和资源；MCP 约定应用与外部能力的发现和交互。Skill 可以指导使用允许的 MCP 工具，宿主仍负责参数、权限和结果校验。

详解：例如“分析日志”的 Skill 可以提供步骤和辅助资源，MCP 服务暴露受控读日志能力；确定性代码也能调用该能力，并不要求每次由模型决策。工具可见不等于获得授权，加载说明也不等于任务已成功。实际协议版本与产品实现须明确；原文只给提问，没有说明候选人的 AI Coding 项目是否已实施，不能补成已完成经历。

知识导航：[MCP / A2A 智能体通信协议](../../../knowledge/llm/agent/mcp-protocol.md)。

<details data-knowledge-key="algorithm-array">
<summary>（2）有序数组中，怎样找出 target 首次和末次出现的位置？</summary>
</details>

短答：先约定非降序输入、索引和未命中结果。分别二分求第一个大于等于 target 的位置 l、以及第一个大于 target 的位置 r；确认 l 确实命中后，首末为 [l, r−1]。

详解：教学约定采用从 0 开始的闭区间索引，不存在返回 [-1, -1]：[1,2,2,2,4] 查 2 得 [1,3]，空数组也能安全退出。半开搜索区间持续缩小，比较条件区分两种边界；不能找到任意相等项就停，也不用 target+1 替代 upper bound。前提是输入有序、比较稳定且查找期间不被修改；查找 O(log n)、额外空间 O(1)，若先全量验序还需计 O(n)。实现时还应覆盖全部重复、目标缺失、目标位于端点和空数组等情况。

知识导航：[数组、字符串与双指针](../../../knowledge/data-structure/algorithm/algorithm-array.md)。

## 参考资料

- [Agent Skills：说明与资源结构](https://agentskills.io/specification)

- [MCP 2025-11-25：工具合同](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)

- [Python：左右插入边界](https://docs.python.org/3/library/bisect.html)
