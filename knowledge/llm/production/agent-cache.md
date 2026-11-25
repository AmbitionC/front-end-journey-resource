Agent 缓存并不是在模型调用前放一个 Redis。模型输出、工具返回、检索候选和最终答案具有不同身份、权限、新鲜度和失效条件；把它们混进同一 key 空间，会出现跨租户泄露、旧索引污染、策略升级后仍返回旧结果，以及“命中率很高但答案已经错误”的假优化。

[RFC 9111](https://www.rfc-editor.org/rfc/rfc9111.html)给出了 HTTP 缓存最重要的两个思想：可复用对象必须有完整身份，陈旧响应只能在明确规则下使用并可通过验证器重新验证。Agent 缓存可以借用这些原则，但必须加入模型、Prompt、工具、索引和授权等领域维度。

![Agent 缓存分四层，共用一个 Key Builder。请求先规范化输入、去掉 traceId 这类瞬时字段，再由 Key Builder 加入租户与主体作用域、模型与 revision、Prompt 模板版本、工具 Schema 版本、索引版本与 filters 与 embedding 版本、策略与输出 Schema 版本、locale 与新鲜度等级，计算摘要作为 key。之后分别进入四层缓存：模型缓存只在确定输入下复用，答案含时间敏感事实时要带数据快照或不缓存；工具缓存遵循工具自身的新鲜度，有 ETag 或版本号时用条件请求重新验证；检索缓存绑定索引版本和过滤条件，新索引发布自然换 key；结果缓存绑定工作流、用户上下文和策略，命中后返回前仍要重新检查授权。四层由同一组失效事件驱动：数据变更、策略撤销、工具 Schema、模型与 Prompt、索引和安全事件，按版本或 tag 失效；先发布新的不可变版本让 key 自然切换，关键缓存另设最大 TTL 并周期对账。写操作、支付、发信这类副作用不进缓存，用幂等账本防重复](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/agent-cache-layered-keys-v2.dark.png)
*图：四层缓存共用一个 Key Builder，但命中语义各不相同；同一组失效事件按版本驱动四层，不能靠一个 TTL 解决一致性。*

## 先判断什么可以复用

模型缓存复用确定输入下的生成结果，适合温度为零、固定 seed 或容忍轻微非确定性的场景。工具缓存复用外部读取，必须遵循工具自身的新鲜度、权限和副作用语义。检索缓存可以保存查询向量、候选文档或重排结果，但必须绑定索引版本和过滤条件。最终结果缓存则受整个工作流、用户上下文和策略影响，风险最高。

写操作、审批、支付、发信、创建资源等副作用不能通过“返回上次响应”冒充执行。它们使用幂等账本防重复，而不是普通缓存。身份与授权实时变化的结果也不应长时间复用。

## 完整缓存键

一个可审计的 key 不是简单拼接 Prompt，而是对规范输入计算摘要：

~~~text
namespace
tenant_id + principal_scope
operation + canonical_input_hash
model_provider + model_id + model_revision
prompt_template_id + prompt_version
tool_name + tool_schema_version
retrieval_index_version + filters + embedding_version
policy_version + output_schema_version
locale + freshness_class
~~~

并非每层都需要全部字段，但缺失任何能改变可见内容或行为的维度都会造成错误复用。tenant 与 principalScope 默认纳入；只有经过数据分类证明为公开、无个性化的数据才允许跨租户共享。

[NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final)强调访问决策围绕主体与资源而非网络位置。由此可推导：缓存命中不能绕过当前授权。安全做法是 key 绑定授权作用域，并在返回前重新检查资源权限；不能因为数据曾被某个用户读取，就让同网段用户共享。

## 规范化与指纹

JSON 输入按稳定字段顺序、数字和 Unicode 规则规范化，移除不影响语义的 traceId 等瞬时字段，再计算加密摘要。Prompt 模板与变量分开版本化，避免空格改动制造无意义 miss，也避免模板升级仍误 hit。文件使用内容摘要和解析器版本，而非临时 URL。

缓存记录保存 keyParts 的安全摘要、createdAt、freshUntil、staleUntil、sourceVersion、policyVersion 和命中证据。不要把敏感原文放进 key，因为 key 会出现在日志、指标和管理界面。

## 新鲜度与重新验证

TTL 只是时间上限，不表达数据是否真的改变。对于有版本号、ETag 或 lastModified 的工具结果，优先使用条件请求重新验证；索引发布用不可变 indexVersion，版本切换自然产生新 key。模型与 Prompt 发布同样使用 bundleVersion，不靠批量扫描删除旧键维持一致。

stale-while-revalidate 可以降低读取延迟，但只能用于明确允许陈旧的数据，并在响应标注数据时间。stale-if-error 是降级策略，不应应用于余额、权限、库存和安全决策。陈旧窗口、错误类型与用户提示都写进契约。

## 失效策略

失效事件来自数据变更、策略撤销、工具 Schema、模型版本、Prompt、索引和安全事件。事件带 tenant、resource、oldVersion、newVersion 和 reason，消费者按版本或 tag 失效。为防事件丢失，关键缓存设置最大 TTL，并周期性对账。

删除旧版本不是发布的前置条件。先发布新不可变版本，让新请求只访问新命名空间；旧键自然过期或后台回收。这样避免全量 DEL 造成延迟尖峰，也避免删除与并发写的竞态。

## 防击穿、穿透和雪崩

热门 key 过期时使用 single-flight，让一个请求刷新，其他请求短时等待或读取允许的 stale 值。不存在结果可以短 TTL 负缓存，但要防止攻击者用高基数随机输入填满缓存。TTL 加 jitter，避免同一发布批次同时过期。

缓存服务不可用时采用明确失败策略：可选性能缓存旁路到源站，但必须限制并发防止把源站压垮；承担授权或幂等语义的数据不能静默旁路。缓存最大对象大小、每租户容量和驱逐策略都要有界。

## 模型缓存的质量边界

模型输出可能包含时间敏感事实、个性化内容或随机性。缓存前按任务标记 cacheable、freshnessClass、safetyPolicy 和 evidenceVersion。答案中若包含“今天”“当前价格”或外部检索内容，key 需加入数据快照，或完全不缓存。

安全策略升级后，旧输出必须重新过滤或失效。只在写入时过滤不够，因为策略会变化；读取路径至少验证 policyVersion 和内容分类。对含个人数据的输出设置短 TTL、加密与可删除索引。

## 指标与验证

除了 hit ratio，还要观察正确命中率、stale serve、revalidation、源站节省、p95 延迟、single-flight 等待、跨租户拒绝、每层容量和驱逐。高 hit 但旧答案投诉增加，说明优化目标错了。

测试构造相同输入不同租户、权限撤销、Prompt 小版本、工具 Schema、索引切换、并发过期、事件丢失和缓存故障。断言 key 隔离、策略更新立即生效、陈旧数据只在允许窗口返回、写操作绝不走普通结果缓存。

## 小结

Agent 缓存的核心是身份与新鲜度，而不是序列化速度。分别治理模型、工具、检索和结果缓存，用完整版本化 key、授权复查、显式 stale 契约和事件失效控制复用边界；副作用则交给幂等账本。只有“命中仍然正确”时，命中率才有意义。

## 出现于（热度来源）

<!-- interview-source-history:start -->

<!-- interview-source-history:end -->

## 参考资料

- [RFC 9111：HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111.html)
- [NIST SP 800-207：Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final)
