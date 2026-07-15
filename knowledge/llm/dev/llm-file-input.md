让模型“读文件”不是上传后直接把文件 ID 塞进请求。文件来自不可信用户，可能伪造类型、包含恶意宏、压缩炸弹、隐藏指令或敏感数据；解析器也可能有漏洞。生产管线要把接收、隔离、检测、解析、分块、索引、模型使用和删除设计成一个可追踪生命周期。

## 安全边界从上传前开始

服务端先验证用户是否有权向目标租户/会话上传，以及业务是否允许该文件类别。不要只在前端限制扩展名。上传接口设置单文件、单请求、用户日配额和并发上限，流式写入隔离区，超过上限立即终止，避免先把整个文件读进内存。

![文件先进入隔离区，经类型、大小、恶意内容与解压检测，再分流解析、保留页级溯源并进入模型](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-file-input-ingestion-pipeline-v1.webp)
*图：任何解析和模型调用都发生在安全门禁之后；索引、保存期和删除属于同一生命周期。*

[OWASP 文件上传安全清单](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)建议采用允许列表、不要信任 Content-Type、重命名文件、限制大小、隔离存储、权限控制和恶意内容检测等组合防线。没有任何单一检查足够安全。

## 一个可执行的摄入状态机

```text
initiated → uploading → quarantined → inspecting
                                  ↘ rejected
inspecting → parsing → indexed/ready → expired/deleted
                    ↘ parse_failed
```

每个文件建立自有 `asset_id`，保存：租户与所有者、原始显示名、安全存储键、声明/检测 MIME、字节数、SHA-256、状态、扫描版本、解析版本、页数、来源与过期时间。对象存储键使用随机值，不能使用用户文件名，也不能让上传目录被 Web 服务器直接执行。

同一哈希不一定允许跨用户复用：去重会泄露“某文件是否存在”，还可能跨越租户授权边界。若做去重，必须在同一安全域内，并保留独立授权与删除引用计数。

## 真实类型检测与隔离

扩展名、客户端 MIME 和魔数都只能提供部分证据。检测流程包括：

1. 规范化显示名，拒绝路径穿越、控制字符和异常双扩展；
2. 使用允许列表决定业务接受的类型；
3. 检查文件签名，并实际用受控解析器解码；
4. 扫描恶意软件、宏、嵌入对象和策略违规；
5. 对压缩包限制层数、成员数、单项/总展开体积和压缩比；
6. 在隔离容器中解析，限制 CPU、内存、时间和网络。

扫描通过不代表内容可信。文档中的文字可能包含提示注入；解析出的链接可能指向内网；图片元数据可能含隐私。模型输入阶段仍要执行内容政策与最小化原则。

## 文本提取与视觉理解是两条路径

PDF、演示文稿和扫描件不能只用一种解析方式：

- **文本路径**提取字符、标题、表格和阅读顺序，成本较低、便于检索；
- **视觉路径**渲染页面，保留版面、图表、印章和图像关系；
- **混合路径**以文本为主，对图表或低置信页面调用视觉模型。

纯文本 PDF 也可能有错误阅读顺序；扫描 PDF 需要 OCR；复杂表格可能在提取时失去行列关系。应用要保存页码、区块、坐标或元素 ID，让每个 chunk 能回到原文件证据，而不是只有无来源的一串文字。

```ts
interface Chunk {
  chunkId: string;
  assetId: string;
  pageStart: number;
  pageEnd: number;
  elementIds: string[];
  text: string;
  contentHash: string;
  parserVersion: string;
}
```

分块优先尊重标题、段落、表格和页边界，再按 token 预算拆分。重叠并非越多越好，会增加重复证据与费用。索引记录 embedding 模型、分块策略、权限标签和版本；文件重新解析时建立新版本，旧索引在切换成功后再删除。

## 大文件的处理策略

大文件不能简单依赖更长上下文。先按任务选择：全文摘要可使用分层 map-reduce；问答使用权限过滤后的检索；字段提取按页/章节并行后对账；跨页关系则保留邻接与全局目录。

推荐流程：

1. 快速提取目录、页数、语言和内容类型；
2. 按结构切分并估算 token；
3. 只把与当前任务相关的块送入模型；
4. 每个回答携带 `asset_id + page + chunk_id`；
5. 对冲突证据、低置信结果或缺页转人工；
6. 缓存解析产物，但按权限和版本失效。

模型回答“文档中没有”时，应用应知道搜索覆盖了哪些页和块。没有覆盖信息的否定结论不可靠。

## 供应商文件引用的生命周期

应用可能选择内联文件、短时签名 URL 或先上传为供应商文件对象。后者适合复用和大载荷，但必须保存：本地 asset ID、供应商、外部 file ID、状态、创建/过期时间、用途和删除结果。

上传供应商前再次检查数据分类、区域、租户许可与最小必要性。用户删除时不能只删本地文件，还要清理解析产物、缩略图、向量索引、缓存、临时 URL 和可控的供应商对象。删除任务应幂等、可重试，并生成不含正文的审计证据。

不要把供应商返回的临时下载 URL写入文章、数据库长期字段或日志。对同一外部文件的并发请求要处理“上传中”，避免重复创建。

## 截至 2026-07-15 的接口差异

OpenAI 的[文件输入指南](https://developers.openai.com/api/docs/guides/file-inputs)描述当前文件与 PDF 输入方式，以及不同 API/模型对文本和页面图像的处理差异。

Anthropic 的 [PDF 支持文档](https://platform.claude.com/docs/en/build-with-claude/pdf-support)说明当前文档内容块、Files API 引用和平台差异。Gemini 的[文件输入方式](https://ai.google.dev/gemini-api/docs/file-input-methods)与 [Files API](https://ai.google.dev/gemini-api/docs/files)说明当前上传和引用路径。

支持 MIME、最大大小、页数、保存期、区域和模型能力会变化。能力目录需要记录 `provider + api + model` 与验证日期；安全管线使用自己的保守上限，不把供应商最大值直接当产品允许值。

## 观测、测试与删除

指标包括上传拒绝率、扫描/解析耗时、解析失败类型、每页字符与 token、OCR 低置信页、索引延迟、检索覆盖、模型费用、供应商文件数量和逾期未删对象。日志使用 asset ID 和哈希，不打印原文件名中的敏感信息、正文或签名 URL。

测试样本至少覆盖：扩展名与内容不一致、路径穿越名、零字节、超大文件、深层压缩、超高压缩比、密码文件、损坏 PDF、宏文档、扫描页、旋转页、跨页表格、重复上传、解析器超时、删除中断和上传后权限撤销。

## 常见误区

- 只检查扩展名或前端 MIME；
- 使用原文件名作为存储路径；
- 文件上传后立即在主进程解析；
- 解压不限制层数和展开大小；
- 扫描通过就把文档指令当可信指令；
- 抽取全文后丢失页码与区块来源；
- 大文件无条件塞入长上下文；
- 只删除原文件，不删除索引、缓存和供应商对象；
- 把供应商最大限制当产品安全上限。

## 小结

文件输入是一条安全、解析与数据治理管线。先鉴权和隔离，再用允许列表、真实类型、恶意内容与解压限制建立防线；按文本/视觉需求解析并保留页级溯源，用检索或分层任务处理大文件，最后覆盖所有派生产物与外部对象的保存和删除。模型只应看到通过门禁且完成最小化的证据。

## 参考资料

- [OWASP — File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [OpenAI — File inputs](https://developers.openai.com/api/docs/guides/file-inputs)
- [Anthropic — PDF support](https://platform.claude.com/docs/en/build-with-claude/pdf-support)
- [Gemini API — File input methods](https://ai.google.dev/gemini-api/docs/file-input-methods)
- [Gemini API — Files API](https://ai.google.dev/gemini-api/docs/files)
