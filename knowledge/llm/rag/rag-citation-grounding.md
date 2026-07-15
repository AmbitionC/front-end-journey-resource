答案末尾出现几个链接，只能证明系统“展示了来源”，不能证明每个声明真的被来源支持。Grounding 要建立的是可核验证据链：用户看到的原子声明能定位到具体文档版本和片段，片段在语义上支持该声明；没有充分证据时，系统缩小结论或拒答。

## 把四个概念分开

- **来源归属**：告诉用户信息来自哪个文档；
- **引用定位**：给出页码、段落、字符区间或内容块 ID；
- **声明支持**：证据是否蕴含或合理支持当前原子声明；
- **答案忠实度**：答案是否只使用提供证据中的信息，没有擅自扩展。

一个链接可能归属正确却定位太宽；定位准确也可能与声明无关；多个局部支持的句子还可能被模型组合成来源没有表达的结论。因此四层要分别记录和评测。

![来源被切成带稳定标识和版本的证据片段，答案声明逐一连接并检查覆盖、蕴含与时效](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/rag-citation-grounding-evidence-chain-v1.webp)
*图：引用在 claim 级别连接到精确 evidence span；不受支持的声明进入拒答，而不是附上相邻链接。*

## 摄取时建立来源账本

证据片段需要可复现身份：

```ts
type EvidenceSpan = {
  sourceId: string;
  documentVersion: string;
  chunkId: string;
  canonicalUrl?: string;
  title: string;
  section?: string;
  page?: number;
  startOffset: number;
  endOffset: number;
  contentHash: string;
  publishedAt?: string;
  validAt?: string;
  retrievedAt: string;
  text: string;
};
```

`sourceId + documentVersion + span` 指向不可变快照。网页更新后创建新版本，不让旧引用悄悄指向不同内容。PDF 页码、网页标题层级和字符区间各有局限，最好同时保留机器定位与用户可读定位。

只有 URL 不够：页面可能删除、重定向或变化。受版权和合同允许时保存受控快照或内容哈希；展示引用时链接到规范来源，并按许可只展示必要短片段。

## 先生成声明，再绑定证据

一种可靠流程是：

1. 从已授权语料检索证据；
2. 生成带临时 evidence ID 的答案；
3. 把答案拆成可独立判断的原子声明；
4. 为每个可验证声明匹配一个或多个证据 span；
5. 检查支持关系、覆盖率、冲突和时效；
6. 删除、改写或拒答未通过声明；
7. 渲染用户可点击引用。

不要让模型自由编造 `[1]`。引用 ID 必须来自服务端提供的允许集合，渲染器根据 ID 查来源账本。

```ts
type GroundedClaim = {
  text: string;
  evidenceIds: string[];
  support: "supported" | "partial" | "conflicting" | "unsupported";
};
```

一个复合句“产品支持功能 A，并且所有地区默认开启”应拆成两个声明，因为同一来源可能只支持前半句。

## 支持检查不只是关键词重合

检查器同时看查询、声明和证据，判断证据是否直接支持、只部分支持、冲突或无关。数值、否定、比较、因果、时间、主体和适用范围是重点。例如证据说“部分企业客户可开启”，不能支持“所有用户默认开启”。

自动蕴含模型或 LLM 裁判可以扩展审核，但要在人工标注集上校准，并保留不确定/人工复核出口。高风险事实使用规则、数据库验证或专业审核；不能让一个模型的自信分数成为唯一门禁。

## 覆盖率与正确率分别算

声明级覆盖率可以定义为：

$$
Coverage = \frac{\text{有引用的可验证声明数}}{\text{全部可验证声明数}}
$$

引用正确率则衡量引用是否真的支持声明。覆盖率高但正确率低，说明系统“到处加链接”；正确率高但覆盖率低，说明很多事实没有来源。还要统计引用定位质量、冲突处理、来源权威性和过期率。

[RAGAS 论文](https://arxiv.org/abs/2309.15217)提出 faithfulness、answer relevance、context relevance 等无需完整人工参考答案的自动评估维度，适合构建诊断基线；具体评分器仍需与自有任务的人类判断校准，不能把框架分数等同绝对真理。

## 来源冲突与时效

检索到冲突证据时，不要挑一个顺眼答案。比较发布日期、有效期、文档类型和权威层级；向用户说明存在差异，并分别引用。对价格、API、政策和版本能力等易变事实，记录 `validAt/retrievedAt`，答案明确“截至某日”。

来源失效、撤回或超过业务新鲜度门槛时，阻止引用并触发重新摄取。缓存答案也要绑定来源版本；文档更新后失效，而不是继续展示旧结论配新链接。

## 当前供应商引用能力的边界

截至 2026-07-15，[Anthropic Citations](https://platform.claude.com/docs/en/build-with-claude/citations) 可以让响应返回到输入文档片段的引用；[Gemini Google Search grounding](https://ai.google.dev/gemini-api/docs/google-search) 返回搜索来源和展示所需元数据。它们能减少手工定位工作，但字段、支持内容类型和展示要求会变化，应按当期官方文档接入。

供应商返回 citation 不代表业务事实已经通过你的权威性、权限、时效和声明支持门禁。仍需把外部结果映射到内部来源账本，并保留请求/响应版本。

## 拒答是证据链的一部分

当关键声明没有证据、证据冲突无法消解、来源过期或用户无权访问时，系统应缩小回答：“现有资料只能确认 A，无法确认 B”。可以提出澄清或建议用户查看权威入口。不要用没有证据的常识填空后附上一个主题相近链接。

## 常见误区

- 每段末尾放一个首页链接就算有引用；
- 用生成的查询、摘要或 HyDE 文档当证据；
- 一个引用覆盖包含多个事实的长句；
- 只评有没有引用，不评是否支持；
- URL 更新后让旧引用指向新内容；
- 忽略来源冲突、有效期和权限；
- 把供应商 citation 字段当作事实正确保证。

## 小结

引用溯源是数据模型与验证流程，不是排版功能。稳定来源身份、不可变版本、精确 span、原子声明映射、支持/覆盖/时效检查和明确拒答共同组成 Grounding。只有当用户能从声明回到真正支持它的证据，引用才提升可信度。

## 参考资料

- [Es et al. — Ragas: Automated Evaluation of Retrieval Augmented Generation](https://arxiv.org/abs/2309.15217)
- [Anthropic — Citations](https://platform.claude.com/docs/en/build-with-claude/citations)
- [Gemini API — Grounding with Google Search](https://ai.google.dev/gemini-api/docs/google-search)
