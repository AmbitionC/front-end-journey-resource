### 字节二面：MySQL 索引、最大乘积子数组与推送重连

原帖发表于 2026 年 4 月，自述为字节二面，正式岗位和部门未披露。记录包含索引、SQL、算法及推送重连问题，部分题面和协议名称不完整。

面试经历为个人自述，未经企业独立确认。以下短答为编辑整理的回答思路，不代表现场回答或实际系统实现。

<details data-knowledge-key="mysql-index"><summary><strong>（1）MySQL 的 B+ 树索引怎样影响 SQL 优化？</strong></summary></details>
<p>从查询条件、索引顺序和数据分布分析访问路径，再用执行计划与实际负载验证。说明范围扫描、回表及排序的代价，不能只凭存在索引就判断查询一定高效。</p>

<details data-binding-status="pending_semantic_verification"><summary><strong>（2）SQL 手写题（完整题面待补）</strong></summary>关联知识点待核实。</details>
<p>原帖没有给出表结构、数据或查询目标，不能还原具体 SQL。先补齐输入、输出与空值和重复值规则，再讨论查询或模拟实现。</p>

<details data-knowledge-key="algorithm-loop"><summary><strong>（3）怎样求最大乘积连续子数组？</strong></summary></details>
<p>遍历时同时维护以当前位置结尾的最大与最小乘积，因为负数可能交换二者的作用。每步比较当前元素独立开始和接在旧状态后的结果，并用零、单元素及连续负数检查边界。</p>

<details data-binding-status="pending_semantic_verification"><summary><strong>（4）数组与 List 怎样按访问模式选择？</strong></summary>关联知识点待核实。</details>
<p>先明确语言与具体容器，再比较随机访问、扩容、中间插删和遍历需求。List 是接口或抽象名称时，不能直接等同于链表；应结合实现的复杂度、内存布局和测量结果作选择。</p>

<details data-binding-status="pending_semantic_verification"><summary><strong>（5）推送断线后怎样恢复（原文协议名“SEE”待核实）？</strong></summary>关联知识点待核实。</details>
<p>先确认真实协议与消息投递语义，再说明如何识别断线、重连、恢复游标及处理重复或缺失消息。原文写作“SEE”，不能直接断言是 SSE，也不能补造确认机制或客户端配置。</p>
