export const meta = {
  name: 'agent-learning-dependency-stages-v2',
  article: 'knowledge/career/agent-learning-roadmap.md',
  alt: 'Agent 工程师学习依赖六步：编程、网络和数据库基础，LLM 调用与 embedding，工具调用与 RAG，Agent 运行时与状态，评估观测与安全，生产项目；每一步配一个可验证作品，从待办应用、本地文档问答、带工具的 RAG 助手、多轮有状态 Agent、可观测且有安全护栏的 Agent，到上线项目；权限、工具副作用和失败边界从第一次工具练习开始就要出现并贯穿后续',
};

export default (k) => {
  const s = [], W = 128, G = 22, X = [...Array(6).keys()].map((i) => 40 + i * (W + G));
  const stages = [
    ['1 基础', '编程、网络\n数据库'],
    ['2 LLM', '调用、提示\nembedding'],
    ['3 工具与 RAG', '函数调用\n检索与重排'],
    ['4 运行时', 'Agent 循环\n记忆与恢复'],
    ['5 评估安全', '评测、观测\n安全与合规'],
    ['6 生产项目', '部署、CI/CD\n成本与监控'],
  ];
  const works = ['待办应用\n增删改查', '本地文档\n问答', '带工具的\nRAG 助手', '多轮 Agent\n记忆与状态', '可观测、有\n安全护栏', '上线的\nAgent 项目'];
  stages.forEach(([t, sub], i) => {
    s.push(k.box({ x: X[i], y: 120, w: W, h: 96, title: t, sub, titleSize: 'body', tone: i === 5 ? 'ok' : 'accent', strong: i === 5 }));
    if (i < 5) s.push(k.arrow({ points: [[X[i] + W, 168], [X[i + 1], 168]], tone: 'accent' }));
    s.push(k.arrow({ points: [[X[i] + W / 2, 216], [X[i] + W / 2, 262]] }));
    s.push(k.box({ x: X[i], y: 262, w: W, h: 72, title: works[i], titleSize: 'label', tone: 'info' }));
  });

  s.push(k.box({ x: X[2], y: 360, w: X[5] + W - X[2], h: 56, title: '权限、工具副作用、失败边界：从第一次工具练习就开始，一直贯穿', titleSize: 'label', tone: 'warn' }));
  s.push(k.text({ x: X[0], y: 382, text: '正文把六步合成四个阶段，\n约 12–17 周只是练习节奏', size: 'note', tone: 'muted' }));

  return k.figure({
    h: 520,
    title: '学习路线：按依赖往上走，每步交一个作品',
    subtitle: '教学样例，不代表某个人的经历；已有基础的部分直接跳过，缺什么补什么',
    body: s.join('') + k.note({ x: 40, y: 440, w: 880, h: 52, lead: '先补任务需要的依赖：', text: '不要从某个流行框架倒推全部能力。' }),
  });
};
