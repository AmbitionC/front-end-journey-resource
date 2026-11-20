export const meta = {
  name: 'rag-citation-claim-evidence-ledger-v2',
  article: 'knowledge/llm/rag/rag-citation-grounding.md',
  alt: '答案“产品支持功能 A，并且所有地区默认开启”先拆成两个原子声明，再逐条绑定来源账本里带文档版本和字符区间的证据片段：声明 1 被“功能 A 已发布”的片段支持，声明 2 的证据只说部分企业客户可开启，范围不符，要删掉、改写或拒答；另外分别统计覆盖率和引用正确率',
};

export default (k) => {
  const s = [];
  s.push(k.box({ x: 40, y: 116, w: 880, h: 52, title: '答案：「产品支持功能 A，并且所有地区默认开启」', titleSize: 'body' }));
  s.push(k.arrow({ points: [[190, 168], [190, 232]], label: '拆成原子声明', labelAt: [202, 204], labelAnchor: 'start' }));

  s.push(k.box({ x: 40, y: 232, w: 300, h: 64, title: '声明 1：支持功能 A', titleSize: 'body', tone: 'ok' }));
  s.push(k.box({ x: 40, y: 312, w: 300, h: 64, title: '声明 2：所有地区默认开启', titleSize: 'body', tone: 'bad' }));

  s.push(k.panel({ x: 420, y: 196, w: 500, h: 196, label: '来源账本：sourceId@version + 片段区间' }));
  s.push(k.box({ x: 440, y: 232, w: 460, h: 64, title: 'e1 · doc_17@v3 · 第 2 节 · 字符 120–188', sub: '“功能 A 已在正式版发布”', titleSize: 'label', align: 'left', tone: 'info' }));
  s.push(k.box({ x: 440, y: 312, w: 460, h: 64, title: 'e2 · doc_22@v5 · 第 4 页 · 字符 40–96', sub: '“部分企业客户可开启”', titleSize: 'label', align: 'left', tone: 'info' }));

  s.push(k.arrow({ points: [[340, 264], [440, 264]], tone: 'ok', label: '支持', labelAt: [378, 254] }));
  s.push(k.arrow({ points: [[340, 344], [440, 344]], tone: 'bad', dashed: true, label: '范围不符', labelAt: [378, 334] }));

  s.push(k.arrow({ points: [[190, 376], [190, 416]], tone: 'bad' }));
  s.push(k.box({ x: 40, y: 416, w: 300, h: 76, title: '删掉、改写或拒答', sub: '“现有资料只能确认 A”', tone: 'bad', titleSize: 'body' }));
  s.push(k.box({ x: 420, y: 416, w: 240, h: 76, title: '覆盖率', sub: '有引用的可验证声明 / 全部', titleSize: 'body', tone: 'accent' }));
  s.push(k.box({ x: 680, y: 416, w: 240, h: 76, title: '引用正确率', sub: '引用是否真的支持声明', titleSize: 'body', tone: 'accent' }));

  return k.figure({
    h: 600,
    title: '引用溯源：每个声明连到具体版本的片段',
    subtitle: '示例中的文档与区间为示意；来源归属、引用定位、声明支持、答案忠实度要分开记录和评测',
    body: s.join('') + k.note({ x: 40, y: 520, w: 880, h: 52, lead: '引用 ID 只能来自服务端账本：', text: '模型不能自由编 [1]；来源过期或冲突就阻止引用。' }),
  });
};
