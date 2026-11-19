export const meta = {
  name: 'agent-memory-tiered-read-write-v2',
  article: 'knowledge/llm/agent/agent-memory.md',
  alt: '左侧是记忆分层：上下文窗口内的工作记忆，窗口外长期存储里的情景记忆、语义记忆和程序性记忆；右侧是生命周期：从长期存储按需检索、装入上下文、使用，产生写入候选后先校验授权、事实和保留政策，通过才更新，过期或不可信的被遗忘',
};

export default (k) => k.figure({
  h: 590,
  title: 'Agent 记忆：分层存放，校验后才写回',
  subtitle: '上下文窗口装不下所有历史，运行时决定什么时候换入、什么时候写回',
  body: [
    k.panel({ x: 40, y: 110, w: 240, h: 120, label: '上下文窗口内' }),
    k.box({ x: 60, y: 146, w: 200, h: 66, title: '工作记忆', sub: '当前任务、最近几轮', titleSize: 'body', tone: 'accent' }),
    k.panel({ x: 40, y: 246, w: 240, h: 236, label: '长期存储（窗口外）' }),
    k.box({ x: 60, y: 280, w: 200, h: 60, title: '情景记忆', sub: '带时间的经历', titleSize: 'body' }),
    k.box({ x: 60, y: 346, w: 200, h: 60, title: '语义记忆', sub: '事实与偏好', titleSize: 'body' }),
    k.box({ x: 60, y: 412, w: 200, h: 60, title: '程序性记忆', sub: '可复用的做法', titleSize: 'body' }),

    k.frame({ x: 320, y: 140, w: 600, h: 274, label: '记忆生命周期', labelPos: 'bottom' }),
    k.box({ x: 350, y: 160, w: 160, h: 60, title: '检索', sub: '按任务按需取', titleSize: 'body' }),
    k.arrow({ points: [[510, 190], [536, 190]] }),
    k.box({ x: 540, y: 160, w: 160, h: 60, title: '装入上下文', sub: '控制 token', titleSize: 'body' }),
    k.arrow({ points: [[700, 190], [726, 190]] }),
    k.box({ x: 730, y: 160, w: 170, h: 60, title: '使用', sub: '回答、调用工具', titleSize: 'body' }),
    k.arrow({ points: [[815, 220], [815, 286]] }),
    k.box({ x: 730, y: 290, w: 170, h: 60, title: '写入候选', sub: '新事实、新经历', titleSize: 'body' }),
    k.arrow({ points: [[730, 320], [704, 320]] }),
    k.box({ x: 540, y: 290, w: 160, h: 60, title: '校验', sub: '授权、事实、保留', titleSize: 'body', tone: 'warn' }),
    k.arrow({ points: [[540, 320], [514, 320]], tone: 'ok' }),
    k.box({ x: 350, y: 290, w: 160, h: 60, title: '更新或遗忘', sub: '合并、过期、删除', titleSize: 'body', tone: 'ok' }),
    k.text({ x: 620, y: 378, text: '不通过就丢弃', size: 'note', tone: 'bad', anchor: 'middle' }),

    k.arrow({ points: [[620, 160], [620, 124], [292, 124], [292, 179], [264, 179]], tone: 'accent', label: '装入', labelAt: [456, 116] }),
    k.arrow({ points: [[280, 456], [330, 456], [330, 190], [346, 190]], label: '取', labelAt: [306, 448] }),
    k.arrow({ points: [[350, 320], [284, 320]], tone: 'ok' }),

    k.note({ x: 40, y: 506, w: 880, h: 56, lead: '不是所有历史都叫长期记忆：', text: '写入前过授权、事实和保留政策；被召回得多不等于可信。' }),
  ].join(''),
});
