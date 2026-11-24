export const meta = {
  name: 'llm-model-selection-six-step-loop-v4',
  article: 'knowledge/llm/basics/llm-model-selection.md',
  alt: '模型选型六步闭环：先把业务任务写成可验收定义，包括输入、输出格式、失败条件和业务损失；再用合规、模态、上下文、API 能力、部署和可运维性等硬约束淘汰候选；短名单覆盖能力上界、主力、低成本和异构降级几个档位；用真实数据在同一评测集上离线比较质量、P95 和 P99 延迟以及单次有效成功成本；建立主模型加降级模型、质量闸门和保留上一版的路由与回滚；最后固定快照灰度上线，记录实际模型标识并持续回归监控。模型、Prompt 或工具 schema 任一变更都回到同一评测集重新比较。比较的是完成一次有效任务的成本：首轮、重试和降级调用的费用之和除以通过验收的任务数',
};

export default (k) => {
  const s = [], W = 270, H = 96, X = [40, 345, 650], Y1 = 112, Y2 = 268;
  const top = [
    ['1. 写成可验收任务', '输入、输出格式\n失败条件和业务损失', 'muted'],
    ['2. 硬约束先淘汰', '合规、模态、上下文\nAPI 能力、部署、可运维', 'warn'],
    ['3. 短名单覆盖各档位', '能力上界 · 主力 · 低成本\n+ 异构降级候选', 'info'],
  ];
  top.forEach(([t, sub, tone], i) => {
    s.push(k.box({ x: X[i], y: Y1, w: W, h: H, title: t, sub, titleSize: 'body', tone }));
    if (i < 2) s.push(k.arrow({ points: [[X[i] + W, Y1 + H / 2], [X[i + 1], Y1 + H / 2]] }));
  });
  s.push(k.arrow({ points: [[785, Y1 + H], [785, Y2]] }));
  const bot = [
    [650, '4. 同一评测集离线比', '质量 · P95/P99 延迟\n单次有效成功成本', 'accent'],
    [345, '5. 路由、降级、回滚', '主模型 + 降级模型\n质量闸门，保留上一版', 'info'],
    [40, '6. 固定快照灰度上线', '记录实际模型标识\n持续回归监控', 'ok'],
  ];
  bot.forEach(([x, t, sub, tone], i) => {
    s.push(k.box({ x, y: Y2, w: W, h: H, title: t, sub, titleSize: 'body', tone, strong: i === 0 }));
    if (i < 2) s.push(k.arrow({ points: [[x, Y2 + H / 2], [bot[i + 1][0] + W, Y2 + H / 2]] }));
  });
  s.push(k.arrow({ points: [[175, Y2 + H], [175, 400], [785, 400], [785, Y2 + H]], tone: 'accent', dashed: true }));
  s.push(k.text({ x: 480, y: 428, text: '模型、Prompt、工具 schema 任一变更 → 回到同一评测集重新比较', size: 'note', tone: 'accent', anchor: 'middle' }));

  return k.figure({
    h: 540,
    title: '模型选型：先定任务和约束，再用同一评测集比',
    subtitle: '选的是“当前可用、满足约束、可回归验证”的具体版本，不是给厂商排座次',
    body: s.join('') + k.note({ x: 40, y: 452, w: 880, h: 52, lead: '比单次有效成功成本：', text: '（首轮 + 重试 + 降级调用费用）÷ 通过验收的任务数。' }),
  });
};
