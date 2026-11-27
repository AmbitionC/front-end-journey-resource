export const meta = {
  name: "project-ga-tools-execute-four-checks-v1",
  article: "project/general-agent/ga-tools.md",
  alt: "工具注册表 execute 的固定顺序：收到工具调用后先看工具是否存在，不存在就返回没有这个工具以及可用的有哪些；再看参数是否符合格式，不符合就返回哪个参数错了、期望什么；然后带超时执行，抛异常就返回异常类型和信息；最后看结果是否过长，过长就截断并说明如何取剩余部分，否则原样返回",
};

export default (k) => k.figure({
  h: 430,
  title: "execute 按固定顺序做四件事",
  subtitle: "每一步出错，都返回一条模型看得懂的说明",
  body: [
    k.box({"x": 40, "y": 200, "w": 150, "h": 64, "title": "收到工具调用"}),
    k.arrow({"points": [[190, 232], [226, 232]]}),
    k.box({"x": 230, "y": 200, "w": 150, "h": 64, "title": "工具存在吗", "tone": "warn"}),
    k.arrow({"points": [[380, 232], [416, 232]], "label": "是", "labelAt": [398, 222], "labelAnchor": "middle"}),
    k.box({"x": 420, "y": 200, "w": 170, "h": 64, "title": "参数符合格式吗", "tone": "warn"}),
    k.arrow({"points": [[590, 232], [626, 232]], "label": "是", "labelAt": [608, 222], "labelAnchor": "middle"}),
    k.box({"x": 630, "y": 200, "w": 130, "h": 64, "title": "带超时执行", "tone": "accent"}),
    k.arrow({"points": [[760, 232], [796, 232]]}),
    k.box({"x": 800, "y": 200, "w": 120, "h": 64, "title": "结果过长吗", "tone": "warn"}),
    k.arrow({"points": [[305, 264], [305, 326]], "label": "否", "labelAt": [317, 300], "labelAnchor": "start"}),
    k.arrow({"points": [[505, 264], [505, 326]], "label": "否", "labelAt": [517, 300], "labelAnchor": "start"}),
    k.arrow({"points": [[695, 264], [695, 326]], "label": "抛异常", "labelAt": [707, 300], "labelAnchor": "start"}),
    k.arrow({"points": [[860, 264], [860, 326]], "label": "是", "labelAt": [872, 300], "labelAnchor": "start"}),
    k.box({"x": 215, "y": 330, "w": 180, "h": 64, "title": "没有这个工具", "sub": "返回可用的有哪些", "tone": "bad"}),
    k.box({"x": 415, "y": 330, "w": 180, "h": 64, "title": "参数不对", "sub": "哪个错了、期望什么", "tone": "bad"}),
    k.box({"x": 615, "y": 330, "w": 160, "h": 64, "title": "执行出错", "sub": "异常类型和信息", "tone": "bad"}),
    k.box({"x": 790, "y": 330, "w": 130, "h": 84, "title": "截断", "sub": "并说明如何\n取剩余部分"}),
    k.arrow({"points": [[860, 200], [860, 170]], "label": "否", "labelAt": [848, 190], "labelAnchor": "end"}),
    k.box({"x": 790, "y": 114, "w": 130, "h": 52, "title": "原样返回", "tone": "ok"}),
  ].join(''),
});
