export const meta = {
  name: 'agent-memory-forgetting-four-actions-v3',
  article: 'knowledge/llm/agent/agent-memory-forgetting.md',
  alt: '四种可以分别执行的遗忘动作：衰减用于可能有用但近期不重要的记忆，原记录不变，仍能进入当前视图但排序靠后；过期在超过有效期后触发，原记录按保留政策处理，不再进入当前视图；替代在用户更正或权威来源更新时触发，旧版本保留并和新版本组成版本链，只有新版本进入当前视图；删除由用户请求、政策或撤回同意触发，原文和向量、索引、缓存、派生摘要都要删掉，只留不含原文的 tombstone 记录最小标识和状态。当前视图必须同时满足 active、已授权和在有效期内；运行中的 Agent 可能已读入旧记忆，高风险调用前要按快照版本复查',
};

export default (k) => {
  const s = [], C = [40, 200, 420, 640, 780], Y0 = 150, RH = 74;
  ['动作', '什么时候用', '原记录', '进当前视图？', '留下什么'].forEach((h, i) => s.push(k.text({ x: C[i], y: 132, text: h, size: 'label', tone: 'muted' })));
  const rows = [
    ['衰减 decay', '可能有用，\n但近期不重要', '不变', '能，排序靠后', '权重', 'info', 'sec'],
    ['过期 expire', '超过有效期\nvalidTo', '按保留政策处理', '不能', '过期原因\n和时间', 'warn', 'bad'],
    ['替代 supersede', '用户更正，\n或权威来源更新', '旧版本保留', '只有新版本', '旧 → 新\n版本链', 'accent', 'ok'],
    ['删除 delete', '用户请求、政策、\n撤回同意', '原文、向量、索引、\n缓存、摘要都删', '不能', 'tombstone\n最小标识 + 状态', 'bad', 'bad'],
  ];
  rows.forEach(([a, b, c, d, e, tone, dTone], i) => {
    const y = Y0 + i * RH, two = (t) => t.includes('\n');
    if (i) s.push(`<line x1="40" y1="${y}" x2="920" y2="${y}" stroke="${k.t.faint}" stroke-width="1"/>`);
    s.push(k.box({ x: C[0], y: y + 13, w: 140, h: 48, title: a, titleSize: 'label', tone }));
    const ty = (t) => (two(t) ? y + 32 : y + 43);
    s.push(k.text({ x: C[1], y: ty(b), text: b, size: 'label' }));
    s.push(k.text({ x: C[2], y: ty(c), text: c, size: 'label', tone: 'sec' }));
    s.push(k.text({ x: C[3], y: ty(d), text: d, size: 'label', tone: dTone }));
    s.push(k.text({ x: C[4], y: ty(e), text: e, size: 'label', tone: 'sec' }));
  });

  return k.figure({
    h: 560,
    title: 'Agent 记忆遗忘：四种动作，分开执行',
    subtitle: '四行不是先后流水线；全实现成 DELETE 会丢掉版本历史，只做软删除又会被向量索引继续召回',
    body: s.join('') + k.box({ x: 40, y: 462, w: 880, h: 68, title: '当前视图 = active ∧ 已授权 ∧ 在有效期内', sub: '运行中的 Agent 可能已读入旧记忆：高风险工具调用前按快照版本复查', titleSize: 'body', tone: 'accent', strong: true }),
  });
};
