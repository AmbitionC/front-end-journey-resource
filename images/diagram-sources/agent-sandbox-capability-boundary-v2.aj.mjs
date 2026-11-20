export const meta = {
  name: 'agent-sandbox-capability-boundary-v2',
  article: 'knowledge/llm/agent/agent-sandbox.md',
  alt: 'Agent 的执行请求先由策略服务校验身份、租户、审批和预算，发出只读三个文件、只访问一个 HTTPS origin、写 20 MB 临时目录、运行 30 秒且绑定 job ID 的窄能力；代码在非特权用户和 namespace、seccomp、资源预算、网络默认拒绝层层收口的沙箱里运行；输出先限字节、剥控制字符并当作数据处理，才返回调用方并记审计',
};

export default (k) => {
  const s = [], TOP = 120, MID = 250;
  s.push(k.box({ x: 40, y: MID - 36, w: 120, h: 72, title: 'Agent 请求', sub: '要跑一段代码' }));
  s.push(k.box({ x: 186, y: MID - 60, w: 170, h: 120, title: '策略服务', sub: '校验身份、租户\n审批与预算\n只发窄能力', tone: 'accent', strong: true }));
  s.push(k.panel({ x: 382, y: TOP, w: 220, h: 260, label: '能力：不可转授、会过期', tone: 'accent' }));
  ['只读这 3 个文件', 'GET 一个 HTTPS origin', '写 20 MB 临时目录', '最多运行 30 秒', '绑定 job ID']
    .forEach((t, i) => s.push(k.text({ x: 400, y: 186 + i * 40, text: t, size: 'label', tone: 'sec' })));
  s.push(k.panel({ x: 628, y: TOP, w: 292, h: 260, label: '沙箱：一次一环境，层层收口' }));
  ['非特权用户 + namespace', 'seccomp：syscall 白名单', 'CPU / 内存 / 进程数预算', '网络默认拒绝，只放行批准目标']
    .forEach((t, i) => s.push(k.box({ x: 646, y: 160 + i * 52, w: 256, h: 42, title: t, titleSize: 'label' })));
  s.push(k.arrow({ points: [[160, MID], [186, MID]], tone: 'accent' }));
  s.push(k.arrow({ points: [[356, MID], [382, MID]], tone: 'accent' }));
  s.push(k.arrow({ points: [[602, MID], [628, MID]], tone: 'accent' }));

  const BY = 412;
  s.push(k.box({ x: 628, y: BY, w: 292, h: 68, title: '输出检查', sub: '限字节、剥控制字符、当数据不当指令', tone: 'warn' }));
  s.push(k.box({ x: 382, y: BY, w: 220, h: 68, title: '返回调用方', sub: '摘要写进审计日志' }));
  s.push(k.arrow({ points: [[774, TOP + 260], [774, BY]], tone: 'warn' }));
  s.push(k.arrow({ points: [[628, BY + 34], [602, BY + 34]], tone: 'warn' }));

  return k.figure({
    h: 590,
    title: 'Agent 沙箱：先发窄能力，再在隔离环境里执行',
    subtitle: '能力在执行层会被重新验证；输出也是攻击面，返回前同样要检查',
    body: s.join('') + k.note({ x: 40, y: 512, w: 880, h: 52, lead: '不继承宿主环境：', text: '不复制环境变量、HOME 或云凭证；超时由宿主监督器终止整个进程组。' }),
  });
};
