公司：小红书；方向：AI全栈开发暑期实习；轮次：二面。面试日期和部门未披露。本文只展开MCP更新操作与JSON输出两题；原记录没有实际接口或Schema，以下合同、例子和答案均为编辑教学补充。

<details data-knowledge-key="agent-permission-model">
<summary>（1）开发 MCP update 方法时，怎样确保安全？</summary>
</details>

把更新操作建成服务端受控动作：验证身份、资源归属、允许修改的字段和当前版本，再校验输入与业务不变量。敏感修改按风险取得具体参数授权，执行后读取实际结果；模型能发现工具或给出合法JSON，都不代表有权修改资源。

MCP的[2026-07-28 Tools规范](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)要求服务器验证输入、实施访问控制、限制调用并处理输出；客户端也要对敏感操作、结果校验、超时和审计作相应处理。协议描述不能替代业务授权。

教学例子：`update_document`只允许当前用户修改自己文档的标题。服务端从认证身份取得用户，查文档归属，限制字段为title，并用expected_version避免覆盖他人刚完成的更新。不能相信模型传来的owner_id，也不能因为工具声明为“安全”就跳过鉴权。

重试还有独立问题：一次更新已完成但响应丢失时，盲目重放可能产生额外副作用。应用需按动作语义设计幂等标识或先查询状态；有权限不等于重复执行安全。审计保留主体、资源、字段变化、版本和结果，敏感内容使用受控引用。

延伸阅读：[最小权限、授权与工具调用确认](../../../knowledge/llm/production/agent-permission-model.md)。

<details data-knowledge-key="prompt-structured-output">
<summary>（2）要求下游 LLM 输出 JSON，Prompt 应怎样写，应用又怎样验收？</summary>
</details>

Prompt应给出明确对象结构、字段含义、缺失值规则和正反例，并要求不附带解释；应用仍要先严格解析JSON，再校验Schema和业务事实。Prompt表达期望，校验决定是否接收，不能把一句“只输出JSON”当成可靠性保证。

例如只接受含answer与evidence_ids的对象，可以定义下面的应用层Schema。它是教学合同，不是某家模型API的参数，也不保证模型必然生成合格结果。

```json
{
  "type": "object",
  "properties": {
    "answer": {"type": "string"},
    "evidence_ids": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["answer", "evidence_ids"],
  "additionalProperties": false
}
```

[JSON Schema的对象说明](https://json-schema.org/understanding-json-schema/reference/object)明确区分properties、required和additionalProperties：列出字段不等于要求字段存在，也不自动拒绝额外字段。Prompt中还应说明没有证据时怎样表达，不能鼓励模型编造ID凑字段。

返回值即使通过Schema，也可能引用不存在的片段或给出错误事实。应用应检查ID属于本次证据集合，并验证其确实支持答案。解析失败、截断、字段错误与事实失败分别记录；只对可恢复错误做有上限重试，最终保留失败状态，不能静默吞掉坏字段继续执行。

延伸阅读：[结构化输出与 JSON Schema](../../../knowledge/llm/prompt/prompt-structured-output.md)。

## 参考资料

- [mcp-tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)。
- [json-schema](https://json-schema.org/understanding-json-schema/reference/object)。
