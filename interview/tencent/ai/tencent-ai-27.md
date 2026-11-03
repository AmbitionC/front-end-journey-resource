这份自述记录对应腾讯混元 AI 后台开发暑期实习一面，包含数据安全、上下文和并发手写题；具体面试日期未说明。 原记录主要保留提问，以下回答思路为编辑补充，不能据此推断当事人的现场作答、项目实现或面试结果。

<details data-knowledge-key="agent-data-privacy"><summary>（1）Agent 中的数据安全问题有没有处理过，是否调研过现成的数据安全方案？</summary></details>
<p>先沿模型上下文、工具、记忆与日志列出敏感数据流，说明最小化、脱敏、租户授权和保留删除分别落在哪里。现成方案按保护对象、部署边界与可复现测试比较。</p>

<details data-knowledge-key="llm-capability-boundaries"><summary>（2）简历项目中抑制模型幻觉的背景与方案是什么，怎样验证该策略的有效性？</summary></details>
<p>先说明项目在哪类输入上出现了不实结论，再对应证据检索、工具校验、输出约束或拒答等处理层。用固定任务集和相同判据比较修改前后，检查事实支持、错误拒答、延迟与成本，并保留失败样例。</p>

<details data-knowledge-key="llm-open-source-deployment"><summary>（3）实习中推理框架优化的背景和方案是什么？</summary></details>
<p>先给出任务、模型、硬件与负载，再用测量定位排队、预填充、生成或内存瓶颈，解释方案为何针对该瓶颈。比较相同长度和并发分布下的首 token、逐 token 延迟、吞吐、错误率与质量，说明取舍。</p>

<details data-knowledge-key="prompt-context-compression"><summary>（4）针对上下文爆炸问题，OpenClaw 是怎样处理的？</summary></details>
<p>按已核验的 OpenClaw 官方路径区分持久化的 compaction 摘要、仅作用于当前请求的旧工具结果 pruning，以及压缩前的可选 memory flush。摘要与保留尾部让下一次请求变短，持久记录供按需回读，但都没有扩大模型硬窗口。版本、后端和配置会影响行为，质量降级仍可能遗漏旧细节，不能把继续对话等同于无损解决。</p>

<details data-knowledge-key="agent-memory"><summary>（5）OpenClaw 对长期记忆是怎样处理和存储的？</summary></details>
<p>OpenClaw 的持久记忆可落在工作区 Markdown 笔记中，整理后的事实与决定和每日记录分开，当前文档另将稳定用户资料放入可选 USER.md。内置引擎默认用 SQLite 建立检索索引，memory_search 找候选，memory_get 按需读取笔记；其他后端与插件按实际配置确认。磁盘留存、索引可搜与本轮已加载是三件事，仍要检查来源、权限、时效和加载预算。</p>

<details data-knowledge-key="mcp-protocol"><summary>（6）是否了解 MCP？</summary></details>
<p>先固定 MCP 的协议版本，分清 Host、Client、Server 与模型工具调用的职责，再说明能力如何发现、参数怎样校验、结果如何返回。MCP 统一交互合同，不会自动授予资源权限，也不保证业务动作已经完成。</p>

<details data-knowledge-key="algorithm-tree"><summary>（7）如何根据前序和中序遍历还原二叉树？</summary></details>
<p>先确认节点值能唯一标识节点，以及两个序列是否一致；值唯一时以前序首项为根，在中序定位根并按左右区间大小递归重建。用中序位置表可避免每层反复查找，期望时间 O(n)，递归栈随树高增长。若值重复，单靠这两个遍历序列可能无法唯一确定结构，需补充标识或其他约束。</p>

<details data-knowledge-key="algorithm-loop"><summary>（8）m 个苹果放入 n 个盘子，盘子可以为空，共有多少种方法？</summary></details>
<p>原题未说明苹果和盘子是否可区分，应先澄清，允许空盘本身不能确定唯一答案。若苹果与盘子都相同，按少用一个盘或每盘先放一个拆成整数划分递推，并用记忆化复用状态；若苹果相同、盘子有编号，则用隔板法。苹果可区分时又分别对应逐个选择盘子或集合划分，不能把这些条件默认为现场题意。</p>

<details data-knowledge-key="os-thread-sync"><summary>（9）怎样基于互斥锁实现读写锁？</summary></details>
<p>先确认是否允许条件变量，以及是否要求可重入、取消与公平，再给出明确的读写准入策略。以非重入、写者优先的 mutex 加条件变量方案为例，在同一 mutex 下维护活跃读者数、活跃写者和等待写者数，等待时释放 mutex，唤醒后用 while 重检谓词。读写实际操作使用逻辑权限，不能让最后一个读者替第一个读者释放有所有权要求的 mutex；写者优先也不承诺所有线程无饥饿。</p>
