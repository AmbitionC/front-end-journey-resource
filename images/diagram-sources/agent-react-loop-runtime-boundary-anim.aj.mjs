export const meta = {
  name: 'agent-react-loop-runtime-boundary-anim',
  article: 'knowledge/llm/agent/agent-react.md',
  alt: 'ReAct 循环（可逐步播放）：模型根据目标和历史推理出下一步行动，运行时校验参数并执行工具，整理后的结果作为观察写回上下文，再进入下一轮；模型给出 finish 行动，或运行时发现步数、时间、token 预算耗尽时停止',
};

export default (k) => {
  const H = 68, R1 = 150, R2 = 300, mid = (y) => y + H / 2;
  return k.figure({
    h: 600,
    title: 'ReAct：模型提出行动，运行时执行并把观察写回',
    subtitle: 'Thought → Action → Observation 反复交替，直到 finish 或预算耗尽',
    steps: [
      'Thought：模型根据目标和已有历史，推理下一步该做什么',
      'Action：模型给出工具名和结构化参数，只是提议',
      '运行时接手：校验参数、检查权限、设超时，然后真正执行工具',
      '整理结果：截断、脱敏、标注来源，变成 Observation',
      '把（行动，观察）追加进上下文，带着新信息进入下一轮 Thought',
      '两种停法：模型给出 finish；或运行时发现步数、时间、token 预算耗尽，主动叫停',
    ],
    body: [
      k.frame({ x: 40, y: 108, w: 490, h: 290, label: '模型：决定下一步' }),
      k.frame({ x: 560, y: 108, w: 360, h: 290, label: '运行时：真正执行与把关', tone: 'info' }),
      k.step(1, [k.box({ x: 70, y: R1, w: 200, h: H, title: 'Thought 推理', sub: '根据目标和历史选下一步', tone: 'accent' })]),
      k.step(2, [
        k.arrow({ points: [[270, mid(R1)], [330, mid(R1)]], tone: 'accent' }),
        k.box({ x: 330, y: R1, w: 180, h: H, title: 'Action 行动', sub: '工具名 + 结构化参数', tone: 'accent' }),
      ]),
      k.step(3, [
        k.arrow({ points: [[510, mid(R1)], [600, mid(R1)]], tone: 'accent' }),
        k.box({ x: 600, y: R1, w: 280, h: H, title: '执行工具', sub: '校验参数、检查权限、设超时', tone: 'info' }),
      ]),
      k.step(4, [
        k.arrow({ points: [[740, R1 + H], [740, R2]], tone: 'info' }),
        k.box({ x: 600, y: R2, w: 280, h: H, title: '整理结果', sub: '截断、脱敏、标注来源', tone: 'info' }),
        k.arrow({ points: [[600, mid(R2)], [510, mid(R2)]], tone: 'accent' }),
        k.box({ x: 330, y: R2, w: 180, h: H, title: 'Observation 观察', sub: '外部系统写入的结果' }),
      ]),
      k.step(5, [
        k.arrow({ points: [[330, mid(R2)], [270, mid(R2)]], tone: 'accent' }),
        k.box({ x: 70, y: R2, w: 200, h: H, title: '更新上下文', sub: '追加（行动，观察）' }),
        k.arrow({ points: [[170, R2], [170, R1 + H]], tone: 'accent', label: '下一轮', labelAt: [182, 264], labelAnchor: 'start' }),
      ]),
      k.step(6, [
        k.box({ x: 330, y: 440, w: 160, h: H, title: '停止', sub: '答案或未完成报告', tone: 'warn' }),
        k.arrow({ points: [[70, mid(R1)], [54, mid(R1)], [54, 474], [330, 474]], tone: 'accent', dashed: true, label: '模型给出 finish', labelAt: [190, 464], labelAnchor: 'middle' }),
        k.arrow({ points: [[740, R2 + H], [740, 474], [490, 474]], tone: 'warn', dashed: true, label: '超预算：步数 / 时间 / token', labelAt: [615, 464], labelAnchor: 'middle' }),
      ]),
      k.note({ x: 40, y: 528, w: 880, h: 52, lead: 'Thought 不是接口：', text: '生产系统记录结构化 Action、Observation 和安全状态，不把详细推理当日志。' }),
    ].join(''),
  });
};
