import still from './agent-parallel-tools-fanout-join-v4.aj.mjs';

export const meta = {
  name: 'agent-parallel-tools-fanout-join-anim',
  article: 'knowledge/llm/agent/agent-parallel-tools.md',
  alt: '并行工具调用的一次运行（可逐步播放）：冻结的计划 v7 同时发出三路调用；读取 A 在 0.8 秒返回，读取 B 在 1.5 秒返回，Join 仍要等最慢的一路；工具 C 有副作用，3 秒超时后不重发，先查操作状态，确认已提交后取回结果；三路到齐后 Join 校验 planVersion、schema、证据和矛盾，按事先写定的 All-or-nothing 策略通过，才进入生成报告、审批和发布',
};

const BY = [120, 212, 304];

export default (k) => {
  if (k.mode === 'still') return still(k);
  const hl = (key, x, y, w, h) => k.keyed(key, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${k.color('warn')}" stroke-width="3.2"/>`);
  const TITLES = ['读取数据源 A', '读取数据源 B', '工具 C：有副作用'];
  // st: [sub, tone, flowIn, flowOut]
  const branches = (st) => st.map(([sub, tone, fin, fout], i) => {
    const y = BY[i];
    return k.arrow({ points: [[220, y + 34], [240, y + 34]], tone, flow: fin }) +
      k.box({ x: 240, y, w: 200, h: 68, title: TITLES[i], sub, titleSize: 'body', tone }) +
      k.arrow({ points: [[440, y + 34], [480, y + 34]], tone, flow: fout });
  }).join('');
  const join = (sub, tone = 'accent') => k.box({ x: 480, y: 120, w: 220, h: 252, title: 'Join = 校验器', sub, titleSize: 'body', tone, strong: true });
  const policy = (on) => [
    ['All-or-nothing', '必需项失败就全取消'],
    ['Quorum', '够法定数量就继续'],
    ['Best-effort', '成功部分 + 缺失清单'],
  ].map(([t, sub], i) => k.box({ x: 740, y: 134 + i * 76, w: 180, h: 64, title: t, sub, titleSize: 'label', tone: on && i === 0 ? 'ok' : 'info', strong: on && i === 0 })).join('');
  const next = (go) => k.arrow({ points: [[830, 372], [830, 412]], tone: 'ok', flow: go }) +
    k.box({ x: 480, y: 412, w: 440, h: 56, title: '有依赖的步骤：生成报告 → 校验审批 → 发布', titleSize: 'label', tone: go ? 'ok' : 'muted', strong: go });
  const clock = (t) => k.text({ x: 40, y: 330, text: t, size: 'heading', weight: 600, tone: 'warn' });
  const RUN = (t) => [`运行中 ${t}`, 'muted', false, false];
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 560,
    title: '并行工具调用：先证明独立，再 fan-out，Join 要校验',
    subtitle: '只有入度为零、输入已冻结、互不依赖的任务才能同时跑；子任务的生命周期不能逃出父任务',
    body: [
      k.box({ x: 40, y: 208, w: 160, h: 76, title: '冻结输入的计划', sub: 'planVersion = 7', titleSize: 'body', tone: 'muted' }),
      k.arrow({ points: [[200, 246], [220, 246]], head: false }),
      k.arrow({ points: [[220, 154], [220, 338]], head: false }),
      k.panel({ x: 724, y: 100, w: 212, h: 272, label: '执行前写定，三选一', tone: 'info' }),
      k.arrow({ points: [[700, 246], [724, 246]], tone: 'accent' }),
      k.box({ x: 40, y: 412, w: 400, h: 56, title: '并行度由下游容量定，不由模型一次发几个', titleSize: 'label', tone: 'warn', dashed: true }),
      k.note({ x: 40, y: 484, w: 880, h: 52, lead: '策略不能临时放宽：', text: '运行中把 All-or-nothing 改成 Best-effort 等于悄悄降低验收标准。' }),
    ].join(''),
    frames: [
      f('计划 v7 的输入已冻结，三路互不依赖，同时发出；汇合策略事先定为 All-or-nothing', [clock('0 s'), hl('cur', 40, 208, 160, 76),
        branches([['已发出', 'info', true, false], ['已发出', 'info', true, false], ['已发出 · op_c', 'bad', true, false]]), join('等待：0 / 3 到齐'), policy(false), next(false)]),
      f('0.8 s：A 先回来了。Join 不急着往下走，必需分支没到齐之前只能等', [clock('0.8 s'), hl('cur', 240, 120, 200, 68),
        branches([['完成 0.8 s', 'ok', false, true], RUN('0.8 s'), RUN('0.8 s')]), join('等待：1 / 3 到齐\nA ✓'), policy(false), next(false)]),
      f('1.5 s：B 也回来了。总耗时取决于最慢的那一路，不是三路相加', [clock('1.5 s'), hl('cur', 240, 212, 200, 68),
        branches([['完成 0.8 s', 'ok', false, false], ['完成 1.5 s', 'ok', false, true], RUN('1.5 s')]), join('等待：2 / 3 到齐\nA ✓  B ✓'), policy(false), next(false)]),
      f('3 s：C 超时了。它有副作用，不能直接重发，先按 op_c 查操作状态：已提交，取回原结果', [clock('3 s'), hl('cur', 240, 304, 200, 68),
        branches([['完成 0.8 s', 'ok', false, false], ['完成 1.5 s', 'ok', false, false], ['超时 → 查询：已提交', 'warn', false, true]]), join('3 / 3 到齐\nA ✓  B ✓  C ✓（对账取回）'), policy(false), next(false)]),
      f('到齐不等于能用：Join 逐项检查仍是 planVersion 7、schema 对、有证据、没有互相矛盾', [clock('3.1 s'), hl('cur', 480, 120, 220, 252),
        branches([['完成 0.8 s', 'ok', false, false], ['完成 1.5 s', 'ok', false, false], ['已提交，结果已取回', 'ok', false, false]]),
        join('仍是 planVersion 7 ✓\nschema 对、有证据 ✓\n没有迟到 / 重复 ✓\n结果互不矛盾 ✓', 'ok'), policy(false), next(false)]),
      f('按事先写定的 All-or-nothing：必需分支全部合格，通过，才进入后面有依赖的步骤', [clock('3.1 s'), hl('cur', 740, 134, 180, 64),
        branches([['完成 0.8 s', 'ok', false, false], ['完成 1.5 s', 'ok', false, false], ['已提交，结果已取回', 'ok', false, false]]),
        join('仍是 planVersion 7 ✓\nschema 对、有证据 ✓\n没有迟到 / 重复 ✓\n结果互不矛盾 ✓', 'ok'), policy(true), next(true)]),
    ],
  });
};
