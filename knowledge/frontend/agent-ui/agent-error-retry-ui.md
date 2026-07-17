Agent 请求可能跨模型、检索、工具和外部系统，失败不再是一个“网络错误”。界面要先区分用户能否修复、重试是否安全、部分工作是否保留、外部副作用是否未知，再提供 Retry、修改输入、重新授权、降级或联系支持。错误文案与恢复动作必须来自同一机器可读类型。

![Agent 错误恢复决策树按暂时故障、输入错误、授权过期、策略拒绝与副作用未知选择动作](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-error-retry-ui-recovery-decision-v1.webp)
*图：只有可安全重放的暂时错误直接重试；已产生部分内容或未知副作用时先对账并保留用户工作。*

## 建立错误分类

Transport 包括断网、超时和 5xx；validation 表示输入或工具参数无效；auth 表示登录或授权过期；policy 表示能力/内容被拒绝；capacity 表示限流与配额；dependency 表示检索/工具不可用；unknown effect 表示外部动作可能已提交但响应丢失。

[RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457.html)定义 type、status、title、detail、instance 等机器可读字段。API 可扩展 code、retryable、retryAfter、operationId 和 fieldErrors，但 detail 不暴露堆栈、SQL 或秘密。前端按稳定 type/code 决定组件，不解析英文字符串。

## Retry safety 不是 HTTP 方法标签

模型生成通常可重新开始，但结果不同；检索可重复；发送邮件、创建工单或付款即使使用 POST，也可能通过 idempotency key 安全查询。错误对象应由拥有副作用知识的服务端声明 retry strategy。

若请求在提交前失败，可重试；若已确认未执行，可重试；若结果 unknown，先按 operationId 查询。绝不能把“没有收到 200”自动解释为“没有发生”。Retry 按钮复用 idempotency key，并显示正在查询还是新建 run。

## 保留部分工作

流式回答中途断开时保留已确认内容，标记 incomplete，提供“从断点继续”或“重新生成”。继续创建 child run，引用已提交部分；重试原 run 只用于协议支持事件补发的情况。用户输入、附件和审批决定不因错误丢失。

工具链某一步失败时展示完成步骤、失败步骤和未执行步骤。允许针对安全步骤 retry，不把整个计划从头运行导致重复效果。最终 message 仍保留 error annotation，避免残缺内容看似完整。

## 退避、限流和自动恢复

网络瞬断可自动有限重连，指数退避加抖动，遵守 `Retry-After`。UI 显示下一次尝试和停止控制；页面后台时降低频率。达到总 deadline 后转人工动作，不无限 spinner。

429 区分账户配额、并发限制和服务拥塞：前者提示升级/等待配额，后者可按时间重试。多个 tab 共用限流状态，避免同时风暴。自动重试只用于用户无须改变输入且无副作用风险的错误。

## 文案帮助形成正确心智模型

[PAIR Mental Models](https://pair.withgoogle.com/guidebook-v2/chapter/mental-models/)强调解释能力与失败边界。错误文案包含发生了什么、哪些内容已保存、用户现在能做什么。例如：“回答生成到第 3 段时连接中断，已保存内容。继续会创建一次新运行。”

不要写“发生未知错误，请重试”作为所有情况；也不要承诺“不会扣款”如果状态未知。策略拒绝说明可修改的范围，但不泄露可被绕过的检测细节。支持入口携带 error instance/runId，不要求用户复制整段堆栈。

## 降级与恢复路径

检索不可用时可询问用户是否接受“仅基于当前上下文回答”，并明显标记无来源；高质量模型限流可切到较小模型，但说明能力变化。工具不可用可生成草稿，不假装已执行。

降级是用户可理解的产品模式，记录实际 model/tool/retrieval bundle。系统恢复后不自动把已降级结果替换，除非用户要求重新运行。

## 可访问性

错误摘要与相关输入用 `aria-describedby` 关联，提交失败后聚焦错误 summary 或首个字段，而不是让屏幕阅读器无提示。后台重连使用 polite status，不反复播报倒计时。Retry、Edit request、Re-authorize 等按钮名称具体。

颜色、图标和文案共同表达状态；保留错误直到用户处理，不用几秒 toast 消失。移动端确保操作不被键盘遮挡。

## 测试与指标

测试离线、chunk 中断、429、auth 刷新失败、invalid tool args、policy refusal、外部成功但响应丢失、重复点击和降级。断言无重复副作用、草稿不丢、焦点正确、错误类型映射稳定。

监控按 error type 的发生率、自动恢复率、用户 retry 成功率、unknown-effect 对账时间、放弃率和降级结果质量。真正好的错误体验不是把失败藏起来，而是最大限度保存已完成工作，并只提供安全、可解释的下一步。

## 参考资料

- [RFC 9457：Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)
- [People + AI Guidebook：Mental Models](https://pair.withgoogle.com/guidebook-v2/chapter/mental-models/)
