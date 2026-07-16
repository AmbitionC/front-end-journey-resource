工具选择不是把全部函数一次性塞进上下文，再让模型挑一个名字。生产系统要先按身份与策略裁剪可见集合，再做能力匹配和语义排序，只向模型暴露少量允许候选，并在真正执行前重新授权。

## Tool Discovery 不等于 Authorization

Discovery 回答“有哪些能力可能相关”，authorization 回答“当前主体此刻能否对这个对象执行”。即使工具描述与任务完美匹配，也不能获得权限；反过来，拥有权限也不代表这个工具适合当前目标。

权限过滤从受信任 principal、tenant、role、region、数据分类、环境和审批状态计算。模型提供的用户文本、工具 annotation 或 `is_admin` 参数不能参与身份事实。过滤发生在语义排名前，禁止工具连名称、描述和 schema 都不应进入模型上下文。

## 建立版本化 Capability Catalog

每个工具记录稳定 ID、版本、窄意图、input/output schema、读写性质、风险、所需 scope、数据区域、成本、延迟和健康状态。描述同时写“何时用”和“何时不用”，减少名字相近工具的误选。

[MCP Tools 规范](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)定义了工具 name、description、inputSchema、可选 outputSchema、annotation 与结果等接口。规范也提醒客户端，除非信任服务器，否则不应把 tool annotations 当作可信事实；因此风险和权限元数据应来自自己的受控 registry。

## 授权优先的选择漏斗

可按以下顺序缩小集合：

1. **硬过滤**：身份、租户、region、capability、环境和资源类型；
2. **任务解析**：提取需要的动作、对象、读写性与约束；
3. **候选召回**：按 capability 标签或 embedding 找到相关允许工具；
4. **确定性打分**：schema 可满足性、风险、健康、成本和延迟；
5. **模型选择**：只在 top-k 中选择、补参或 abstain；
6. **执行前再授权**：绑定实际参数与目标资源重新验证。

![大型工具目录先经过身份、租户、区域与能力硬过滤，再在允许索引中匹配排序，模型选择后仍需重新授权](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-tool-selection-progressive-discovery-v1.webp)
*图：未授权工具在排名前就进入不可见区；发现与排名都不能覆盖权限。*

## Progressive Discovery 控制规模

工具很多时，一次暴露全部 schema 会消耗上下文，增加混淆与误选。可以先暴露 namespace/capability 摘要，模型或检索器选中领域后再加载少量具体工具。缓存索引按 catalog version 与授权集合分区，不能把管理员候选缓存复用给普通用户。

[OpenAI Agents SDK tools 文档](https://openai.github.io/openai-agents-python/tools/)展示了当前工具类型、deferred loading/tool search 等能力。这是截至 2026-07-16 的具体实现示例，不是所有模型或协议都有的保证。无论是否由 SDK 延迟加载，服务端都应掌握最终可见集合。

Progressive discovery 的每一层仍要经过权限过滤。只隐藏具体函数却暴露敏感 namespace 名称，也可能泄漏组织能力和数据存在性。

## 匹配与排序信号

任务先归一化为 `intent + object + sideEffect + constraints`。候选工具只有在必需输入可从受信任上下文、用户明确输入或可安全获取来源中填充时才提升排名。不要鼓励模型编造缺失 ID。

排序可组合：意图相似度、schema 覆盖、历史成功、工具健康、延迟/成本、风险惩罚和数据 locality。线上成功率只能是信号，不能压过授权；热门万能工具也不应因历史调用多而长期垄断。

模型收到候选时，要同时看到选择理由所需的差异：一个只读、一个写入；一个支持批量、一个单项；各自限制和必须确认的参数。若 top 候选分数都低或缺关键输入，正式输出 `abstain`、请求澄清或转人工。

## 模型路由与提供商差异

[OpenAI Agents SDK models 文档](https://openai.github.io/openai-agents-python/models/)描述了当前模型配置与能力差异。选择层不要假设所有模型支持同样的工具搜索、并行调用或 strict schema；在 provider adapter 中声明能力，并在不支持时使用确定性检索与本地校验。

模型返回 tool name 只视为候选。解析器确认它来自本轮允许集合、版本匹配、参数 schema 合法；执行服务再按具体对象授权。如果 catalog 在决策后更新或工具被下线，本轮应重新选择，而不是执行同名新版本。

## Fallback 不是降级权限

首选工具不可用时，只能尝试下一允许候选。fallback 要重新验证输入映射、风险和语义等价性；“写入 CRM 失败”不能自动退化为“发邮件给任意地址”。所有候选失败后应返回可解释的不可用或请求人工。

熔断、限流和健康状态可暂时移除工具。对非幂等写操作，超时后先查询原 operation 状态，不能因为 fallback 存在就换工具再执行一次相同副作用。

## 评估工具选择

建立带标准答案与允许集合的数据集，覆盖相似工具、缺参数、禁止工具、跨租户、低置信度、工具下线和多步组合。评估不仅看 top-1 accuracy，还看 unauthorized exposure、错误副作用、abstain precision、参数来源正确率和 fallback 安全性。

用 counterfactual 测试：仅改变用户角色，相关度排序可以相同，但可见集合必须变化；仅改变 region，不兼容工具必须消失；在文档中注入某工具名，不能绕过 allowlist。

## 可观测性

每次决策记录 catalog version、authorization policy version、硬过滤数量、召回候选、排名特征摘要、top-k、模型 choice、执行前授权结果、fallback 与最终 outcome。敏感工具名对无权日志查看者仍要脱敏。

指标包括候选压缩率、上下文 token、top-k 命中、模型 abstain、选后授权拒绝、工具不可用、fallback 成功和错误工具纠正率。选后授权拒绝突然升高，往往说明选择缓存、身份传播或 catalog 版本存在问题。

## 常见误区

- 将全部工具 schema 无差别暴露；
- 先按语义召回，再从结果中删禁用工具，泄漏描述；
- 相信第三方 annotation 中的 read-only/安全声明；
- 把 ranking score 当权限分数；
- 工具名存在就执行，不校验本轮 allowlist/version；
- 低置信度时强制选一个；
- fallback 到语义不等价或权限更宽的工具。

## 小结

可靠选择管线先建立受控 catalog，用身份与策略做硬过滤，再在允许集合中召回、匹配和排序。模型只看少量候选，可以明确放弃；执行前根据实际参数重新授权。Discovery 帮助找到工具，authorization 才决定能否使用，两者永远不能互相替代。

## 参考资料

- [Model Context Protocol — Tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
- [OpenAI Agents SDK — Tools](https://openai.github.io/openai-agents-python/tools/)
- [OpenAI Agents SDK — Models](https://openai.github.io/openai-agents-python/models/)
