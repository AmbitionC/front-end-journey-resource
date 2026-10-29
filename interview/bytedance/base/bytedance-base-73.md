### 字节 AI 全栈一面：断点续传与代码回归

候选人自述为字节 AI 应用全栈一面，具体部门与面试日期未披露。本文选录断点续传和 AI 代码回归两组问题。

面试经历、岗位与轮次来自候选人自述，未独立认证。短答和教学例子为编辑补充，不代表候选人现场回答或企业标准答案。

<details data-knowledge-key="file-upload-service">
<summary>（1）断点续传时，客户端已发送2.5M就能从那里继续吗？</summary>
</details>
<p>应以服务端确认的上传状态为准，先核验会话身份和文件版本，再查询已接受的偏移或分片。以tus为例，HEAD返回Upload-Offset，后续PATCH携带匹配偏移；对象存储Multipart则按上传ID与已确认part清单补传缺失块，两类协议不能混用。客户端显示已发送2.5M不证明后端已接受这些字节。已Abort的S3上传不能用原uploadId继续，需新建会话。</p>

<p>教学例子（非原项目协议）：客户端显示已发2.5M，服务端确认的偏移却更早，应从服务端确认位置按协议恢复；若本地文件已经变化，应重新建立上传会话，不能把旧分片拼进新文件。</p>

技术核对：[tus：可恢复上传协议](https://tus.io/protocols/resumable-upload.html)、[Amazon S3：分片上传](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)。

知识导航：[文件上传、分片与对象存储](../../../knowledge/backend/api/file-upload-service.md)。

<details data-knowledge-key="agent-coding">
<summary>（2）AI生成大量代码时，怎样防止改坏其他模块？</summary>
</details>
<p>先固定需求、代码基线和影响范围，把大段生成拆成连贯且可审查的小变更；AI摘要不能代替差异审查。沿调用方、公共接口与依赖选择验证，结合静态检查、类型检查、受影响单元和集成回归，检查异常、权限及兼容路径。记录真实命令和结果，区分环境失败与代码失败；保护他人已有修改，重要变更经独立审查，未验证项如实保留。</p>

<p>教学例子（非原项目回归）：上传主路径测试通过，但补丁同时删掉共享鉴权分支，其他接口便可能退化。应审查共享函数的差异，并补跑拒绝访问等相关场景，不能仅凭新功能跑通就合并。</p>

技术核对：[SWE-bench：任务与测试评测](https://www.swebench.com/original.html)、[Git：diff比较](https://git-scm.com/docs/git-diff)。

知识导航：[Coding Agent 的架构与执行循环](../../../knowledge/llm/agent/agent-coding.md)。
