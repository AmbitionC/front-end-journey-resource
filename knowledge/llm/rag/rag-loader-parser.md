Loader 和 Parser 经常被写成一个 `load()`，但它们解决的是两类问题：Loader 负责把外部对象可靠地取回来并解码为可读流；Parser 负责从这个流中解释结构。前者回答“拿到的是什么字节”，后者回答“这些字节表达了什么版面”。边界清楚，才能定位乱码、错序、表格丢失和 OCR 幻觉究竟发生在哪一层。

## Loader：获取、识别与解码

Loader 的输入通常是 URI、对象 ID 或文件句柄，输出是带元数据的字节/字符流：

```ts
type LoadedAsset = {
  sourceId: string;
  sourceVersion: string;
  bytes: Uint8Array;
  detectedMime: string;
  declaredMime?: string;
  charset?: string;
  checksum: string;
  encrypted: boolean;
};
```

它负责下载超时、大小限制、校验和、MIME sniffing、压缩包边界、字符集和解密，但不应该凭文件名把 `.pdf` 当作可信格式。声明 MIME、扩展名和内容探测结果不一致时，应记录冲突并进入策略判断。

Loader 也不应把所有输入一次读入内存。[Apache Tika Parser 接口](https://tika.apache.org/2.6.0/parser.html) 的设计强调流式解析，避免巨大文档必须整体驻留内存；这个原则同样适用于下载与解压层。压缩包要限制文件数量、展开大小和嵌套深度，防止 zip bomb。

## Parser：从内容流恢复结构

Parser 的输出不是一个长字符串，而是版面树或元素序列：

```ts
type Element = {
  id: string;
  type: 'title' | 'paragraph' | 'list' | 'table' | 'image' | 'footnote';
  text?: string;
  page?: number;
  bbox?: [number, number, number, number];
  order: number;
  parentId?: string;
  confidence?: number;
  provenance: 'native' | 'ocr' | 'inferred';
};
```

`page`、`bbox` 与 `order` 是引用和调试的关键。只有文本没有坐标，表格单元格和脚注很难回到原页；只有坐标没有阅读顺序，多栏 PDF 会被交叉拼接。

![RAG 的 Loader 与 Parser 分两层。Loader 负责把外部对象可靠取回并解码：下载超时、大小上限、校验和，MIME 靠内容探测而不信扩展名，处理字符集和解密，流式读取不把整个文件读进内存；它输出带来源、版本、校验和的 LoadedAsset。Parser 先用原生文本层提取，再做质量检查（字符覆盖率、乱码比例、坐标是否大量重叠或越界）；质量够就直接进入版面树，只有低质量的页面或区域才走 OCR，OCR 结果带置信度，是观测而不是源事实。Parser 的输出是版面树而不是长字符串：文档下面依次是标题、段落、表格、图像和脚注，每个元素都带页码、坐标和阅读顺序，并标出来源是原生、OCR 还是推断；表格保留行列、表头和合并单元格，图像保留资产 ID，段落和脚注双向链接。只有坐标没有阅读顺序时，多栏 PDF 会被交叉拼接。质量门禁：解析成功不能只看退出码，要看覆盖率和元素顺序；损坏、加密、超限、格式伪装和解析器崩溃分别记错误码，绝不能返回空文档继续做 embedding](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/rag-loader-parser-layout-tree-v2.dark.png)
*图：左边 Loader 取回解码、Parser 先用原生文本层并做质量检查，只有低质量页才 OCR；右边是版面树，每个元素都带页码、坐标和阅读顺序。*

[Unstructured 的 partition 文档](https://docs.unstructured.io/open-source/core-functionality/partitioning)把原始文档拆成 `Title`、`NarrativeText`、`ListItem` 等元素，说明结构化元素比“按固定字符切文本”更适合作为后续分块输入。元素类型仍是解析器的推断，应保留解析版本与置信信号。

## 不同格式需要不同证据模型

### PDF

PDF 主要描述页面绘制，不保证逻辑阅读顺序。原生文本层可能把字拆散、把双栏交错，扫描 PDF 甚至没有文本层。应先尝试原生提取，检查字符覆盖、乱码率和布局一致性，再决定是否 OCR。

### HTML

DOM 结构通常比像素坐标可靠，但导航、广告、隐藏节点和脚本模板会污染正文。Parser 应保留标题层级、列表、表格和链接目标，同时用可解释规则排除 chrome；不要仅按 CSS class 名猜正文。

### Office 文档

Word 的段落、样式、页眉脚注与嵌入对象，Excel 的 sheet、单元格、公式和合并区域，PowerPoint 的文本框、讲者备注和图形都有不同结构。强行全部转纯文本会丢掉关系。解析层应输出统一 envelope，但允许格式专属字段。

## OCR 是有不确定性的观测

[Tesseract 用户手册](https://tesseract-ocr.github.io/tessdoc/)说明 OCR 引擎基于语言模型识别图像文字，并支持多种语言与脚本。OCR 结果依赖分辨率、旋转、版面分割、语言包和图像质量，因此必须标成 `provenance: ocr`，保留区域与置信度。

推荐的回退判定不是“提取文本为空才 OCR”，而是结合：

- 页面是否存在可见文字区域；
- 原生文本字符数与覆盖率；
- Unicode 替换字符、不可打印字符比例；
- 字符坐标是否大量重叠或越界；
- OCR 抽样与原生文本的一致性。

可只对低质量页面或图像区域做 OCR，避免把可用原生文字再次识别后引入错误。OCR 文字、原图区域和解析后的表格要通过同一 source/page/bbox 关联，而不是覆盖彼此。

## 表格、图像和脚注不要扁平化

表格至少保存行列坐标、表头层级、合并单元格和单元格文本。序列化为 Markdown 可以用于模型上下文，但结构化矩阵仍应作为源产物保存。图片保存 asset ID、标题、附近段落与页内坐标；是否生成 caption 是下一层派生任务。

脚注需要双向链接：正文引用标记指向脚注，脚注也记录被哪些段落引用。否则分块后，限定条件会与主句分离。页眉页脚可用跨页重复频率识别，但应保留被排除记录，便于发现误删。

## 质量门禁与失败分类

解析成功不能只看“进程退出码为 0”。可以计算：

```text
quality = {
  decoded: true,
  textCoverage: 0..1,
  orderedElements: count,
  invalidChars: ratio,
  tablesRecovered: count,
  ocrPages: count,
  warnings: [...]
}
```

损坏、加密但无密钥、超限、格式伪装和解析器崩溃分别记录错误码。不要返回空文档再继续 embedding，因为它会让上游以为摄取成功。部分成功时，产物携带 `partial: true` 和缺失页范围，发布策略再决定是否接受。

## 用代表性文档评测 Parser

建立 parser corpus，覆盖：文本 PDF、扫描件、双栏、旋转页、复杂表格、混合语言、脚注、超长 Office、损坏与加密输入。为小规模样本人工标注标题层级、阅读顺序、表格边界和关键文字。

评测分层进行：

- Loader：下载/解码成功率、MIME 判断、校验和、资源上限；
- 文本：字符/词错误率、关键字段召回；
- 布局：元素类型、阅读顺序、bbox 重叠；
- 表格：单元格匹配、行列关系、表头关联；
- 下游：固定检索问题的 Recall@K 与引用定位。

平均字符准确率很高，仍可能把金额负号或表头列错；因此要按文档类型和业务关键字段切片。Parser 升级先在 corpus 上对比，再进入影子索引，不能直接覆盖生产结果。

## 常见误区

- Loader 根据扩展名决定格式，忽略内容探测；
- Parser 只返回纯文本，丢失页码、坐标和阅读顺序；
- 对所有 PDF 全量 OCR，覆盖更可靠的原生文本；
- 把 OCR、caption 或版面分类当作源事实；
- 表格只保留 Markdown 字符串，不保留单元格结构；
- “没有抛异常”就判定解析成功；
- 解析器升级后不跑代表性回归集。

## 小结

Loader 建立可信的字节边界，Parser 建立可审计的结构解释。两层之间用明确 envelope 连接；Parser 输出元素树、坐标、顺序、来源类型和质量信号。OCR、表格恢复与版面分类都保留不确定性，最后通过分格式 corpus 和下游检索一起验证。

## 练一练

### 高频考点题 1：Loader 和 Parser 的分工

Loader 和 Parser 的分工是？

- A. Loader 负责安全取回和解码，Parser 负责恢复页码、版面和阅读顺序
- B. 两者是同一个组件的不同叫法，负责把文件读成文本
- C. Loader 负责 OCR 和版面识别，Parser 负责从远端下载文件
- D. Parser 只需要输出一个长字符串

**答案：A。** Loader 管下载超时、大小限制、MIME 探测、字符集；Parser 输出版面树或元素序列。只有文本没有坐标，表格和脚注很难回溯引用。

### 高频考点题 2：什么时候做 OCR

处理 PDF 时，下面哪种 OCR 策略最合理？

- A. 所有 PDF 都全量 OCR，保证文字识别结果统一
- B. 只有提取出的文本完全为空时才做 OCR
- C. 根据文字质量信号，只对低质量页面或区域做 OCR
- D. 从不做 OCR

**答案：C。** 全量 OCR 会用识别误差覆盖本来可靠的原生文字；只看是否为空又会漏掉乱码、双栏交错这类质量问题。

### 高频考点题 3：怎样算解析成功

下面哪种判断解析成功的方式最可靠？

- A. 解析进程退出码为 0 就算成功，异常会通过退出码反映
- B. 返回了非空文本就算成功，空文本再进入人工处理
- C. 文件扩展名正确就算成功
- D. 按文档类型检查关键字段，失败要分类记录，不放空文档流转

**答案：D。** 平均字符准确率很高，也可能把金额负号或表头列错了。没抛异常不等于解析对了，失败要有错误码，不能让空文档悄悄进入索引。

## 出现于（热度来源）

<!-- interview-source-history:start -->
- [字节 Agent 后端实习一面：LangGraph、评测集与混合检索](../../../interview/bytedance/base/bytedance-base-22.md)
- [字节 Agent 二面：RAG 分块、查询改写与随机采样](../../../interview/bytedance/base/bytedance-base-28.md)
- [字节财经保险 AI 全栈实习一面：项目设计、AI Coding 与 Diff](../../../interview/bytedance/base/bytedance-base-34.md)
- [字节全栈一面：RAG、Java 与线程池](../../../interview/bytedance/base/bytedance-base-37.md)
<!-- interview-source-history:end -->

## 相关机制阅读（不计专题频次）

- [OPPO IT 开发一面：ReAct、MCP 与智能问数](../../../interview/oppo/ai/oppo-ai-3.md)（原题问 Word 图文输入到图文回答的整条链路；本篇支撑其中的文档解析与关系保留，图像召回和视觉证据可继续读[图像检索](./rag-image-retrieval.md)，不把整链路问题等同于解析专题的独立追问。）

## 参考资料

- [Apache Tika — The Parser interface](https://tika.apache.org/2.6.0/parser.html)
- [Unstructured — Partitioning](https://docs.unstructured.io/open-source/core-functionality/partitioning)
- [Tesseract — User Manual](https://tesseract-ocr.github.io/tessdoc/)
