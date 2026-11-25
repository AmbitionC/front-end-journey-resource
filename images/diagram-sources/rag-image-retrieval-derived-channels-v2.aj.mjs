export const meta = {
  name: 'rag-image-retrieval-derived-channels-v2',
  article: 'knowledge/llm/rag/rag-image-retrieval.md',
  alt: '图像 RAG 以原图为根对象，派生出多条检索通道。原图 asset 记录 assetId、sourceVersion、contentHash 和 aclVersion，所有派生记录都指回它。原图先经过隐私与授权过滤：这一步要在 OCR、caption、视觉向量和缓存之前完成，敏感内容先遮挡或拒绝索引。之后派生出四条通道，都是观测而不是原始证据：OCR 区域保存文字、bbox 和置信度，适合精确编号；Caption 是生成的描述，用来补召回，不能直接当事实；视觉向量分整图和区域，外观相似不等于同一事实；版面关系记录图片与标题、段落、表格、页码的关系。四条通道分别检索后做晚融合，用 RRF 或在标注集上校准的权重，不直接相加不同模型的原始分数，并按问题类型调整权重。最终引用回到原图，带 assetId、页码、bbox，并标明来自像素、OCR 还是 caption。图里的文字也是不可信数据，截图里写的「忽略指令」只能当检索证据，不能升级为系统指令',
};

export default (k) => {
  const s = [];
  s.push(k.box({ x: 40, y: 190, w: 210, h: 112, title: '原图 asset（根）', sub: 'assetId · sourceVersion\ncontentHash · aclVersion\n派生记录都指回它', titleSize: 'body', tone: 'accent', strong: true }));
  s.push(k.arrow({ points: [[250, 246], [280, 246]] }));
  s.push(k.box({ x: 280, y: 190, w: 180, h: 112, title: '隐私与授权过滤', sub: '在 OCR、caption\n向量和缓存之前\n遮挡或拒绝索引', titleSize: 'body', tone: 'warn' }));

  const ch = [
    ['OCR 区域', '文字 + bbox + 置信度', 'info'],
    ['Caption', '生成的描述：补召回，不当事实', 'info'],
    ['视觉向量', '整图 + 区域：像 ≠ 同一事实', 'info'],
    ['版面关系', '标题、段落、表格、页码', 'info'],
  ];
  s.push(`<path d="M 460 246 H 475 M 475 144 V 372 M 730 144 V 372 M 730 246 H 750" fill="none" stroke="${k.t.faint}" stroke-width="1.5"/>`);
  ch.forEach(([t, sub, tone], i) => {
    const y = 112 + i * 76;
    s.push(k.arrow({ points: [[475, y + 32], [490, y + 32]] }));
    s.push(k.box({ x: 490, y, w: 240, h: 64, title: t, sub, titleSize: 'label', tone }));
  });
  s.push(k.arrow({ points: [[750, 246], [770, 246]] }));
  s.push(k.box({ x: 770, y: 190, w: 150, h: 112, title: '晚融合', sub: 'RRF 或校准权重\n不加原始分数\n按问题调权重', titleSize: 'body', tone: 'accent' }));
  s.push(k.arrow({ points: [[845, 302], [845, 430]] }));

  s.push(k.box({ x: 40, y: 430, w: 880, h: 56, title: '引用回到原图：assetId · 页码 · bbox · 来自像素 / OCR / caption', titleSize: 'body', tone: 'ok', strong: true }));

  return k.figure({
    h: 600,
    title: '图像 RAG：一张原图，多条派生通道',
    subtitle: 'OCR、caption、视觉向量都是派生观测；证据最终要回到原图和区域坐标',
    body: s.join('') + k.note({ x: 40, y: 510, w: 880, h: 52, lead: '图里的字也不可信：', text: '截图里写的「忽略指令」只是检索证据，不能升级为系统指令。' }),
  });
};
