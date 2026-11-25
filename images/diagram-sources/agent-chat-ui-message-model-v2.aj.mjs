export const meta = {
  name: 'agent-chat-ui-message-model-v2',
  article: 'knowledge/frontend/agent-ui/agent-chat-ui.md',
  alt: 'Agent Chat UI 的数据模型与发送状态。Conversation 是长期容器，保存 title、owner、branch head 和最近活动；它下面是 Turn，表示一次用户意图及其响应范围。一个 Turn 可以有多个 Run：Run 1 是一次有终态的执行；用户点重新生成时创建 Run 2，作为 sibling run，不覆盖 Run 1。Run 产出 Message，Message 记录 author 和 status，内容按 part 结构化，分为 text、citation、tool、attachment 四类，不从 Markdown 反向解析。Run 有自己的状态：queued、running、awaiting approval、cancelling、completed、failed、cancelled，和 Message 的展示状态分开。发送消息时先乐观插入一条 sending 状态的用户消息，带 clientRequestId；服务端确认后换成 canonical ID 和序号；网络失败时标记 failed，保留输入，重试复用同一个 clientRequestId。消息排序看服务端序号，不按本地时间，因为设备时钟和多个标签页让本地时间不可信',
};

export default (k) => {
  const s = [];
  s.push(k.box({ x: 40, y: 140, w: 260, h: 84, title: 'Conversation', sub: 'title · owner · branch head\n最近活动', titleSize: 'body', tone: 'accent', strong: true }));
  s.push(k.arrow({ points: [[170, 224], [170, 250]] }));
  s.push(k.box({ x: 40, y: 250, w: 260, h: 84, title: 'Turn', sub: '一次用户意图\n及其响应范围', titleSize: 'body', tone: 'info' }));
  s.push(k.arrow({ points: [[300, 292], [320, 292], [320, 264], [340, 264]] }));
  s.push(k.arrow({ points: [[320, 292], [320, 344], [340, 344]] }));
  s.push(k.box({ x: 340, y: 232, w: 240, h: 62, title: 'Run #1', sub: '一次有终态的执行', titleSize: 'body', tone: 'info' }));
  s.push(k.box({ x: 340, y: 314, w: 240, h: 62, title: 'Run #2：重新生成', sub: 'sibling run，不覆盖 #1', titleSize: 'body', tone: 'info', dashed: true }));
  s.push(k.arrow({ points: [[580, 264], [620, 264]] }));
  s.push(k.box({ x: 620, y: 236, w: 300, h: 56, title: 'Message：author · status', titleSize: 'body', tone: 'ok' }));
  ['text', 'citation', 'tool', 'attachment'].forEach((p, i) => s.push(k.box({ x: 620 + (i % 2) * 155, y: 304 + Math.floor(i / 2) * 48, w: 145, h: 40, title: p, titleSize: 'label', tone: 'muted' })));

  s.push(k.text({ x: 40, y: 422, text: 'Run 状态：和 Message 的展示状态分开', size: 'label', tone: 'muted', weight: 600 }));
  const st = [['queued', 'muted'], ['running', 'info'], ['awaiting\napproval', 'warn'], ['cancelling', 'warn'], ['completed', 'ok'], ['failed', 'bad'], ['cancelled', 'muted']];
  st.forEach(([t, tone], i) => s.push(k.box({ x: 40 + i * 127, y: 434, w: 114, h: 52, title: t, titleSize: 'label', tone })));

  s.push(k.text({ x: 40, y: 524, text: '发送一条消息', size: 'label', tone: 'muted', weight: 600 }));
  s.push(k.box({ x: 40, y: 536, w: 280, h: 84, title: '乐观插入：sending', sub: '带 clientRequestId\n输入框不清空', titleSize: 'body', tone: 'info' }));
  s.push(k.arrow({ points: [[320, 578], [370, 578]], label: '确认', labelAt: [345, 568] }));
  s.push(k.box({ x: 370, y: 536, w: 260, h: 84, title: '换成 canonical ID', sub: '按服务端序号合并\n并去重', titleSize: 'body', tone: 'ok' }));
  s.push(k.box({ x: 660, y: 536, w: 260, h: 84, title: '网络失败：failed', sub: '保留输入；重试复用\n同一个 clientRequestId', titleSize: 'body', tone: 'bad' }));
  s.push(k.arrow({ points: [[180, 620], [180, 640], [790, 640], [790, 620]], tone: 'bad', dashed: true }));

  return k.figure({
    h: 750,
    title: 'Agent Chat UI：先把身份和状态建模对',
    subtitle: 'Turn、Run、Message 各有身份；内容按 part 结构化，重连和重试都能对账',
    body: s.join('') + k.note({ x: 40, y: 664, w: 880, h: 52, lead: '排序看服务端序号：', text: '不按本地时间排，设备时钟和多个标签页都会让本地时间不可信。' }),
  });
};
