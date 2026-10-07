以下原题或题目类别依据候选人的公开自述整理，经历、实现效果与面试结果未经独立证明。每题后的短答是独立教学归纳，不是作者现场回答；未记录的追问不补写。

“open claw”未绑定版本或实现，只讨论可核实的通用机制。

<details data-knowledge-key="transformer-arch">
<summary>（1）为什么用transformer，为什么不用其他模型比如LSTM</summary>
</details>

Transformer 的注意力便于建模位置之间关系，训练可并行处理序列；LSTM 按序递归且有不同计算与归纳偏置。选型需比较数据量、长度、时延和基线，不能认为 Transformer 必然更好。

<details data-binding-status="pending_semantic_verification">
<summary>（2）怎么分析流量</summary>
<p>关联知识点待核实。</p>
</details>

先明确流量单位、时间窗口、采样与来源，再看分布、峰值、异常和特征变化。模型分析要防数据泄漏并用时间切分验证，原帖未给具体数据，不能编造业务指标。

<details data-knowledge-key="transformer-arch">
<summary>（3）可视化怎么体现，模型的可解释性怎么保证</summary>
</details>

图表应标明单位、窗口与样本，展示预测、误差和代表性异常；解释可结合特征影响与反例。注意力权重可提供线索，但不能直接当作因果解释。

<details data-knowledge-key="transformer-arch">
<summary>（4）讲一下注意力机制在你的项目怎么应用的</summary>
</details>

说明 query/key/value 如何形成相关性权重并聚合信息，再对应到项目的时间或序列特征。具体用了哪层与掩码应以实现为准，不把注意力图当正确性的证明。

<details data-knowledge-key="mcp-protocol">
<summary>（5）A2A协议</summary>
</details>

A2A 面向智能体之间发现能力、提交任务和交换任务状态等协作；需以选定版本定义消息和生命周期。协议不自动建立信任，身份与权限仍要单独实现。

<details data-knowledge-key="mcp-protocol">
<summary>（6）MCP协议</summary>
</details>

MCP 主要连接宿主与工具/资源服务，支持发现和调用；A2A 的智能体任务协作处于另一层。不能只因都叫通信协议就认为可以直接互换。

<details data-knowledge-key="agent-identity-auth">
<summary>（7）智能体可信通信怎么实现的</summary>
</details>

先认证通信主体，再检查受委托权限、消息完整性、重放与审计。TLS、令牌与业务授权各解决一部分问题，可信通信不意味着对方返回内容一定真实。

<details data-knowledge-key="http-message">
<summary>（8）Https在项目中的应用</summary>
</details>

HTTPS 用 TLS 保护传输机密性与完整性并认证服务器，仍需校验证书和主机名。它不替代应用身份、对象权限或内容校验，应用内部日志也要保护。

<details data-knowledge-key="oauth2">
<summary>（9）Oauth的作用</summary>
</details>

OAuth 2.0 是委托授权框架，访问令牌用于获准访问资源；用户登录通常还需对应身份协议。限定受众、scope 与期限，并按实际流程验证，不能把 OAuth 直接当用户密码传输。

<details data-binding-status="pending_semantic_verification">
<summary>（10）了解新技术吗比如open claw</summary>
<p>关联知识点待核实。</p>
</details>

先确认 OpenClaw 的实际仓库、版本和部署方式，再阅读能力、工具权限与依赖。原帖只给名称，不能断言其具体插件或默认安全设置；试用前以文档和隔离实验验证。
