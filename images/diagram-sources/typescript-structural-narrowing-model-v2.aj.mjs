export const meta = {
  name: 'typescript-structural-narrowing-model-v2',
  article: 'knowledge/js-es6-ts/ts/type-system.md',
  alt: 'TypeScript 类型系统的三件事和一条边界。结构化兼容：pixel 有 x、y、color，Point 只要 x、y，成员够就能赋值；但对象字面量直接赋值时仍会做额外属性检查。判别联合缩小：LoadState 按 status 区分，switch 进入 idle 分支什么也没有，loading 分支才能用 requestId，success 分支才能用 data，error 分支才能用 error；default 分支把值赋给 never 做穷尽检查，新增状态时编译器会提醒。泛型保留关系：first<T> 输入 readonly T[]，返回 T | undefined；mapValue<T, U> 接收 T 和从 T 到 U 的转换，返回 U；T 从实参推断并贯穿输入和输出，只用一次的类型参数不要硬泛型化。类型擦除边界：网络响应、用户输入、本地存储这些外部数据在运行时没有类型，先用 unknown 接收，经过 parser 校验，才得到 User 这样的领域类型；as User 断言只改变编译器视角，不检查字段，any 会沿调用链传播，只适合当迁移逃生口',
};

export default (k) => {
  const s = [];
  const cols = [[40, '结构化兼容：看成员，不看名字'], [350, '判别联合：按字段缩小'], [660, '泛型：保留输入输出关系']];
  cols.forEach(([x, label]) => s.push(k.panel({ x, y: 112, w: 260, h: 336, label, tone: 'info' })));

  // 结构化
  s.push(k.box({ x: 60, y: 160, w: 220, h: 64, title: 'pixel', sub: 'x · y · color', titleSize: 'body', tone: 'muted' }));
  s.push(k.arrow({ points: [[170, 224], [170, 280]] }));
  s.push(k.text({ x: 182, y: 258, text: '成员够就能赋值', size: 'note', tone: 'ok' }));
  s.push(k.box({ x: 60, y: 280, w: 220, h: 64, title: 'Point', sub: 'x · y', titleSize: 'body', tone: 'ok' }));
  s.push(k.text({ x: 170, y: 384, text: '对象字面量直接赋值时', size: 'note', anchor: 'middle', tone: 'sec' }));
  s.push(k.text({ x: 170, y: 406, text: '仍做额外属性检查', size: 'note', anchor: 'middle', tone: 'sec' }));

  // 判别联合
  s.push(k.box({ x: 370, y: 152, w: 220, h: 64, title: 'LoadState', sub: 'switch (state.status)', titleSize: 'body', tone: 'accent' }));
  [
    ['idle', 'muted'],
    ['loading：可用 requestId', 'info'],
    ['success：可用 data', 'info'],
    ['error：可用 error', 'info'],
    ['default：never 穷尽检查', 'warn'],
  ].forEach(([t, tone], i) => s.push(k.box({ x: 370, y: 228 + i * 42, w: 220, h: 36, title: t, titleSize: 'label', tone })));

  // 泛型
  s.push(k.box({ x: 680, y: 160, w: 220, h: 84, title: 'first<T>', sub: '输入 readonly T[]\n返回 T | undefined', titleSize: 'body', tone: 'accent' }));
  s.push(k.box({ x: 680, y: 260, w: 220, h: 84, title: 'mapValue<T, U>', sub: 'value: T，transform: T → U\n返回 U', titleSize: 'body', tone: 'accent' }));
  s.push(k.text({ x: 790, y: 384, text: 'T 从实参推断，贯穿输入输出', size: 'note', anchor: 'middle', tone: 'sec' }));
  s.push(k.text({ x: 790, y: 406, text: '只用一次的类型参数别硬泛型化', size: 'note', anchor: 'middle', tone: 'sec' }));

  // 擦除边界
  s.push(k.panel({ x: 40, y: 468, w: 880, h: 112, label: '类型擦除边界：外部数据运行时没有类型，要先解析', tone: 'bad' }));
  [['外部数据', '网络 · 输入 · 存储', 'muted'], ['unknown', '还没验证', 'warn'], ['parser 校验', '失败走显式错误', 'info'], ['User', '可信领域类型', 'ok']].forEach(([t, sub, tone], i) => {
    const x = 60 + i * 220;
    s.push(k.box({ x, y: 508, w: 180, h: 60, title: t, sub, titleSize: 'label', tone }));
    if (i < 3) s.push(k.arrow({ points: [[x + 180, 538], [x + 220, 538]] }));
  });

  return k.figure({
    h: 690,
    title: 'TypeScript 类型系统：描述值之间的关系',
    subtitle: '静态类型管可信代码内部的关系，运行时 parser 管跨信任边界的数据，两者缺一不可',
    body: s.join('') + k.note({ x: 40, y: 604, w: 880, h: 52, lead: 'as User 不是校验：', text: '断言只改编译器视角，不查字段；any 会一路传播，只当迁移逃生口。' }),
  });
};
