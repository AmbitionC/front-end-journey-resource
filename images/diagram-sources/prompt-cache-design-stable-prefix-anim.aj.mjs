import still from './prompt-cache-design-stable-prefix-v3.aj.mjs';

export const meta = {
  name: 'prompt-cache-design-stable-prefix-anim',
  article: 'knowledge/llm/prompt/prompt-cache-design.md',
  alt: 'Prompt Cache 命中过程（可逐步播放）：第 1 次请求缓存为空，整段都要计算，稳定前缀写入缓存；第 2 次请求前 5 段逐字一致，全部命中，只算动态后缀；第 3 次有人把时间戳插到任务定义后面，从插入点往后全部对不上，工具定义、输出契约和示例都要重算；第 4 次工具定义升级，前缀指纹变了，从工具定义往后重算，应主动换新前缀并按新指纹统计命中率',
};

const SEGS = [['应用政策', 100], ['任务定义', 100], ['工具定义', 100], ['输出契约', 100], ['审核示例', 100], ['权限状态', 86], ['检索结果', 86], ['时间', 86], ['本轮输入', 86]];

export default (k) => {
  if (k.mode === 'still') return still(k);
  // segs: [title, w, state]；state: write 计算并写入缓存 / hit 命中 / calc 本次计算 / miss 本可复用却重算
  const TONE = { write: 'info', hit: 'ok', calc: 'muted', miss: 'bad' };
  const bar = (segs) => {
    let x = 40;
    return segs.map(([t, w, st]) => {
      const s = k.box({ x, y: 170, w, h: 52, title: st === 'hit' ? `${t} ✓` : t, titleSize: 'label', tone: TONE[st], dashed: st === 'miss', strong: st === 'hit' });
      x += w + 4;
      return s;
    }).join('');
  };
  const head = (text, tone) => k.text({ x: 40, y: 152, text, size: 'label', weight: 600, tone });
  const stat = (text, tone = 'sec') => k.text({ x: 40, y: 290, text, size: 'body', tone });
  const std = (states) => SEGS.map(([t, w], i) => [t, w, states[i]]);
  const f = (caption, parts) => ({ caption, body: parts.join('') });
  const C4 = ['calc', 'calc', 'calc', 'calc'];

  return k.figure({
    h: 600,
    title: 'Prompt Cache：命中靠稳定前缀',
    subtitle: '缓存复用的是前缀已完成的计算，不扩大上下文窗口；变了的内容不会命中',
    body: [
      k.legend({ x: 40, y: 250, items: [{ tone: 'ok', label: '命中缓存' }, { tone: 'info', label: '计算并写入缓存' }, { tone: 'muted', label: '每次都要算' }, { tone: 'bad', label: '本可复用却重算', dashed: true }] }),
      ...[
        ['供应商适配器', '自动前缀缓存：看 usage 判命中\n显式断点：自己管生命周期\nTTL、阈值不写成通用常量', 'info'],
        ['逻辑前缀指纹', 'provider · model · 政策 · 工具\nSchema · 示例 · 序列化器版本\n按指纹统计命中率', 'accent'],
        ['主动失效', '政策、工具权限、Schema\n示例、模型、授权范围变了\n就换新前缀，不强求旧命中', 'warn'],
      ].map(([t, sub, tone], i) => k.box({ x: 40 + i * 300, y: 376, w: 280, h: 112, title: t, sub, titleSize: 'body', tone })),
      k.note({ x: 40, y: 512, w: 880, h: 52, lead: '值不值得：', text: '净收益 = 基线 − 写入存储 − 读取 − 失效成本；同时看首 token 延迟和 P95。' }),
    ].join(''),
    frames: [
      f('第 1 次请求：缓存是空的，整段都要算；算完后，按变更频率排在前面的稳定前缀被写进缓存', [head('请求 #1：稳定区在前，按变更频率从低到高排', 'sec'), bar(std(['write', 'write', 'write', 'write', 'write', ...C4])), stat('缓存为空：9 段全部计算，前 5 段写入缓存')]),
      f('第 2 次请求：前 5 段和上次逐字一样，全部命中；只有权限、检索结果、时间和本轮输入要重新算', [head('请求 #2：同一个稳定前缀', 'ok'), bar(std(['hit', 'hit', 'hit', 'hit', 'hit', ...C4])), stat('命中 5 段，只算 4 段后缀：首 token 更快、输入更便宜', 'ok')]),
      f('第 3 次请求：有人图方便把时间戳插到了任务定义后面。前缀匹配到这里就断了，后面本可复用的三段全要重算', [head('请求 #3：稳定区中间插了一个时间戳', 'bad'),
        bar([['应用政策', 100, 'hit'], ['任务定义', 100, 'hit'], ['时间', 86, 'calc'], ['工具定义', 100, 'miss'], ['输出契约', 100, 'miss'], ['审核示例', 100, 'miss'], ['权限状态', 86, 'calc'], ['检索结果', 86, 'calc'], ['本轮输入', 86, 'calc']]),
        stat('从插入点往后全部对不上：只命中 2 段', 'bad')]),
      f('第 4 次请求：工具定义升级到 v2，这是真的变了。从工具定义往后都重算是对的，此时换一个新的前缀指纹重新统计命中率', [head('请求 #4：工具定义升级', 'warn'),
        bar([['应用政策', 100, 'hit'], ['任务定义', 100, 'hit'], ['工具 v2', 100, 'write'], ['输出契约', 100, 'write'], ['审核示例', 100, 'write'], ...SEGS.slice(5).map(([t, w]) => [t, w, 'calc'])]),
        stat('新前缀写入缓存；指纹变了，命中率按新指纹从头算', 'warn')]),
    ],
  });
};
