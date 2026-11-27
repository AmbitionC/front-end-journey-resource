export const meta = {
  name: "project-ee-architecture-evolve-round-v1",
  article: "project/eval-evolve/ee-architecture.md",
  alt: "一轮进化的完整流程：运行器让当前版本跑进化集，评分器给出判定理由，失败分析归因到具体环节，提案器生成若干候选版本；每个候选提交给准入闸门，在验收集和回归集上运行并评分，验收集更好且回归集不退步的合入版本库，否则拒绝并把退步的任务交回提案器",
};

export default (k) => k.figure({
  h: 520,
  title: "一轮进化：先找原因出候选，再逐个过闸门",
  subtitle: "被拒绝的候选会带着退步的任务回到提案器",
  body: [
    k.box({"x": 56, "y": 120, "w": 200, "h": 72, "title": "运行器", "sub": "当前版本跑进化集"}),
    k.box({"x": 272, "y": 120, "w": 200, "h": 72, "title": "评分器", "sub": "给出判定理由"}),
    k.box({"x": 488, "y": 120, "w": 200, "h": 72, "title": "失败分析", "sub": "归因到具体环节"}),
    k.box({"x": 704, "y": 120, "w": 200, "h": 72, "title": "提案器", "sub": "生成若干候选版本", "tone": "accent"}),
    k.arrow({"points": [[256, 156], [268, 156]]}),
    k.arrow({"points": [[472, 156], [484, 156]]}),
    k.arrow({"points": [[688, 156], [700, 156]]}),
    k.frame({"x": 40, "y": 232, "w": 880, "h": 250, "label": "对每个候选版本", "labelPos": "top"}),
    k.arrow({"points": [[804, 192], [804, 266]], "label": "提交候选", "labelAt": [792, 222], "labelAnchor": "end"}),
    k.box({"x": 704, "y": 270, "w": 200, "h": 90, "title": "准入闸门", "tone": "warn"}),
    k.arrow({"points": [[704, 315], [692, 315]]}),
    k.box({"x": 488, "y": 270, "w": 200, "h": 90, "title": "运行器", "sub": "跑验收集和回归集"}),
    k.arrow({"points": [[488, 315], [476, 315]]}),
    k.box({"x": 272, "y": 270, "w": 200, "h": 90, "title": "评分器", "sub": "给出得分"}),
    k.arrow({"points": [[272, 315], [260, 315]]}),
    k.box({"x": 56, "y": 270, "w": 200, "h": 90, "title": "能合入吗", "sub": "验收集更好\n且回归集不退步", "tone": "warn"}),
    k.arrow({"points": [[120, 360], [120, 406]], "label": "是", "labelAt": [132, 390], "labelAnchor": "start"}),
    k.box({"x": 56, "y": 410, "w": 200, "h": 52, "title": "合入版本库", "tone": "ok"}),
    k.arrow({"points": [[200, 360], [200, 384], [340, 384], [340, 406]], "label": "否", "labelAt": [352, 400], "labelAnchor": "start"}),
    k.box({"x": 272, "y": 410, "w": 416, "h": 52, "title": "拒绝，附上退步的任务", "tone": "bad"}),
    k.arrow({"points": [[688, 436], [912, 436], [912, 156], [908, 156]]}),
  ].join(''),
});
