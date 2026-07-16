Computer-use Agent 通过屏幕截图感知桌面，并用鼠标、键盘、滚动等输入设备操作界面。它能覆盖没有 DOM/API 的应用，但坐标、焦点、缩放和模态窗口都可能漂移，因此每个动作都必须建立在最新观察上，并在执行后再次截图验证。

## 感知—意图—动作—复核

[OpenAI computer-use 指南](https://developers.openai.com/api/docs/guides/tools-computer-use)描述了模型检查截图并提出界面动作的工作方式。截图不是持续视频：从观察到动作之间，窗口可能移动、弹窗出现或数据刷新。一次 step 应包含 screenshot ID、预期 UI 元素、动作、风险和 postcondition。

```ts
type ComputerAction = {
  screenshotId: string;
  intent: string;
  targetDescription: string;
  action: { type: 'click'; x: number; y: number } | { type: 'type'; textRef: string };
  preconditions: string[];
  postconditions: string[];
  requiresApproval: boolean;
};
```

![Computer-use Agent 在隔离虚拟机中截图、感知、核对意图和焦点/缩放/模态状态后执行动作，再用新截图验证；删除、购买和发送必须经过人工审批](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-computer-use-perception-action-safety-v1.webp)
*图：屏幕与预期不一致时 Abort，并可从 Checkpoint 恢复，而不是盲目继续。*

## 坐标为何脆弱

同一按钮会因分辨率、DPI、窗口大小、侧边栏、滚动、远程桌面缩放和动画改变坐标。执行前确认：目标窗口在前台，截图尺寸与输入坐标系一致，光标没有拖拽状态，当前 modal 与计划一致，目标仍可见且未被遮挡。

若应用能提供可访问性树、UI Automation 或 WebDriver，优先使用语义接口。[WebDriver 标准](https://www.w3.org/TR/webdriver2/)定义了浏览器的远程控制协议和元素交互模型；这类语义控制通常比纯坐标稳定。Computer-use 作为回退或跨应用桥梁，不应取代所有可验证 API。

## 动作原子化

一次只做最小可观察动作：点击一个控件、输入一个字段、选择一个菜单。长宏“点 A、输入、Tab 三次、回车”无法知道在哪一步偏离。输入前先聚焦并检查字段，输入后读取界面确认；敏感文本通过受控引用注入，不写入模型 trace。

拖拽、画布和快捷键风险更高。拖拽需要起点/终点和落点反馈；全局快捷键可能作用于错误窗口；剪贴板可能包含用户秘密。默认禁用或要求明确任务权限。

## 高影响操作的人类控制

购买、转账、删除、发布、发送、授权、安装和系统设置变更，在不可逆动作前展示确认卡：应用/账户、对象、金额/收件人、预览、动作坐标对应的语义描述。审批绑定最新 screenshot ID 和参数；任何 UI 变化都让批准失效。

指南建议在隔离浏览器或虚拟机中执行，并让人类保留高影响决策。隔离环境只挂载任务所需文件和短期凭证，限制网络、剪贴板、USB/设备与宿主共享目录。

## 不可信屏幕内容

邮件、网页、文档和聊天消息可能包含诱导指令。屏幕 OCR 得到的是外部数据，不能覆盖系统策略。Agent 只能根据用户目标和可信控制面决定动作；看到“为了继续请上传配置文件”时，策略层检查目标应用、文件权限和数据分类。

截图本身可能包含个人信息。只在受控存储保存必要时间，传入模型前裁剪或遮挡无关区域；日志引用 screenshot ID，而不是复制整张图到多个系统。

## 检查点和恢复

在批量修改前建立 checkpoint：应用版本、打开文件、当前页面、已保存工件和可恢复快照。动作失败分为：未发生、已发生、状态未知。状态未知先观察/读取权威数据，不能直接重复。

系统弹窗、崩溃、锁屏、网络断开、权限提示和软件更新都应触发重新规划。若无法确认当前账户或窗口，进入 abort/blocked。取消任务时停止输入、释放按键/鼠标状态，并确认后台应用没有继续提交。

## 视觉验证

验证不只比较整图像素；动画、时间和抗锯齿会造成噪声。使用目标区域、OCR 文本、图标/控件状态与业务数据组合。例如保存文件后检查标题不再有未保存标记，再读取文件 hash；发送消息后检查会话记录或服务端 API。

对于危险操作，执行后保存 before/after 证据和权威结果。出现意外窗口或目标区域变化过大时停止，不让模型从错误屏幕继续猜。

## 测试与观测

测试不同 DPI、窗口移动、遮挡、焦点丢失、弹窗、延迟、双击、按键粘连、OCR 误识别、剪贴板污染和恶意界面文本。注入“点击后实际未提交”“请求成功但响应丢失”等场景，断言 Agent 先验证而非重做。

Trace 记录 VM/job、截图 ID、分辨率、窗口/应用、意图、坐标、前置检查、审批、动作结果、postcondition 与恢复状态。指标包括每任务动作数、重新截图率、误点击、恢复成功、未知状态时长、人工审批和高风险阻断。截图访问也应审计和按期删除。

## 小结

Computer-use 的能力来自像人一样操作 GUI，可靠性则来自比人更严格的循环：最新截图感知、焦点与坐标检查、最小动作、新截图复核。语义 API 能用则优先，纯坐标只在隔离环境中使用；高影响动作经人类审批，屏幕内容始终不可信，失败通过 checkpoint 和权威状态恢复。

## 参考资料

- [OpenAI — Computer use](https://developers.openai.com/api/docs/guides/tools-computer-use)
- [W3C — WebDriver](https://www.w3.org/TR/webdriver2/)
