### 小红书 AI 研发一面：观测回放、多智能体与数据库

原帖自述为 2026 年 10 月小红书 AI 研发工程师一面。以下只取技术问题，不保留个人争执与对他人的评价；具体项目实现和系统配置未披露。

面试经历为个人自述，未经企业独立确认。以下短答为编辑整理的回答思路，不代表现场回答或实际系统实现。

<details data-binding-status="pending_semantic_verification"><summary><strong>（1）Agent 相关数据怎样采集（采集对象与协议待补）？</strong></summary>关联知识点待核实。</details>
<p>先澄清要采集的是交互、任务状态还是其他数据，再定义输入边界、成功确认与完整性检查。原帖没有说明采集对象和协议，不能推断已采用 Trace、Run、Token 或某种字段规范。</p>

<details data-binding-status="pending_semantic_verification"><summary><strong>（2）Agent 观测平台的查询怎样优化？</strong></summary>关联知识点待核实。</details>
<p>先明确常见查询、数据量与延迟目标，再沿索引、聚合、存储分层和采样定位瓶颈。以真实查询和测量比较效果，不能只用“换数据库”解释优化。</p>

<details data-knowledge-key="agent-debugging"><summary><strong>（3）Agent 评测回放怎样实现可复现？</strong></summary></details>
<p>保存输入、版本、工具边界和必要观察，再决定哪些依赖重放、哪些隔离模拟。控制副作用并标注外部状态差异，回放轨迹不等于能够重现每个非确定性结果。</p>

<details data-knowledge-key="algorithm-loop"><summary><strong>（4）最长公共子序列怎样用动态规划求解？</strong></summary></details>
<p>定义前缀之间的最优长度，相同元素从左上状态加一，不同时在丢弃一侧的状态中取较大值。检查空输入与重复字符，若要还原序列需保留决策，不能把它和连续子串混为一题。</p>

<details data-knowledge-key="agent-multi-agent-messaging"><summary><strong>（5）多智能体怎样分工与定义协作协议？</strong></summary></details>
<p>按可独立验收的任务定义职责、消息与交接，再说明状态版本、超时和失败处理。保留结果验证与权限范围，不能靠群聊顺序或自然语言约定保证协作正确。</p>

<details data-knowledge-key="redis-distributed-lock"><summary><strong>（6）Redis 分布式锁需要哪些正确性边界？</strong></summary></details>
<p>说明唯一持有者、租约和原子校验释放，再检查暂停、超时、故障切换及过期执行者。业务不变量仍需权威存储或栅栏约束，锁的存在不能替代幂等和对账。</p>

<details data-knowledge-key="mysql-index"><summary><strong>（7）MySQL 索引怎样工作，哪些情况下可能不用预期索引？</strong></summary></details>
<p>从索引结构、列顺序、谓词和成本估计解释可能的访问路径，再通过执行计划验证。类型转换、表达式与数据分布等因素依版本和查询条件影响选型，不能用一张固定“失效清单”替代分析。</p>
