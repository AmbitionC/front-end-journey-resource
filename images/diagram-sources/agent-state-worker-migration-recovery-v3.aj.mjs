export const meta = {
  name: 'agent-state-worker-migration-recovery-v3',
  article: 'knowledge/backend/storage/agent-state-storage.md',
  alt: '旧 Worker 把检查点快照、追加事件和制品、幂等账本写到容器之外；崩溃或迁移后，新 Worker 先拿新 lease 和 fencing token 挡住旧 Worker，再载入可信快照、从事件序号往后重放、逐个查询外部操作状态，已提交的取回结果、未知的先对账，验收通过后才继续',
};

export default (k) => {
  const s = [], H = 76, R2 = 200, R3 = 296, R4 = 392, SX = 330, SW = 250, PX = 660, PW = 260;
  // 旧 Worker：写到容器外
  s.push(k.box({ x: 40, y: R2, w: 220, h: H, title: '旧 Worker', sub: 'lease 41 · 执行到 step 18', tone: 'muted' }));
  s.push(k.arrow({ points: [[260, R2 + 38], [SX, R2 + 38]], label: '写', labelAt: [295, R2 + 28] }));
  s.push(k.arrow({ points: [[150, R2 + H], [150, R3 + 38], [SX, R3 + 38]] }));
  s.push(k.arrow({ points: [[90, R2 + H], [90, R4 + 38], [SX, R4 + 38]] }));
  s.push(k.arrow({ points: [[200, R2], [200, 146], [PX, 146]], tone: 'bad', dashed: true, label: '崩溃 / 迁移：容器内存和磁盘都丢了', labelAt: [430, 136] }));

  // 容器外的权威状态
  s.push(k.panel({ x: 310, y: 164, w: 290, h: 320, label: '容器之外的权威状态' }));
  s.push(k.box({ x: SX, y: R2, w: SW, h: H, title: 'Checkpoint 快照', sub: '不可变 v19 · 带 checksum', tone: 'info' }));
  s.push(k.box({ x: SX, y: R3, w: SW, h: H, title: '事件 / 制品', sub: '追加 #184 · 大对象只存引用', tone: 'info' }));
  s.push(k.box({ x: SX, y: R4, w: SW, h: H, title: '幂等账本', sub: 'op_8 的提交状态', tone: 'info' }));

  // 新 Worker 的恢复步骤
  s.push(k.box({ x: PX, y: 116, w: PW, h: 60, title: '1 新 Worker 抢 lease', sub: 'fencing token 挡住旧 Worker', tone: 'accent', strong: true, titleSize: 'body' }));
  s.push(k.box({ x: PX, y: R2, w: PW, h: H, title: '2 载入快照', sub: '校验 release 与 checksum', tone: 'accent' }));
  s.push(k.box({ x: PX, y: R3, w: PW, h: H, title: '3 重放事件', sub: '从 eventSeq 184 往后补', tone: 'accent' }));
  s.push(k.box({ x: PX, y: R4, w: PW, h: H, title: '4 查外部操作', sub: '已提交取结果，未知先对账', tone: 'accent' }));
  s.push(k.box({ x: PX, y: 492, w: PW, h: 52, title: '5 验收后继续决策', tone: 'ok', titleSize: 'body' }));
  for (const [a, b] of [[176, R2], [R2 + H, R3], [R3 + H, R4], [R4 + H, 492]]) s.push(k.arrow({ points: [[790, a], [790, b]], tone: 'accent' }));
  for (const r of [R2, R3, R4]) s.push(k.arrow({ points: [[SX + SW, r + 38], [PX, r + 38]], tone: 'info', label: '读', labelAt: [620, r + 28] }));

  return k.figure({
    h: 650,
    title: '容器迁移：Worker 可以换，状态和账本留在容器外',
    subtitle: '恢复绑定 run、release、checkpoint、事件序号和已提交副作用，不是复制一份聊天记录',
    body: s.join('') + k.note({ x: 40, y: 568, w: 880, h: 52, lead: '账本只指导恢复：', text: '外部已提交、本地没记账的窗口仍存在，未知状态先查询对账，不能当成恰好一次。' }),
  });
};
