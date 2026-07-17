Agent UI 把聊天日志、流式更新、代码、工具审批和长任务状态集中在一个页面，普通静态扫描无法覆盖。测试策略要横跨键盘、屏幕阅读器、缩放、减少动画、移动端、慢网和错误恢复，并把每个动态状态当成可重复的场景。

![Agent UI 在键盘、屏幕阅读器、缩放、移动端、减少动画与慢失败网络上的测试矩阵](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-ui-accessibility-testing-multimodal-matrix-v1.webp)
*图：组件、集成和人工辅助技术测试覆盖互补风险；自动扫描只能发现其中一部分。*

## 先列关键任务与状态

关键任务包括创建会话、发送/取消、阅读长回答、打开引用、审批工具、恢复错误、上传附件和切换历史。每项再覆盖 idle、loading、streaming、awaiting approval、failed、offline 与 completed。

用状态矩阵驱动 fixture，避免只测 happy path。后端提供可控 event script，按指定顺序产生 delta、工具请求、gap 和失败；测试不依赖真实模型随机输出。

## Chat log 与动态内容

[W3C ARIA23](https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA23)说明 `role="log"` 可用于按顺序追加的信息。测试日志有名称，新消息可被礼貌宣布，焦点不被移动；流式 token 不逐字播报，完成或段落更新有适度状态。

长内容若采用 [ARIA feed pattern](https://www.w3.org/WAI/ARIA/apg/patterns/feed/)，需实现 article、`aria-posinset`/`aria-setsize`、busy 和焦点加载行为。只有确实需要 feed 键盘模型时才使用；普通聊天 log + 标题结构往往更简单。虚拟化不能让当前聚焦 article 从 DOM 消失。

## 键盘脚本

仅用键盘完成所有任务：Tab 顺序符合阅读，焦点样式清晰；输入发送/换行不冲突；Stop/Retry 可达；引用侧栏和 approval modal 打开后焦点正确、关闭后返回；Escape 不误取消真实工具执行。

消息操作不应让每个气泡出现大量永久 Tab stop。可使用消息容器进入后箭头/菜单访问，但必须遵循已知模式并有说明。测试删除当前会话、加载更多和路由切换后的焦点落点。

## 屏幕阅读器场景

至少在 macOS Safari + VoiceOver 和 Windows Chrome/Firefox + NVDA 中跑关键路径。检查控件 name/role/state、消息作者、代码语言、引用标记、审批风险、进度与错误。不能只看 accessibility tree snapshot，因为播报时序和虚拟光标行为需要真实 AT。

记录预期播报的意义，不锁死每个标点文本，以免测试脆弱。例如断言用户能知道“正在生成”和“生成完成”，而非要求某实现读出完全相同句子。

## 视觉、缩放与运动

在 200% 浏览器缩放和 320 CSS px 宽度检查 reflow，无水平滚动（代码区域可局部滚动）、输入与按钮不重叠。400% 检查关键内容可用。高对比/forced colors 下焦点、边框和状态仍可区分，不只依赖背景色。

尊重 `prefers-reduced-motion`：关闭打字光标闪烁、自动平滑滚动和装饰动画，保留必要状态。测试动画暂停、内容不因 streaming 频繁位移，用户上滚后不被拉回底部。

## 移动与触摸

覆盖窄屏、横屏、虚拟键盘、safe-area、文字放大和触摸目标。输入框增长时发送按钮仍可达，bottom sheet 焦点不跑到背景，附件选择失败可恢复。屏幕旋转不丢草稿或 run 状态。

真实设备验证 VoiceOver/TalkBack 的 swipe 顺序与键盘组合，因为桌面 responsive 模式不能模拟全部辅助技术和 viewport 行为。

## 网络与性能条件

模拟高延迟、低带宽、离线、SSE 断线、事件重复/缺口和 chunk load failure。UI 保留已完成内容，状态不会永久 busy，Retry 语义安全。CPU throttling 下流式 Markdown 不应阻塞输入和 Stop。

性能也是可访问性：主线程长任务会让开关控制和屏幕阅读器延迟。测 INP/长任务、单次 reducer 成本、超长代码和会话虚拟化。

## 自动化分层

lint 捕获无效 ARIA；组件测试用 role/name 查询并验证状态；axe 等扫描集成到浏览器测试；视觉回归覆盖缩放/forced colors；E2E 执行关键键盘流程。[W3C Test & Evaluate](https://www.w3.org/WAI/test-evaluate/)强调多种评估方式，自动工具只能发现一部分问题。

CI 失败附 DOM、accessibility snapshot、event script、截图/视频和浏览器版本。对 flaky test 修复时序根因，不永久重试。人工测试有固定 checklist、设备矩阵、日期和 owner。

## 发布门禁

阻断级问题包括键盘陷阱、关键控件无名称、审批无法读取、焦点丢失导致任务无法继续、缩放后操作不可达。次要问题也进入有期限 backlog。每次消息模型、stream renderer 或组件库升级重跑回归。

测试的最终标准是不同用户在不同输入方式和网络条件下都能完成同一关键任务、理解当前状态，并在失败后恢复，而不只是页面通过一个扫描器。

## 参考资料

- [W3C：Using role=log](https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA23)
- [WAI-ARIA APG：Feed Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/feed/)
- [W3C WAI：Test & Evaluate](https://www.w3.org/WAI/test-evaluate/)
