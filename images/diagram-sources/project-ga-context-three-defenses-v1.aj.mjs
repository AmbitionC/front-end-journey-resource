export const meta = {
  name: "project-ga-context-three-defenses-v1",
  article: "project/general-agent/ga-context.md",
  alt: "上下文的三道防线：工具返回结果在进入上下文前先截断，追加到消息列表后检查总量是否超过窗口的 80%，没超过就正常调用模型；超过则清理旧的工具结果正文，降到阈值以下就调用模型，否则把早期对话压缩成摘要后再调用模型",
};

export default (k) => k.figure({
  h: 700,
  title: "三道防线：截断、清理旧结果、压缩成摘要",
  subtitle: "后两道只在总量超过窗口的 80% 时才触发",
  body: [
    k.box({"x": 120, "y": 120, "w": 330, "h": 48, "title": "工具返回结果"}),
    k.box({"x": 120, "y": 196, "w": 330, "h": 52, "title": "第一道：进入上下文前截断", "tone": "accent"}),
    k.box({"x": 120, "y": 276, "w": 330, "h": 48, "title": "追加到消息列表"}),
    k.box({"x": 120, "y": 352, "w": 330, "h": 52, "title": "总量超过窗口的 80% 吗", "tone": "warn"}),
    k.box({"x": 120, "y": 440, "w": 330, "h": 52, "title": "第二道：清理旧的工具结果正文", "tone": "accent"}),
    k.box({"x": 120, "y": 528, "w": 330, "h": 52, "title": "降到阈值以下了吗", "tone": "warn"}),
    k.box({"x": 120, "y": 616, "w": 330, "h": 52, "title": "第三道：把早期对话压缩成摘要", "tone": "accent"}),
    k.arrow({"points": [[285, 168], [285, 192]]}),
    k.arrow({"points": [[285, 248], [285, 272]]}),
    k.arrow({"points": [[285, 324], [285, 348]]}),
    k.arrow({"points": [[285, 404], [285, 436]], "label": "是", "labelAt": [297, 426], "labelAnchor": "start"}),
    k.arrow({"points": [[285, 492], [285, 524]]}),
    k.arrow({"points": [[285, 580], [285, 612]], "label": "否", "labelAt": [297, 602], "labelAnchor": "start"}),
    k.box({"x": 640, "y": 440, "w": 260, "h": 52, "title": "正常调用模型", "tone": "ok"}),
    k.arrow({"points": [[450, 378], [770, 378], [770, 436]], "label": "否", "labelAt": [540, 368], "labelAnchor": "middle"}),
    k.arrow({"points": [[450, 554], [720, 554], [720, 496]], "label": "是", "labelAt": [540, 544], "labelAnchor": "middle"}),
    k.arrow({"points": [[450, 642], [850, 642], [850, 496]]}),
  ].join(''),
});
