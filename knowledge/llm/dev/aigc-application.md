# 如何集成大模型到前端应用

大模型（LLM）正在成为现代 Web 应用的核心能力之一。对前端开发者来说，理解如何安全、高效地将 LLM 集成进来，既是竞争力的体现，也是面试高频考点。

## 架构选型：直连 API vs 后端代理

### 直连前端（不推荐用于生产）

最简单的做法是在前端直接调用 LLM API：

```typescript
// ❌ 危险：API Key 暴露在客户端
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': 'sk-ant-xxxxxx', // 任何人打开 DevTools 都能看到
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  },
  body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 1024, messages }),
});
```

**安全风险**：API Key 一旦泄露，攻击者可无限调用，产生巨额账单。

### 后端代理（推荐）

正确的架构是通过自己的后端转发请求：

```
用户浏览器 → 你的 API Server（持有 Key）→ LLM Provider
```

好处：
- API Key 只存在于服务端环境变量
- 可以在服务端做鉴权、限流、日志审计
- 可以注入系统级 prompt，防止用户绕过

## Streaming UI：让回答"流"起来

LLM 生成文本是逐 token 输出的，流式响应能大幅降低用户感知到的等待时间。后端使用 Server-Sent Events（SSE）或 chunked transfer，前端读取 `ReadableStream`。

### React 流式聊天组件骨架

```typescript
import { useState, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function StreamingChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);
    setError(null);

    // 在 messages 中占位，后续追加流式内容
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // 解析 SSE data 行（格式依具体后端而定）
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
        for (const line of lines) {
          const text = line.slice(6); // 去掉 "data: "
          if (text === '[DONE]') continue;
          try {
            const { delta } = JSON.parse(text);
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: 'assistant',
                content: updated[updated.length - 1].content + (delta ?? ''),
              };
              return updated;
            });
          } catch {
            // 忽略非 JSON 行
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
      // 移除空的 assistant 占位
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
    }
  }, [input, messages, isStreaming]);

  return (
    <div>
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message message--${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {isStreaming && <div className="message message--assistant typing-indicator">...</div>}
      </div>
      {error && <div className="error">{error}</div>}
      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          disabled={isStreaming}
        />
        <button onClick={sendMessage} disabled={isStreaming || !input.trim()}>
          {isStreaming ? '生成中...' : '发送'}
        </button>
      </div>
    </div>
  );
}
```

**关键点**：
- 用函数式更新 `setMessages((prev) => ...)` 避免闭包陷阱
- `TextDecoder` 的 `stream: true` 选项处理跨 chunk 的多字节字符
- 先插入空占位消息，再逐步追加，避免列表跳动

## Prompt 管理

随着功能增多，prompt 会变成散落各处的魔法字符串。建议集中管理：

```typescript
// prompts/index.ts
export const PROMPTS = {
  documentQA: (context: string) => `
你是一个文档助手，只根据以下上下文回答问题，不要编造信息。
如果上下文中没有答案，请明确告知用户。

上下文：
${context}
  `.trim(),

  codeReview: (language: string) => `
你是一名资深 ${language} 工程师，请对用户提交的代码进行 code review。
重点关注：正确性、可读性、潜在 bug、性能问题。
用中文回答，代码示例使用 ${language}。
  `.trim(),
} as const;
```

这样便于版本管理、A/B 测试和跨功能复用。

## 限流与成本控制

LLM API 按 token 计费，失控的调用会产生意外账单：

| 策略 | 说明 |
|------|------|
| 前端防抖/节流 | 防止用户快速重复提交 |
| 服务端限流 | 每用户每分钟最多 N 次请求 |
| max_tokens 限制 | 控制单次响应长度上限 |
| 用量监控告警 | 设置账单阈值提醒 |
| 缓存常见问答 | 相同问题直接返回缓存结果 |

## 常见应用模式

**聊天 UI**：最基础的场景，维护 `messages` 数组，每轮带上历史上下文。注意 context window 有长度限制，超长时需要截断或摘要历史。

**文档问答（RAG）**：先将文档切片、向量化存储；用户提问时检索相关片段，拼入 prompt。前端负责展示引用来源，提升可信度。

**代码生成助手**：配合代码编辑器组件（如 Monaco Editor），将用户选中的代码片段和问题一起发给 LLM，返回结果直接插入编辑器。

## 面试常问

**Q：为什么不能在前端直接调用 LLM API？**
A：API Key 会暴露在客户端代码和网络请求中，任何用户都能提取并滥用，导致账单失控和数据泄露。

**Q：流式响应和普通响应在前端处理上有什么区别？**
A：普通响应等待 `response.json()` 即可；流式需要通过 `response.body.getReader()` 逐块读取 `ReadableStream`，实时更新 UI 状态。

**Q：如何防止用户绕过 system prompt？**
A：system prompt 只在服务端拼接，不暴露给前端；同时可以在服务端做输出过滤，拦截明显的 prompt injection 攻击。

**Q：如何处理 LLM 响应中途出错（如网络断开）？**
A：在 `finally` 中重置 `isStreaming` 状态；在 `catch` 中移除不完整的 assistant 消息或标记为错误状态，给用户提供重试入口。
