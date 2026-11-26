export const meta = {
  name: "project-ee-side-effects-staged-evolve-v1",
  article: "project/eval-evolve/ee-side-effects.md",
  alt: "分阶段进化并回头测所有组：从初始版本出发，先只用 A 类任务进化，然后测 A、B、C 三类的留出任务；再只用 B 类任务进化，再测三类；最后只用 C 类任务进化，再测三类",
};

export default (k) => k.figure({
  h: 340,
  title: "分三个阶段进化，每个阶段结束都回头测所有组",
  subtitle: "进化集按任务类型分组，依次进化",
  body: [
    k.box({"x": 40, "y": 140, "w": 130, "h": 56, "title": "初始版本"}),
    k.arrow({"points": [[170, 168], [196, 168]]}),
    k.box({"x": 200, "y": 140, "w": 220, "h": 56, "title": "只用 A 类任务进化", "tone": "accent"}),
    k.arrow({"points": [[310, 196], [310, 226]]}),
    k.box({"x": 200, "y": 230, "w": 220, "h": 64, "title": "回头测 A、B、C", "sub": "三类的留出任务", "tone": "info"}),
    k.arrow({"points": [[420, 262], [435, 262], [435, 168], [446, 168]]}),
    k.box({"x": 450, "y": 140, "w": 220, "h": 56, "title": "只用 B 类任务进化", "tone": "accent"}),
    k.arrow({"points": [[560, 196], [560, 226]]}),
    k.box({"x": 450, "y": 230, "w": 220, "h": 64, "title": "回头测 A、B、C", "sub": "三类的留出任务", "tone": "info"}),
    k.arrow({"points": [[670, 262], [685, 262], [685, 168], [696, 168]]}),
    k.box({"x": 700, "y": 140, "w": 220, "h": 56, "title": "只用 C 类任务进化", "tone": "accent"}),
    k.arrow({"points": [[810, 196], [810, 226]]}),
    k.box({"x": 700, "y": 230, "w": 220, "h": 64, "title": "回头测 A、B、C", "sub": "三类的留出任务", "tone": "info"}),
  ].join(''),
});
