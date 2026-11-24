export const meta = {
  name: 'aigc-openai-responses-request-chain-v4',
  article: 'knowledge/fe/aigc/aigc-openai.md',
  alt: '从浏览器到 OpenAI Responses API 的请求链路。浏览器只调用自己的 /api/chat，不接触密钥；你的 API 路由先确认登录、校验输入（比如消息不超过 8000 字）、检查用户配额；服务端通过官方 SDK 调用 Responses API，model 从配置读取，instructions 写行为规则，input 放用户输入，并设置超时和有限重试；返回时取 output_text，不要假设 output[0] 一定是文本，并把响应 id 和 request id 记进日志。OPENAI_API_KEY 只存在服务端，不能用 VITE_ 或 NEXT_PUBLIC_ 这类会注入浏览器的前缀。三个进阶点：流式输出时把提供方事件转换成自己的 start、delta、done、error 协议再经 SSE 发给浏览器，取消要用 AbortController 一直传到服务端和 SDK；多轮对话可以用 previous_response_id 连接上下文，但 instructions 不会继承，每轮都要给，也可以由应用自己保存消息并管理 token 预算；结构化输出把结果绑定到 Schema，不用正则抠 JSON，但 Schema 合规不等于业务事实正确。错误按状态码处理：400 和 422 修参数、不盲目重试；401 和 403 查密钥与项目权限；429 指数退避加随机抖动并限制自身并发；5xx 有限重试后降级。写操作只有带幂等键才自动重试，对浏览器只暴露稳定错误码和可重试标志',
};

export default (k) => {
  const s = [];
  const chain = [
    ['浏览器', '只调自己的 /api/chat\n不碰密钥', 'muted'],
    ['你的 API 路由', '登录 · 校验输入\n用户配额', 'accent'],
    ['SDK → Responses', 'model 读配置\ninstructions + input\n超时 + 有限重试', 'accent'],
    ['返回', '取 output_text\n别假设 output[0]\nid 记进日志', 'ok'],
  ];
  chain.forEach(([t, sub, tone], i) => {
    const x = 40 + i * 225;
    s.push(k.box({ x, y: 112, w: 205, h: 112, title: t, sub, titleSize: 'body', tone, strong: i === 1 || i === 2 }));
    if (i < 3) s.push(k.arrow({ points: [[x + 205, 168], [x + 225, 168]] }));
  });
  s.push(k.text({ x: 480, y: 252, text: 'OPENAI_API_KEY 只在服务端：不用 VITE_、NEXT_PUBLIC_ 这类会进浏览器的前缀', size: 'note', anchor: 'middle', tone: 'bad' }));

  [
    ['流式输出', '转成自己的 start / delta\ndone / error，经 SSE 下发\n取消用 AbortController 传到底'],
    ['多轮对话', 'previous_response_id 连上下文\ninstructions 不继承，每轮都给\n或自己存消息、管 token'],
    ['结构化输出', '绑定 Schema，不用正则抠 JSON\nSchema 合规 ≠ 业务正确\n金额、权限仍要代码校验'],
  ].forEach(([t, sub], i) => s.push(k.box({ x: 40 + i * 300, y: 276, w: 280, h: 112, title: t, sub, titleSize: 'body', tone: 'info' })));

  s.push(k.panel({ x: 40, y: 410, w: 880, h: 116, label: '错误按状态码分类处理', tone: 'warn' }));
  [
    ['400 / 422', '修参数，不盲目重试', 'bad'],
    ['401 / 403', '查密钥与项目权限', 'bad'],
    ['429', '退避 + 抖动，限并发', 'warn'],
    ['5xx', '有限重试后降级', 'warn'],
  ].forEach(([t, sub, tone], i) => s.push(k.box({ x: 60 + i * 215, y: 450, w: 195, h: 60, title: t, sub, titleSize: 'label', tone })));

  return k.figure({
    h: 630,
    title: 'OpenAI API：浏览器 → 自己的服务端 → Responses',
    subtitle: '新文本应用默认用 Responses API；浏览器永远不直连模型接口',
    body: s.join('') + k.note({ x: 40, y: 550, w: 880, h: 52, lead: '重试有前提：', text: '写操作带幂等键才自动重试；对浏览器只给稳定错误码和可重试标志。' }),
  });
};
