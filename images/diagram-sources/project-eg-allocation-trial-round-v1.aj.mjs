export const meta = {
  name: "project-eg-allocation-trial-round-v1",
  article: "project/ecom-growth/eg-allocation.md",
  alt: "一轮试投的预算分配流程：先给每个选项保底曝光，剩余预算用汤普森采样分配，试投后更新统计；还有下一轮时由进化环节增删选项再回到开头，没有下一轮就输出最终分配和结论",
};

export default (k) => k.figure({
  h: 530,
  title: "一轮试投：先保底，再把剩余预算分给表现好的",
  subtitle: "预算一批一批地分，每一轮结束都更新统计",
  body: [
    k.box({"x": 40, "y": 120, "w": 260, "h": 64, "title": "本轮预算和候选选项"}),
    k.arrow({"points": [[300, 152], [346, 152]]}),
    k.box({"x": 350, "y": 120, "w": 260, "h": 64, "title": "每个选项保底曝光", "tone": "accent"}),
    k.arrow({"points": [[610, 152], [656, 152]]}),
    k.box({"x": 660, "y": 120, "w": 260, "h": 64, "title": "剩余预算再分配", "sub": "用汤普森采样", "tone": "accent"}),
    k.arrow({"points": [[790, 184], [790, 316]]}),
    k.box({"x": 660, "y": 320, "w": 260, "h": 64, "title": "执行试投", "sub": "收集数据"}),
    k.arrow({"points": [[660, 352], [614, 352]]}),
    k.box({"x": 350, "y": 320, "w": 260, "h": 64, "title": "更新每个选项的统计"}),
    k.arrow({"points": [[350, 352], [304, 352]]}),
    k.box({"x": 40, "y": 320, "w": 260, "h": 64, "title": "还有下一轮吗", "tone": "warn"}),
    k.arrow({"points": [[170, 320], [170, 276]], "label": "是", "labelAt": [182, 304], "labelAnchor": "start"}),
    k.box({"x": 40, "y": 208, "w": 260, "h": 64, "title": "进化环节", "sub": "加入新选项、移除旧选项"}),
    k.arrow({"points": [[170, 208], [170, 188]]}),
    k.arrow({"points": [[170, 384], [170, 426]], "label": "否", "labelAt": [182, 410], "labelAnchor": "start"}),
    k.box({"x": 40, "y": 430, "w": 260, "h": 64, "title": "输出最终分配和结论", "tone": "ok"}),
  ].join(''),
});
