公司为拼多多，方向为服务器开发，轮次为一面。原文标题给出 10 月 23 日，未单独说明面试年份；记录发布时间为 2026 年 10 月 29 日。以下短答与例子为编辑教学整理，不代表作者实际部署、现场回答或实测数据；缺代码和题面之处保持待补。

<details data-knowledge-key="agent-deployment"><summary>（1）Agent 运行在浏览器中，还是部署在后端服务器上，应怎样说明？</summary>
</details>
<p>先把界面、模型调用、持久状态和工具执行分开描述，再依据数据位置、权限、算力和断网需求决定放置，不能把“有聊天页面”等同于 Agent 在浏览器执行。教学例子是浏览器呈现流、服务端持有受控凭据并执行任务；原文未给出该项目的实际拓扑。 <a href="../../../knowledge/llm/production/agent-deployment.md">知识详解</a></p>

<details data-knowledge-key="agent-api-gateway"><summary>（2）Java 后端怎样对接内部大模型网关？</summary>
</details>
<p>把网关当成有版本的接口合同，逐项核对认证、请求结构、能力、错误、超时、流事件和取消，再用适配层对业务暴露稳定语义。比如网关首部返回成功后仍可能流内失败，应将请求 ID、实际后端和终态关联；原文未披露实际接口和 SDK。 <a href="../../../knowledge/llm/production/agent-api-gateway.md">知识详解</a></p>

<details data-knowledge-key="agent-api-gateway"><summary>（3）Java 后端与模型网关之间采用什么通信协议？</summary>
</details>
<p>协议属于项目事实，原文未给出答案；应区分应用协议、序列化、流式表示与底层传输，而非只回答“用 JSON”。教学例子可以是 HTTPS 接口承载 JSON 请求、用 SSE 返回增量，但是否如此必须由真实配置和请求证据确认。 <a href="../../../knowledge/llm/production/agent-api-gateway.md">知识详解</a></p>

<details data-knowledge-key="llm-sse-streaming"><summary>（4）模型逐步生成结果时，采用什么协议接收流式返回？</summary>
</details>
<p>应先核对实际 API；常见单向推送方案是 HTTP 上的 SSE，双向实时交互可另评估 WebSocket，不能把“逐字生成”当作协议名。比如 Java 服务解析上游事件后转成稳定业务事件给客户端，同时传播取消和总超时；原文没有确认实际选型。 <a href="../../../knowledge/llm/dev/llm-sse-streaming.md">知识详解</a> · <a href="https://html.spec.whatwg.org/multipage/server-sent-events.html">规范核对</a></p>

<details data-knowledge-key="llm-sse-streaming"><summary>（5）模型接口返回数据的 Content-Type 应怎样确认？</summary>
</details>
<p>读取真实响应首部并结合成功、失败和流式路径核对；SSE 的媒体类型是 text/event-stream，普通 JSON 响应常使用 application/json，不能从请求体格式倒推响应。比如 API 已返回 SSE 首部后，上游错误需要通过约定事件或连接终态表达，而非假定还能改成另一份普通 JSON 错误。 <a href="../../../knowledge/llm/dev/llm-sse-streaming.md">知识详解</a> · <a href="https://html.spec.whatwg.org/multipage/server-sent-events.html">规范核对</a></p>

<details data-knowledge-key="llm-sse-streaming"><summary>（6）为什么选择 SSE 传输模型增量结果？</summary>
</details>
<p>SSE 适合客户端发起请求后由服务端单向持续推送，并提供明确的文本事件格式；是否适合还取决于代理缓冲、连接管理和恢复需求。比如需要 POST 请求体及自定义鉴权头时，可用 fetch 读取流并实现事件解析，不能把原生 EventSource 与任意 POST 客户端混为一谈。 <a href="../../../knowledge/llm/dev/llm-sse-streaming.md">知识详解</a> · <a href="https://html.spec.whatwg.org/multipage/server-sent-events.html">规范核对</a></p>

<details data-knowledge-key="jwt-auth"><summary>（7）所谓动态 Token 具体动态在哪些方面？</summary>
</details>
<p>先澄清它是随机会话凭据还是签名令牌，以及动态指有效期、轮换、授权范围还是其他机制；本题的 Token 是鉴权语境，不是模型计费 Token。教学上，短期访问令牌与受控刷新可减少长期凭据暴露，但令牌更新不自动等于即时撤权；原文未给具体格式。 <a href="../../../knowledge/backend/auth/jwt-auth.md">知识详解</a> · <a href="https://www.rfc-editor.org/rfc/rfc8725.html#section-3">规范核对</a></p>

<details data-knowledge-key="jwt-auth"><summary>（8）动态 Token 根据哪些信息生成？</summary>
</details>
<p>令牌必须由受信认证或授权流程签发，主体、用途、受众、范围和有效期来自服务端可信状态，不能接受模型或客户端任意填写身份。若采用签名 JWT，可把最小必要声明编码并签名，例如绑定某资源受众；编码不等于加密，实际字段与算法原文均未给出。 <a href="../../../knowledge/backend/auth/jwt-auth.md">知识详解</a> · <a href="https://www.rfc-editor.org/rfc/rfc8725.html#section-3">规范核对</a></p>

<details data-knowledge-key="agent-identity-auth"><summary>（9）Token 鉴权逻辑放在 Spring Boot 服务还是其他服务器，应怎样设计？</summary>
</details>
<p>实际部署位置原文未说明；架构上要区分签发身份凭据的服务、入口验证点，以及拥有资源的最终授权点。比如网关验证访问令牌后，下游仍核对主体、受众和资源范围，不能仅信任一个客户端也能伪造的 userId 请求头。 <a href="../../../knowledge/llm/production/agent-identity-auth.md">知识详解</a></p>

<details data-knowledge-key="jwt-auth"><summary>（10）单实例服务扩展为多实例后，怎样避免鉴权状态不一致？</summary>
</details>
<p>先明确采用共享会话还是可独立验证的签名令牌，再统一受信密钥、发行方、受众、时钟与策略配置；刷新和撤销等状态需有一致的权威存储。比如随机会话凭据在实例之间查询同一会话记录，而 JWT 的本地验签不能自行获知刚发生的撤销。 <a href="../../../knowledge/backend/auth/jwt-auth.md">知识详解</a> · <a href="https://www.rfc-editor.org/rfc/rfc8725.html#section-3">规范核对</a></p>

<details data-knowledge-key="jwt-auth"><summary>（11）用户在实例 1 验证成功，下一次到实例 2 还要重新鉴权吗？</summary>
</details>
<p>不必因此重新要求用户登录，但实例 2 处理本次请求时仍须按同一规则验证凭据与当前资源权限。比如它可查共享会话或用受信公钥校验令牌，再检查撤销与策略；不能仅因另一实例曾放行，就把当前请求和所有后续动作永久视为已授权。 <a href="../../../knowledge/backend/auth/jwt-auth.md">知识详解</a> · <a href="https://www.rfc-editor.org/rfc/rfc8725.html#section-3">规范核对</a></p>

<details data-binding-status="pending_semantic_verification"><summary>（12）简历中的“双链路降级”具体是什么意思？</summary>
<span>关联知识点待核实。</span>
</details>
<p>项目定义待补：原文只给出“双链路降级”名称，没有说明两条链路、切换条件或能力差异，不能替作者补成双模型、双供应商或传统逻辑兜底。通用设计应画清主备输入输出和最低安全质量，剩余时间与数据权限不满足时应明确失败；这里只提供审查方向。</p>

<details data-knowledge-key="llm-error-retry-fallback"><summary>（13）降级由超时还是调用失败触发，怎样定义条件？</summary>
</details>
<p>把连接、首 Token、流内空闲、总截止时间与不同错误类别分别建模，再决定重试、切换或失败，不能给所有异常同一动作。比如持续 5xx 可进入故障降级，认证错误则应停止并修正配置；原文未给具体阈值，备用路径还须重新满足权限和能力门槛。 <a href="../../../knowledge/llm/dev/llm-error-retry-fallback.md">知识详解</a></p>

<details data-knowledge-key="llm-error-retry-fallback"><summary>（14）大模型调用超时后，怎样重试和降级？</summary>
</details>
<p>重试继承同一个总 deadline，仅对可恢复且重复安全的操作做有限退避与抖动；结果未知时先查状态或对账。比如纯文本生成重复可能增加费用，而此前已执行的创建工单工具不能随整轮盲目重放；没有合格备用模型时要明确未完成。 <a href="../../../knowledge/llm/dev/llm-error-retry-fallback.md">知识详解</a></p>

<details data-binding-status="pending_semantic_verification"><summary>（15）简历中配置的功能路由具体实现什么效果？</summary>
<span>关联知识点待核实。</span>
</details>
<p>路由语义待补：原文没有功能清单、配置或执行轨迹，不能推定这是模型供应商路由、知识索引选择还是 Tool 分发。可先说明路由的输入、候选范围、匹配优先级、失败路径和版本，例如受限功能标识映射到经授权的后端；实际含义仍需项目证据。</p>

<details data-knowledge-key="agent-permission-model"><summary>（16）Tool 能访问敏感数据，但当前用户没有相应权限，怎样防止越权？</summary>
</details>
<p>在工具执行点按可信用户、资源、操作和环境重新授权，不以工具已暴露或模型已选择作为许可。比如工具可查询客户档案，但普通用户只能读取归属自己的记录；由服务端生成过滤条件，并覆盖缓存、导出和批量接口，拒绝模型改写资源 ID 绕过。 <a href="../../../knowledge/llm/production/agent-permission-model.md">知识详解</a></p>

<details data-knowledge-key="agent-identity-auth"><summary>（17）Agent 自身有高权限时，怎样避免它替用户绕过原有业务权限？</summary>
</details>
<p>保留用户 Subject 与执行 Actor 的委托链，让下游资源服务按“代表谁做什么”判断，而非只看到强大的共享服务账号。比如 Agent 管理账号能读取全部发票，也不能替无权用户导出别人的发票；用面向目标、窄范围的凭据并在最终资源边界复核。 <a href="../../../knowledge/llm/production/agent-identity-auth.md">知识详解</a></p>

<details data-knowledge-key="agent-permission-model"><summary>（18）面向成百上千万 C 端用户时，怎样降低逐个手工授权的成本？</summary>
</details>
<p>用角色表达基础权限、资源关系表达所有权或成员关系，再以属性策略约束租户、数据等级与用途，避免维护用户乘资源的手工名单。比如规则允许用户读自己的订单，但服务端每次仍依据可信主体和订单归属决策；规模扩大不意味着可以跳过逐请求授权与撤权。 <a href="../../../knowledge/llm/production/agent-permission-model.md">知识详解</a></p>

<details data-binding-status="pending_semantic_verification"><summary>（19）Java 单例模式代码找错题应怎样分析？</summary>
<span>关联知识点待核实。</span>
</details>
<p>代码待补：原文只写“Java 代码找错题：单例模式”，没有代码，无法判断究竟是发布、并发初始化、序列化还是其他缺陷。拿到完整实现和运行条件后再逐条验证，不把某一种常见双重检查代码当成原题，也不提供假装修复后的补丁。</p>

<details data-knowledge-key="algorithm-array"><summary>（20）给定整数数组，将每项替换为右侧所有元素最大值，最后一项替换为 -1，怎样实现？</summary>
</details>
<p>从右向左扫描，维护严格右侧后缀的最大值：先写答案，再用原来的当前值更新状态，最后一项单独写 -1。教学例子 [-3,-5] 应得到 [-5,-1]，所以运行状态不能初始化为 -1；用 -Infinity 表示还没有右侧元素。每项只扫描一次，时间 O(n)，除返回数组外空间 O(1)。 <a href="../../../knowledge/data-structure/algorithm/algorithm-array.md">知识详解</a></p>

<details data-knowledge-key="algorithm-array"><summary>（21）给定 I/D 关系串，使用 0 到 N 各一次构造满足相邻大小关系的数组，怎样实现？</summary>
</details>
<p>保留未使用整数区间 [low,high]：遇 I 取最小值 low，遇 D 取最大值 high，最后追加剩下的数。被取出的端点与后续任意未用值都满足当前大小关系，因此不等式和不重复约束都成立。教学例子 IDID 可构造 [0,4,1,3,2]；这里只求任意合法解，未额外要求字典序最小。时间 O(N)，除输出外空间 O(1)。 <a href="../../../knowledge/data-structure/algorithm/algorithm-array.md">知识详解</a></p>

<details data-binding-status="pending_semantic_verification"><summary>（22）手撕“字符串数组等价判断”的完整要求是什么？</summary>
<span>关联知识点待核实。</span>
</details>
<p>题面待补：原文只有题名，没有说明等价按拼接内容、元素顺序、集合还是其他规则定义，不能直接套某道题的条件。取得输入、输出和边界后再选算法；本项暂不补代码、不关联知识，也不计热。</p>

## 技术核对资料

- [WHATWG SSE](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [RFC 8725 JWT best practices](https://www.rfc-editor.org/rfc/rfc8725.html#section-3)
- [NIST ABAC](https://csrc.nist.gov/pubs/sp/800/162/upd2/final)
