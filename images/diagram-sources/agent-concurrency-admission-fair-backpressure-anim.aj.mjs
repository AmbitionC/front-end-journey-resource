import still from './agent-concurrency-admission-fair-backpressure-v2.aj.mjs';

export const meta = {
  name: 'agent-concurrency-admission-fair-backpressure-anim',
  article: 'knowledge/llm/production/agent-concurrency.md',
  alt: 'Agent 并发控制的一轮运行（可逐步播放）：三个租户提交任务先过准入，超出配额的请求被快速拒绝 429；通过的按租户和优先级分成 flow 排队，公平调度器用 DRR 每轮给各 flow 发额度，大任务按估算成本扣额度、不够就等下一轮；任务分发到按瓶颈分开的 Worker 池，浏览器池满了以后背压向上游传播，调度暂停发放、准入收紧返回 503',
};

const Y = 130, H = 220;
const POOLS = ['CPU 池', '模型协调池', '浏览器池', '高内存池'];

export default (k) => {
  if (k.mode === 'still') return still(k);
  const hl = (key, x, y, w, h, tone = 'warn') => k.keyed(key, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${k.color(tone)}" stroke-width="3.2"/>`);
  const tenants = (flow, badC) => [['租户 A', 140], ['租户 B', 210], ['租户 C', 280]].map(([t, y], i) => {
    const tone = badC && i === 2 ? 'bad' : 'info';
    return k.box({ x: 40, y, w: 140, h: 52, title: t, titleSize: 'body', tone }) + k.arrow({ points: [[180, y + 26], [216, y + 26]], tone, flow });
  }).join('');
  const admit = (sub, tone = 'accent') => k.box({ x: 216, y: Y, w: 170, h: H, title: '准入', sub, tone });
  const reject = (title, on) => k.arrow({ points: [[301, Y + H], [301, 380]], tone: 'bad', flow: on }) + k.box({ x: 216, y: 380, w: 170, h: 52, title, titleSize: 'label', tone: on ? 'bad' : 'muted' });
  // q: 每个 flow 排队的任务数；served: 本轮被取走的格子标绿
  const queues = (q, served = [0, 0, 0], note = '加权轮询 / DRR\n大任务按估算成本扣额度') => [
    ...[['A · 高', 0], ['B · 普通', 1], ['C · 大任务', 2]].map(([t, i]) => {
      let s = k.text({ x: 436, y: Y + 64 + i * 40, text: t, size: 'note', tone: 'muted' });
      for (let j = 0; j < q[i]; j++) {
        const tone = j < served[i] ? k.t.ok : k.t.accent;
        s += `<rect x="${526 + j * 22}" y="${Y + 48 + i * 40}" width="18" height="22" rx="3" fill="${tone}" fill-opacity="0.6" stroke="${tone}" stroke-width="1.2"/>`;
      }
      return s;
    }),
    k.text({ x: 436, y: Y + 186, text: note, size: 'note', tone: 'sec' }),
  ].join('');
  const pools = (full) => POOLS.map((t, i) => k.box({ x: 706, y: Y + 40 + i * 44, w: 198, h: 36, title: full && i === 2 ? '浏览器池 8 / 8 满' : t, titleSize: 'label', tone: full && i === 2 ? 'bad' : 'default' })).join('');
  const pass = (on) => k.arrow({ points: [[386, Y + 110], [420, Y + 110]], tone: 'accent', flow: on });
  const out = (on) => k.arrow({ points: [[656, Y + 110], [690, Y + 110]], tone: 'accent', flow: on });
  const back = (on) => k.arrow({ points: [[805, Y + H], [805, 470], [200, 470], [200, 338], [216, 338]], tone: on ? 'warn' : 'line', dashed: true, flow: on, label: '背压：下游满了就暂停发放、收紧准入', labelAt: [600, 460] });
  const ADM = '全局健康\n租户配额与预算\n队列容量';
  const f = (caption, parts) => ({ caption, body: parts.join('') });

  return k.figure({
    h: 590,
    title: 'Agent 并发：准入、公平调度、有界 Worker、背压',
    subtitle: '五层各管一件事：准入、租户配额、调度公平、资源隔离、下游背压，不能用一个 semaphore 全包',
    body: [
      k.panel({ x: 420, y: Y, w: 236, h: H, label: '公平调度：按 flow 排队' }),
      k.frame({ x: 690, y: Y, w: 230, h: H, label: 'Worker 池：按瓶颈分开' }),
      k.note({ x: 40, y: 506, w: 880, h: 52, lead: '只拿当前阶段的许可：', text: '别持有模型 slot 等浏览器，取消时要及时释放许可。' }),
    ].join(''),
    frames: [
      f('三个租户同时提交任务，第一关是准入：看全局健康、租户配额与预算、队列还有没有位置', [tenants(true, false), admit(ADM), hl('cur', 216, Y, 170, H), reject('快速拒绝 429 / 503', false), pass(false), queues([0, 0, 0]), out(false), pools(false), back(false)]),
      f('租户 C 这个月的预算快用完了，超出部分当场返回 429：拒得早，比排进队列再超时便宜得多', [tenants(false, true), admit('C 超出配额', 'bad'), reject('快速拒绝 429', true), pass(false), queues([0, 0, 0]), out(false), pools(false), back(false)]),
      f('通过准入的任务按租户、优先级和任务类别分进各自的 flow，彼此排队互不阻塞', [tenants(false, false), admit(ADM), reject('快速拒绝 429 / 503', false), pass(true), queues([2, 3, 5]), hl('cur', 420, Y, 236, H), out(false), pools(false), back(false)]),
      f('DRR 每轮给每个 flow 发额度：A、B 各取走一个小任务；C 的大任务估算成本高，这轮额度不够，攒到下一轮再发', [tenants(false, false), admit(ADM), reject('快速拒绝 429 / 503', false), pass(false),
        queues([2, 3, 5], [1, 1, 0], '本轮：A −1，B −1\nC 额度累积中，下轮发'), out(true), pools(false), back(false)]),
      f('任务按瓶颈分到不同 Worker 池，每个池都有并发上限和有界队列；这时浏览器池占满了', [tenants(false, false), admit(ADM), reject('快速拒绝 429 / 503', false), pass(false), queues([1, 2, 5]), out(false), pools(true), hl('cur', 706, Y + 128, 198, 36, 'bad'), back(false)]),
      f('背压沿链路往上传：调度器暂停给浏览器类任务发放，准入收紧，新请求先返回 503，而不是在内存里越堆越多', [tenants(false, false), admit('已收紧\n新请求先 503', 'warn'), reject('快速拒绝 503', true), pass(false),
        queues([1, 2, 5], [0, 0, 0], '浏览器类任务暂停发放\n其他池照常'), out(false), pools(true), back(true)]),
    ],
  });
};
