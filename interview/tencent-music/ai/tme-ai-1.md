腾讯音乐后台开发秋招一面，面试日期与具体部门未明示。作者提到首道算法未完成后改题；本页只选 AI 开发交付和多模态 RAG 两组。

经历、岗位与面试过程均来自候选人自述，未独立认证。以下短答、详解与例子为编辑补充，不是候选人的现场答案或企业标准答案；未披露条件会明确列为教学假设。

<details data-knowledge-key="agent-coding">
<summary>（1）从含糊 PRD 到上线，怎样借助 AI 开发并验证交付质量？</summary>
</details>

短答：先澄清 PRD 歧义，把需求变成可观察的验收标准，固定仓库与依赖基线，再让 AI 按小任务实现。静态检查、相关测试、Diff 审查与上线恢复证据共同验收，模型声称完成不能代替验证。

详解：例如“搜索更快”要先约定查询集、正确性、延迟目标和失败行为，再设计改动与测试。AI 可协助找代码、写补丁和测试，但任务边界、关键业务规则与实际结果仍要核查。测试超时或环境缺失属于未验证；PRD 未定清的部分先澄清或显式记录假设。原文没有代码和上线数据，以上是编辑教学流程，不代表作者已采用这些做法。

知识导航：[Coding Agent 的架构与执行循环](../../../knowledge/llm/agent/agent-coding.md)。

<details data-knowledge-key="rag-image-retrieval">
<summary>（2）图片或视频进入 RAG 时，怎样建立可检索、可回查的多模态证据？</summary>
</details>

短答：保留原媒体，再建立 OCR、视觉向量和描述等可关联通道。图片引用回到原图与区域；视频还要对齐帧时间、转写片段和来源版本，检索后回查可播放片段。

详解：图像描述和音频转写都是派生观测，不能当作原始事实认证。变帧率视频不能只用帧号除名义帧率定位；稀疏采样漏掉短暂事件，也不能证明事件不存在。按同一权限、版本与时间口径融合候选，必要时提高局部采样密度并核对原片。采样率、模型、语料和指标未给，示例方案仍需在真实任务上验证，不据此声称已有实现或性能结果。

知识导航：[图像、OCR 与多模态检索](../../../knowledge/llm/rag/rag-image-retrieval.md)。

## 参考资料

- [SWE-bench：仓库与测试验收](https://www.swebench.com/original.html)

- [Gemini：视频片段与采样边界](https://ai.google.dev/gemini-api/docs/video-understanding)

- [FFmpeg 7.1：帧时间戳](https://github.com/FFmpeg/FFmpeg/blob/n7.1/libavutil/frame.h)
