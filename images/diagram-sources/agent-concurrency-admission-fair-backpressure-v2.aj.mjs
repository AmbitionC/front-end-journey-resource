export const meta = {
  name: 'agent-concurrency-admission-fair-backpressure-v2',
  article: 'knowledge/llm/production/agent-concurrency.md',
  alt: '多个租户的任务先过准入，检查全局健康、租户配额与预算、队列容量，超限就快速返回 429 或 503；通过的任务按租户、优先级和任务类别分成 flow，由公平调度器用加权轮询或 DRR 按估算成本扣额度；再分发到按瓶颈分开的 CPU、模型协调、浏览器和高内存 Worker 池，每个池都有并发上限和有界队列；下游变满时背压向上游传播，暂停发放并收紧准入',
};

export default (k) => {
  const s = [], Y = 130, H = 220;
  [['租户 A', 140], ['租户 B', 210], ['租户 C', 280]].forEach(([t, y]) => {
    s.push(k.box({ x: 40, y, w: 140, h: 52, title: t, titleSize: 'body', tone: 'info' }));
    s.push(k.arrow({ points: [[180, y + 26], [216, y + 26]], tone: 'info' }));
  });
  s.push(k.box({ x: 216, y: Y, w: 170, h: H, title: '准入', sub: '全局健康\n租户配额与预算\n队列容量', tone: 'accent' }));
  s.push(k.arrow({ points: [[301, Y + H], [301, 380]], tone: 'bad' }));
  s.push(k.box({ x: 216, y: 380, w: 170, h: 52, title: '快速拒绝 429 / 503', titleSize: 'label', tone: 'bad' }));
  s.push(k.arrow({ points: [[386, Y + 110], [420, Y + 110]], tone: 'accent' }));

  s.push(k.panel({ x: 420, y: Y, w: 236, h: H, label: '公平调度：按 flow 排队' }));
  [['A · 高', 2], ['B · 普通', 3], ['C · 大任务', 5]].forEach(([t, n], i) => {
    s.push(k.text({ x: 436, y: Y + 64 + i * 40, text: t, size: 'note', tone: 'muted' }));
    for (let j = 0; j < n; j++) s.push(`<rect x="${526 + j * 22}" y="${Y + 48 + i * 40}" width="18" height="22" rx="3" fill="${k.t.accent}" fill-opacity="0.6" stroke="${k.t.accent}" stroke-width="1.2"/>`);
  });
  s.push(k.text({ x: 436, y: Y + 186, text: '加权轮询 / DRR\n大任务按估算成本扣额度', size: 'note', tone: 'sec' }));
  s.push(k.arrow({ points: [[656, Y + 110], [690, Y + 110]], tone: 'accent' }));

  s.push(k.frame({ x: 690, y: Y, w: 230, h: H, label: 'Worker 池：按瓶颈分开' }));
  ['CPU 池', '模型协调池', '浏览器池', '高内存池'].forEach((t, i) => s.push(k.box({ x: 706, y: Y + 40 + i * 44, w: 198, h: 36, title: t, titleSize: 'label' })));

  s.push(k.arrow({ points: [[805, Y + H], [805, 470], [200, 470], [200, 338], [216, 338]], tone: 'warn', dashed: true, label: '背压：下游满了就暂停发放、收紧准入', labelAt: [600, 460] }));

  return k.figure({
    h: 590,
    title: 'Agent 并发：准入、公平调度、有界 Worker、背压',
    subtitle: '五层各管一件事：准入、租户配额、调度公平、资源隔离、下游背压，不能用一个 semaphore 全包',
    body: s.join('') + k.note({ x: 40, y: 506, w: 880, h: 52, lead: '只拿当前阶段的许可：', text: '别持有模型 slot 等浏览器，取消时要及时释放许可。' }),
  });
};
