export const meta = {
  name: "project-eg-evolve-three-actions-v1",
  article: "project/ecom-growth/eg-evolve.md",
  alt: "一轮进化做三件事：根据归因结论和本轮各素材表现，淘汰明显差的素材，基于表现好的素材和归因结论改写出新版本，针对未回应的顾虑补写全新素材；改写和补缺的素材都要送审，通过的加入下一轮候选并继承父素材的部分统计，两次不过的放弃；没被淘汰的素材和新通过的素材组成下一轮的候选集合",
};

export default (k) => k.figure({
  h: 640,
  title: "一轮进化做三件事：淘汰、改写、补缺",
  subtitle: "新写出来的素材要先送审，两次不过就放弃",
  body: [
    k.box({"x": 280, "y": 120, "w": 400, "h": 52, "title": "归因结论 + 本轮各素材表现"}),
    k.arrow({"points": [[480, 172], [480, 196], [175, 196], [175, 216]]}),
    k.arrow({"points": [[480, 172], [480, 216]]}),
    k.arrow({"points": [[480, 196], [785, 196], [785, 216]]}),
    k.box({"x": 40, "y": 220, "w": 270, "h": 90, "title": "淘汰", "sub": "移除明显差的素材", "tone": "bad"}),
    k.box({"x": 345, "y": 220, "w": 270, "h": 90, "title": "改写", "sub": "基于表现好的素材\n和归因结论写新版本", "tone": "accent"}),
    k.box({"x": 650, "y": 220, "w": 270, "h": 90, "title": "补缺", "sub": "针对未回应的顾虑\n写全新素材", "tone": "accent"}),
    k.arrow({"points": [[480, 310], [480, 346]]}),
    k.arrow({"points": [[785, 310], [785, 346]]}),
    k.box({"x": 345, "y": 350, "w": 575, "h": 52, "title": "送审", "tone": "warn"}),
    k.arrow({"points": [[480, 402], [480, 446]], "label": "通过", "labelAt": [492, 430], "labelAnchor": "start"}),
    k.arrow({"points": [[785, 402], [785, 446]], "label": "两次不过", "labelAt": [797, 430], "labelAnchor": "start"}),
    k.box({"x": 345, "y": 450, "w": 270, "h": 64, "title": "加入下一轮候选", "sub": "继承父素材的部分统计", "tone": "ok"}),
    k.box({"x": 650, "y": 450, "w": 270, "h": 64, "title": "放弃"}),
    k.arrow({"points": [[175, 310], [175, 556]]}),
    k.arrow({"points": [[480, 514], [480, 556]]}),
    k.box({"x": 40, "y": 560, "w": 575, "h": 52, "title": "下一轮的候选集合"}),
  ].join(''),
});
