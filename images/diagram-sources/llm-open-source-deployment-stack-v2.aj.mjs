export const meta = {
  name: 'llm-open-source-deployment-stack-v2',
  article: 'knowledge/llm/basics/llm-open-source-deployment.md',
  alt: '开源大模型部署栈自下而上六层：模型审查看模型卡、许可证、来源和哈希；格式与兼容要逐项核对 safetensors 或 GGUF、架构、tokenizer、聊天模板和量化类型；运行时在 vLLM 类 GPU 服务（连续批处理、KV Cache 管理）和 llama.cpp 类本地运行时（CPU、消费级 GPU、可移植）之间按硬件选择；硬件预算要算三本内存账：权重、随上下文和并发增长的 KV Cache、激活与工作区，还要留余量；服务入口负责认证、限流、token 上限、超时取消、背压和版本记录；最上层是可观测与验收，看首 token 延迟、P95、KV 占用，在业务集上比较高精度和量化版本，并能回滚到已知组合',
};

export default (k) => {
  const s = [], X = 40, W = 880;
  const band = (y, h, t, sub, tone) => s.push(k.box({ x: X, y, w: W, h, title: t, sub, titleSize: 'body', tone, align: 'left' }));
  band(112, 64, '6. 可观测与验收', '首 token 延迟、P95、KV 占用；业务集上比高精度和量化版；能回滚到已知组合', 'ok');
  band(188, 64, '5. 服务入口', '认证、限流、token 上限、超时与取消、背压，记录模型 / 模板 / 采样参数版本', 'info');

  s.push(k.panel({ x: X, y: 264, w: W, h: 92, label: '4. 硬件预算：先算三本内存账，文件小于显存不代表能跑' }));
  [
    [60, 220, '权重', 'info'],
    [288, 300, 'KV Cache：随上下文 × 并发增长', 'warn'],
    [596, 170, '激活与工作区', 'muted'],
    [774, 126, '余量', 'muted'],
  ].forEach(([x, w, t, tone], i) => s.push(k.box({ x, y: 304, w, h: 38, title: t, titleSize: 'label', tone, dashed: i === 3 })));

  s.push(k.box({ x: X, y: 368, w: 430, h: 72, title: '3a. vLLM 类 GPU 服务', sub: '连续批处理、KV 管理，面向多请求', titleSize: 'body', tone: 'accent' }));
  s.push(k.box({ x: 490, y: 368, w: 430, h: 72, title: '3b. llama.cpp 类本地运行时', sub: 'CPU、消费级 GPU，多平台可移植', titleSize: 'body', tone: 'accent' }));
  band(452, 64, '2. 格式与兼容', 'safetensors / GGUF；逐项核对架构、tokenizer、聊天模板、量化类型——扩展名相同不算兼容', 'muted');
  band(528, 64, '1. 模型审查', '模型卡、许可证（权重能否商用和托管）、来源与哈希；尽量不执行远程自定义代码', 'warn');

  return k.figure({
    h: 630,
    title: '开源模型部署：模型文件只是最底下的一层',
    subtitle: '自下而上逐层核对；硬件预算、服务控制和验收共同决定能不能上线',
    body: s.join(''),
  });
};
