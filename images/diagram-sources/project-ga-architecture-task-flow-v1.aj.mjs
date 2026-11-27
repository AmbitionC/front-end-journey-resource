export const meta = {
  name: "project-ga-architecture-task-flow-v1",
  article: "project/general-agent/ga-architecture.md",
  alt: "一次任务在各部件之间的流转：用户输入任务后进入执行循环，上下文管理器取出本轮消息，发给模型接口，模型回复文本或工具调用；要求调用工具时先过权限闸门，需要确认时先问用户，放行后由工具注册表执行，调用和结果追加回上下文进入下一轮；模型不再要求调用工具时把最终回复交给用户",
};

export default (k) => k.figure({
  h: 580,
  title: "一次任务怎么流转：每一轮都经过这几个部件",
  subtitle: "以修一条挂掉的测试为例",
  body: [
    k.box({"x": 60, "y": 112, "w": 340, "h": 48, "title": "用户输入任务"}),
    k.arrow({"points": [[370, 160], [370, 212]]}),
    k.frame({"x": 40, "y": 176, "w": 880, "h": 298, "label": "执行循环：直到模型不再要求调用工具", "labelPos": "top"}),
    k.box({"x": 60, "y": 216, "w": 340, "h": 64, "title": "上下文管理器", "sub": "取本轮消息：提示词、记忆、历史、输入", "tone": "accent"}),
    k.arrow({"points": [[230, 280], [230, 304]]}),
    k.box({"x": 60, "y": 308, "w": 340, "h": 64, "title": "模型接口", "sub": "发送消息和工具定义", "tone": "accent"}),
    k.arrow({"points": [[230, 372], [230, 396]]}),
    k.box({"x": 60, "y": 400, "w": 340, "h": 52, "title": "模型要求调用工具吗", "tone": "warn"}),
    k.arrow({"points": [[400, 426], [556, 426]], "label": "是", "labelAt": [478, 416], "labelAnchor": "middle"}),
    k.box({"x": 560, "y": 394, "w": 340, "h": 64, "title": "权限闸门", "sub": "需要确认时先问用户", "tone": "warn"}),
    k.arrow({"points": [[730, 394], [730, 376]]}),
    k.box({"x": 560, "y": 308, "w": 340, "h": 64, "title": "工具注册表", "sub": "放行后执行工具，返回结果"}),
    k.arrow({"points": [[730, 308], [730, 284]]}),
    k.box({"x": 560, "y": 216, "w": 340, "h": 64, "title": "追加调用和结果", "sub": "写回上下文"}),
    k.arrow({"points": [[560, 248], [404, 248]], "label": "下一轮", "labelAt": [482, 238], "labelAnchor": "middle"}),
    k.arrow({"points": [[230, 452], [230, 496]], "label": "否", "labelAt": [242, 492], "labelAnchor": "start"}),
    k.box({"x": 60, "y": 500, "w": 340, "h": 52, "title": "最终回复交给用户", "tone": "ok"}),
  ].join(''),
});
