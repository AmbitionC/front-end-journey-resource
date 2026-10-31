### 腾讯 WXG 一面：跨语言 RAG、消息幂等与算法

原帖发表于 2026 年 5 月，自述为腾讯 WXG 一面，正式岗位未披露。以下按原文整理技术问题，算法名称来自原帖，未补造项目配置或面试结果原因。

面试经历为个人自述，未经企业独立确认。以下短答为编辑整理的回答思路，不代表现场回答或实际系统实现。

本页只整理已核验文字；原帖图片尚未核验，未用于还原题目，记录可能仍有遗漏。

<details data-knowledge-key="algorithm-array"><summary><strong>（1）怎样求至多包含 K 个不同字符的最长子串？</strong></summary></details>
<p>用滑动窗口维护字符频次与不同字符数，超过 K 时移动左边界直到重新合法，再更新最大长度。明确 K 为零、空串与字符编码约定，保证指针单调推进。</p>

<details data-knowledge-key="algorithm-graph"><summary><strong>（2）怎样求最小体力消耗路径？</strong></summary></details>
<p>把路径代价定义为沿途相邻高度差的最大值，可用最小化该最大值的 Dijkstra 变体。松弛时取当前代价与新边权的较大者，并说明与普通“边权求和最短路”的区别。</p>

<details data-knowledge-key="rag-pipeline"><summary><strong>（3）RAG 查询链路怎样说明？</strong></summary></details>
<p>沿查询理解、已授权范围内的召回、筛选重排、证据装配和生成说明依赖关系。结合失败样本解释各阶段如何验收，保留出处和证据不足分支。</p>

<details data-knowledge-key="rag-query-rewrite"><summary><strong>（4）RAG 查询重写怎样实现与验证？</strong></summary></details>
<p>只补齐有依据的指代、实体或表达，保留用户的否定、时间和权限条件。保存原问与改写结果，用检索和最终回答比较收益，存在歧义时先澄清。</p>

<details data-knowledge-key="rag-query-rewrite"><summary><strong>（5）中文知识库怎样支持英文提问？</strong></summary></details>
<p>先比较跨语言 Embedding 与受控翻译或双路查询，检查术语、专名和约束是否保留。用真实中英查询对评估召回与回答，不能只凭翻译通顺或模型声称支持多语判断效果。</p>

<details data-knowledge-key="redis-cache"><summary><strong>（6）Redis 怎样处理过期 Key？</strong></summary></details>
<p>先区分到期失效与内存不足时的淘汰策略，再说明访问时检查和后台过期清理。TTL 不表示物理删除必定发生在该时刻，业务正确性也不能依赖清理任务精确触发。</p>

<details data-knowledge-key="async-job-queue"><summary><strong>（7）至少一次投递下怎样避免重复业务执行？</strong></summary></details>
<p>用稳定业务幂等键和权威存储中的唯一约束或条件状态转换保护副作用。把确认时机、处理结果和重试协议一起设计，去重缓存或消息 ID 本身不等于业务恰好执行一次。</p>

<details data-knowledge-key="tcp-handshake"><summary><strong>（8）TCP 慢启动为什么会近似按 RTT 倍增？</strong></summary></details>
<p>先区分流量控制的接收窗口与拥塞控制的拥塞窗口，实际发送还受二者共同约束。慢启动在 ACK 驱动下增加拥塞窗口，按 RTT 观察可近似倍增；达到门限或出现拥塞后会改变增长方式，不能说发送窗口始终倍增。</p>

<details data-knowledge-key="os-ipc"><summary><strong>（9）进程间通信有哪些方案，怎样选择？</strong></summary></details>
<p>按是否同机、消息大小、吞吐和同步要求比较管道、Socket、共享内存等方式。共享内存减少复制仍需同步与生命周期管理，不能只按接口名称判断性能和可靠性。</p>
