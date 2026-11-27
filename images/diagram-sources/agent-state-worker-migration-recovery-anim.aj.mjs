import still from './agent-state-worker-migration-recovery-v3.aj.mjs';

export const meta = {
  name: 'agent-state-worker-migration-recovery-anim',
  article: 'knowledge/backend/storage/agent-state-storage.md',
  alt: 'Worker 宕机迁移恢复（可逐步播放）：旧 Worker 执行时持续把检查点快照、事件和幂等账本写到容器外；执行到 step 18 时崩溃，容器里的东西全丢；新 Worker 抢到 lease 42，fencing token 让旧 Worker 的写入失效；随后载入快照 v19、从事件 184 往后重放、查询 op_8 的真实状态并取回已提交的结果，验收通过后从 step 19 继续',
};

const H = 76, R2 = 200, R3 = 296, R4 = 392, SX = 330, SW = 250, PX = 660, PW = 260;
const STEPS = [
  [116, 60, '1 新 Worker 抢 lease', 'fencing token 挡住旧 Worker', 'body'],
  [R2, H, '2 载入快照', '校验 release 与 checksum'],
  [R3, H, '3 重放事件', '从 eventSeq 184 往后补'],
  [R4, H, '4 查外部操作', '已提交取结果，未知先对账'],
  [492, 52, '5 验收后继续决策', null, 'body'],
];

export default (k) => {
  if (k.mode === 'still') return still(k);
  const old = (sub, tone) => k.box({ x: 40, y: R2, w: 220, h: H, title: '旧 Worker', sub, tone });
  const writes = (flow) => [
    k.arrow({ points: [[260, R2 + 38], [SX, R2 + 38]], label: '写', labelAt: [295, R2 + 28], flow }),
    k.arrow({ points: [[150, R2 + H], [150, R3 + 38], [SX, R3 + 38]], flow }),
    k.arrow({ points: [[90, R2 + H], [90, R4 + 38], [SX, R4 + 38]], flow }),
  ].join('');
  const crash = () => k.arrow({ points: [[200, R2], [200, 146], [PX, 146]], tone: 'bad', dashed: true, label: '崩溃 / 迁移：容器内存和磁盘都丢了', labelAt: [430, 136] });
  const store = (ledger = 'op_8 的提交状态', ledgerTone = 'info') => [
    k.box({ x: SX, y: R2, w: SW, h: H, title: 'Checkpoint 快照', sub: '不可变 v19 · 带 checksum', tone: 'info' }),
    k.box({ x: SX, y: R3, w: SW, h: H, title: '事件 / 制品', sub: '追加 #184 · 大对象只存引用', tone: 'info' }),
    k.box({ x: SX, y: R4, w: SW, h: H, title: '幂等账本', sub: ledger, tone: ledgerTone }),
  ].join('');
  // cur：当前进行到第几步（0 起）；之前的步骤标绿，之后的灰掉
  const plan = (cur) => {
    const out = STEPS.map(([y, h, title, sub, size], i) => k.box({
      x: PX, y, w: PW, h, title, sub: sub ?? undefined, titleSize: size ?? 'heading',
      tone: cur < 0 || i > cur ? 'muted' : i < cur ? 'ok' : 'accent', strong: i === cur,
    }));
    for (const [a, b] of [[176, R2], [R2 + H, R3], [R3 + H, R4], [R4 + H, 492]]) out.push(k.arrow({ points: [[790, a], [790, b]], tone: 'accent' }));
    if (cur >= 0) {
      const [y, h] = STEPS[cur];
      out.push(k.keyed('cur', `<rect x="${PX}" y="${y}" width="${PW}" height="${h}" rx="10" fill="none" stroke="${k.color('warn')}" stroke-width="3.2"/>`));
    }
    return out.join('');
  };
  const read = (r) => k.arrow({ points: [[SX + SW, r + 38], [PX, r + 38]], tone: 'info', label: '读', labelAt: [620, r + 28], flow: true });
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 650,
    title: '容器迁移：Worker 可以换，状态和账本留在容器外',
    subtitle: '恢复绑定 run、release、checkpoint、事件序号和已提交副作用，不是复制一份聊天记录',
    body: k.panel({ x: 310, y: 164, w: 290, h: 320, label: '容器之外的权威状态' }) +
      k.note({ x: 40, y: 568, w: 880, h: 52, lead: '账本只指导恢复：', text: '外部已提交、本地没记账的窗口仍存在，未知状态先查询对账，不能当成恰好一次。' }),
    frames: [
      f('旧 Worker 正常执行：每走一步都把快照、事件和外部操作的账本写到容器外，不靠容器自己的磁盘', [old('lease 41 · 执行到 step 18', 'accent'), writes(true), store(), plan(-1)]),
      f('执行到 step 18 时容器崩溃或被迁走：内存和本地磁盘全丢了，容器外的三样还在', [old('已崩溃', 'bad'), writes(false), crash(), store(), plan(-1)]),
      f('新 Worker 先抢 lease 42，拿到更大的 fencing token：旧 Worker 万一复活，带着 41 来写会被拒', [old('lease 41 · 写入会被拒', 'muted'), writes(false), crash(), store(), plan(0)]),
      f('载入最近的可信快照 v19：先核对 release 版本和 checksum，对不上就不能用', [old('lease 41 · 已失效', 'muted'), writes(false), store(), plan(1), read(R2)]),
      f('快照之后还有动作：从事件序号 184 往后逐条重放，把状态补到崩溃前那一刻', [old('lease 41 · 已失效', 'muted'), writes(false), store(), plan(2), read(R3)]),
      f('账本里 op_8 还停在“已发出”：不能重做，先去外部查真实状态。查到已提交，就取回结果记账', [old('lease 41 · 已失效', 'muted'), writes(false), store('op_8 已提交 → 取回结果', 'ok'), plan(3), read(R4)]),
      f('状态、事件和外部副作用都对上了，验收通过，从 step 19 接着往下做', [old('lease 41 · 已失效', 'muted'), writes(false), store('op_8 已提交 → 取回结果', 'ok'), plan(4)]),
    ],
  });
};
