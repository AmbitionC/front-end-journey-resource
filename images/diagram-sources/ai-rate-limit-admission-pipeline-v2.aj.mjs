export const meta = {
  name: 'ai-rate-limit-admission-pipeline-v2',
  article: 'knowledge/llm/production/ai-rate-limiting.md',
  alt: 'AI 限流分别回答四个问题：能接多快由令牌桶控制，最多等多久由有界队列控制，同时跑多少由并发租约控制，还能花多少由预算预留控制。请求依次经过：入口做可信身份和请求指纹；令牌桶按估算 token 加权扣额度，超限返回 429 和 Retry-After；有界队列限制条数、字节、等待时长和租户份额，满员或过期就移除并通知；出队准入时重查 deadline、做预算预留和并发租约，只拿到部分资源就幂等补偿；执行时每次尝试有唯一 ID、共享总 deadline，超时或取消要向下传播，但不能证明底层已停止；结算按可信 usage 只结一次，usage 不明就进入待对账而不是全额退款。降级到其他模型也是一次新尝试，要重新通过预算和并发准入',
};

export default (k) => {
  const s = [];
  [
    ['能接多快？', '令牌桶'],
    ['最多等多久？', '有界队列'],
    ['同时跑多少？', '并发租约'],
    ['还能花多少？', '预算预留'],
  ].forEach(([q, a], i) => s.push(k.box({ x: 40 + i * 225, y: 112, w: 205, h: 52, title: `${q} → ${a}`, titleSize: 'label', tone: 'accent' })));

  const main = [
    ['入口', '可信身份\n请求指纹', 'muted', null],
    ['令牌桶', '按估算 token\n加权扣额度', 'info', '429\n+ Retry-After'],
    ['有界队列', '条数、字节\n等待、份额', 'info', '满员或过期\n移除并通知'],
    ['出队准入', '重查 deadline\n预算 + 租约', 'accent', '只拿到部分\n幂等补偿'],
    ['执行', '唯一尝试 ID\n共享 deadline', 'info', '超时取消\n≠ 已停止'],
    ['结算', '可信 usage\n只结一次', 'ok', 'usage 不明\n进入对账'],
  ];
  main.forEach(([t, sub, tone, fail], i) => {
    const x = 40 + i * 150;
    s.push(k.box({ x, y: 204, w: 130, h: 88, title: t, sub, titleSize: 'body', tone, strong: t === '出队准入' }));
    if (i < 5) s.push(k.arrow({ points: [[x + 130, 248], [x + 150, 248]] }));
    if (fail) {
      s.push(k.arrow({ points: [[x + 65, 292], [x + 65, 332]], tone: 'bad', dashed: true }));
      s.push(k.box({ x, y: 332, w: 130, h: 72, title: fail.split('\n')[0], sub: fail.split('\n')[1], titleSize: 'label', tone: 'bad' }));
    }
  });

  return k.figure({
    h: 530,
    title: 'AI 限流：速率、等待、并发、预算分开管',
    subtitle: '令牌是抽象额度，可以按估算 token 加权；流式完成前拿不到完整用量，所以预算先预留、后结算',
    body: s.join('') + k.note({ x: 40, y: 440, w: 880, h: 52, lead: '降级也要重新准入：', text: '换模型是一次新尝试，要再过预算和并发，共享总 deadline 和费用上限。' }),
  });
};
