export const meta = {
  name: 'agent-workflow-side-effect-checkpoint-v2',
  article: 'knowledge/llm/agent/agent-workflow-state.md',
  alt: '一个带副作用的工作流步骤按五步推进：先写意图，记录操作、参数 hash、授权和目标；再生成 runId、stepId 加逻辑操作的幂等键；然后执行付款、发信等外部效果；接着把结果提交到 operation 表；最后 checkpoint 下一节点、版本和事件序号。最危险的崩溃点在效果已发生、结果还没提交之间。恢复时先按幂等键查外部系统或 operation 表：已存在就复用结果，确定未执行才重试，状态未知转人工或补偿；同一个 run 用带 fencing token 的 lease 保证只有一个 worker 推进，过期 worker 不能覆盖。Retry 是重新执行某个失败操作，Resume 是从持久状态继续未完成流程，Replay 是按事件历史重建状态，不重做真实副作用',
};

export default (k) => {
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
  s.push(k.box({ x: 680, y: 296, w: 240, h: 196, title: 'Lease + fencing token', sub: '同一个 run 只有一个\nworker 推进；\n每次提交校验 token，\n过期 worker 不能覆盖', titleSize: 'body', tone: 'accent' }));

  [['Retry', '重新执行某个失败操作'], ['Resume', '从持久状态继续未完成流程'], ['Replay', '按事件历史重建，不重做副作用']].forEach(([t, sub], i) => s.push(k.box({ x: 40 + i * 300, y: 516, w: 280, h: 68, title: t, sub, titleSize: 'body', tone: i === 2 ? 'accent' : 'muted', strong: i === 2 })));

  return k.figure({
    h: 620,
    title: 'Agent 工作流：副作用夹在意图和检查点之间',
    subtitle: '只在副作用前 checkpoint，崩溃后会重放付款或发信；结果提交之后才推进状态',
    body: s.join(''),
  });
};
