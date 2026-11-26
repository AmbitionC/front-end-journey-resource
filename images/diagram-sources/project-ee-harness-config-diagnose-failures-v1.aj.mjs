export const meta = {
  name: "project-ee-harness-config-diagnose-failures-v1",
  article: "project/eval-evolve/ee-harness-config.md",
  alt: "自动失败归因的流程：读进化集上的失败轨迹，逐条诊断失败发生在哪一步、直接原因是什么，把相似的诊断聚成几类，每一类统计涉及多少条任务、对应哪个配置项，最后按影响的任务数排序取前几类",
};

export default (k) => k.figure({
  h: 520,
  title: "失败归因：从一条条轨迹，聚到该改的配置项",
  subtitle: "诊断必须指向外壳的某个部件",
  body: [
    k.box({"x": 200, "y": 120, "w": 560, "h": 52, "title": "进化集上的失败轨迹"}),
    k.box({"x": 200, "y": 200, "w": 560, "h": 64, "title": "逐条诊断", "sub": "失败发生在哪一步，直接原因是什么", "tone": "accent"}),
    k.box({"x": 200, "y": 292, "w": 560, "h": 52, "title": "把相似的诊断聚成几类"}),
    k.box({"x": 200, "y": 372, "w": 560, "h": 64, "title": "每一类", "sub": "涉及多少条任务，对应哪个配置项", "tone": "accent"}),
    k.box({"x": 200, "y": 464, "w": 560, "h": 52, "title": "按影响的任务数排序，取前几类", "tone": "ok"}),
    k.arrow({"points": [[480, 172], [480, 196]]}),
    k.arrow({"points": [[480, 264], [480, 288]]}),
    k.arrow({"points": [[480, 344], [480, 368]]}),
    k.arrow({"points": [[480, 436], [480, 460]]}),
  ].join(''),
});
