export const meta = {
  name: "project-ee-taskset-where-tasks-come-from-v1",
  article: "project/eval-evolve/ee-taskset.md",
  alt: "任务的三个来源和入库流程：日常使用中的失败、真实仓库的修复提交、人工构造的边界情况都先整理成任务，写参考解并确认能通过评分，再检查两个人对通过标准的理解是否一致，不一致就改写任务描述后重新确认，一致才入库并分配到三套集合之一",
};

export default (k) => k.figure({
  h: 550,
  title: "任务从哪里来：三个来源，两道检查后入库",
  subtitle: "两个人理解不一致，说明任务描述还得改",
  body: [
    k.box({"x": 40, "y": 130, "w": 250, "h": 52, "title": "日常使用中的失败"}),
    k.box({"x": 40, "y": 202, "w": 250, "h": 52, "title": "真实仓库的修复提交"}),
    k.box({"x": 40, "y": 274, "w": 250, "h": 52, "title": "人工构造的边界情况"}),
    k.arrow({"points": [[290, 156], [330, 156], [330, 228], [376, 228]]}),
    k.arrow({"points": [[290, 228], [330, 228]], "head": false}),
    k.arrow({"points": [[290, 300], [330, 300], [330, 228]], "head": false}),
    k.box({"x": 380, "y": 202, "w": 300, "h": 52, "title": "整理成任务", "tone": "accent"}),
    k.arrow({"points": [[530, 254], [530, 286]]}),
    k.box({"x": 380, "y": 290, "w": 300, "h": 52, "title": "写参考解并确认能通过评分"}),
    k.arrow({"points": [[530, 342], [530, 374]]}),
    k.box({"x": 380, "y": 378, "w": 300, "h": 52, "title": "两个人理解的通过标准一致吗", "tone": "warn"}),
    k.arrow({"points": [[530, 430], [530, 462]], "label": "是", "labelAt": [542, 452], "labelAnchor": "start"}),
    k.box({"x": 380, "y": 466, "w": 300, "h": 52, "title": "入库，分配到三套集合之一", "tone": "ok"}),
    k.arrow({"points": [[680, 404], [825, 404], [825, 346]], "label": "否", "labelAt": [752, 394], "labelAnchor": "middle"}),
    k.box({"x": 730, "y": 290, "w": 190, "h": 52, "title": "改写任务描述"}),
    k.arrow({"points": [[730, 316], [684, 316]]}),
  ].join(''),
});
