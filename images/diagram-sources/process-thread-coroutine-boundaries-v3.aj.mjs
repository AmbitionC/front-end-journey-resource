export const meta = {
  name: 'process-thread-coroutine-boundaries-v3',
  article: 'knowledge/cs/os/os-process-thread.md',
  alt: '进程 A 和进程 B 各有独立的虚拟地址空间；进程 A 里的两个内核线程各有执行状态、共享堆和全局数据，由内核调度；放大线程 A1 看到单线程事件循环一次运行一个任务，任务等待 IO 时让出；两个进程要访问文件、数据库或共享内存等显式共享资源时，都要按协议和同步来',
};

export default (k) => {
  const s = [];
  s.push(k.panel({ x: 40, y: 116, w: 540, h: 210, label: '进程 A：独立虚拟地址空间' }));
  s.push(k.box({ x: 60, y: 152, w: 240, h: 68, title: '内核线程 A1', sub: '自己的栈和寄存器', tone: 'accent', strong: true }));
  s.push(k.box({ x: 320, y: 152, w: 240, h: 68, title: '内核线程 A2', sub: '自己的栈和寄存器', tone: 'accent' }));
  s.push(k.box({ x: 200, y: 244, w: 360, h: 60, title: '共享堆与全局数据', sub: 'A1、A2 直接读写，要加同步', titleSize: 'body' }));

  s.push(k.panel({ x: 620, y: 116, w: 300, h: 210, label: '进程 B：另一个地址空间' }));
  s.push(k.box({ x: 640, y: 152, w: 260, h: 68, title: '内核线程 B1', sub: '看不到 A 的私有内存', tone: 'accent' }));
  s.push(k.text({ x: 640, y: 262, text: '线程由操作系统内核调度', size: 'label', tone: 'muted' }));

  s.push(k.arrow({ points: [[100, 220], [100, 360]], dashed: true, label: '放大', labelAt: [112, 344], labelAnchor: 'start' }));
  s.push(k.panel({ x: 40, y: 360, w: 500, h: 176, label: '放大 A1：单线程事件循环（asyncio 示例）' }));
  s.push(k.box({ x: 60, y: 404, w: 150, h: 112, title: '事件循环', sub: '一次只跑\n一个 Task', tone: 'info' }));
  s.push(k.box({ x: 350, y: 398, w: 170, h: 52, title: '任务 C1', titleSize: 'body', tone: 'info' }));
  s.push(k.box({ x: 350, y: 466, w: 170, h: 52, title: '任务 C2', titleSize: 'body', tone: 'info' }));
  s.push(k.arrow({ points: [[210, 424], [350, 424]], tone: 'info', both: true }));
  s.push(k.text({ x: 280, y: 463, text: '运行 / 等 IO 让出', size: 'label', tone: 'muted', anchor: 'middle' }));
  s.push(k.arrow({ points: [[210, 492], [350, 492]], tone: 'info', both: true }));

  s.push(k.box({ x: 620, y: 400, w: 300, h: 76, title: '显式共享资源', sub: '文件、数据库、共享内存', tone: 'warn' }));
  s.push(k.arrow({ points: [[770, 326], [770, 400]], tone: 'warn' }));
  s.push(k.arrow({ points: [[560, 326], [560, 372], [680, 372], [680, 400]], tone: 'warn' }));
  s.push(k.text({ x: 620, y: 506, text: '两边都按协议和同步访问', size: 'label', tone: 'muted' }));

  return k.figure({
    h: 640,
    title: '进程、线程、协程：谁拥有资源，谁来调度',
    subtitle: '以 Linux/POSIX 和 Python asyncio 为例的机制示意，不含调度耗时或容量实测',
    body: s.join('') + k.note({ x: 40, y: 560, w: 880, h: 52, lead: '单线程里不并行：', text: '一个线程同一时刻只跑一个任务；多线程运行时的协程可以并行。' }),
  });
};
