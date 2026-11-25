export const meta = {
  name: 'jwt-validation-trust-boundary-v3',
  article: 'knowledge/backend/auth/jwt-auth.md',
  alt: '签名 JWT 的三段结构与验证管线。三段是 header、payload、signature：header 声明算法，payload 只是 Base64URL 编码不是加密，谁拿到都能读，不能放密码和密钥；signature 覆盖前两段，篡改任一段都会验签失败。服务端按顺序验证：先用写死的算法白名单（如 RS256，不能含 none），不信 token 自己声明的 alg；再从受信密钥集合里选公钥，轮换时可按 kid 支持多把；然后验签；再校验 claims：iss、aud、exp、sub 和 token_use 等用途字段，并做运行时 schema 检查；最后查当前授权，验签通过不等于有权执行。任一步失败都终止请求，签名或受众无效不能靠刷新重试掩盖。两个常见错误：把 jwt.decode 当验证，以及在 payload 里放敏感明文。令牌生命周期：Access Token 短期，Refresh Token 在服务端维护会话族，原子轮换、旧凭据只消费一次，发现重放按策略撤销；撤销有三种取舍：短过期在到期前仍然有效，即时撤销需要额外状态，比如 jti 黑名单或 tokenVersion',
};

export default (k) => {
  const s = [];
  // 三段结构
  const seg = [
    ['header', 'alg · typ', 'info'],
    ['payload', 'sub · iss · aud · exp · jti', 'warn'],
    ['signature', '覆盖前两段', 'ok'],
  ];
  seg.forEach(([t, sub, tone], i) => {
    const x = 40 + i * 300;
    s.push(k.box({ x, y: 112, w: 280, h: 64, title: t, sub, titleSize: 'body', tone }));
    if (i < 2) s.push(k.text({ x: x + 290, y: 150, text: '.', size: 'heading', anchor: 'middle', weight: 700 }));
  });
  s.push(k.text({ x: 180, y: 200, text: '只是 Base64URL 编码', size: 'note', anchor: 'middle', tone: 'muted' }));
  s.push(k.text({ x: 480, y: 200, text: '谁拿到都能读：不放密码和密钥', size: 'note', anchor: 'middle', tone: 'bad' }));
  s.push(k.text({ x: 780, y: 200, text: '改任何一段都会验签失败', size: 'note', anchor: 'middle', tone: 'muted' }));

  // 验证管线
  s.push(k.panel({ x: 40, y: 226, w: 880, h: 176, label: '服务端验证：按顺序，一步失败就终止', tone: 'accent' }));
  const steps = [
    ['① 固定算法', '白名单如 RS256\n不信 token 的 alg'],
    ['② 选受信密钥', '受信公钥集合\n轮换按 kid'],
    ['③ 验签', '完整性\n没被篡改'],
    ['④ 校验 claims', 'iss · aud · exp\nsub · token_use'],
    ['⑤ 当前授权', '验签 ≠ 有权\n查当前策略'],
  ];
  steps.forEach(([t, sub], i) => {
    const x = 60 + i * 172;
    s.push(k.box({ x, y: 272, w: 152, h: 88, title: t, sub, titleSize: 'label', tone: i === 4 ? 'ok' : 'accent', strong: i === 4 }));
    if (i < 4) s.push(k.arrow({ points: [[x + 152, 316], [x + 172, 316]] }));
  });
  s.push(k.text({ x: 480, y: 388, text: '签名或受众无效不能靠刷新重试掩盖；jwt.decode 只是解码，不是验证', size: 'note', anchor: 'middle', tone: 'bad' }));

  // 生命周期与撤销
  s.push(k.box({ x: 40, y: 426, w: 280, h: 88, title: 'Access Token', sub: '期限按资源风险设得短\n资源请求入口验证并授权', titleSize: 'body', tone: 'info' }));
  s.push(k.box({ x: 340, y: 426, w: 280, h: 88, title: 'Refresh Token', sub: '服务端维护会话族，原子轮换\n旧凭据只用一次，重放按策略撤销', titleSize: 'body', tone: 'info' }));
  s.push(k.box({ x: 640, y: 426, w: 280, h: 88, title: '撤销的三种取舍', sub: '短过期：到期前仍有效\n即时：jti 黑名单 · tokenVersion', titleSize: 'body', tone: 'warn' }));

  return k.figure({
    h: 560,
    title: 'JWT：能解码不等于可信',
    subtitle: '以签名 JWT（JWS 紧凑形式）为例：先固定规则验签和 claims，再查当前授权',
    body: s.join(''),
  });
};
