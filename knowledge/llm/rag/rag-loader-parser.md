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

![Loader 负责格式识别、解码与解密，Parser 在质量门禁和 OCR 回退后重建带页码坐标的版面树](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/rag-loader-parser-layout-tree-v1.webp)
*图：解析出的标题、段落、表格、图像和脚注都携带 PAGE、BBOX 与 ORDER；OCR 只是带置信度的回退路径。*

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

## 参考资料

- [Apache Tika — The Parser interface](https://tika.apache.org/2.6.0/parser.html)
- [Unstructured — Partitioning](https://docs.unstructured.io/open-source/core-functionality/partitioning)
- [Tesseract — User Manual](https://tesseract-ocr.github.io/tessdoc/)
