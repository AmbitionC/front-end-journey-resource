export const meta = {
  name: 'prompt-cache-design-stable-prefix-v3',
  article: 'knowledge/llm/prompt/prompt-cache-design.md',
  alt: 'Prompt Cache 的稳定前缀设计。正确的请求排列：稳定前缀在前，按变更频率从低到高依次是应用政策、任务定义、工具定义、输出契约、审核过的示例，这一段可以复用；动态后缀在后，依次是权限状态、检索结果、时间和本轮输入，每次都不同。错误的排列：在稳定区中间插了一个时间戳，从插入点往后都可能对不上，工具定义、输出契约和示例这些本可复用的前缀可能都要重算。下方三件事：供应商适配器封装差异，自动前缀缓存看 usage 判断命中，显式缓存断点要自己管理生命周期，TTL 和阈值不写成通用常量；应用维护逻辑前缀指纹，由供应商、模型以及政策、工具、Schema、示例和序列化器的版本组成，按指纹统计命中率；政策、工具权限、Schema、示例、模型或授权范围变化时主动换新前缀，不强求旧缓存命中。值不值得：净收益等于未缓存基线成本减去缓存写入与存储、缓存读取和失效带来的额外成本，同时看首 token 延迟和 P95。缓存复用的是计算，不会扩大上下文窗口',
};

export default (k) => {
  const s = [];
  const bar = (y, segs) => {
    let x = 40;
    segs.forEach(([t, w, tone, dashed]) => {
      s.push(k.box({ x, y, w, h: 48, title: t, titleSize: 'label', tone, dashed }));
      x += w + 4;
    });
  };
  s.push(k.text({ x: 40, y: 132, text: '对：稳定区在前，按变更频率从低到高排', size: 'label', weight: 600, tone: 'ok' }));
  bar(146, [['应用政策', 100, 'ok'], ['任务定义', 100, 'ok'], ['工具定义', 100, 'ok'], ['输出契约', 100, 'ok'], ['审核示例', 100, 'ok'],
    ['权限状态', 86, 'muted'], ['检索结果', 86, 'muted'], ['时间', 86, 'muted'], ['本轮输入', 86, 'muted']]);
  s.push(k.text({ x: 298, y: 218, text: '稳定前缀：可复用', size: 'note', anchor: 'middle', tone: 'ok' }));
  s.push(k.text({ x: 734, y: 218, text: '动态后缀：每次不同', size: 'note', anchor: 'middle', tone: 'muted' }));

  s.push(k.text({ x: 40, y: 262, text: '错：稳定区中间插了一个时间戳', size: 'label', weight: 600, tone: 'bad' }));
  bar(276, [['应用政策', 100, 'ok'], ['任务定义', 100, 'ok'], ['时间', 86, 'bad'], ['工具定义', 100, 'bad', true], ['输出契约', 100, 'bad', true], ['审核示例', 100, 'bad', true],
    ['权限状态', 86, 'muted'], ['检索结果', 86, 'muted'], ['本轮输入', 86, 'muted']]);
  s.push(k.text({ x: 248, y: 348, text: '从插入点往后都可能对不上：后面的前缀可能无法复用', size: 'note', tone: 'bad' }));

  [
    ['供应商适配器', '自动前缀缓存：看 usage 判命中\n显式断点：自己管生命周期\nTTL、阈值不写成通用常量', 'info'],
    ['逻辑前缀指纹', 'provider · model · 政策 · 工具\nSchema · 示例 · 序列化器版本\n按指纹统计命中率', 'accent'],
    ['主动失效', '政策、工具权限、Schema\n示例、模型、授权范围变了\n就换新前缀，不强求旧命中', 'warn'],
  ].forEach(([t, sub, tone], i) => s.push(k.box({ x: 40 + i * 300, y: 376, w: 280, h: 112, title: t, sub, titleSize: 'body', tone })));

  return k.figure({
    h: 600,
    title: 'Prompt Cache：命中靠稳定前缀',
    subtitle: '缓存复用的是前缀已完成的计算，不扩大上下文窗口；变了的内容不会命中',
    body: s.join('') + k.note({ x: 40, y: 512, w: 880, h: 52, lead: '值不值得：', text: '净收益 = 基线 − 写入存储 − 读取 − 失效成本；同时看首 token 延迟和 P95。' }),
  });
};
