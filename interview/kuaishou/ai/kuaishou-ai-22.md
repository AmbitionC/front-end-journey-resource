> 题单标题标注：快手 Agent 开发二面。具体面试日期、部门与用工类型未确定。本页按一份转载关联题单整理，原始作者与转载方向未证实，不把不同账号的重复内容当作两位候选人的独立经历。

> 以下仅依据已见文字。题单没有提供现场回答、具体项目实现、代码或测试结果；短答是编辑整理的教学思路。原文中一个模式术语与手撕题条件不清，保留待补，不据相似题型复原。

## 问题与简答

<details data-knowledge-key="agent-resume-interview"><summary>（1）你的 AI 项目的亮点是什么？</summary></details>
<p>先交代真实问题和约束，再选一个由自己负责的关键判断，说明方案、验证与结果。把个人贡献与团队成果分开，没有实测数据就讲可复核的交付与局限；题单未给项目细节，不能把通用方案写成当事人的经历。</p>

<details data-knowledge-key="prompt-context-compression"><summary>（2）上下文压缩算法应在什么条件下触发？</summary></details>
<p>先按目标模型窗口，为固定指令、下一步输入、输出与安全余量预留预算，再判断历史和工具结果是否需要压缩。也可在阶段边界整理状态，但阈值应按真实任务和保真评测确定；题单未给具体算法、模型或阈值，不能补成统一百分比。</p>

<details data-knowledge-key="agent-state-storage"><summary>（3）执行几天、步骤很多的长任务，在项目中怎样组织和恢复？</summary></details>
<p>把运行进度、待办、检查点和产物保存到可恢复的外部状态，让临时进程能够退出后继续。恢复前核对任务版本和已提交副作用，区分继续、重放、取消与未知结果，并为重试设置预算；这是编辑设计思路，题单未披露原项目的实现。</p>

<details data-knowledge-key="agent-coding"><summary>（4）Claude Code 的 Hooks 机制是什么？</summary></details>
<p>Hooks 在指定生命周期事件上调用配置的处理器，可用于工具执行前检查或执行后反馈；它不同于模型隐藏推理，部分处理器类型也可调用模型判定。需按当前版本核对事件、匹配、输入输出与失败规则；事后 Hook 不能撤销已发生的副作用，Hook 也不替代执行端权限。</p>

<details data-knowledge-key="decorator-pattern"><summary>（5）装饰器设计模式怎样通过对象组合扩展职责？</summary></details>
<p>让包装器与组件遵守同一接口，包装器持有内部对象，在委托调用前后增加职责，再按需求逐层组合。组合顺序会改变结果，接口相同也不保证所有组合语义正确；这里讨论对象结构型模式，不能仅凭同名语法装饰器判断。</p>

<details data-binding-status="pending_semantic_verification"><summary>（6）原题中的“代码设计模式”具体指什么？（术语待补）</summary><p>关联知识点待核实。原题缺少的术语或条件详见下方。</p></details>
<p>题单只留下这个表述，无法确定它指哪一种模式。需要补原始术语与上下文，暂不关联知识或增加热度，也不能改写成代理模式或补造比较题。</p>

<details data-knowledge-key="spring-container"><summary>（7）看过 Spring Boot / Spring 的源码吗？其中用到了哪些设计模式？</summary></details>
<p>先说明实际阅读的版本与具体类，再沿调用关系解释设计目的。例如可从 BeanFactory 的工厂访问及 singleton、prototype 的作用域合同说明对象创建与实例管理；容器单例不等于进程中某个类绝对唯一，不能只报模式名就宣称读懂了源码。</p>

<details data-knowledge-key="db-transaction-lock"><summary>（8）MySQL 的锁有哪些？</summary></details>
<p>先限定讨论层次与存储引擎，以 InnoDB 为例区分记录上的共享/排他锁、表级意向锁，以及记录、间隙、Next-Key 和插入意向等范围。再结合隔离级别、索引和语句分析冲突，不能把所有 MySQL 操作都套成相同的行锁行为。</p>

<details data-knowledge-key="db-transaction-lock"><summary>（9）乐观锁和悲观锁有什么区别？</summary></details>
<p>乐观控制通常在提交写入时核对版本或业务条件并检查结果，冲突后重新读取和计算；悲观控制先取得适当锁再处理临界操作。两者都需表达业务不变量，选择取决于冲突、持锁时间与重试成本，乐观方案执行数据库写入时也仍可能使用锁。</p>

<details data-binding-status="pending_semantic_verification"><summary>（10）给定链表和二叉树，树中是否存在与链表一致的路径？（路径条件与示例待补）</summary><p>关联知识点待核实。原题缺少的术语或条件详见下方。</p></details>
<p>原文自称大致题意，示例也带“貌似”及不明确字符，无法确定完整输入与路径合同。需补起点、方向、是否沿连续边、节点能否重复及匹配长度；在这些条件确定前，不恢复数组、不指定题号，也不补造算法、代码或测试结果。</p>

## 延伸阅读

- [关联知识：agent-resume-interview](https://www.agent-journey.cn/knowledge?activeKey=agent-resume-interview)

- [关联知识：prompt-context-compression](https://www.agent-journey.cn/knowledge?activeKey=prompt-context-compression)

- [关联知识：agent-state-storage](https://www.agent-journey.cn/knowledge?activeKey=agent-state-storage)

- [关联知识：agent-coding](https://www.agent-journey.cn/knowledge?activeKey=agent-coding)

- [关联知识：decorator-pattern](https://www.agent-journey.cn/knowledge?activeKey=decorator-pattern)

- [关联知识：spring-container](https://www.agent-journey.cn/knowledge?activeKey=spring-container)

- [关联知识：db-transaction-lock](https://www.agent-journey.cn/knowledge?activeKey=db-transaction-lock)
