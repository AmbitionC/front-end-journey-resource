export const meta = {
  name: "project-eg-product-extract-selling-points-v1",
  article: "project/ecom-growth/eg-product.md",
  alt: "卖点提取流程：从商品详情与规格提取候选卖点并附原文依据，从用户评价聚合反复提到的优点和缺点，两路合并去重后由程序校验依据能否在原文中逐字找到，找不到的丢弃，找到的标注声明等级，需要证据的卖点交人工确认，最后写入卖点表",
};

export default (k) => k.figure({
  h: 720,
  title: "卖点提取：每条卖点都要在原文里找得到依据",
  subtitle: "两路来源合并后，先过程序校验，再过人工确认",
  body: [
    k.box({"x": 100, "y": 120, "w": 340, "h": 52, "title": "商品详情与规格"}),
    k.box({"x": 520, "y": 120, "w": 340, "h": 52, "title": "用户评价"}),
    k.arrow({"points": [[270, 172], [270, 196]]}),
    k.arrow({"points": [[690, 172], [690, 196]]}),
    k.box({"x": 100, "y": 200, "w": 340, "h": 64, "title": "提取候选卖点", "sub": "每条附原文依据", "tone": "accent"}),
    k.box({"x": 520, "y": 200, "w": 340, "h": 64, "title": "聚合评价", "sub": "反复提到的优点和缺点", "tone": "accent"}),
    k.arrow({"points": [[270, 264], [270, 284], [480, 284], [480, 300]]}),
    k.arrow({"points": [[690, 264], [690, 284], [480, 284]], "head": false}),
    k.box({"x": 280, "y": 304, "w": 400, "h": 52, "title": "合并去重"}),
    k.arrow({"points": [[480, 356], [480, 380]]}),
    k.box({"x": 280, "y": 384, "w": 400, "h": 64, "title": "程序校验", "sub": "依据能在原文中逐字找到吗", "tone": "warn"}),
    k.arrow({"points": [[680, 416], [756, 416]], "label": "找不到", "labelAt": [718, 406], "labelAnchor": "middle"}),
    k.box({"x": 760, "y": 390, "w": 160, "h": 52, "title": "丢弃该卖点", "tone": "bad"}),
    k.arrow({"points": [[480, 448], [480, 480]], "label": "找到", "labelAt": [492, 470], "labelAnchor": "start"}),
    k.box({"x": 280, "y": 484, "w": 400, "h": 52, "title": "标注声明等级"}),
    k.arrow({"points": [[480, 536], [480, 560]]}),
    k.box({"x": 280, "y": 564, "w": 400, "h": 52, "title": "人工确认需要证据的卖点"}),
    k.arrow({"points": [[480, 616], [480, 640]]}),
    k.box({"x": 280, "y": 644, "w": 400, "h": 52, "title": "写入卖点表", "tone": "ok"}),
  ].join(''),
});
