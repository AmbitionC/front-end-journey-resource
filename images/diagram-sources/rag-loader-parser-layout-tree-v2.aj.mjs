export const meta = {
  name: 'rag-loader-parser-layout-tree-v2',
  article: 'knowledge/llm/rag/rag-loader-parser.md',
  alt: 'RAG 的 Loader 与 Parser 分两层。Loader 负责把外部对象可靠取回并解码：下载超时、大小上限、校验和，MIME 靠内容探测而不信扩展名，处理字符集和解密，流式读取不把整个文件读进内存；它输出带来源、版本、校验和的 LoadedAsset。Parser 先用原生文本层提取，再做质量检查（字符覆盖率、乱码比例、坐标是否大量重叠或越界）；质量够就直接进入版面树，只有低质量的页面或区域才走 OCR，OCR 结果带置信度，是观测而不是源事实。Parser 的输出是版面树而不是长字符串：文档下面依次是标题、段落、表格、图像和脚注，每个元素都带页码、坐标和阅读顺序，并标出来源是原生、OCR 还是推断；表格保留行列、表头和合并单元格，图像保留资产 ID，段落和脚注双向链接。只有坐标没有阅读顺序时，多栏 PDF 会被交叉拼接。质量门禁：解析成功不能只看退出码，要看覆盖率和元素顺序；损坏、加密、超限、格式伪装和解析器崩溃分别记错误码，绝不能返回空文档继续做 embedding',
};

export default (k) => {
  const s = [];
  s.push(k.box({ x: 40, y: 112, w: 300, h: 112, title: 'Loader：取回并解码', sub: '超时、大小上限、校验和\nMIME 靠内容探测，不信扩展名\n字符集、解密，流式读取', titleSize: 'body', tone: 'info' }));
  s.push(k.arrow({ points: [[190, 224], [190, 268]] }));
  s.push(k.text({ x: 202, y: 252, text: '交出 LoadedAsset', size: 'note', tone: 'sec' }));
  s.push(k.box({ x: 40, y: 268, w: 300, h: 56, title: 'Parser：先用原生文本层', titleSize: 'label', tone: 'accent' }));
  s.push(k.arrow({ points: [[190, 324], [190, 344]] }));
  s.push(k.box({ x: 40, y: 344, w: 300, h: 84, title: '质量检查', sub: '字符覆盖率、乱码比例\n坐标重叠或越界', titleSize: 'body', tone: 'accent', strong: true }));
  s.push(k.arrow({ points: [[190, 428], [190, 452]], tone: 'warn', dashed: true }));
  s.push(k.box({ x: 40, y: 452, w: 300, h: 64, title: '只对低质量页 OCR', sub: '带置信度，是观测不是事实', titleSize: 'label', tone: 'warn' }));
  s.push(k.arrow({ points: [[340, 386], [380, 386]], tone: 'ok' }));
  s.push(k.arrow({ points: [[340, 484], [380, 484]], tone: 'warn', dashed: true }));

  s.push(k.panel({ x: 380, y: 112, w: 540, h: 404, label: '版面树：每个元素带页码、坐标、阅读顺序', tone: 'ok' }));
  s.push(k.box({ x: 400, y: 156, w: 110, h: 40, title: '文档', titleSize: 'label', tone: 'muted' }));
  const els = [
    ['标题', '第 1 页 · 顺序 1 · 原生', 'info'],
    ['段落', '第 1 页 · 顺序 2 · 引用脚注', 'info'],
    ['表格', '第 2 页 · 行列 + 表头 + 合并单元格', 'accent'],
    ['图像', '第 2 页 · 资产 ID + 说明', 'info'],
    ['脚注', '第 2 页 · OCR + 置信度 · 回指段落', 'warn'],
  ];
  s.push(`<path d="M 425 196 V ${214 + 4 * 52 + 20}" fill="none" stroke="${k.t.faint}" stroke-width="1.5"/>`);
  els.forEach(([t, meta, tone], i) => {
    const y = 214 + i * 52;
    s.push(`<path d="M 425 ${y + 20} H 445" fill="none" stroke="${k.t.faint}" stroke-width="1.5"/>`);
    s.push(k.box({ x: 445, y, w: 90, h: 40, title: t, titleSize: 'label', tone }));
    s.push(k.text({ x: 552, y: y + 26, text: meta, size: 'note', tone: 'sec' }));
  });
  s.push(k.text({ x: 650, y: 496, text: '只有坐标没有顺序，多栏 PDF 会交叉拼接', size: 'note', anchor: 'middle', tone: 'muted' }));

  return k.figure({
    h: 620,
    title: 'Loader 与 Parser：先可靠取回，再恢复结构',
    subtitle: 'Loader 建立可信的字节边界，Parser 输出可审计的元素树，而不是一长串文本',
    body: s.join('') + k.note({ x: 40, y: 540, w: 880, h: 52, lead: '质量门禁：', text: '不能只看退出码，要看覆盖率和顺序；失败记错误码，绝不交空文档去 embedding。' }),
  });
};
