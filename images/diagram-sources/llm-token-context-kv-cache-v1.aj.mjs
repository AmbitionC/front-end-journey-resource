export const meta = {
  name: 'llm-token-context-kv-cache-v1',
  article: 'knowledge/llm/basics/llm-token-context.md',
  alt: '文本经分词器变成 Token，输入与输出共用上下文窗口；Prefill 并行处理输入并写入各层 KV Cache，Decode 每步只计算新位置并追加 K、V',
};

const T = ['t1', 't2', 't3', 't4', 't5', 't6'];

export default (k) => k.figure({
  h: 610,
  title: 'Token、上下文窗口与 KV Cache',
  subtitle: 'Prefill 一次写满缓存；Decode 每步读全部历史，只追加一个新位置',
  body: [
    k.box({ x: 40, y: 112, w: 168, h: 68, title: '原始文本', sub: '提示词、工具、历史' }),
    k.box({ x: 238, y: 112, w: 130, h: 68, title: 'Tokenizer', sub: '按模型词表切分' }),
    k.arrow({ points: [[208, 146], [234, 146]] }),
    k.arrow({ points: [[368, 146], [396, 146]] }),
    k.frame({ x: 400, y: 100, w: 520, h: 124, label: '上下文窗口：输入 t1–t6 和还没生成的输出共用一个上限', labelPos: 'bottom' }),
    k.cells({ x: 430, y: 122, values: [...T, '…', '…'], cw: 56, ch: 44, indices: false, mark: Object.fromEntries(T.map((_, i) => [i, 'accent'])), dim: [6, 7] }),

    k.panel({ x: 40, y: 254, w: 430, h: 266, label: '① Prefill：一次并行处理全部输入' }),
    k.cells({ x: 76, y: 296, values: T, cw: 44, ch: 38, indices: false, mark: Object.fromEntries(T.map((_, i) => [i, 'accent'])) }),
    k.arrow({ points: [[208, 334], [208, 352]] }),
    k.box({ x: 64, y: 356, w: 288, h: 48, title: '每层算出全部位置的 K、V', titleSize: 'body' }),
    k.arrow({ points: [[208, 404], [208, 422]] }),
    k.text({ x: 66, y: 448, text: 'K', size: 'label', tone: 'muted', anchor: 'end' }),
    k.text({ x: 66, y: 480, text: 'V', size: 'label', tone: 'muted', anchor: 'end' }),
    k.cells({ x: 76, y: 426, values: Array(6).fill(''), cw: 44, ch: 30, indices: false, mark: Object.fromEntries(T.map((_, i) => [i, 'accent'])) }),
    k.cells({ x: 76, y: 458, values: Array(6).fill(''), cw: 44, ch: 30, indices: false, mark: Object.fromEntries(T.map((_, i) => [i, 'accent'])) }),
    k.text({ x: 352, y: 452, text: '写入\nKV Cache', size: 'label', tone: 'muted' }),
    k.box({ x: 378, y: 356, w: 82, h: 48, title: '首个输出', titleSize: 'label' }),
    k.arrow({ points: [[352, 380], [374, 380]] }),

    k.panel({ x: 490, y: 254, w: 430, h: 266, label: '② Decode：每步只算 1 个新位置' }),
    k.cells({ x: 526, y: 296, values: ['t7'], cw: 44, ch: 38, indices: false, mark: { 0: 'ok' } }),
    k.text({ x: 584, y: 321, text: '刚生成的 token', size: 'label', tone: 'muted' }),
    k.arrow({ points: [[548, 334], [548, 352]] }),
    k.box({ x: 514, y: 356, w: 252, h: 48, title: '只算新位置的 Q、K、V', titleSize: 'body' }),
    k.arrow({ points: [[640, 404], [640, 422]] }),
    k.text({ x: 516, y: 448, text: 'K', size: 'label', tone: 'muted', anchor: 'end' }),
    k.text({ x: 516, y: 480, text: 'V', size: 'label', tone: 'muted', anchor: 'end' }),
    k.cells({ x: 526, y: 426, values: Array(7).fill(''), cw: 34, ch: 30, indices: false, mark: { ...Object.fromEntries(T.map((_, i) => [i, 'accent'])), 6: 'ok' } }),
    k.cells({ x: 526, y: 458, values: Array(7).fill(''), cw: 34, ch: 30, indices: false, mark: { ...Object.fromEntries(T.map((_, i) => [i, 'accent'])), 6: 'ok' } }),
    k.text({ x: 784, y: 372, text: '新 Q 去匹配\n全部历史 K，\n按权重汇总 V', size: 'label', tone: 'sec' }),
    k.text({ x: 784, y: 460, text: '末尾追加\n新的 K、V', size: 'label', tone: 'ok' }),

    k.note({ x: 40, y: 540, w: 880, lead: '代价：', text: '缓存省掉历史 K、V 的重复计算，但每步仍要读完整缓存，越长越占显存。' }),
  ].join(''),
});
