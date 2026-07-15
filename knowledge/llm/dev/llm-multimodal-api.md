多模态 API 不是“文本接口再加一个图片 URL”。文本、图像、音频、视频和文档有不同的编码、尺寸、生命周期、计量与安全边界；它们在请求中的顺序还会影响模型理解。工程重点是先建立统一的内容部件模型，再在供应商适配层执行能力检查和格式转换。

## 用有序内容部件思考

一条用户消息可以包含多个按顺序排列的部件：先给照片，再问“图中设备的指示灯是否异常”；也可以先给规则文档，再给截图，要求按文档判断。把所有附件提取成一大段文字，会丢失版面、图像与问题之间的指代关系。

```ts
type MultimodalPart =
  | { type: 'text'; text: string }
  | { type: 'image'; source: AssetRef; detail?: 'low' | 'high' | 'auto' }
  | { type: 'audio'; source: AssetRef; format: string }
  | { type: 'document'; source: AssetRef; mediaType: string };

interface AssetRef {
  kind: 'inline' | 'url' | 'provider_file';
  value: string;
  sha256: string;
  byteLength: number;
}
```

![文本、图像、音频与文档经校验组成有序内容部件，再产生多类型输出](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-multimodal-api-content-parts-pipeline-v1.webp)
*图：多模态调用先规范化与校验，再按顺序装配内容部件；输出也可能是文本、结构化数据或媒体。*

统一模型不要假装所有供应商都支持所有类型。`detail`、视频、音频回传、PDF 版面理解等能力必须由能力目录判断；适配失败应在调用前显式报错，而不是静默丢掉附件。

## inline、URL 与文件对象怎样选

### 内联数据

将小文件编码进请求，生命周期清晰、不依赖外部网络，但 base64 会增大载荷，重试也会反复传输。适合体积小、只使用一次、不能暴露 URL 的内容。

### 远程 URL

请求更小，适合已有受控对象存储的资源。必须确认供应商能访问该 URL，并防止 SSRF、过期链接和越权。推荐短时签名 URL、固定允许域、精确 Content-Type，并在日志中隐藏查询签名。

### 供应商文件对象

先上传、后在多次请求中引用，适合较大文件或复用。代价是多一个外部生命周期：上传是否完成、对象何时过期、是否可删除、区域与权限如何设置，都要记录。应用文件 ID 与供应商文件 ID 不能混成一个字段。

选择依据不是“哪段 SDK 代码更短”，而是大小、复用次数、隐私、延迟和删除要求。无论哪种方式，都应保存内容哈希，避免相同大文件被无意重复上传。

## 发送前的规范化管线

一个可靠管线通常按以下顺序执行：

1. **鉴权**：当前用户是否可访问资源；
2. **真实类型检测**：检查文件签名与解码结果，不信任扩展名；
3. **安全扫描**：恶意内容、压缩炸弹、元数据与策略检测；
4. **资源规范化**：旋转方向、色彩空间、采样率、页码等；
5. **能力匹配**：目标模型和接口是否支持类型、大小与数量；
6. **预算预估**：图像分辨率、音频时长、PDF 页数可能影响 token、延迟和费用；
7. **引用转换**：生成 inline、签名 URL 或供应商文件引用；
8. **顺序装配**：保持问题与媒体的逻辑邻接关系。

图片不应一律上传原图。先根据任务确定是否需要缩放、裁剪或切片：识别发票总体布局与读取微小序列号需要的分辨率不同。缩小会减少成本，但也可能删除关键证据；策略要用任务数据评估，而不是使用单一全局阈值。

## 结构化输出与证据定位

多模态应用往往不是要一段描述，而是可验证结果。让模型返回业务 Schema，例如：

```json
{
  "items": [
    { "field": "total", "value": 128.5, "page": 2, "evidence": "..." }
  ],
  "uncertain": ["seller_tax_id"]
}
```

Schema 验证只能保证形状，不保证事实正确。应用还应校验金额范围、页码存在、枚举合法，并把证据定位回原文件。对于坐标、像素和精确计数，模型可能并非合适工具；可先用 OCR、条码或计算机视觉算法得到确定性信号，再让模型完成语义归纳。

输出媒体也要作为资产处理：验证 MIME 与大小，写入自有对象存储，记录来源请求、模型策略、安全检查和过期策略。不要把供应商临时 URL 当永久资源地址。

## 多模态提示的写法

清楚说明任务、范围、输出和不确定性，比堆叠“仔细观察”有效：

```text
任务：从所附三页发票中提取订单号、含税总额和币种。
范围：只使用图片可见信息，不推测被遮挡内容。
输出：按给定 JSON Schema 返回；每个字段附页码和短证据。
不确定：无法确认的字段填 null，并加入 uncertain。
```

当一条消息有多张图时，应用应赋予稳定资源 ID，并在提示中按 ID 引用，避免“第二张图”因重排而失效。不要让用户文本伪装成系统指令；来自图片、PDF 或网页的文字也可能包含提示注入，只能当作待分析数据。

## 截至 2026-07-15 的供应商差异

- OpenAI 的[图像与视觉指南](https://developers.openai.com/api/docs/guides/images-vision)说明图像输入、detail 与当前计量方式；[文件输入指南](https://developers.openai.com/api/docs/guides/file-inputs)说明文件和 PDF 在 Responses 等接口中的使用。不同模型与接口的默认行为应单独核对。
- Anthropic 的[视觉指南](https://platform.claude.com/docs/en/build-with-claude/vision)说明图像内容块及请求组织；[PDF 支持文档](https://platform.claude.com/docs/en/build-with-claude/pdf-support)区分直接文档块与文件引用等当前路径。
- Gemini 的[文件输入方式](https://ai.google.dev/gemini-api/docs/file-input-methods)、[图像理解指南](https://ai.google.dev/gemini-api/docs/generate-content/image-understanding)分别覆盖 Interactions 与 generateContent 相关路径。

支持的 MIME、单次数量、大小、分辨率、保存时长和计价会变化。能力目录应按 `provider + api + model + region` 维护，并标记验证日期；不要把调研日限制复制成散落常量。

## 测试与可观测性

建立含真实困难样本的评测集：旋转、低分辨率、手写、表格跨页、重复页面、透明背景、噪声、不同语言和恶意指令。指标应包括字段准确率、拒答率、证据定位准确率、人工复核率、延迟与每份文档成本。

日志记录资源 ID、哈希、类型、尺寸、页数/时长、所用预处理版本、模型策略、usage 与结果状态；不记录不必要的原始媒体或签名 URL。相同资源在不同预处理策略下的结果要能关联比较。

## 常见误区

- 相信扩展名和客户端 MIME；
- 把所有媒体转成文字后丢失顺序与版面；
- 原图无条件上传，忽略成本、延迟与隐私；
- 把文件 ID 当永久对象，忘记删除和过期；
- 只验证 JSON 形状，不验证业务事实与证据；
- 让模型承担像素级测量、精确计数等不擅长任务；
- 把媒体中的指令当可信系统指令；
- 将某个模型当前限制写成跨供应商通用规则。

## 小结

多模态开发的核心是资产生命周期与有序内容部件。先鉴权、检测、扫描和规范化，再按模型能力与预算选择 inline、URL 或文件对象；对输出做 Schema、业务与证据三层验证，并把供应商差异封装进带日期的能力目录。这样才能在增加模态的同时，不增加不可控的安全债和成本债。

## 参考资料

- [OpenAI — Images and vision](https://developers.openai.com/api/docs/guides/images-vision)
- [OpenAI — File inputs](https://developers.openai.com/api/docs/guides/file-inputs)
- [Anthropic — Vision](https://platform.claude.com/docs/en/build-with-claude/vision)
- [Anthropic — PDF support](https://platform.claude.com/docs/en/build-with-claude/pdf-support)
- [Gemini API — File input methods](https://ai.google.dev/gemini-api/docs/file-input-methods)
- [Gemini API — Image understanding](https://ai.google.dev/gemini-api/docs/generate-content/image-understanding)
