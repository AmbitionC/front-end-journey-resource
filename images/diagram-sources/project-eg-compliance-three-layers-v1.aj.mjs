export const meta = {
  name: "project-eg-compliance-three-layers-v1",
  article: "project/ecom-growth/eg-compliance.md",
  alt: "审核分三层：第一层规则命中禁用项直接拦截，未命中进入第二层模型裁判；裁判判为明确违规则拦截，明确合规则通过，拿不准的交给第三层人工，人工同意则通过、否决则拦截；被拦截的素材带着原因退回生成环节重写，最多两次",
};

export default (k) => k.figure({
  h: 590,
  title: "审核分三层：规则先拦，模型再判，拿不准才找人",
  subtitle: "被拦截的素材带着原因退回重写，最多两次",
  body: [
    k.box({"x": 140, "y": 120, "w": 300, "h": 52, "title": "待审素材"}),
    k.arrow({"points": [[290, 172], [290, 196]]}),
    k.box({"x": 140, "y": 200, "w": 300, "h": 64, "title": "第一层：规则"}),
    k.arrow({"points": [[290, 264], [290, 296]], "label": "未命中", "labelAt": [302, 286], "labelAnchor": "start"}),
    k.box({"x": 140, "y": 300, "w": 300, "h": 64, "title": "第二层：模型裁判", "sub": "逐项判断", "tone": "info"}),
    k.arrow({"points": [[290, 364], [290, 396]], "label": "拿不准", "labelAt": [302, 386], "labelAnchor": "start"}),
    k.box({"x": 140, "y": 400, "w": 300, "h": 64, "title": "第三层：人工", "tone": "warn"}),
    k.arrow({"points": [[290, 464], [290, 496]], "label": "同意", "labelAt": [302, 486], "labelAnchor": "start"}),
    k.box({"x": 140, "y": 500, "w": 300, "h": 56, "title": "通过", "tone": "ok"}),
    k.box({"x": 680, "y": 200, "w": 240, "h": 264, "title": "拦截", "sub": "返回命中的规则和位置\n带着原因退回重写\n最多两次", "tone": "bad"}),
    k.arrow({"points": [[440, 232], [676, 232]], "label": "命中禁用项", "labelAt": [558, 222], "labelAnchor": "middle"}),
    k.arrow({"points": [[440, 332], [676, 332]], "label": "明确违规", "labelAt": [558, 322], "labelAnchor": "middle"}),
    k.arrow({"points": [[440, 432], [676, 432]], "label": "否决", "labelAt": [558, 422], "labelAnchor": "middle"}),
    k.arrow({"points": [[140, 332], [100, 332], [100, 528], [136, 528]], "label": "明确合规", "labelAt": [92, 436], "labelAnchor": "end"}),
  ].join(''),
});
