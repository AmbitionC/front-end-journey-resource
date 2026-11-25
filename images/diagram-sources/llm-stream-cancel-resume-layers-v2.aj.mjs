export const meta = {
  name: 'llm-stream-cancel-resume-layers-v2',
  article: 'knowledge/llm/dev/llm-stream-cancel-resume.md',
  alt: '把 LLM 流当成有类型的事件，而不是拼字符串。一次流依次有响应开始、text 增量、工具参数增量、item 完成、usage 和 completed 事件；网络 EOF 不等于成功，只有收到 completed 且所有 item 校验通过才能提交。取消要分三件事：前端取消是不再渲染、不再等待，并释放 reader 和连接；上游取消是调用 API 尝试停止模型任务，成没成功要确认；业务撤销是拦住尚未执行的工具副作用，已经发生的只能补偿。确认点分四层：UI 内存保存所有 delta，可以丢；临时快照是标记为 incomplete 的草稿；持久事件包括 item 完成、工具调用确认和整体完成；业务事实在验证通过后单独写入。续传有三种含义：传输层重连要求服务端保留事件并认 Last-Event-ID；查询同一后台任务要供应商支持，按任务 ID 重新订阅；应用级恢复从确认点发起新请求，用幂等键防止重复工具操作。恢复点只认协议给的事件 ID，字节偏移、最后一个 token 或 UI 已显示的字都不可靠',
};

export default (k) => {
  const s = [];
  s.push(k.text({ x: 40, y: 130, text: '流是有类型的事件', size: 'label', tone: 'muted', weight: 600 }));
  const ev = [['开始', 'muted'], ['text 增量', 'info'], ['工具参数增量', 'info'], ['item 完成', 'accent'], ['usage', 'muted'], ['completed', 'ok']];
  ev.forEach(([t, tone], i) => {
    const x = 40 + i * 149;
    s.push(k.box({ x, y: 142, w: 134, h: 44, title: t, titleSize: 'label', tone }));
    if (i < ev.length - 1) s.push(k.arrow({ points: [[x + 134, 164], [x + 149, 164]] }));
  });
  s.push(k.text({ x: 40, y: 214, text: 'EOF 不等于成功：收到 completed 且 item 都校验通过，才能提交', size: 'label', tone: 'bad' }));

  s.push(k.text({ x: 40, y: 254, text: '「停止」其实是三件事', size: 'label', tone: 'muted', weight: 600 }));
  const cancel = [
    ['前端取消', '不再渲染、不再等待\n释放 reader 和连接', 'muted'],
    ['上游取消', '调 API 尝试停模型任务\n成没成功要确认', 'warn'],
    ['业务撤销', '拦住未执行的工具副作用\n已发生的只能补偿', 'bad'],
  ];
  cancel.forEach(([t, sub, tone], i) => s.push(k.box({ x: 40 + i * 300, y: 266, w: 280, h: 84, title: t, sub, titleSize: 'body', tone })));

  s.push(k.text({ x: 40, y: 390, text: '确认点分四层', size: 'label', tone: 'muted', weight: 600 }));
  const tiers = [
    ['UI 内存：所有 delta，可以丢', 'muted'],
    ['临时快照：标 incomplete 的草稿', 'warn'],
    ['持久事件：item 完成 · 工具确认 · 整体完成', 'info'],
    ['业务事实：验证通过后单独写入', 'ok'],
  ];
  tiers.forEach(([t, tone], i) => s.push(k.box({ x: 40, y: 402 + i * 56, w: 430, h: 48, title: t, titleSize: 'label', tone })));

  s.push(k.text({ x: 490, y: 390, text: '「续传」的三种含义', size: 'label', tone: 'muted', weight: 600 }));
  const resume = [
    ['传输层重连', '服务端保留事件、认 Last-Event-ID 才行', 'muted'],
    ['查同一后台任务', '供应商支持时，按任务 ID 重新订阅', 'info'],
    ['应用级恢复', '从确认点发新请求，幂等键防重复', 'ok'],
  ];
  resume.forEach(([t, sub, tone], i) => s.push(k.box({ x: 490, y: 402 + i * 74, w: 430, h: 64, title: t, sub, titleSize: 'body', tone })));

  return k.figure({
    h: 720,
    title: '流式生成：取消和续传都要分层说清',
    subtitle: '传输断开、服务端停止、副作用撤销是不同的事；恢复靠持久化的确认点，不靠接回半个字节流',
    body: s.join('') + k.note({ x: 40, y: 640, w: 880, h: 52, lead: '恢复点只认协议事件 ID：', text: '字节偏移、最后一个 token、UI 上已显示的字，都不可靠。' }),
  });
};
