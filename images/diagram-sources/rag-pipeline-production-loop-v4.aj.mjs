export const meta = {
  name: 'rag-pipeline-production-loop-v4',
  article: 'knowledge/llm/rag/rag-pipeline.md',
  alt: '离线索引把数据源解析清洗、切块并带上元数据和权限、做 Embedding 后写入向量和关键词索引；在线回答对问题改写、按权限过滤、混合召回、重排、组装上下文后生成带引用的答案；评测集和线上日志再反馈去调切块、检索和 Prompt',
};

const off = ['数据源', '解析清洗', '切块', 'Embedding', '索引'];
const offSub = ['文档、库、网页', '格式、去重、去噪', '带元数据和权限', '批量向量化', '向量 + 关键词'];
const on = ['问题改写', '权限过滤', '混合召回', '重排', '组装上下文', '生成 + 引用'];
const onSub = ['纠错、扩展', '检索时就生效', '向量 + BM25', '精排 Top-N', '去重、裁窗口', '标明来源'];

export default (k) => k.figure({
  h: 620,
  title: 'RAG 全流程：离线建索引，在线答问题',
  subtitle: '上面一次性（或增量）做好，下面每个问题都走一遍；评测和日志把两边连起来',
  body: [
    k.panel({ x: 40, y: 110, w: 880, h: 122, label: '离线索引' }),
    ...off.map((t, i) => k.box({ x: 60 + i * 174, y: 146, w: 146, h: 70, title: t, sub: offSub[i], titleSize: 'body' })),
    ...off.slice(1).map((_, i) => k.arrow({ points: [[206 + i * 174, 181], [230 + i * 174, 181]] })),

    k.arrow({ points: [[829, 216], [829, 264], [402, 264], [402, 322]], tone: 'accent', label: '查索引', labelAt: [690, 256] }),

    k.panel({ x: 40, y: 290, w: 880, h: 130, label: '在线回答' }),
    ...on.map((t, i) => k.box({ x: 52 + i * 144, y: 326, w: 124, h: 74, title: t, sub: onSub[i], titleSize: 'body', tone: i === 1 ? 'warn' : i === 5 ? 'ok' : 'default' })),
    ...on.slice(1).map((_, i) => k.arrow({ points: [[176 + i * 144, 363], [192 + i * 144, 363]] })),

    k.arrow({ points: [[834, 400], [834, 488], [664, 488]], label: '记日志', labelAt: [846, 460], labelAnchor: 'start' }),
    k.box({ x: 300, y: 450, w: 360, h: 76, title: '评测集 + 线上日志', sub: '召回、答案、引用、反馈、时延、成本', titleSize: 'body' }),
    k.arrow({ points: [[300, 488], [26, 488], [26, 170], [36, 170]], tone: 'accent', dashed: true, label: '回头调切块、检索、Prompt', labelAt: [164, 480] }),

    k.note({ x: 40, y: 546, w: 880, h: 54, lead: '检索到 ≠ 答对：', text: '找不到证据时应拒答；权限要在检索时过滤，不能等生成后再遮。' }),
  ].join(''),
});
