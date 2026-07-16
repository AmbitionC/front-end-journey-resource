Voice Agent 把实时音频、对话状态、模型推理和工具调用编排成可打断的会话。它的难点不仅是语音识别准确率，还包括轮次边界、端到端延迟、插话、噪声、工具等待和失败恢复。

## 两种架构

[OpenAI Voice Agents 指南](https://developers.openai.com/api/docs/guides/voice-agents)区分 speech-to-speech 与 chained 架构。

- **Speech-to-speech**：实时模型直接接收/生成音频，延迟低，能保留语调和自然打断；中间文本与各阶段控制较少。
- **Chained**：STT → 文本 Agent → TTS，各阶段可选择模型、记录 transcript、单独评估和替换；总延迟与错误传播更明显。

选择取决于场景：自然对话与低延迟优先实时音频；合规脚本、精确文本记录、复杂工具和可解释性可能更适合 chained。也可混合：实时前台维持会话，关键业务步骤转入结构化文本流程。

![Voice Agent 的 Speech-to-Speech 实时会话与 STT—Text Agent—TTS 串联架构对比，两者分别处理轮次检测、插话、工具调用、传输和恢复](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-voice-realtime-turn-taking-v1.webp)
*图：WebRTC 常用于浏览器实时媒体，WebSocket 常用于服务端；架构选择影响延迟、控制、转录和恢复。*

## 会话与传输

[OpenAI Realtime 指南](https://developers.openai.com/api/docs/guides/realtime)介绍实时 session、客户端与服务端连接等当前机制。浏览器通常使用 WebRTC 处理低延迟媒体，服务端常用 WebSocket 传输事件/音频。[W3C WebRTC](https://www.w3.org/TR/webrtc/)定义浏览器实时通信的连接、轨道与会话相关接口。

短期凭证在服务端签发，浏览器不持有长期 API key。session 记录用户/租户、模型与音色版本、工具集合、语言、采样/编解码设置和策略版本。断线重连要区分“传输恢复”和“开启新会话”，避免重复执行上一个工具调用。

## 轮次检测

轮次可由 VAD、语义结束判断、按键说话或显式控制。VAD 过敏会把停顿切成两轮，过迟则增加延迟；背景音乐、多人说话和语言习惯都会影响。把 `speech_started`、`speech_stopped`、transcript 和 response lifecycle 分开记录。

在关键数据上不要只依赖语音。姓名、地址、金额、日期和确认码应复述并请求确认，必要时显示文本卡片。沉默可能表示思考、掉线或麦克风权限失败，不应一律当作结束。

## Barge-in 与取消

用户开始说话时，停止或淡出正在播放的音频，取消未发送部分，并让模型知道用户听到了多少。仅停止扬声器不够：后台响应、TTS 和工具可能仍运行。取消传播到生成与可取消工具；不可取消副作用进入状态确认流程。

被打断的语句不能完整写入会话事实。例如 Agent 还没说出“订单已取消”，用户就插话，系统不能把整段未播放文本当成用户已知信息。保存 output audio 的播放游标或已确认片段。

## 工具调用期间的体验

工具调用可能远慢于自然对话节奏。先给短、真实的进度提示，不虚构完成；长操作允许用户询问、取消或切换主题。工具参数从结构化 transcript 和上下文生成，执行前校验；支付、发送和删除仍要显式确认。

工具结果回来后检查是否仍对应当前 turn/session。用户已改变意图时，迟到结果只更新账本，不直接朗读或触发下一动作。

## 延迟预算

端到端延迟拆成上传/VAD、模型首 token/首音频、工具、TTS、网络抖动和播放缓冲。只看平均值会掩盖长尾；分别监控 p50/p95/p99 和首音频时间。可通过流式音频、预测性连接和短响应降低感知延迟，但不能为了快跳过验证。

Chained 架构可并行部分安全步骤，如 STT 的稳定前缀开始意图路由；最终工具参数仍等完整且确认的转录。不要基于尚可能修正的临时 transcript 执行副作用。

## 安全、隐私和无障碍

麦克风权限明确展示，支持静音、结束和删除。原始音频、转录、声纹相关信息按敏感数据管理，设置保留期和访问审计。不要在 trace 中复制整段通话；使用受控录音引用和脱敏事件。

提供文本字幕、键盘替代和音量/语速控制。听障、口音、噪声或语音障碍不能变成不可用；模型不确定时请求重复或切到文字，而不是自信猜测。

## 测试与指标

测试不同语言/口音、噪声、回声、多人插话、长沉默、断网、麦克风切换、工具慢/失败、TTS 中断和会话重连。端到端 fixture 断言：插话真正取消后续音频；未确认金额不执行；迟到工具结果不污染新意图；重连不重复副作用。

指标包括端到端和首音频延迟、VAD 误切/漏切、barge-in 停止时间、STT 关键实体错误、工具成功、用户重复率、切文字率、人工转接和每分钟成本。质量评估结合人工听评、任务完成和安全 rubric，不能只看词错误率。

## 小结

Voice Agent 是实时状态机：选择 speech-to-speech 或 chained 架构，管理 session 与传输，显式处理轮次、插话和播放进度，把工具调用放进可取消且可验证的流程。延迟、可控性、转录、隐私和无障碍共同决定体验，不能只优化“像人说话”。

## 参考资料

- [OpenAI — Voice agents](https://developers.openai.com/api/docs/guides/voice-agents)
- [OpenAI — Realtime API](https://developers.openai.com/api/docs/guides/realtime)
- [W3C — WebRTC](https://www.w3.org/TR/webrtc/)
