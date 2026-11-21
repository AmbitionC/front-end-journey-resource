export const meta = {
  name: 'thread-sync-mutex-condvar-semaphore-v2',
  article: 'knowledge/cs/os/os-thread-sync.md',
  alt: '三种同步原语：互斥锁中 T1 加锁、改 count、解锁，T2 等到随后成功加同一把锁才读，T1 解锁前的写对 T2 可见；条件变量中等待方加锁后谓词不成立就 wait 并原子放锁，通知方加锁改谓词、解锁再 notify，等待方被唤醒后重新拿锁并用 while 重查谓词；信号量用 N 个许可控制有限资源，wait 在计数为 0 时阻塞，post 归还许可且可由别的线程调用；不加锁并发 count++ 会因读、加、写交错丢失更新',
};

export default (k) => {
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
  s.push(k.text({ x: 660, y: 170, text: '连接池 N = 10，已占 7 个', size: 'label', tone: 'muted' }));
  for (let i = 0; i < 10; i++) s.push(`<rect x="${660 + i * 24}" y="184" width="20" height="28" rx="4" fill="${i < 7 ? k.t.accent : 'none'}" fill-opacity="${i < 7 ? 0.7 : 0}" stroke="${k.t.accent}" stroke-width="1.4"/>`);
  s.push(k.box({ x: 660, y: 236, w: 240, h: 84, title: 'sem_wait', sub: '计数 > 0：占一个许可\n计数 = 0：阻塞', titleSize: 'body', tone: 'accent' }));
  s.push(k.box({ x: 660, y: 336, w: 240, h: 84, title: 'sem_post', sub: '归还许可，可能唤醒等待者\n可以由别的线程调用', titleSize: 'body', tone: 'info' }));
  s.push(k.text({ x: 660, y: 446, text: '没有所有者，和 mutex 契约不同', size: 'note', tone: 'muted' }));

  s.push(k.box({ x: 40, y: 492, w: 880, h: 52, title: '不加锁并发 count++：读、加、写三步交错，两次自增可能只生效一次', titleSize: 'body', tone: 'bad' }));

  return k.figure({
    h: 576,
    title: '线程同步：互斥锁、条件变量、信号量各管一件事',
    subtitle: '以 POSIX 语义示意；Java 的 notify 必须持有同一 monitor，数据竞争后果按 JMM 分析',
    body: s.join(''),
  });
};
