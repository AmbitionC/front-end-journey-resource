import still from './rag-chunking-boundaries-overlap-v4.aj.mjs';

export const meta = {
  name: 'rag-chunking-boundaries-overlap-anim',
  article: 'knowledge/llm/rag/rag-chunking.md',
  alt: '同一段 560 token 的文档三种切法（可逐步播放）：固定 200 token 两刀都切在句子中间；递归结构切分按段落切成两块并带上标题路径；滑动窗口每块 200、步长 160，窗口每往后滑一次就和上一块重叠 40 token，重叠区内容出现两次；最后每个 chunk 带元数据向量化入库',
};

const X0 = 210, X1 = 920, TOTAL = 560;
const X = (t) => X0 + (t * (X1 - X0)) / TOTAL;
const SEG = [[0, 40, '标题'], [40, 160, '句 1'], [160, 300, '句 2'], [300, 460, '步骤'], [460, 560, '仅管理员']];
// 滑动窗口：每块 200、步长 160；第 4 块到文末只剩 80
const WIN = [[0, 200, 376], [160, 360, 416], [320, 520, 376], [480, 560, 416]];

export default (k) => {
  if (k.mode === 'still') return still(k);
  const bar = (a, b, y, h, title, tone = 'default', dashed = false) =>
    k.box({ x: X(a), y, w: X(b) - X(a), h, title, titleSize: 'label', tone, dashed });
  const rowLabel = (y, title, sub) =>
    k.text({ x: 40, y: y + 18, text: title, size: 'label', weight: 600 }) + (sub ? k.text({ x: 40, y: y + 40, text: sub, size: 'note', tone: 'muted' }) : '');

  const fixed = (cut) => [
    rowLabel(208, '固定 200 token', '实现简单，当基线'),
    bar(0, 200, 208, 44, 'chunk 1'), bar(200, 400, 208, 44, 'chunk 2'), bar(400, 560, 208, 44, 'chunk 3'),
    ...(cut ? [200, 400].map((t) => `<line x1="${X(t)}" y1="118" x2="${X(t)}" y2="258" stroke="${k.color('bad')}" stroke-width="2" stroke-dasharray="4 4"/>`) : []),
    k.text({ x: X(560), y: 274, text: '红线：切在句子中间', size: 'note', tone: 'bad', anchor: 'end' }),
  ].join('');
  const recursive = () => [
    rowLabel(292, '递归结构切分', '标题 → 段落 → 句子'),
    bar(0, 300, 292, 44, '标题 + 段落 1', 'accent'), bar(300, 560, 292, 44, '标题路径 + 段落 2', 'accent'),
    k.text({ x: X(560), y: 358, text: '步骤和“仅管理员”留在同一块', size: 'note', tone: 'accent', anchor: 'end' }),
  ].join('');
  const windows = (n, msg) => {
    const out = [rowLabel(376, '滑动窗口', '每块 200，重叠 40')];
    for (let i = 0; i < n; i++) {
      const [a, b, y] = WIN[i];
      const w = bar(a, b, y, 34, `窗口 ${i + 1}`, 'info');
      out.push(i === n - 1 ? k.keyed('win', w) : w);
    }
    // 最新一块和上一块的重叠区：画在两排窗口下方的橙色条
    if (n >= 2) {
      const a = WIN[n - 1][0], b = WIN[n - 2][1];
      out.push(`<rect x="${X(a)}" y="453" width="${X(b) - X(a)}" height="6" rx="3" fill="${k.color('warn')}"/>`);
    }
    out.push(k.text({ x: X(0), y: 474, text: msg, size: 'note', tone: n >= 2 ? 'warn' : 'muted' }));
    return out.join('');
  };
  const store = (flow) => [
    k.box({ x: 40, y: 494, w: 400, h: 60, title: '每个 chunk 带元数据入库', sub: 'doc_id · 标题路径 · 页码 · acl', titleSize: 'body', tone: flow ? 'ok' : 'default' }),
    k.box({ x: 500, y: 494, w: 160, h: 60, title: 'Embedding', titleSize: 'body' }),
    k.box({ x: 720, y: 494, w: 200, h: 60, title: '向量索引', titleSize: 'body' }),
    k.arrow({ points: [[440, 524], [500, 524]], flow }),
    k.arrow({ points: [[660, 524], [720, 524]], flow }),
  ].join('');
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 650,
    title: 'Chunking：先保结构，再控 token',
    subtitle: '同一段文档的三种切法；横向长度按 token 数示意',
    body: [
      rowLabel(124, '原文', '共 560 token'),
      ...SEG.map(([a, b, t]) => bar(a, b, 124, 44, t)),
      k.text({ x: X(170), y: 190, text: '段落 1', size: 'note', tone: 'muted', anchor: 'middle' }),
      k.text({ x: X(430), y: 190, text: '段落 2', size: 'note', tone: 'muted', anchor: 'middle' }),
      k.note({ x: 40, y: 576, w: 880, h: 52, lead: '重叠不是越大越好：', text: '优先用结构边界避免切断语义，重叠只在窗口边界做有限补救。' }),
    ].join(''),
    frames: [
      f('原文 560 token：一个标题，加两个段落，第二段的“步骤”和“仅限管理员”必须一起看', [store(false)]),
      f('固定 200 token 一刀一刀切：第 200、400 个 token 正好落在“句 2”和“步骤”中间', [fixed(true), store(false)]),
      f('递归结构切分：先按标题、段落切，块太大再按句子切；“步骤”和“仅管理员”留在同一块，两块都带标题路径', [fixed(false), recursive(), store(false)]),
      f('滑动窗口：第 1 块取 0–200', [fixed(false), recursive(), windows(1, '每次往后滑 160 token（块长 200 − 重叠 40）'), store(false)]),
      f('窗口往后滑 160，从 160 取到 360：160–200 这 40 token 同时在窗口 1 和 2 里，句 2 不再被切断', [fixed(false), recursive(), windows(2, '160–200 出现两次：句 2 的尾巴和开头在同一块里'), store(false)]),
      f('再滑 160，取 320–520：重叠区 320–360 把“步骤”开头也带进了窗口 3', [fixed(false), recursive(), windows(3, '320–360 出现两次：“步骤”开头没被切丢'), store(false)]),
      f('最后一块到文末只剩 80 token；4 块共 680 token，比原文多了 120 的重复', [fixed(false), recursive(), windows(4, '重叠区内容出现两次：边界更保险，但块数、成本和重复召回都会增加'), store(false)]),
      f('不管用哪种切法，每个 chunk 都带着 doc_id、标题路径、页码和权限一起向量化入库', [fixed(false), recursive(), windows(4, '重叠区内容出现两次：边界更保险，但块数、成本和重复召回都会增加'), store(true)]),
    ],
  });
};
