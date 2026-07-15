图像检索不是“先 OCR，再把文本扔进向量库”。一张图同时包含像素、空间区域、可见文字、视觉语义和上下文关系。OCR、caption、视觉 embedding 都是从原图派生的观测；只有保留原始 asset、区域坐标和派生版本，答案才能回到真正证据。

## 一个 asset，多条检索通道

推荐把原图作为根对象：

```ts
type ImageAsset = {
  tenantId: string;
  assetId: string;
  sourceId: string;
  sourceVersion: string;
  page?: number;
  uri: string;
  width: number;
  height: number;
  contentHash: string;
  aclVersion: string;
};
```

从它生成相互独立但可关联的派生记录：

- OCR region：文字、bbox、语言、置信度、OCR 版本；
- caption：对画面内容的生成式概述、模型版本；
- visual vector：整图或区域 embedding、模型版本；
- layout relation：图片与标题、段落、表格、页码的关系。

派生记录通过 `assetId + regionId` 返回原图，不覆盖原图字段。这样 OCR 修正或模型升级时，可以只重建对应通道。

![原图先经过隐私过滤，再派生 OCR 区域、Caption 与视觉向量，多模态融合结果保留 Asset ID 和坐标](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/rag-image-retrieval-multimodal-evidence-v1.webp)
*图：OCR、caption 和向量均标为 DERIVED；证据最终回到原始图片与 PAGE/BBOX。*

## OCR 检索：精确文字与空间位置

[Tesseract 文档](https://tesseract-ocr.github.io/tessdoc/)说明 OCR 是文本识别引擎，并支持多语言模型。它适合发票号、错误码、图表标签等精确词，但结果受分辨率、旋转、语言和版面分割影响。

索引 OCR 时，不只存整页文本。按区域保留 bbox 与阅读顺序：

```json
{
  "assetId": "img-18",
  "regionId": "r-7",
  "text": "Gross margin",
  "bbox": [0.12, 0.18, 0.41, 0.24],
  "confidence": 0.91,
  "provenance": "ocr"
}
```

坐标建议归一化到 0–1，另保留原图尺寸。命中时可以在 UI 高亮区域，也能判断两个标签是否在同一图例或表格行。

## Caption 检索：补足不可见于文字的语义

“红色折线在四月突然上升”未必出现在 OCR 文字中，caption 可以描述视觉关系。但 caption 是生成结果，可能漏掉细节或误认对象。它适合提升候选召回，不应直接作为事实引用。

生成 caption 时可分层：整图摘要、区域描述、图表类型和与附近正文的关系。提示里要求“不确定则标注”，输出结构化字段；保留模型、Prompt 版本和输入 asset hash。原图改变后，旧 caption 必须失效。

## Visual embedding：寻找相似外观和概念

视觉向量能匹配没有文字的照片、图标、界面截图和图表形态。可以同时建立整图与区域向量：整图适合主题，区域向量适合具体组件。相似外观不等于相同事实，因此结果仍需结合 source、时间和文本上下文重排。

当前 [OpenAI Images and Vision 文档](https://developers.openai.com/api/docs/guides/images-vision)说明视觉模型能把图像作为输入分析对象、形状、颜色与纹理；具体模型、格式和 token 计算属于截至 2026-07-15 的供应商行为，接入时应再次核对，而不是写死在通用检索层。

## 早融合与晚融合

**早融合**把 OCR、caption、附近正文拼成一段再 embedding，部署简单，但很难解释是哪条通道命中，某个噪声 caption 还会污染整体向量。

**晚融合**分别检索 OCR、视觉、caption 和附近正文，再用 RRF 或训练过的权重融合：

```text
score = fuse(
  rank_ocr,
  rank_visual,
  rank_caption,
  rank_context
)
```

晚融合更易观测和按问题自适应：包含精确编号的问题提高 OCR 权重，描述外观的问题提高视觉权重。不要直接相加不同模型的原始分数；使用排名融合或在标注集上校准。

## 空间 grounding 与引用

检索结果进入模型时，传入受控缩略图、区域 crop、OCR 文本和邻近说明，并附 asset ID、页码与 bbox。回答中的每个视觉断言映射到一个或多个区域：

```ts
type VisualCitation = {
  assetId: string;
  page?: number;
  bbox: [number, number, number, number];
  derivedFrom: 'pixels' | 'ocr' | 'caption';
};
```

若模型只能根据 caption 作答，应显示“基于自动描述”，而不是伪装成看过原图。涉及细小文字、计数、医疗或财务图表时，需要高分辨率 crop 或人工复核。

## 去重、隐私与安全

同一图片可能以不同尺寸、裁剪、压缩或水印重复出现。先用 content hash 找完全相同文件，再用感知哈希/视觉向量产生近重复候选，最后保留 canonical asset 与全部来源关系。不要因为视觉相似就删除版本不同的报表截图。

隐私过滤必须发生在 OCR、caption、embedding 和缓存之前：检测人脸、身份证号、屏幕密钥、地理元数据和受限区域；按策略遮挡或拒绝索引。授权过滤同样在检索前执行，不能先跨租户召回再在结果中删掉。

图像也会携带 Prompt injection，例如截图中写“忽略指令”。OCR 与视觉文字一律视为不可信数据，只用于检索证据，不能升级为系统指令。

## 多模态评测

测试集要覆盖：纯文字截图、扫描件、照片、流程图、图表、相似图、裁剪图、多语言、低分辨率和敏感内容。分别评：

- OCR region Recall/Precision 与字符错误；
- visual Recall@K、近重复误合并；
- 多路融合的 nDCG/Recall@K；
- bbox 是否覆盖答案证据；
- caption 忠实度与无依据细节；
- 最终答案、引用与隐私泄露。

做消融：仅 OCR、仅视觉、仅 caption、融合。整体平均提升之外，要检查精确编号、图表数值和跨语言切片是否退化。

## 小结

图像 RAG 应围绕原始 asset 建立多条派生通道：OCR 提供文字和坐标，caption 提供可检索语义，视觉 embedding 提供外观匹配。隐私与权限先于派生和检索，融合结果始终保留 asset/page/bbox，使模型的视觉断言可以回到原始像素。

## 参考资料

- [Tesseract — User Manual](https://tesseract-ocr.github.io/tessdoc/)
- [OpenAI — Images and vision](https://developers.openai.com/api/docs/guides/images-vision)
