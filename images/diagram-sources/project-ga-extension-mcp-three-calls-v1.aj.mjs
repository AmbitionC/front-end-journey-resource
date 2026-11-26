export const meta = {
  name: "project-ga-extension-mcp-three-calls-v1",
  article: "project/general-agent/ga-extension.md",
  alt: "Agent 作为 MCP 客户端和 MCP 服务之间的三次往返：先初始化并交换协议版本和能力，服务返回服务信息；再列出工具，服务返回每个工具的名称、用途和参数格式，Agent 把这些工具登记进工具注册表；之后调用工具时发送名称和参数，服务返回结果",
};

export default (k) => k.figure({
  h: 500,
  title: "接一个 MCP 服务只需要三个动作",
  subtitle: "初始化、列出工具、调用工具",
  body: [
    k.panel({"x": 40, "y": 120, "w": 250, "h": 350, "label": "Agent（MCP 客户端）"}),
    k.panel({"x": 670, "y": 120, "w": 250, "h": 350, "label": "MCP 服务"}),
    k.arrow({"points": [[290, 186], [666, 186]], "label": "初始化，交换协议版本和能力", "labelAt": [480, 176], "labelAnchor": "middle"}),
    k.arrow({"points": [[670, 224], [294, 224]], "label": "服务信息", "labelAt": [480, 214], "labelAnchor": "middle", "dashed": true}),
    k.arrow({"points": [[290, 286], [666, 286]], "label": "列出工具", "labelAt": [480, 276], "labelAnchor": "middle"}),
    k.arrow({"points": [[670, 324], [294, 324]], "label": "每个工具的名称、用途、参数格式", "labelAt": [480, 314], "labelAnchor": "middle", "dashed": true}),
    k.arrow({"points": [[290, 406], [666, 406]], "label": "调用工具（名称、参数）", "labelAt": [480, 396], "labelAnchor": "middle"}),
    k.arrow({"points": [[670, 444], [294, 444]], "label": "结果", "labelAt": [480, 434], "labelAnchor": "middle", "dashed": true}),
    k.box({"x": 56, "y": 340, "w": 218, "h": 44, "title": "登记进工具注册表", "tone": "accent", "titleSize": "body"}),
  ].join(''),
});
