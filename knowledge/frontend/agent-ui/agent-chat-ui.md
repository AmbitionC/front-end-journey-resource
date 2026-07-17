Agent Chat UI 不是把字符串按时间堆成气泡。它要同时表达会话、用户 turn、一次模型 run、消息内容片段和工具活动，并在乐观提交、流式更新、重连、分支与持久化之间保持同一身份。数据模型先正确，视觉层才能稳定。

![Agent Chat UI 中 Conversation、Turn、Message、Content Part 与 Run 状态的关系](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-chat-ui-message-state-model-v1.webp)
*图：用户 turn 可触发一个或多个 run；message 与 run 分离，内容按 part 结构化，服务端序号负责最终排序。*

## 分离 Conversation、Turn 与 Run

Conversation 是长期容器，保存 title、owner、branch head 和最近活动；Turn 表示一次用户意图及其响应范围；Run 是一次有开始和终态的执行，可以失败、取消或继续。用户点“重新生成”应创建 sibling run，而不是覆盖原消息。

Message 保存 author、createdAt、status 和 content parts。文本、代码、引用、工具请求、附件分别建模，避免日后从 Markdown 反向解析。每个实体使用服务端稳定 ID；客户端提交时带 clientRequestId，重连后对账，防止重复气泡。

## 状态与顺序

客户端先插入 optimistic user message，状态 `sending`；服务端确认后用 canonical ID/sequence 合并。网络失败保留输入并显示 `failed`，重试复用同一 clientRequestId。不能按本地时间排序，因为设备时钟和并发 tab 会漂移。

run 状态可为 queued、running、awaiting_approval、cancelling、completed、failed、cancelled。message 的展示状态不要等同 run 状态：一个 run 可能已产生完整文本，却因后置工具失败；UI 要分别显示已获得内容和后续错误。

```ts
type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'citation'; citationId: string }
  | { type: 'tool'; callId: string; state: string }
  | { type: 'attachment'; artifactId: string };
```

## 会话列表与分页

列表按 server `updatedAt` + id 游标分页，不能用 offset 在新增会话时翻页。标题生成是派生操作，失败不影响会话；用户手改标题后标记 manual，后台不再覆盖。删除可先软删并给撤销窗口，高风险数据说明实际保留策略。

列表显示同步、离线和未发送草稿状态。多端同时编辑时，服务端以版本号检测冲突，不用 last-write-wins 覆盖用户消息。分支会话显示来源 turn，便于理解上下文为什么不同。

## 心智模型与不确定性

[People + AI Guidebook 的 mental models](https://pair.withgoogle.com/guidebook-v2/chapter/mental-models/)强调帮助用户理解系统能力、失败和反馈。界面不应暗示模型“正在查到事实”如果实际上只在生成；工具、检索与模型文本使用不同状态和来源标识。

“思考中”表达等待，不展示伪造的内心活动。对不确定结果提供检查来源、修改输入和反馈路径。重新生成说明会得到新的候选，而不是承诺修复事实。

## 滚动、输入与焦点

只有用户原本接近底部时才自动跟随新内容；用户向上阅读后显示“有新内容”按钮，不能抢回滚动。输入框保留草稿，Enter/Shift+Enter 行为可配置且有提示；发送后焦点仍在输入，错误不清空内容。

移动端考虑虚拟键盘、安全区和附件选择。长会话虚拟化时要保持 message 高度变化、锚点和搜索定位，不能让流式更新造成页面跳跃。

## 可访问的消息日志

[W3C ARIA23](https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA23)说明 `role="log"` 可表达按顺序追加的更新并礼貌播报。日志本身有可访问名称，新消息追加不移动用户焦点。流式 token 不逐个播报，可在段落或完成时更新状态摘要。

每条消息标明作者和时间，工具按钮有明确名称。复制、重试和反馈操作可键盘到达，但不要让每个气泡产生十几个 Tab 停靠点；次要操作可在消息聚焦后出现并保持可发现。

## 持久化与离线

服务端是已确认历史权威，客户端缓存用于快速启动。缓存按 user/tenant 隔离并加版本，退出账号清理。离线允许编辑草稿；是否允许排队发送要明确，因为恢复联网时上下文和权限可能已改变。

加载历史按游标向前，合并以 ID 去重。消息编辑、撤回和分支保留 lineage，不原地改掉审计事实。附件上传与消息发送是两个状态机，失败可分别恢复。

## 测试

覆盖双击发送、确认响应丢失、服务端乱序、重连补事件、重新生成分支、多 tab、历史分页时新消息、长文本高度变化、删除撤销和账号切换。用键盘与屏幕阅读器验证日志播报、焦点和新消息按钮。

可靠 Chat UI 的核心是身份与状态可对账：任何气泡都能追到 message/run，任何重试都不会复制事实，任何重连都能从服务端序号恢复一致视图。

## 参考资料

- [W3C：Using role=log to identify sequential information updates](https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA23)
- [People + AI Guidebook：Mental Models](https://pair.withgoogle.com/guidebook-v2/chapter/mental-models/)
