export const meta = {
  name: 'multi-agent-orchestrator-worker-tradeoffs-v2',
  article: 'knowledge/llm/agent/multi-agent.md',
  alt: '主智能体持有目标并提出子任务，运行时校验任务契约、权限和预算后创建流量、支付两个独立执行会话；两者可并行，各自交回观察和证据；汇总时先核对口径和出处，缺证据就退回补查，最后输出含不确定项的报告',
};

export default (k) => k.figure({
  h: 540,
  title: '多智能体：契约派出去，证据收回来',
  subtitle: '以“店铺支付金额为什么下降”为例：主智能体分工，运行时把关，专项智能体各查一支',
  body: [
    k.box({ x: 40, y: 200, w: 150, h: 90, title: '主智能体', sub: '持有目标与进度', titleSize: 'body' }),
    k.arrow({ points: [[190, 245], [216, 245]], label: '' }),
    k.box({ x: 220, y: 200, w: 150, h: 90, title: '运行时校验', sub: '契约、权限、预算', titleSize: 'body', tone: 'warn' }),
    k.arrow({ points: [[370, 245], [394, 245], [394, 162], [416, 162]], tone: 'accent' }),
    k.arrow({ points: [[394, 245], [394, 328], [416, 328]], tone: 'accent' }),
    k.box({ x: 420, y: 120, w: 170, h: 84, title: '流量智能体', sub: '独立会话，只读查询', titleSize: 'body', tone: 'accent' }),
    k.text({ x: 505, y: 251, text: '可并行，不默认互发消息', size: 'note', tone: 'muted', anchor: 'middle' }),
    k.box({ x: 420, y: 286, w: 170, h: 84, title: '支付智能体', sub: '独立会话，只读查询', titleSize: 'body', tone: 'accent' }),
    k.arrow({ points: [[590, 162], [614, 162], [614, 245], [636, 245]], tone: 'ok' }),
    k.arrow({ points: [[590, 328], [614, 328], [614, 245]], tone: 'ok', head: false }),
    k.text({ x: 622, y: 150, text: '观察 + 证据', size: 'note', tone: 'ok' }),
    k.box({ x: 640, y: 200, w: 150, h: 90, title: '汇总校验', sub: '同口径？有出处？', titleSize: 'body' }),
    k.arrow({ points: [[790, 245], [816, 245]], tone: 'ok' }),
    k.box({ x: 820, y: 200, w: 100, h: 90, title: '报告', sub: '含不确定项', titleSize: 'body', tone: 'ok' }),
    k.arrow({ points: [[715, 290], [715, 404], [505, 404], [505, 374]], tone: 'bad', dashed: true, label: '缺证据：退回补查', labelAt: [610, 428] }),

    k.note({ x: 40, y: 460, w: 880, h: 56, lead: '模型提出分工，运行时决定能不能执行：', text: '只有带来源的结果才进汇总；分几个专项看任务定。' }),
  ].join(''),
});
