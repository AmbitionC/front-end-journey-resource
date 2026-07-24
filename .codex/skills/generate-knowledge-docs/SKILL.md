---
name: generate-knowledge-docs
description: Research knowledge topics from supplied titles and create, audit, or batch-update progressively structured Markdown learning documents with sourced explanations and image2-generated illustrations. Use when Codex is asked to write,整理,讲解,调研,批量生成,补齐,更新, or治理 knowledge-point articles, tutorials, technical concept documents, learning notes, or course chapters, especially the knowledge module in AmbitionC/front-end-journey-resource.
---

# Generate Knowledge Documents

Turn one or many titles into accurate, teachable Markdown documents. Research before drafting, build concepts in dependency order, and use image2 only where a visual materially improves understanding.

## Inputs

Accept one title, a list of titles or keys, a subtree, or an update criterion as input. Use any audience, depth, length, language, source, or style constraints the user supplies.

When constraints are absent:

- Write in the user's language.
- Target an interested beginner progressing toward practical competence.
- Explain prerequisites briefly instead of assuming them.
- Prefer enough depth to make the topic usable; do not pad to a fixed length.
- Use current authoritative sources when the subject may have changed.

Ask a question only when different interpretations of the title would produce materially different documents. Otherwise state a narrow interpretation and proceed.

## FrontEnd Journey project mode

When the request concerns FrontEnd Journey knowledge content, read and follow [references/fe-journey-integration.md](references/fe-journey-integration.md). Treat `AmbitionC/front-end-journey-resource` as the content source of truth. Inspect the repository's current default branch before changing anything; do not rely on remembered paths or schemas when the repository differs.

**去重与热度**：创建或更新知识点前，先做语义去重（同一考点只留一条，哪怕表述不同），并维护叶子的 `heat`/`currRank`（复现越多越靠前）——规则见 [`../curate-interview-posts/references/dedup-and-heat.md`](../curate-interview-posts/references/dedup-and-heat.md)。宁可给既有知识点加权 / 补内容，也不要造语义重复的新条目。

Prefer a local checkout when creating or modifying batches. A writable GitHub integration is also acceptable when it can create a branch and apply the complete article/image change atomically. Do not publish unless the user asks. In this project, “发布” means branch → pull request → merge into `master`; the configured resource-repository Action performs the actual synchronization.

Routine knowledge publication must change only `AmbitionC/front-end-journey-resource`. Do not edit or redeploy `fe-journey-faas`, `front-end-journey`, `front-end-journey-manager`, or investment services merely to publish an article. Escalate into infrastructure only when the resource Action fails with evidence and the user authorizes that separate fix.

For project batches:

1. Resolve this skill's directory and run its bundled `scripts/knowledge-inventory.mjs <resource-repo>` to flatten `knowledge/_tree.json` and identify missing, existing, and orphaned articles.
2. Read `.codex/knowledge-update-history.json` when it exists. Exclude records with `status: "published"` or `status: "pending"` from directory-order or missing-work selection unless the user explicitly requests an audit, refresh, or exact key/title. Pending means selected/in flight, not published; resume its existing batch instead of creating a duplicate article.
3. Resolve scope by explicit keys, exact titles, a subtree key, missing files, or an update audit. Never interpret "batch" as permission to rewrite the entire knowledge base without a bounded scope.
4. Create a manifest of intended actions with `key`, `label`, `filePath`, output path, action (`create` or `update`), and reason.
5. Process in reviewable batches of 5–10 articles unless the user specifies a different size.
6. Validate every batch before starting the next one. Stop if systemic errors appear.

When the user asks to publish a completed batch:

1. Put the Markdown, any `_tree.json` change, every referenced image, and the updated `.codex/knowledge-update-history.json` in one resource-repository branch.
2. Run the repository validation and review the scoped diff.
3. Open a pull request and merge it into `master` after checks pass.
4. Treat the configured resource Action as the publication authority. Wait for its result and report it.
5. After a successful Action, do not open the production site or perform an additional browser smoke test unless the user explicitly requests it. This does not waive content, image-semantic, manifest, or diff validation before merge.

Record each completed article by stable `key` with `label`, `filePath`, `action`, batch/date, and `status`. During publication, write the intended records with `status: "pending"`; after the resource Action succeeds, update them to `status: "published"` in the next content batch or a dedicated record-only change. Never treat the history as proof that an article exists: cross-check the tree and expected Markdown path.

### Overall progress reporting

After every FrontEnd Journey batch, report the overall knowledge-update progress, even when the user does not ask again:

1. Read the current `master` versions of `knowledge/_tree.json` and `.codex/knowledge-update-history.json` after the batch merge.
2. Count total knowledge points as unique tree nodes with `isLeaf: true`. Do not count category nodes, and do not include a separate interview tree unless the user explicitly expands the scope.
3. Count updated knowledge points as unique history keys present in that tree whose status is `published`, plus `pending` records whose complete article/image batch is already merged into `master`. Exclude merely selected or failed work that is not merged.
4. Calculate `percentage = updated / total * 100`, normally rounded to two decimal places.
5. End the batch report with the fixed form `整体进度：x/xx（yy.yy%）` and optionally include the remaining count. If the tree changes, always recompute the denominator rather than reusing an earlier total.

For a status-only request, also report the `published` and merged-`pending` breakdown so the counting basis is explicit.

When updating an existing article, preserve correct and useful explanations. Rewrite only what improves accuracy, pedagogy, currency, structure, citations, or illustration quality. Never replace a strong article merely to make its wording uniform.

## Workflow

### 1. Define the learning target

Parse the title into:

- the central question the document must answer;
- prerequisite concepts;
- the mechanism or mental model;
- practical application;
- common confusions, limitations, and tradeoffs.

Form a one-sentence learning outcome. Use it to exclude interesting but irrelevant material.

For a batch, do this once for the shared subject area and once per title for topic-specific boundaries. Detect overlap between neighboring titles so the articles reference prerequisites instead of duplicating large sections.

### 2. Research before outlining

Search broadly enough to discover the topic, then verify important claims with authoritative sources.

Prefer sources in this order:

1. specifications, standards, official documentation, and original research;
2. maintainers' documentation and reputable institutional material;
3. high-quality secondary explanations for pedagogy and contrasting interpretations.

For technical questions, rely on primary sources for factual claims. Check version numbers, dates, terminology, defaults, and deprecations. Cross-check consequential or disputed claims. Distinguish sourced facts from inference. Never fabricate citations, URLs, benchmarks, or quotations.

Keep a compact evidence map while researching: claim, supporting source, confidence, and whether it is time-sensitive. If authoritative sources disagree, explain the disagreement instead of silently choosing one.

Reuse a source only when it directly supports the current article. Do not copy a generic reference list across a batch.

### 3. Build a dependency-first outline

Arrange sections so each concept uses only ideas already introduced. Prefer this progression:

1. what it is and what problem it solves;
2. prerequisites and vocabulary;
3. core mental model;
4. step-by-step operating principle;
5. concrete example or walkthrough;
6. architecture, interactions, or implementation details;
7. tradeoffs, failure modes, and common misconceptions;
8. practical checklist or next steps;
9. concise recap.

Adapt the structure to the subject. Do not force empty sections.

### 4. Plan illustrations

Identify concepts where prose alone imposes high cognitive load. Create an illustration when at least one applies:

- three or more components interact;
- order, causality, state change, or data flow matters;
- the topic has layers, boundaries, ownership, or hierarchy;
- an invisible runtime mechanism needs a spatial mental model;
- readers must compare paths, states, or architectures.

Do not add decorative images, generic hero art, screenshots that add no teaching value, or a picture for every section. Usually use one to three high-value illustrations per document.

For each illustration, write a specification containing:

- teaching purpose;
- elements and relationships that must be visible;
- reading direction and layout;
- exact labels, limited to essential terms;
- visual style, aspect ratio, and accessibility alt text;
- factual constraints the image must not violate.

Follow [references/image2-integration.md](references/image2-integration.md) to generate and upload images. Never invent a returned image URL. If image2 or upload configuration is unavailable, preserve the specification as a clearly marked Markdown placeholder and continue the document.

### 5. Draft progressively

Start each major section with the question it answers. Introduce one conceptual jump at a time:

- define a term before using it;
- explain why before how when motivation is not obvious;
- move from a small concrete example to the general rule;
- connect each new idea to the previous one;
- make assumptions and boundaries explicit;
- use code, equations, tables, or analogies only when they improve understanding.

Use lists for genuine sequences or parallel points, not as a substitute for explanation. After an important list, explain how the items work together.

Place each image immediately after the paragraph that creates the need for it. Introduce what the reader should notice, then add the image with meaningful alt text and, when useful, a short caption.

### 6. Cite and verify

Place source links near the claims they support. Add a final `## 参考资料` section containing only sources actually used. Prefer descriptive Markdown links over bare URLs.

Before delivery, verify:

- the title, learning outcome, outline, and conclusion agree;
- terminology is consistent and version-sensitive claims are current;
- every important factual claim is supported;
- examples actually demonstrate the stated rule;
- images match the surrounding explanation and contain no invented relationships;
- every image URL exists and every image has useful alt text;
- the document is valid, self-contained Markdown with no process notes.

For a batch, also verify:

- every selected manifest leaf has exactly one expected Markdown file;
- no unrelated article or `_tree.json` node changed;
- article keys and `filePath` values are unchanged during updates;
- generated image filenames are unique and all referenced images exist;
- the repository's `npm run validate:tree` succeeds;
- a diff review shows no truncated articles, duplicated boilerplate, fake citations, or leaked credentials.

Produce a compact batch report with created, updated, skipped, failed, and pending-image counts. Keep failure reasons per key so a later run can resume safely. For FrontEnd Journey batches, always include the overall `x/xx（percentage）` progress line defined above.

## Output contract

Return one Markdown document using this baseline shape when appropriate:

```markdown
# 标题

> 用一两句话说明学习目标和适合读者。

## 为什么需要它

## 前置知识

## 核心概念

## 运行原理

![准确描述图片教学内容的替代文本](uploaded-image-url)
*图：读图重点。*

## 示例与实践

## 常见误区与边界

## 小结

## 参考资料

- [来源名称](https://example.com)
```

When image generation is blocked only by missing interface configuration, use this temporary form instead of a fake URL:

```markdown
<!-- IMAGE2_PENDING
purpose: 这张图要帮助读者理解什么
alt: 无障碍替代文本
prompt: 可直接提交给 image2 的完整提示词
upload_target: 待配置
-->
```

Remove all `IMAGE2_PENDING` blocks after successful generation and upload.

In FrontEnd Journey project mode, follow the repository's body-only convention: the article title comes from `_tree.json`, so normally start the Markdown file with a concise introduction followed by `##` sections rather than duplicating the title as `#`. Use GitHub-flavored Markdown, fenced code, KaTeX-compatible math, and ordinary image syntax supported by the site renderer.
