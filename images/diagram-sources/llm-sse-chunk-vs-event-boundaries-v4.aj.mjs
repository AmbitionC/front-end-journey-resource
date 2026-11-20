export const meta = {
  name: 'llm-sse-chunk-vs-event-boundaries-v4',
  article: 'knowledge/llm/dev/llm-sse-streaming.md',
  alt: '网络收到的三个 chunk 边界是随机的：第一个 chunk 在“好”字的 UTF-8 字节中间断开，第二个 chunk 才补齐并结束事件 1，又带上事件 2 的开头；解析器先做 UTF-8 增量解码、追加到缓冲区，遇到空行才切出事件，最后交给界面的是完整的三个事件',
};

export default (k) => {
  const s = [], W = 280, X = [40, 340, 640];
  const line = (x, y, text, tone = 'sec') => s.push(k.text({ x, y, text, size: 'label', mono: true, tone }));
  const hint = (x, y, text, tone = 'muted') => s.push(k.text({ x, y, text, size: 'note', tone }));

  s.push(k.text({ x: 40, y: 124, text: '网络上收到的 chunk：边界由 TCP 和代理决定，随机', size: 'label', tone: 'muted' }));
  X.forEach((x, i) => s.push(k.panel({ x, y: 138, w: W, h: 100, label: `chunk ${i + 1}` })));
  line(56, 194, 'data: {"t":"你');
  line(56, 222, 'E5 A5', 'bad'); hint(112, 222, '←“好”只到了前 2 个字节', 'bad');
  line(356, 194, 'BD"}\\n\\n', 'sec'); hint(450, 194, '← 补齐，事件 1 结束');
  line(356, 222, 'data: {"t":"世');
  line(656, 194, '界"}\\n\\n');
  line(656, 222, 'event: done\\ndata: {}\\n\\n');

  const PY = 282, PH = 68;
  s.push(k.box({ x: 40, y: PY, w: W, h: PH, title: 'UTF-8 增量解码', sub: 'stream: true，半个字先留着', tone: 'accent' }));
  s.push(k.box({ x: 340, y: PY, w: W, h: PH, title: '追加到缓冲区', sub: '跨 chunk 拼接未完成的文本', tone: 'accent' }));
  s.push(k.box({ x: 640, y: PY, w: W, h: PH, title: '遇到空行才切出事件', sub: '没切完的留在缓冲区等下一块', tone: 'accent' }));
  s.push(k.arrow({ points: [[180, 238], [180, PY]], tone: 'line', label: '按到达顺序逐块喂入', labelAt: [192, 266], labelAnchor: 'start' }));
  s.push(k.arrow({ points: [[320, PY + PH / 2], [340, PY + PH / 2]], tone: 'accent' }));
  s.push(k.arrow({ points: [[620, PY + PH / 2], [640, PY + PH / 2]], tone: 'accent' }));

  const EY = 414, TY = 382;
  s.push(k.arrow({ points: [[780, PY + PH], [780, EY]], tone: 'accent' }));
  s.push(k.arrow({ points: [[780, TY], [180, TY], [180, EY]], tone: 'accent' }));
  s.push(k.arrow({ points: [[480, TY], [480, EY]], tone: 'accent' }));
  s.push(k.text({ x: 492, y: TY - 8, text: '每个事件都完整', size: 'note', tone: 'muted' }));
  [['message', '{"t":"你好"}'], ['message', '{"t":"世界"}'], ['done', '{}']].forEach(([type, data], i) => {
    s.push(k.box({ x: X[i], y: EY, w: W, h: 52, title: `${type}  ·  ${data}`, titleSize: 'body', tone: i === 2 ? 'info' : 'default' }));
  });

  return k.figure({
    h: 560,
    title: 'SSE：网络分块不等于事件边界',
    subtitle: '同一段事件流被切成 3 个 chunk；没写 event 字段的事件类型默认是 message',
    body: s.join('') + k.note({ x: 40, y: 488, w: 880, h: 52, lead: '不要按单个 chunk 拆行：', text: 'chunk 可能切在事件中间，甚至切开一个汉字的 UTF-8 字节。' }),
  });
};
