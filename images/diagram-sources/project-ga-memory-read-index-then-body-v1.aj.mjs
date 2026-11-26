export const meta = {
  name: "project-ga-memory-read-index-then-body-v1",
  article: "project/general-agent/ga-memory.md",
  alt: "长期记忆的读取：会话开始时取出当前项目和全局范围的标题，最多 30 条，把标题列表放进上下文；模型判断某条相关时才调用记忆读取工具取正文，不相关就不取",
};

export default (k) => k.figure({
  h: 400,
  title: "读取记忆：索引常驻，正文按需",
  subtitle: "标题最多 30 条，正文一条都不预先放进上下文",
  body: [
    k.box({"x": 40, "y": 140, "w": 120, "h": 84, "title": "会话开始"}),
    k.arrow({"points": [[160, 182], [186, 182]]}),
    k.box({"x": 190, "y": 140, "w": 200, "h": 84, "title": "取出标题", "sub": "当前项目和全局范围\n最多 30 条", "tone": "accent"}),
    k.arrow({"points": [[390, 182], [416, 182]]}),
    k.box({"x": 420, "y": 140, "w": 200, "h": 84, "title": "标题列表", "sub": "放进上下文", "tone": "accent"}),
    k.arrow({"points": [[620, 182], [646, 182]]}),
    k.box({"x": 650, "y": 140, "w": 270, "h": 84, "title": "某条相关吗", "sub": "由模型判断", "tone": "warn"}),
    k.arrow({"points": [[700, 224], [700, 296]], "label": "是", "labelAt": [712, 266], "labelAnchor": "start"}),
    k.arrow({"points": [[870, 224], [870, 296]], "label": "否", "labelAt": [882, 266], "labelAnchor": "start"}),
    k.box({"x": 560, "y": 300, "w": 240, "h": 64, "title": "取正文", "sub": "调用记忆读取工具", "tone": "ok"}),
    k.box({"x": 820, "y": 300, "w": 100, "h": 64, "title": "不取"}),
  ].join(''),
});
