# 最终版本发布审核

此契约限定面经内容加工与资源仓库发布；不授权改支付、部署阅读端、创建凭据或外部服务。

## 仓外输入与本地绑定

保留原文快照、私有来源历史、逐题映射和独立内容审查报告于公开仓库外。文件路径必须为绝对路径，解析符号链接后的真实路径也必须在仓外。旧公开来源历史迁出当前树不等于擦除过去 Git 提交。

本地命令：

```bash
node .codex/skills/curate-fe-journey-inbox/scripts/inspect-batch.mjs <resource-root> --batch <batch-id> --history /absolute/private/history.json
npm run validate:tree
npm run validate:release -- /absolute/private/history.json /absolute/private/review.json <review-sha256>
```

审核方单独交付 `review-sha256`。调用者能自行修改回执并重新计算哈希，因此本地绑定不是审核身份认证；发布身份由下述 GitHub 真实审查承担。不要把可编辑私账中的 approved/prepared/published 当作独立回执。

仓外 `review.json` 为 `schemaVersion: 1`、`kind: resource-content-review`、`decision: approved`，包含：

- `history`、`independentReview`、`questionLedger`：绝对 `path` 与完整 `sha256`。
- `baseCommit`：实际 PR base 的完整 commit SHA；最终 --private-pr 与 GitHub 实际 base.sha 精确比对并检查它是 head 祖先，不能自行选更早基线；`coveredPaths` 必须等于基线与最终资源的真实差异。
- `publicFiles`、`publicationDigest`：按路径排序的全部 `interview/`、`knowledge/`、`images/`、可选 `class/` 及 `.codex/image-resync.txt` 文件指纹；摘要为该数组 JSON 的 SHA-256。
- `articleKeys`：本批变化面经范围，不得把新增正文从原文审核范围排除。`deletedPublicPaths` 只接受实际基线中存在且最终快照真正删除的文件，不能用仍存在的孤儿正文冒充删除说明。
- `sourceEvidence`：冻结原文的 `path/sha256/sourceId/canonicalUrl/articleKey/processUnitId`；采集 JSON 使用 `documentJson: true`，其 `document.canonicalUrl/url` 和 `text` 必须与来源及正文对应。
- `questionLedger`：每页逐题 `sourceId/sourceSpan/sourceLiteral/publicQuestion/knowledgeKey/teachingAnswer/bindingStatus`。原文坐标是 Unicode codepoint 的半开区间；公开题、短答和绑定与实际可见结构逐项比对。原帖缺关键词时只能明确标记 `pending_missing_keyword`，保留未绑定问题，不猜题、不增加热度。私账 knowledgeKeys 必须逐来源等于本批逐题映射中 bindingStatus=bound 的知识 key 集合，不能用旧字段让 pending 组计热。
- `distinctRoundPairs`：仅用于已经独立审核确认的同流程不同轮次；不能用它为补充材料重复建页。

实际原文先去掉采集器 frontmatter，再以 NFKC 去空白后计算完整 SHA-256；私账的 `normalizedBodySha256` 必须与它一致。跨 URL 同正文不得重复公开建页或增加独立过程频次。历史已存的完整正文指纹必须由仓外冻结 `originalBodyEvidenceFile/originalBodySha256` 重新读取核对（采集 JSON 标 `originalBodyDocumentJson: true`）；缺证据时不得将该指纹用于去重。缺 normalizedBodySha256 时仍从冻结原文复算，不跳过历史记录；既有公开叶子删除整条历史记录也会阻断。基线目录移除旧叶子不能使未变的旧正文退出历史去重；目录/正文删除须在独立审核中明确，去重仍读取已知基线来源证据。旧未回填来源不能当作完整历史覆盖证明，自动去重所涉及的既有公开来源须先补充原文证据。这是来源校验，不能借此重写全库文章。对照最新已发布目录与私账复用稳定 key，不能仅凭本地旧分支证明线上不存在重复页。

任一正文、知识文章、quickRead、目录、图片或原文证据改变，旧回执失效。`sync-interview-topic-weights` 的写入是草稿更新，必须重新冻结并审核再发布。保留正确既有内容，限定本批 keys。

## 公开结构

真实问题采用实际 HTML `details`，其第一个元素是唯一非空 `summary`，之后紧邻独立非空短答段落。已绑定问题使用稳定 `data-knowledge-key`；对应知识正文必须存在、目录具有非空单段 `quickRead.text`，并在实际非代码、非隐藏链接中反向导航到面经。代码示例、注释、脚本字符串、属性里的伪 HTML、重复属性或嵌套 details 不能充当问题或关联。

路径不得使用绝对路径、点段、反斜杠或符号链接。公开面经禁止原帖 URL、来源标题和能改变问题可见性的样式注入。隐藏容器或 SVG 内的 style/link 样式也按实际 DOM 检查。问题/短答及反链节点与其祖先不能带无法证明可见的 style/class/隐藏属性，反链须有可见文字。HTML 静态检查不替代生产阅读端交互验收。

## GitHub 发布审查与同步/PDF

PR job 只运行公开结构和隔离负向测试，不调用外部同步，也不要求尚未发生的 merged 状态。合入 master 的正式同步才运行以下门槛；实际 required checks 必须只读核对，不能让合并前依赖合并后 content-sync。正式入口读取 GitHub 实际 PR 与 review API，要求合入 `master` 的 PR 与当前最终 commit 对应、审查的 PR head 和最终公开资源快照一致，且最终 SHA 仍为实际默认 master 的当前 head；旧 Action 重跑不能重放已被新提交取代的内容。可信 OWNER/COLLABORATOR 的最终 APPROVED review 须来自 PR 作者之外，正文包含精确一行：

```text
content-release:v2 head=<完整已审PR-head-SHA> digest=<完整publicationDigest> receipt=<完整仓外review.json-SHA256>
```

实际独立审查者先核验整个仓外回执及它引用的冻结原文、历史、逐题映射、独立审查报告、公开快照，再提交上述 APPROVED review。执行者在最终提交上读取真实 PR/review，并运行：

```bash
npm run validate:release -- --private-pr <PR-number> /absolute/private/history.json /absolute/private/review.json <review-sha256>
```

该发布前步骤读取并验证全部私有 pin，且与认证 review 的 receipt 摘要精确比对；原文替换或回执摘要变化均阻断。保留其结果于仓外证据，不发布来源/URL/私账。通过后至合并期间不可更改任何冻结输入；更改须重审。CI 无法读取这些仓外文件，只认证审查者签署的已审版本指针，并检查最终公开提交；CI 返回 privateEvidenceMode=authenticated-reviewed-receipt-pointer，不能把它称为 CI 自动核验原文。发布协调者须同时持有真实认证私有最终步骤和同 SHA 同步证据。

OWNER/作者的 COMMENTED review 与“已核验私有独立审核”的自述不能替代上述独立 APPROVED review。没有现有受信任的独立审查者时明确报告阻断；不为完成发布添加账号权限或凭据。最新 dismissed/changes requested、其他 head、不同摘要、未合并 PR 或不可信账号均不放行。不得以调用者提供的 API JSON、私账字段或本地测试 fixture 替代真实 GitHub 证据。现有公开只读 API 不需新权限或令牌；读取失败就阻断。

同步先检查真实终态 `success === true`、`data.errors` 为空及计数字段合法；这仍不证明 FaaS 固定读取 afterSha。资源、FaaS 和线上阅读端都完成对应版本核验后才能记为发布成功。

PDF Action 与直接 `build-materials.mjs` 入口都要求最终 commit 的可信审查，且同一 SHA 的最新 sync.yml run 已完成并成功。构建仅使用冻结知识正文和本地已审图片；浏览器脚本禁用，外部可变请求不参与正式 PDF。所有分组与叶子 key 都必须是安全单个组件。PDF 只支持明确列出的静态 HTML 元素、构建器自有 CSS 及经过字节绑定和加载核验的 PNG/JPEG/WebP img。所有册的 HTML 和图片在浏览器启动与 OSS client 使用之前预检。每张图先核对规范 OSS 地址、本地边界、已审 SHA 与真实格式字节头；请求拦截再次核对并给出准确 MIME。SVG 即使 outer SHA 固定也不能证明内部媒体已加载，所以作为图片引用也先阻断，待独立核验静态产物。iframe、内联 SVG/MathML、picture/srcset、作者 CSS、非 img 图片入口和导航元数据会阻断。阅读端会将 Mermaid fence 转图，当前 PDF 没有经审核的转换机制，所以该输入也阻断，不把图解静默降成代码。上述未支持输入会阻断 PDF，不能依同名图片猜测等价或静默移除图解。保留既有 PDF keys、manifest version 2、私有 ACL 与下载协议。

## 当前基础设施边界

若实际 FaaS 只用 beforeSha/afterSha 获取差异、却按默认分支读取上传字节，同步与 PDF 的版本闭环仍被阻断。若生产页面未证实消费 data-knowledge-key/quickRead，则资源绑定通过不证明展开交互正常。记录具体依赖与失败，不自动改其他仓库或宣称修复上线；由用户明确授权的发布协调者安排后续范围。
