import still from './thread-sync-mutex-condvar-semaphore-v2.aj.mjs';

export const meta = {
  name: 'thread-sync-mutex-condvar-semaphore-anim',
  article: 'knowledge/cs/os/os-thread-sync.md',
  alt: '三种同步原语（可逐步播放）：互斥锁里 T1 加锁改 count 时 T2 只能等，T1 解锁后 T2 才拿到锁并读到新值；条件变量里等待方发现谓词不成立就 wait 原子放锁睡下，通知方加锁改 ready、解锁再 notify，等待方醒来重新拿锁并用 while 重查；信号量 10 个许可被占满后第 11 个线程阻塞，别的线程 post 归还一个后它才拿到；最后提示不加锁的 count++ 会丢更新',
};

export default (k) => {
  if (k.mode === 'still') return still(k);
  const s = [], PY = 116, PH = 352, BH = 40;
  const lane = (x, y, w, title, tone, h = BH, sub) => s.push(k.box({ x, y, w, h, title, sub, titleSize: 'label', tone }));
  const down = (x, a, b, tone = 'line') => s.push(k.arrow({ points: [[x, a], [x, b]], tone }));

  // 互斥锁
  s.push(k.panel({ x: 40, y: PY, w: 280, h: PH, label: '互斥锁：同一时刻只一个进' }));
  s.push(k.text({ x: 113, y: 168, text: 'T1', size: 'label', tone: 'muted', anchor: 'middle' }));
  s.push(k.text({ x: 247, y: 168, text: 'T2', size: 'label', tone: 'muted', anchor: 'middle' }));
  lane(56, 180, 114, 'lock(m)', 'accent'); down(113, 220, 236);
  lane(56, 236, 114, 'count++', 'accent'); down(113, 276, 292);
  lane(56, 292, 114, 'unlock(m)', 'accent');
  s.push(k.text({ x: 247, y: 262, text: '等锁', size: 'label', tone: 'muted', anchor: 'middle' }));
  lane(190, 348, 114, 'lock(m)', 'info'); down(247, 388, 404);
  lane(190, 404, 114, '读 count', 'info');
  s.push(k.arrow({ points: [[170, 312], [247, 312], [247, 348]], tone: 'info', dashed: true }));
  s.push(k.text({ x: 56, y: 372, text: '解锁 → 后续加锁\n建立先行发生', size: 'note', tone: 'info' }));

  // 条件变量
  s.push(k.panel({ x: 340, y: PY, w: 280, h: PH, label: '条件变量：while 重查谓词' }));
  s.push(k.text({ x: 416, y: 168, text: '等待方', size: 'label', tone: 'muted', anchor: 'middle' }));
  s.push(k.text({ x: 548, y: 168, text: '通知方', size: 'label', tone: 'muted', anchor: 'middle' }));
  lane(356, 180, 120, 'lock(m)', 'accent'); down(416, 220, 236);
  lane(356, 236, 120, '谓词不成立', 'warn', 64, 'wait 放锁睡');
  lane(356, 348, 120, '醒来重拿锁', 'accent'); down(416, 388, 404);
  lane(356, 404, 120, '谓词成立才用', 'accent');
  s.push(k.arrow({ points: [[376, 348], [376, 300]], tone: 'warn', dashed: true }));
  lane(488, 180, 120, 'lock(m)', 'info'); down(548, 220, 236);
  lane(488, 236, 120, 'ready = true', 'info'); down(548, 276, 292);
  lane(488, 292, 120, 'unlock(m)', 'info'); down(548, 332, 348);
  lane(488, 348, 120, 'notify(cv)', 'info');
  s.push(k.arrow({ points: [[488, 368], [476, 368]], tone: 'info' }));
  s.push(k.text({ x: 428, y: 324, text: 'while', size: 'note', tone: 'warn', anchor: 'middle' }));

  // 信号量
  s.push(k.panel({ x: 640, y: PY, w: 280, h: PH, label: '信号量：N 个许可' }));
  s.push(k.box({ x: 660, y: 236, w: 240, h: 84, title: 'sem_wait', sub: '计数 > 0：占一个许可\n计数 = 0：阻塞', titleSize: 'body', tone: 'accent' }));
  s.push(k.box({ x: 660, y: 336, w: 240, h: 84, title: 'sem_post', sub: '归还许可，可能唤醒等待者\n可以由别的线程调用', titleSize: 'body', tone: 'info' }));
  s.push(k.text({ x: 660, y: 446, text: '没有所有者，和 mutex 契约不同', size: 'note', tone: 'muted' }));

  s.push(k.box({ x: 40, y: 492, w: 880, h: 52, title: '不加锁并发 count++：读、加、写三步交错，两次自增可能只生效一次', titleSize: 'body', tone: 'bad' }));

  const hl = (key, x, y, w, h, tone = 'warn') => k.keyed(key, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${k.color(tone)}" stroke-width="3.2"/>`);
  const permits = (used, label) => {
    const out = [k.text({ x: 660, y: 170, text: label, size: 'label', tone: used >= 10 ? 'warn' : 'muted' })];
    for (let i = 0; i < 10; i++) out.push(`<rect x="${660 + i * 24}" y="184" width="20" height="28" rx="4" fill="${i < used ? k.t.accent : 'none'}" fill-opacity="${i < used ? 0.7 : 0}" stroke="${k.t.accent}" stroke-width="1.4"/>`);
    return out.join('');
  };
  const p7 = permits(7, '连接池 N = 10，已占 7 个');
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 576,
    title: '线程同步：互斥锁、条件变量、信号量各管一件事',
    subtitle: '以 POSIX 语义示意；Java 的 notify 必须持有同一 monitor，数据竞争后果按 JMM 分析',
    body: s.join(''),
    frames: [
      f('互斥锁：T1 先 lock 成功，锁归 T1；T2 也想进临界区，只能在外面等', [hl('cur', 56, 180, 114, 40), hl('wait', 190, 236, 114, 40, 'muted'), p7]),
      f('T1 在锁里把 count 从 0 改成 1，T2 还在等，不会读到改了一半的值', [hl('cur', 56, 236, 114, 40), hl('wait', 190, 236, 114, 40, 'muted'), p7]),
      f('T1 unlock，T2 随即拿到同一把锁：解锁和后续加锁之间建立了先行发生关系', [hl('cur', 56, 292, 114, 40), hl('wait', 190, 348, 114, 40), k.arrow({ points: [[170, 312], [247, 312], [247, 348]], tone: 'info', dashed: true, flow: true }), p7]),
      f('T2 在锁里读 count，一定能看到 T1 解锁前写下的 1', [hl('cur', 190, 404, 114, 40), p7]),
      f('条件变量：等待方加锁后发现 ready 还是 false，调用 wait，原子地放锁并睡下', [hl('cur', 356, 236, 120, 64), p7]),
      f('通知方加锁、把 ready 改成 true、解锁，再 notify 把等待方叫醒', [hl('cur', 482, 174, 132, 220), k.arrow({ points: [[488, 368], [476, 368]], tone: 'info', flow: true }), p7]),
      f('等待方醒来先重新拿锁，再用 while 重查 ready：可能是虚假唤醒，也可能被别人抢先改回去，成立了才往下用', [hl('cur', 352, 344, 128, 104), k.arrow({ points: [[376, 348], [376, 300]], tone: 'warn', dashed: true, flow: true })]
        .concat(p7)),
      f('信号量：连接池 10 个许可已占 7 个，又来 3 个线程 sem_wait，各占一个，计数降到 0', [hl('cur', 660, 236, 240, 84), permits(10, 'N = 10，已占满')]),
      f('第 11 个线程再 sem_wait：计数是 0，只能阻塞，直到有人归还', [hl('cur', 660, 236, 240, 84, 'bad'), permits(10, 'N = 10，已占满 · 等待 1')]),
      f('某个线程用完连接 sem_post 归还一个许可，等待的线程被唤醒拿走它；post 可以由别的线程调用', [hl('cur', 660, 336, 240, 84), permits(10, 'N = 10，还 1 借 1 · 等待 0')]),
      f('反过来，不加锁直接并发 count++：读、加、写三步一交错，两次自增可能只生效一次', [hl('cur', 40, 492, 880, 52, 'bad'), p7]),
    ],
  });
};
