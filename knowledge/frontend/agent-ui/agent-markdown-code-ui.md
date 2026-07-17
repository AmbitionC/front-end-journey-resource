模型输出必须视为不可信输入。Markdown、代码高亮和图表渲染会把文本送入不同解析器与 DOM 上下文，任何一个允许任意 HTML、URL 或脚本，都可能把“回答内容”升级为页面权限。安全管线应是 parse → policy → sanitize → render，并让代码保持 inert。

![Agent Markdown、代码与图表从解析、白名单策略、消毒、隔离到安全 DOM 的渲染管线](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-markdown-code-ui-safe-render-pipeline-v1.webp)
*图：Markdown、语法高亮和 Mermaid 是独立信任边界；链接、图片和 HTML 都经过目标上下文策略。*

## 解析不是字符串替换

[CommonMark Specification](https://spec.commonmark.org/current/)定义 block/inline、转义、链接和 fenced code。使用成熟 parser 生成 AST，不用正则把 `**`、反引号和 HTML 替换成标签。流式状态下保留未完成 fence，避免一半代码突然被解释为 HTML。

AST 让策略可按节点类型执行：允许 paragraph、list、table、code；拒绝 raw HTML；限制 heading level；给链接和图片单独处理。渲染 key 来自稳定 node/part ID，不能每次 delta 重建整棵树导致选择和滚动丢失。

## XSS 需要上下文防御

[OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)强调输出编码必须匹配 HTML、attribute、URL、JavaScript 等目标上下文，并在允许 HTML 时使用可靠 sanitizer。过滤 `<script>` 字符串远远不够，事件属性、危险 URL、SVG 和解析差异都可能执行。

最佳边界是不让模型 HTML 进入 `innerHTML`。若产品确需子集 HTML，在最后写 DOM 前用持续维护的 sanitizer 白名单，并启用 CSP/Trusted Types 作为纵深防御。禁止 `javascript:`、`data:text/html` 等协议，外链增加 `rel="noopener noreferrer"`，必要时经过 redirect warning。

## 代码块必须保持文本

fenced code 的内容不应再作为 Markdown/HTML 解析。语法高亮器输出若是 HTML，同样需要可信库与消毒，或把 token 映射成 React text nodes。language 标签只在允许列表中查 grammar，不能动态加载任意 URL。

复制按钮复制原始代码，而不是 DOM text 被行号和折叠符污染的内容。显示语言、换行、横向滚动和“展开”，大代码块延迟高亮并限制长度，防止单条输出阻塞主线程。

“运行代码”绝不能在页面 origin 直接 eval。使用独立 sandbox/worker/远端环境，明确权限、网络、文件和资源限制，并先让用户审批。渲染与执行是两个完全不同的能力。

## Mermaid 与图表边界

[Mermaid securityLevel](https://mermaid.js.org/config/usage.html#securitylevel)提供不同安全模式。对不可信图表使用严格模式，禁用 HTML label、click callback 和任意链接；最好在 worker 或隔离 iframe 渲染 SVG，再按 SVG 白名单消毒。

限制节点数、文本长度、布局时间和输出尺寸，防止复杂图造成 CPU/内存 DoS。渲染失败显示原始 fenced text 和可复制错误，不让整条消息崩溃。图表还需文字说明，不能把关键信息只放在视觉关系中。

## 图片、附件与 URL

远程图片会泄露用户 IP、referer 和查看时机，也可能成为追踪像素。可默认点击加载、通过受控代理取回，限制协议、MIME、大小、重定向和私网地址，防止 SSRF。上传附件使用平台 artifactId，不直接信任模型拼出的内部 URL。

链接显示来源域名，文本与 href 分离；模型写“官方文档”并不代表目标可信。URL 解析使用标准 API，比较规范化 host，而非字符串前缀。

## 流式渲染性能

把已完成 block 固化，只重解析最后未完成 block。批量应用 delta，代码高亮和图表在 fence 完成后异步执行。对长消息虚拟化时保留 anchor，渲染失败使用 error boundary 局部降级。

DOMPurify 等 sanitizer 配置和 Markdown 插件视为安全依赖，锁定版本并订阅公告。插件能扩展语法也扩大攻击面，每个扩展都需说明 AST、输出节点和 URL 行为。

## 测试攻击面

fixture 覆盖 raw HTML、事件属性、大小写/编码协议、嵌套链接、SVG、畸形 fence、超长行、Mermaid click、私网图片 URL 和 bidi 控制字符。断言最终 DOM 无脚本能力，而不是只检查输入被改变。

同时测试键盘复制、代码横向滚动、图表替代说明、缩放和高对比。安全渲染的合格标准是：模型可以展示代码和图表，但无论输出什么文本，都拿不到应用脚本、会话凭据或任意网络能力。

## 参考资料

- [CommonMark Specification](https://spec.commonmark.org/current/)
- [OWASP：Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Mermaid：securityLevel](https://mermaid.js.org/config/usage.html#securitylevel)
