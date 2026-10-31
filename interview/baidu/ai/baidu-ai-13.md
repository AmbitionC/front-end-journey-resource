### 百度 AI 测开一面：LLM 评测、压测与有序链表

原帖发表于 2026 年 8 月，自述为百度 AI 测开一面。仅给出题目摘要，未披露评测数据、应用架构或接口配置。

面试经历为个人自述，未经企业独立确认。以下短答为编辑整理的回答思路，不代表现场回答或实际系统实现。

<details data-knowledge-key="agent-eval-framework"><summary><strong>（1）怎样组织评测数据、模型输出与 LLM-as-Judge？</strong></summary></details>
<p>先固定样本、评分规则及可追溯输入输出，再设计裁判提示、结构化结果和异常处理。用人工标注与客观检查校准裁判，控制位置偏差和版本变化，不能把一次模型打分当作真实质量。</p>

<details data-knowledge-key="agent-eval-framework"><summary><strong>（2）大模型评测应用的框架怎样设计？</strong></summary></details>
<p>按数据集与版本、执行器、评分器、结果存储和比较报告划分职责。先做可复现的小规模闭环，再加入并发、失败重试与审计，确保样本、模型和评分版本能够一起回溯。</p>

<details data-knowledge-key="agent-test-pyramid"><summary><strong>（3）LLM 评测与传统服务端测试有哪些区别？</strong></summary></details>
<p>保留接口、权限和状态不变量等确定性检查，同时增加语义质量、随机性及任务成功率的评估。使用固定样本、多次运行和误差切片解释波动，避免只检查响应码或依赖单次裁判。</p>

<details data-binding-status="pending_semantic_verification"><summary><strong>（4）算法接口的线上压测怎样设计？</strong></summary>关联知识点待核实。</details>
<p>先确定授权范围、隔离方式、容量目标和停止条件，再逐步施压并观察成功率、尾延迟、排队和依赖资源。区分输入或输出长度及冷启动影响，不能用单一平均 QPS 代表服务能力。</p>

<details data-knowledge-key="api-schema-validation"><summary><strong>（5）算法接口自动化测试应覆盖什么？</strong></summary></details>
<p>先验证请求与响应 Schema、错误语义及权限，再覆盖边界、重复请求和依赖失败。语义效果另用固定样本与容差验收，避免把格式正确当作算法结果正确。</p>

<details data-binding-status="pending_semantic_verification"><summary><strong>（6）“刷视频得奖励”怎样设计测试用例？</strong></summary>关联知识点待核实。</details>
<p>先补齐奖励规则、有效观看判定、上限和幂等要求，再覆盖正常、临界、重复及中断恢复场景。原文没有规则细节，不能编造发奖条件或将教学假设写成真实业务。</p>

<details data-knowledge-key="algorithm-heap"><summary><strong>（7）K 个有序链表怎样求合并后的中位数并分析复杂度？</strong></summary></details>
<p>先明确总长度是否已知，再用最小堆进行多路归并，只保留定位中位数所需状态。已知长度时可在目标位置停止，长度未知则需先统计或采用其他受约束方案；链表不能直接套用数组的随机访问二分。</p>
