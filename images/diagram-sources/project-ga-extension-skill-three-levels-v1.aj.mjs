export const meta = {
  name: "project-ga-extension-skill-three-levels-v1",
  article: "project/general-agent/ga-extension.md",
  alt: "技能的三级加载：会话开始时只读入每个技能的 name 和 description；模型判断当前任务匹配某个技能时才调用技能工具读入 SKILL.md 全文，不匹配就不加载；正文里提到其他文件且需要时，再用读文件工具读 examples.md 或执行 check.py，最后按说明完成任务",
};

export default (k) => k.figure({
  h: 740,
  title: "技能分三级加载：窗口里只留索引",
  subtitle: "用不到的技能，正文一个字都不进上下文",
  body: [
    k.box({"x": 100, "y": 120, "w": 420, "h": 48, "title": "会话开始"}),
    k.arrow({"points": [[310, 168], [310, 192]]}),
    k.box({"x": 100, "y": 196, "w": 420, "h": 64, "title": "第一级：只读名称和描述", "sub": "每个技能的 name 和 description", "tone": "accent"}),
    k.arrow({"points": [[310, 260], [310, 284]]}),
    k.box({"x": 100, "y": 288, "w": 420, "h": 52, "title": "当前任务匹配某个技能吗", "tone": "warn"}),
    k.arrow({"points": [[520, 314], [616, 314]], "label": "否", "labelAt": [568, 304], "labelAnchor": "middle"}),
    k.box({"x": 620, "y": 288, "w": 280, "h": 52, "title": "不加载，零额外开销"}),
    k.arrow({"points": [[310, 340], [310, 372]], "label": "是", "labelAt": [322, 362], "labelAnchor": "start"}),
    k.box({"x": 100, "y": 376, "w": 420, "h": 64, "title": "第二级：读入 SKILL.md 全文", "sub": "调用技能工具", "tone": "accent"}),
    k.arrow({"points": [[310, 440], [310, 468]]}),
    k.box({"x": 100, "y": 472, "w": 420, "h": 52, "title": "正文里提到了其他文件吗", "tone": "warn"}),
    k.arrow({"points": [[310, 524], [310, 556]], "label": "需要", "labelAt": [322, 546], "labelAnchor": "start"}),
    k.box({"x": 100, "y": 560, "w": 420, "h": 64, "title": "第三级：按需读文件或执行脚本", "sub": "读 examples.md，或执行 check.py", "tone": "accent"}),
    k.arrow({"points": [[310, 624], [310, 656]]}),
    k.box({"x": 100, "y": 660, "w": 420, "h": 52, "title": "按说明完成任务", "tone": "ok"}),
    k.arrow({"points": [[520, 498], [580, 498], [580, 686], [524, 686]], "label": "不需要", "labelAt": [592, 596], "labelAnchor": "start"}),
  ].join(''),
});
