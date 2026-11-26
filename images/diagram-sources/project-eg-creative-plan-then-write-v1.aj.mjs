export const meta = {
  name: "project-eg-creative-plan-then-write-v1",
  article: "project/ecom-growth/eg-creative.md",
  alt: "素材生成先定方案再写正文：从一类人群和可用卖点清单出发，生成方案矩阵，每个方案指定卖点、角度和语气，检查方案之间是否足够不同，再按每个方案分别写正文；写完自检正文是否只用了方案指定的卖点，不是就重写，是就写入素材库，状态为草稿",
};

export default (k) => k.figure({
  h: 600,
  title: "先定方案，再写正文",
  subtitle: "方案之间足够不同，后面的试投才比得出差别",
  body: [
    k.box({"x": 220, "y": 120, "w": 520, "h": 52, "title": "一类人群 + 可用卖点清单"}),
    k.box({"x": 220, "y": 196, "w": 520, "h": 64, "title": "生成方案矩阵", "sub": "每个方案指定卖点、角度、语气", "tone": "accent"}),
    k.box({"x": 220, "y": 284, "w": 520, "h": 52, "title": "检查方案之间是否足够不同"}),
    k.box({"x": 220, "y": 360, "w": 520, "h": 52, "title": "按每个方案分别写正文", "tone": "accent"}),
    k.box({"x": 220, "y": 436, "w": 520, "h": 52, "title": "自检：正文只用了方案指定的卖点吗", "tone": "warn"}),
    k.box({"x": 220, "y": 520, "w": 520, "h": 52, "title": "写入素材库，状态为草稿", "tone": "ok"}),
    k.arrow({"points": [[480, 172], [480, 192]]}),
    k.arrow({"points": [[480, 260], [480, 280]]}),
    k.arrow({"points": [[480, 336], [480, 356]]}),
    k.arrow({"points": [[480, 412], [480, 432]]}),
    k.arrow({"points": [[480, 488], [480, 516]], "label": "是", "labelAt": [492, 508], "labelAnchor": "start"}),
    k.arrow({"points": [[740, 462], [790, 462], [790, 386], [744, 386]], "label": "否", "labelAt": [802, 428], "labelAnchor": "start", "dashed": true}),
  ].join(''),
});
