可访问性不是给现有界面补几个 ARIA 属性，而是让内容结构、名称、状态和操作方式能被浏览器转换为一致的 accessibility tree。优先使用原生 HTML，再补充必要 ARIA，并通过键盘、屏幕阅读器和自动化共同验证。

![语义化 HTML 经 DOM 与 Accessibility API 形成地标、标题、名称、焦点和动态通知树](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/web-semantic-accessibility-tree-v1.webp)
*图：视觉布局不等于可访问性树；正确元素、可访问名称和状态决定辅助技术获得的交互模型。*

## 原生语义优先

`button` 天然可聚焦，支持 Enter/Space 激活并向辅助技术暴露按钮角色；`div onClick` 没有这些能力。[WAI-ARIA Authoring Practices 的 Read Me First](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)强调，没有 ARIA 胜过错误 ARIA，并优先使用具有所需语义和行为的原生元素。

页面用 `header`、`nav`、`main`、`aside`、`footer` 提供 landmarks；标题按内容层级组织，不因字号跳级；列表、表格、表单用对应元素。CSS 可改变外观，无需为了视觉效果牺牲语义。

## 可访问名称与描述

控件必须有可访问名称。文本按钮直接来自内容；图标按钮使用可见文本或 `aria-label`；输入用 `<label for>` 关联。placeholder 会消失且不是 label。错误和帮助文本用 `aria-describedby` 关联，名称与描述职责不同。

图片按目的写 alt：传达信息就描述其功能/结论，纯装饰用 `alt=""`，复杂图在正文提供等价解释。不要写“图片：”重复角色，也不要把整段信息塞进超长 alt。

## 键盘与焦点

所有交互必须可通过键盘到达和操作，焦点顺序应跟 DOM 与阅读顺序一致。不要用正 `tabindex` 人工重排；`tabindex="0"` 加入自然顺序，`-1` 允许程序聚焦但不参与 Tab。

焦点样式必须可见。打开 modal 后把焦点移入，限制在对话框内，关闭后回到触发器；Escape 行为与背景 inert 状态按模式实现。路由切换或删除当前项后也要给焦点合理落点，不能掉到 body。

## 动态内容与 Live Region

状态消息如“已保存”可用 `role="status"`/polite live region，紧急错误才用 alert/assertive。先让 live region 存在，再更新文本；不要每个流式 token 都播报，否则屏幕阅读器被淹没。流式回答可按句或完成时提供摘要通知，并允许用户暂停。

加载按钮同时设置 disabled/`aria-disabled` 的正确语义与 `aria-busy`，可见文本说明状态。仅用颜色或旋转图标表达成功失败不够。

## WCAG 2.2 的检查视角

[WCAG 2.2](https://www.w3.org/TR/WCAG22/)按 Perceivable、Operable、Understandable、Robust 组织成功准则。实践中检查文本替代、颜色对比、缩放与 reflow、键盘、焦点不被遮挡、目标尺寸、错误识别和名称/角色/值。

合规等级不是“用户体验已经完美”的保证。真实任务、语言和辅助技术组合仍需用户测试。反过来，也不要因为无法一次做到全部，就跳过最基础的键盘和名称错误。

## ARIA 状态与组件模式

自定义 tabs、combobox、menu 和 tree 要同时实现 role、state、键盘模型和焦点管理。[WAI ARIA 规范与指南入口](https://www.w3.org/WAI/standards-guidelines/aria/)提供语义基础；APG 模式是实现参考，不是复制属性就完成。

例如展开按钮用 `aria-expanded` 和 `aria-controls`；选项状态用 `aria-selected`，不是随意添加 `aria-pressed`。状态变化必须与视觉和实际交互同步。组件卸载时清理引用 ID，避免名称链断裂。

## 测试金字塔

静态 lint 捕获缺 label、无效 ARIA；组件测试查询 role/name 并验证状态；浏览器自动扫描发现部分 WCAG 问题；键盘手测验证顺序、焦点和陷阱；至少用 VoiceOver/NVDA 等屏幕阅读器完成关键路径。

自动工具无法判断 alt 是否表达图片意义、焦点落点是否合理或播报是否烦扰。测试不要只按 CSS selector 点击，而要像用户一样 `getByRole('button', {name: ...})`，这也推动组件暴露正确语义。

## 发布清单

关闭鼠标完成登录、导航、表单错误和 modal；放大到 200%/400% 检查重排；开启高对比/减少动画；检查空、加载、错误和流式状态；确认触摸目标和横竖屏。记录已知问题、owner 与修复期限。

语义化和可访问性最终是在建立一个稳定的交互 API：视觉用户通过像素使用它，辅助技术通过 accessibility tree 使用它，两者应表达同一内容、状态和动作。

## 参考资料

- [WAI-ARIA APG：Read Me First](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)
- [W3C：WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [W3C WAI：ARIA](https://www.w3.org/WAI/standards-guidelines/aria/)
