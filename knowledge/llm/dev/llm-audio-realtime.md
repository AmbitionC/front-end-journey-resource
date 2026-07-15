语音应用不是“把文本聊天换成麦克风”。文本请求通常有清晰的开始和结束；实时语音则是一条持续变化的双向会话：用户可能在模型说话时插话，网络可能抖动，浏览器可能撤销麦克风权限，工具调用又会让一次回答跨越多个状态。可靠性来自对媒体、会话和业务动作分别建模。

## 两种语音架构先分清

链式架构把语音拆成 **语音识别 → 文本模型 → 语音合成**。[OpenAI 音频指南](https://developers.openai.com/api/docs/guides/audio)也把当前语音转文字、文字转语音等接口路径分开说明。每一步都可替换、可记录和单独评测，适合客服质检、会议摘要以及必须保存文字稿的场景；代价是多次排队和网络往返会累积延迟，语气、停顿等非文字信息也可能丢失。

Realtime 架构让支持音频的模型直接维护双向会话，客户端持续发送音频并接收增量音频、文本、工具事件和状态事件。它更适合自然对话，但应用必须处理并发输入输出、打断、会话恢复和费用上限。两者不是优劣关系：需要可审计文字中间态时，链式管线常更稳；追求低延迟和自然交互时，再引入实时会话。

![实时语音会话通过服务端信任边界连接浏览器、模型与工具，并支持 VAD 和打断](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/llm-audio-realtime-session-pipeline-v1.webp)
*图：浏览器只持有短期会话能力，长期凭据和工具授权留在服务端；打断是一条显式控制路径。*

## 浏览器、传输与会话各管一层

浏览器先通过 `getUserMedia()` 获取用户授权的音频轨道。[W3C Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/) 把轨道、约束、静音和结束状态定义在媒体层；这不等于模型会话已经建立。设备切换、页面进入后台或权限撤销，都可能让轨道停止，应用必须监听并反馈真实状态。

[WebRTC 1.0](https://www.w3.org/TR/webrtc/) 负责浏览器实时媒体与数据通信，适合直接连接浏览器或移动客户端；WebSocket 更像有序的双向应用消息通道，常用于受控服务端连接。不要把二者当成同一种协议的不同写法。截至 2026-07-15，[OpenAI Realtime 指南](https://developers.openai.com/api/docs/guides/realtime)分别提供 WebRTC、WebSocket 和 SIP 路线；[Gemini Live API](https://ai.google.dev/gemini-api/docs/live-api) 也提供有状态实时会话，但事件、音频格式和生命周期并不相同。

服务端应创建或授权短期会话，浏览器不能获得长期供应商 API Key。工具调用也不应由模型直接越过业务后端：模型给出工具意图，服务端再次验证用户、参数和权限，再返回最小结果。

## 用状态机代替一堆布尔值

一个最小客户端状态可以写成：

```ts
type VoiceState =
  | "idle"
  | "requesting-permission"
  | "connecting"
  | "listening"
  | "responding"
  | "interrupting"
  | "reconnecting"
  | "closed";

type Turn = {
  id: string;
  inputStartAt: number;
  inputEndAt?: number;
  responseId?: string;
  playedUntilMs: number;
  cancelled: boolean;
};
```

每个事件都携带会话 ID、turn ID 或 response ID，重复事件按 ID 去重。UI 的“正在听”“正在回答”来自已确认的状态，而不是点击按钮后的乐观猜测。连接断开后，先判断当前接口是否支持恢复；若不支持，就创建新会话并用经过预算控制的摘要恢复业务上下文，不要盲目重放原始音频和工具动作。

## 音频帧、VAD 与背压

采集层统一采样率、声道和编码，按接口要求发送小帧。帧太大增加等待时间，太小则增加调度与协议开销。生产系统要观测采集队列、上传队列和播放队列；当上传追不上采集时，应限长、降级或停止，而不是让内存无限增长。

VAD（Voice Activity Detection）判断用户何时开始或停止说话。服务端 VAD 上手快，但阈值过敏会截断停顿，过迟又增加等待；按键说话或客户端 VAD 控制更明确，却增加交互负担。应在安静、噪声、口音、多人说话和长停顿样本上调参，并保留手动结束入口。

## 打断必须同时处理三件事

用户插话时，应用至少需要：

1. 停止本地尚未播放的音频；
2. 向会话发送取消当前响应的控制事件；
3. 记录用户实际听到的位置，避免后续历史把“未播放内容”当成已经交付。

只做第一步只是静音，模型或服务端仍可能继续生成、计费并提交状态。取消也不等于回滚已经执行的工具；支付、发信等有副作用动作需要幂等键、确认门禁和独立补偿流程。

## 延迟预算要分段测量

端到端首音延迟可以拆成：

```text
采集成帧 + 上行网络 + VAD/回合判定 + 模型首事件
+ 下行网络 + 解码缓冲 + 音频播放
```

同时记录 `input_started`、`input_committed`、`response_started`、`first_audio_received` 和 `first_audio_played`。只有一个“总耗时”无法区分是 VAD、网络、模型还是播放缓冲变慢。弱网时可降级为文字、按键说话或链式异步处理，并明确告诉用户当前模式。

## 隐私与安全边界

开始录音前说明用途并取得授权，提供清晰的录音指示和停止按钮。默认不要把原始音频写入普通日志；需要保存时，定义保留期、访问控制、区域和删除机制。语音中的指令仍是不可信输入，不能因为“来自本人声音”就跳过工具授权。也不要仅凭声音完成高风险身份认证。

## 上线检查清单

- 麦克风授权、撤销、设备切换和后台恢复都有明确 UI；
- 长期供应商凭据只在服务端，客户端使用短期会话能力；
- VAD、手动结束、打断和未播放内容的语义经过测试；
- 上传、播放和工具队列都有上限与背压；
- 连接断开、会话过期和不支持恢复时有降级路线；
- 分段监控首音延迟、打断成功率、掉线率、费用和人工转接率；
- 原始音频、文字稿与审计元数据分别制定保存和删除策略。

## 小结

实时语音应用的核心不是一个音频接口，而是三层协作：媒体层稳定采集与播放，传输层维持双向低延迟，业务会话层管理 turn、打断、工具和恢复。把状态、背压、延迟和授权显式化，才能从“会说话的 Demo”走向可控产品。

## 参考资料

- [OpenAI — Realtime API](https://developers.openai.com/api/docs/guides/realtime)
- [OpenAI — Audio and speech](https://developers.openai.com/api/docs/guides/audio)
- [W3C — WebRTC 1.0](https://www.w3.org/TR/webrtc/)
- [W3C — Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/)
- [Gemini API — Live API](https://ai.google.dev/gemini-api/docs/live-api)
