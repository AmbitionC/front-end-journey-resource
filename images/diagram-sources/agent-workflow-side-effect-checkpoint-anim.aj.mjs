import still from './agent-workflow-side-effect-checkpoint-v2.aj.mjs';

export const meta = {
  name: 'agent-workflow-side-effect-checkpoint-anim',
  article: 'knowledge/llm/agent/agent-workflow-state.md',
  alt: '带副作用的工作流步骤崩溃恢复（可逐步播放）：worker-1 先写意图、生成幂等键 run-9:step-4:pay，再执行付款；付款成功后、结果提交前崩溃；worker-2 拿到更新的 lease 和 fencing token，按幂等键查到这笔付款已存在，于是复用结果、提交到 operation 表并 checkpoint，从持久状态 Resume 继续，没有重复付款',
};

export default (k) => {
  if (k.mode === 'still') return still(k);
  const s = [];
  s.push(k.frame({ x: 40, y: 112, w: 880, h: 160, label: '副作用的安全序列（一个步骤）' }));
  const steps = [
    ['写意图', '操作、参数 hash\n授权、目标', 'info'],
    ['生成幂等键', 'runId:stepId:\n逻辑操作', 'info'],
    ['执行外部效果', '付款、发信、\n写外部系统', 'warn'],
    ['提交结果', '写进\noperation 表', 'info'],
    ['checkpoint', '下一节点、版本\n事件序号', 'accent'],
  ];
  steps.forEach(([t, sub, tone], i) => {
    const x = 60 + i * 172;
    s.push(k.box({ x, y: 146, w: 152, h: 84, title: t, sub, titleSize: 'body', tone, strong: i === 4 }));
    if (i < 4) s.push(k.arrow({ points: [[x + 152, 188], [x + 172, 188]] }));
  });
  s.push(`<line x1="566" y1="140" x2="566" y2="238" stroke="${k.t.bad}" stroke-width="2" stroke-dasharray="5 4"/>`);
  s.push(k.text({ x: 566, y: 258, text: '最危险的崩溃点：效果已发生，结果还没提交', size: 'note', tone: 'bad', anchor: 'middle' }));

  s.push(k.frame({ x: 40, y: 296, w: 620, h: 196, label: '恢复：先按幂等键查，再决定' }));
  s.push(k.box({ x: 60, y: 362, w: 220, h: 68, title: '查外部系统', sub: '或本地 operation 表', titleSize: 'body', tone: 'info' }));
  s.push(k.arrow({ points: [[280, 396], [310, 396]], head: false }));
  s.push(k.arrow({ points: [[310, 346], [310, 446]], head: false }));
  [['已存在 → 复用结果', 'ok'], ['确定未执行 → 重试', 'info'], ['状态未知 → 人工或补偿', 'warn']].forEach(([t, tone], i) => {
    const y = 324 + i * 52;
    s.push(k.arrow({ points: [[310, y + 22], [340, y + 22]], tone }));
    s.push(k.box({ x: 340, y, w: 300, h: 44, title: t, titleSize: 'label', tone }));
  });

  [['Retry', '重新执行某个失败操作'], ['Resume', '从持久状态继续未完成流程'], ['Replay', '按事件历史重建，不重做副作用']].forEach(([t, sub], i) => s.push(k.box({ x: 40 + i * 300, y: 516, w: 280, h: 68, title: t, sub, titleSize: 'body', tone: i === 2 ? 'accent' : 'muted', strong: i === 2 })));

  const hl = (key, x, y, w, h, tone = 'warn') => k.keyed(key, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${k.color(tone)}" stroke-width="3.2"/>`);
  const step = (i) => hl('cur', 60 + i * 172, 146, 152, 84);
  const lease = (sub, tone = 'accent') => k.box({ x: 680, y: 296, w: 240, h: 196, title: 'Lease + fencing token', sub, titleSize: 'body', tone });
  const W1 = 'worker-1 持有 lease\nfencing token = 7\n\n每次提交都校验 token';
  const W2 = 'worker-2 接手\nfencing token = 8\nworker-1 若复活带 7 来写\n会被拒绝';
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 620,
    title: 'Agent 工作流：副作用夹在意图和检查点之间',
    subtitle: '只在副作用前 checkpoint，崩溃后会重放付款或发信；结果提交之后才推进状态',
    body: s.join(''),
    frames: [
      f('worker-1 执行“付款 199 元”这一步：先把意图落盘，记下操作、参数 hash、授权和收款方', [step(0), lease(W1)]),
      f('生成幂等键 run-9:step-4:pay：同一个逻辑操作不管重试几次，键都一样', [step(1), lease(W1)]),
      f('调用支付接口，钱真的付出去了：这是外部效果，撤不回来', [step(2), k.arrow({ points: [[384, 188], [404, 188]], tone: 'warn', flow: true }), lease(W1)]),
      f('偏偏在这里崩溃：付款已经成功，结果还没写进 operation 表。只在副作用前做过 checkpoint 的系统，恢复时会再付一次', [hl('cur', 548, 136, 36, 108, 'bad'), lease('worker-1 已崩溃\nlease 到期后释放', 'bad')]),
      f('worker-2 抢到 lease，拿到更大的 fencing token 8：旧 worker 就算复活，也写不进来', [hl('cur', 680, 296, 240, 196), lease(W2)]),
      f('恢复不是直接重跑：先按幂等键去支付系统查，这笔付款已经存在', [hl('cur', 60, 362, 220, 68), hl('hit', 340, 324, 300, 44, 'ok'),
        k.arrow({ points: [[280, 396], [310, 396], [310, 346], [340, 346]], tone: 'ok', flow: true }), lease(W2)]),
      f('复用这次付款的结果，补写进 operation 表，再 checkpoint 推进到下一节点', [step(3), hl('hit', 748, 146, 152, 84, 'ok'), k.arrow({ points: [[728, 188], [748, 188]], tone: 'ok', flow: true }), lease(W2)]),
      f('这就是 Resume：从持久状态接着往下走，钱只付了一次。Retry 是重做一个失败操作，Replay 只按事件重建状态', [step(4), hl('hit', 340, 516, 280, 68, 'ok'), lease(W2)]),
    ],
  });
};
