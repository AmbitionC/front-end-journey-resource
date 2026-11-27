import still from './llm-stream-cancel-resume-layers-v2.aj.mjs';

export const meta = {
  name: 'llm-stream-cancel-resume-layers-anim',
  article: 'knowledge/llm/dev/llm-stream-cancel-resume.md',
  alt: '流式生成的取消与续传（可逐步播放）：事件依次到达，text 增量只进 UI 内存；item 完成写成持久事件；completed 之前网络断开，EOF 不算成功，草稿标 incomplete；用户点停止时，前端取消、上游取消、业务撤销是三件事；续传时传输层按 Last-Event-ID 重连，或从最后一个持久确认点发新请求并带幂等键；收到 completed 且校验通过，才写业务事实',
};

export default (k) => {
  if (k.mode === 'still') return still(k);
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

  const hl = (key, x, y, w, h, tone = 'warn') => k.keyed(key, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${k.color(tone)}" stroke-width="3.2"/>`);
  const got = (n, tone = 'info') => hl('ev', 40, 142, (n - 1) * 149 + 134, 44, tone);
  const tier = (i, tone) => hl('tier', 40, 402 + i * 56, 430, 48, tone);
  const can = (i, tone) => hl('cancel', 40 + i * 300, 266, 280, 84, tone);
  const res = (i, tone) => hl('res', 490, 402 + i * 74, 430, 64, tone);
  const eof = (tone) => hl('eof', 36, 196, 600, 26, tone);
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 720,
    title: '流式生成：取消和续传都要分层说清',
    subtitle: '传输断开、服务端停止、副作用撤销是不同的事；恢复靠持久化的确认点，不靠接回半个字节流',
    body: s.join('') + k.note({ x: 40, y: 640, w: 880, h: 52, lead: '恢复点只认协议事件 ID：', text: '字节偏移、最后一个 token、UI 上已显示的字，都不可靠。' }),
    frames: [
      f('事件一个个到：响应开始，接着是 text 增量和工具参数增量。这些 delta 只进 UI 内存，断了可以丢', [got(3), tier(0, 'muted')]),
      f('收到 item 完成：这一段内容和工具调用参数完整了，写成持久事件，它就是以后恢复的确认点', [got(4, 'accent'), tier(2, 'info')]),
      f('completed 还没来，网络断了：读到 EOF 不等于成功，手里的内容只能存成标 incomplete 的草稿', [got(4, 'bad'), eof('bad'), tier(1, 'warn')]),
      f('用户点了“停止”，先做前端取消：不再渲染、不再等待，释放 reader 和连接', [got(4, 'muted'), can(0, 'warn')]),
      f('前端停了，模型可能还在跑：上游取消要调 API 去停，成没成功得确认', [got(4, 'muted'), can(1, 'warn')]),
      f('已经发出的工具调用还要拦：没执行的副作用撤掉，已经发生的只能补偿', [got(4, 'muted'), can(2, 'bad')]),
      f('要续传：服务端保留了事件，就带 Last-Event-ID 重连，从断点之后的事件接着收', [got(4, 'info'), res(0, 'info')]),
      f('否则从最后一个持久确认点（item 完成）发起新请求，工具调用带幂等键，不会重复执行', [got(4, 'accent'), tier(2, 'info'), res(2, 'ok')]),
      f('这次收到了 usage 和 completed，所有 item 校验通过，才把结果作为业务事实单独写入', [got(6, 'ok'), tier(3, 'ok')]),
    ],
  });
};
