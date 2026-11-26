export const meta = {
  name: "project-eg-simulation-two-step-reaction-v1",
  article: "project/ecom-growth/eg-simulation.md",
  alt: "模拟用户的一次反应拆成两步：模型先给素材和这个用户的动机、顾虑的相关程度打分，三个维度各 0 到 2 分；概率模型再结合相关程度和用户的行为特征算出点击概率，按概率抽样决定点或不点；点了的用同样方式算出下单概率并抽样，最后生成一句理由",
};

export default (k) => k.figure({
  h: 630,
  title: "一次反应拆成两步：模型打分，概率模型定结果",
  subtitle: "模型不直接说点不点，只给相关程度",
  body: [
    k.box({"x": 220, "y": 120, "w": 520, "h": 52, "title": "素材 + 模拟用户"}),
    k.box({"x": 220, "y": 196, "w": 520, "h": 64, "title": "模型打分", "sub": "素材和这个用户的动机、顾虑有多相关", "tone": "accent"}),
    k.box({"x": 220, "y": 284, "w": 520, "h": 52, "title": "相关程度：三个维度各 0 到 2 分"}),
    k.box({"x": 220, "y": 360, "w": 520, "h": 64, "title": "概率模型", "sub": "结合相关程度和行为特征，算出点击概率", "tone": "info"}),
    k.box({"x": 220, "y": 448, "w": 520, "h": 52, "title": "按概率抽样：点或不点", "tone": "warn"}),
    k.arrow({"points": [[480, 172], [480, 192]]}),
    k.arrow({"points": [[480, 260], [480, 280]]}),
    k.arrow({"points": [[480, 336], [480, 356]]}),
    k.arrow({"points": [[480, 424], [480, 444]]}),
    k.arrow({"points": [[350, 500], [350, 536]], "label": "点了", "labelAt": [362, 524], "labelAnchor": "start"}),
    k.arrow({"points": [[610, 500], [610, 536]]}),
    k.box({"x": 220, "y": 540, "w": 250, "h": 64, "title": "再算下单", "sub": "同样方式算概率并抽样", "tone": "info"}),
    k.box({"x": 490, "y": 540, "w": 250, "h": 64, "title": "生成一句理由"}),
    k.arrow({"points": [[470, 572], [486, 572]]}),
  ].join(''),
});
