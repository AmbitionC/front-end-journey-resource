export const meta = {
  name: 'prompt-injection-defense-boundary-v3',
  article: 'knowledge/llm/production/prompt-injection-defense.md',
  alt: '提示词注入的分层防御。左边是不可信内容的四个入口：用户输入、网页、文件和工具返回。中间是模型内的防御，只能降低概率：角色与数据标记、输入检测、评审模型或双 LLM、输出泄露检测，它们都可能漏判。右边是模型外、由执行层强制的确定性边界，分四步：策略，principal 和 tenant 来自受信任会话，不信模型自报；契约，服务端再次校验 Schema、范围和收件人；执行，限制网络出口、凭据和调用次数，写操作带幂等键；确认与审计，高风险动作绑定用户看到的精确参数并显式批准。红色虚线表示残余攻击可能穿过概率层，执行层的确定性检查限定它能造成的影响。System Prompt 要按可能泄露来设计，里面不放密钥、隐式授权或只有知道文本才安全的逻辑；在 Prompt 里写不要泄露只能降低概率，不能赋予或撤销权限。设计目标是即使模型被诱导，攻击者也越不过确定性授权和最小权限边界',
};

export default (k) => {
  const s = [];
  s.push(k.text({ x: 40, y: 138, text: '不可信内容', size: 'label', tone: 'muted', weight: 600 }));
  ['用户输入', '网页', '文件', '工具返回'].forEach((t, i) => s.push(k.box({ x: 40, y: 150 + i * 58, w: 160, h: 48, title: t, titleSize: 'label', tone: 'warn' })));
  s.push(`<path d="M 200 174 H 218 M 200 232 H 218 M 200 290 H 218 M 200 348 H 218 M 218 174 V 348 M 218 276 H 222" fill="none" stroke="${k.t.line}" stroke-width="1.5"/>`);
  s.push(k.arrow({ points: [[218, 261], [240, 261]] }));
  s.push(k.text({ x: 240, y: 138, text: '模型内：降低概率', size: 'label', tone: 'muted', weight: 600 }));
  s.push(k.box({ x: 240, y: 150, w: 260, h: 252, title: '概率层', sub: '角色与数据标记\n输入检测\n评审模型 / 双 LLM\n输出泄露检测\n都可能漏判', titleSize: 'body', tone: 'muted' }));
  s.push(k.arrow({ points: [[500, 276], [540, 276]] }));

  s.push(k.text({ x: 540, y: 138, text: '模型外：执行层强制的确定性边界', size: 'label', tone: 'muted', weight: 600 }));
  const det = [
    ['① 策略', 'principal、tenant 来自受信任会话'],
    ['② 契约', '服务端再验 Schema、范围、收件人'],
    ['③ 执行', '限出口、凭据、次数；写操作带幂等键'],
    ['④ 确认与审计', '高风险动作绑定精确参数、显式批准'],
  ];
  det.forEach(([t, sub], i) => s.push(k.box({ x: 540, y: 150 + i * 64, w: 380, h: 60, title: t, sub, titleSize: 'body', tone: 'ok', strong: i === 0 })));

  s.push(k.arrow({ points: [[120, 384], [120, 424], [720, 424], [720, 402]], tone: 'bad', dashed: true }));
  s.push(k.text({ x: 140, y: 446, text: '残余攻击可能穿过概率层，执行层的确定性检查限定它能造成的影响', size: 'note', tone: 'bad' }));

  s.push(k.box({ x: 40, y: 470, w: 880, h: 84, title: 'System Prompt 按「可能泄露」来设计', sub: '里面不放密钥、隐式授权，或「知道文本才安全」的逻辑\n写「不要泄露」只能降低概率，不能赋予或撤销权限', titleSize: 'body', tone: 'warn' }));

  return k.figure({
    h: 670,
    title: '提示词注入：模型内降概率，模型外守边界',
    subtitle: '标记、检测、评审模型都只能减少成功率；真正的边界是执行层的授权和最小权限',
    body: s.join('') + k.note({ x: 40, y: 578, w: 880, h: 52, lead: '设计目标：', text: '即使模型被诱导，攻击者也越不过确定性授权和最小权限边界。' }),
  });
};
