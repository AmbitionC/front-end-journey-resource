import still from './llm-sse-chunk-vs-event-boundaries-v4.aj.mjs';

export const meta = {
  name: 'llm-sse-chunk-vs-event-boundaries-anim',
  article: 'knowledge/llm/dev/llm-sse-streaming.md',
  alt: 'SSE 解析逐步演示（可逐步播放）：chunk 1 在“好”字的 UTF-8 字节中间断开，半个字先留在解码器里；chunk 2 补齐后，缓冲区里出现空行，切出事件 1，剩下的“世”留在缓冲区；chunk 3 到达后切出事件 2 和 done 事件，缓冲区清空',
};

const W = 280, X = [40, 340, 640];

export default (k) => {
  if (k.mode === 'still') return still(k);
  const chunk = (i, on, lines) => k.panel({ x: X[i], y: 134, w: W, h: 96, label: `chunk ${i + 1}`, tone: on ? 'accent' : 'default' }) +
    lines.map(([t, tone], j) => k.text({ x: X[i] + 16, y: 190 + j * 26, text: t, size: 'label', mono: true, tone: tone ?? (on ? 'sec' : 'muted') })).join('');
  const C1 = (on) => chunk(0, on, [['data: {"t":"你'], ['E5 A5  ← 半个“好”', on ? 'bad' : 'muted']]);
  const C2 = (on) => chunk(1, on, [['BD"}\\n\\n'], ['data: {"t":"世']]);
  const C3 = (on) => chunk(2, on, [['界"}\\n\\n'], ['event: done ...\\n\\n']]);
  const feed = (i) => k.arrow({ points: [[X[i] + W / 2, 230], [X[i] + W / 2, 290]], tone: 'accent', flow: true, label: '喂入', labelAt: [X[i] + W / 2 + 10, 266], labelAnchor: 'start' });
  const seg = (key, x, w, text, tone, y = 338) => k.keyed(key, k.box({ x, y, w, h: 48, title: text, titleSize: 'label', tone }));
  const out = (key, i, text, tone) => seg(key, X[i], W, text, tone, 448);
  const empty = k.text({ x: 480, y: 368, text: '（空）', size: 'label', tone: 'muted', anchor: 'middle' });
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 600,
    title: 'SSE：网络分块不等于事件边界',
    subtitle: '解析器先做 UTF-8 增量解码、追加到缓冲区，遇到空行才切出一个事件',
    body: [
      k.panel({ x: 40, y: 294, w: 880, h: 112, label: '缓冲区' }),
      k.text({ x: 40, y: 436, text: '交给界面的事件', size: 'label', tone: 'muted' }),
      k.note({ x: 40, y: 524, w: 880, h: 52, lead: '不要按单个 chunk 拆行：', text: 'chunk 可能切在事件中间，甚至切开一个汉字的 UTF-8 字节。' }),
    ].join(''),
    frames: [
      f('chunk 1 到达：它在“好”字的 3 个字节中间断开了。解码器先把“你”之前的解出来，半个“好”的 2 个字节先留着', [C1(true), feed(0),
        seg('p1', 60, 220, 'data: {"t":"你', 'default'), seg('half', 300, 180, '待补齐：E5 A5', 'bad')]),
      f('缓冲区里还没有空行，说明事件没结束：什么都不交给界面，继续等', [C1(false),
        seg('p1', 60, 220, 'data: {"t":"你', 'default'), seg('half', 300, 180, '待补齐：E5 A5', 'bad')]),
      f('chunk 2 到达：先补齐“好”，再追加后面的内容。缓冲区里出现了空行 \\n\\n', [C1(false), C2(true), feed(1),
        seg('ev1', 60, 300, 'data: {"t":"你好"}\\n\\n', 'accent'), seg('p2', 380, 220, 'data: {"t":"世', 'default')]),
      f('遇到空行就切出事件 1 交给界面；“世”那一半事件留在缓冲区，等下一块', [C1(false), C2(false),
        out('ev1', 0, 'message · {"t":"你好"}', 'ok'), seg('p2', 60, 220, 'data: {"t":"世', 'default')]),
      f('chunk 3 到达：补完事件 2，又带来一个完整的 done 事件', [C1(false), C2(false), C3(true), feed(2), out('ev1', 0, 'message · {"t":"你好"}', 'ok'),
        seg('ev2', 60, 300, 'data: {"t":"世界"}\\n\\n', 'accent'), seg('ev3', 380, 300, 'event: done\\ndata: {}', 'info')]),
      f('切出事件 2 和 done，缓冲区清空。界面拿到的是 3 个完整事件，和网络怎么分块无关', [C1(false), C2(false), C3(false), empty,
        out('ev1', 0, 'message · {"t":"你好"}', 'ok'), out('ev2', 1, 'message · {"t":"世界"}', 'ok'), out('ev3', 2, 'done · {}', 'info')]),
    ],
  });
};
