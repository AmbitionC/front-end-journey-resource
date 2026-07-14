# FrontEnd Journey knowledge integration

Use this reference only for knowledge-content work in the FrontEnd Journey repositories.

## Current architecture

The repositories have distinct roles:

- `AmbitionC/front-end-journey-resource`: source of truth for Markdown, images, and navigation manifests.
- `AmbitionC/fe-journey-faas`: content API and GitHub-to-OSS/MySQL synchronization.
- `AmbitionC/front-end-journey-manager`: manual Markdown editor and content CRUD interface.
- `AmbitionC/front-end-journey`: reader UI. It loads navigation through `useNavList('knowledge')`, fetches Markdown from OSS, and renders it with `react-markdown`.
- `AmbitionC/fe-journey-node`: general Midway backend; it is not the active knowledge-content write path unless the current code says otherwise.

Always re-check the current code before a large run because deployment URLs, branches, and schemas can change.

## Knowledge paths and manifest

The knowledge manifest is:

```text
knowledge/_tree.json
```

Each leaf has at least:

```json
{
  "label": "Transformer 架构原理",
  "key": "transformer-arch",
  "isLeaf": true,
  "filePath": "llm/basics"
}
```

The matching article path is deterministic:

```text
knowledge/{filePath}/{key}.md
```

For an existing leaf, never change `key`, `filePath`, hierarchy, or ordering merely while updating prose. For a new title, choose a stable lowercase kebab-case key, place it under an existing branch when possible, add exactly one leaf to `_tree.json`, and create the matching Markdown file in the same change.

Optional current leaf metadata includes `tags` and `currRank`. Preserve unknown metadata fields. Do not introduce planned fields such as `difficulty`, `prerequisites`, or `estMinutes` until both the manifest/API implementation and the user request support them.

## Batch selection

Support these safe modes:

- **Explicit**: exact keys or titles supplied by the user.
- **Subtree**: all leaves beneath a branch key such as `llm-rag`.
- **Missing**: manifest leaves whose expected Markdown file does not exist.
- **Audit**: existing articles selected by a concrete rule, such as stale version claims, missing sources, broken links, insufficient explanation, or missing high-value visuals.

Generate an inventory before writing. Treat orphan Markdown files, duplicate keys, and malformed leaves as blockers for the affected paths; do not silently delete or repurpose them.

For directory-order batches, also read `.codex/knowledge-update-history.json`. Skip entries already recorded with `status: "published"` or `status: "pending"` unless the user names them directly or asks for an audit/refresh. Treat pending entries as in-flight work to resume, not as permission to start a duplicate. Add every selected key to the same batch manifest so selection is deterministic and resumable.

## Article format

The reader UI already displays the manifest label as the page title. Keep article files body-only unless neighboring documents use a different convention:

1. concise opening mental model;
2. `## 为什么需要……`;
3. prerequisite concepts only when needed;
4. mechanism in dependency order;
5. practical example or code;
6. tradeoffs, failure modes, and misconceptions;
7. concise recap;
8. `## 参考资料` with descriptive links actually used.

The renderer supports GitHub-flavored Markdown, raw HTML, KaTeX math, fenced code highlighting, Mermaid code blocks, and standard images. Prefer image2 for the important architecture or operating-principle visual requested by the user. Use Mermaid only for exact supplementary relationships when it adds value and does not duplicate the generated image.

## image2 asset flow

For batch work, prefer the Git source-of-truth flow over calling the manager's per-image endpoint:

1. Generate and inspect the image with image2.
2. Save the accepted bytes under repository root `images/`.
3. Use a collision-resistant readable filename, normally `{article-key}-{concept-slug}.png`. When replacing an already-published image, use a new object name such as `{article-key}-{concept-slug}-v2.png` and update Markdown in the same change; do not rely on overwriting a cached OSS/CDN key.
4. Reference the final OSS URL in Markdown:

```markdown
![具体说明组件、方向和关系的替代文本](https://font-end-journey-resources.oss-cn-hangzhou.aliyuncs.com/images/{filename})
```

5. Confirm the local image exists and is included in the same change as the Markdown and any required manifest update.

On push to the configured branch, `.github/workflows/sync.yml` validates manifests and calls FaaS `/content/sync`; `syncChanged` uploads changed files under `images/` to OSS. Do not claim the public image is live until that workflow succeeds.

If the user later supplies a separate upload interface, follow its documented schema and use the stable returned URL. Do not assume that `/content/image/upload` returns a `url`: the current FaaS implementation returns `objectKey`, while the current manager editor expects `res.data.url`; direct batch publication should therefore use the repository image flow unless that mismatch has been fixed.

## Validation and publication

Run from `front-end-journey-resource`:

```bash
npm install
npm run validate:tree
```

Then review changed files and check:

- each selected leaf maps to `knowledge/{filePath}/{key}.md`;
- every Markdown image URL has a corresponding `images/{filename}` file;
- citations are reachable and support their nearby claims;
- time-sensitive claims name a version or date when useful;
- no secrets, local absolute paths, temporary URLs, or `IMAGE2_PENDING` blocks remain in a publishable batch.

Publishing the resource branch triggers asynchronous OSS and DB synchronization. Report repository validation separately from deployment synchronization; one does not prove the other.

### Standard production flow

Use this exact workflow for routine knowledge creates and updates:

1. Inspect `knowledge/_tree.json` on the current `master` branch and resolve the leaf by exact `key` or title.
2. Update `knowledge/{filePath}/{key}.md`. Preserve the existing leaf and path for an update; add one matching leaf only for a new article.
3. Generate and inspect only the high-value teaching images. Add accepted bytes under `images/` and reference their final OSS object URLs from Markdown. Use a new filename when replacing a published asset.
4. Keep the article, image assets, and manifest change in one branch so readers never observe a half-published revision.
5. Update `.codex/knowledge-update-history.json` in the same branch with stable keys, paths, action, batch/date, and `status: "pending"`; do not duplicate an existing key record.
6. Run `npm run validate:tree`, check image references, and review the scoped diff for unrelated files and secrets.
7. Open a pull request against `master`, then merge it after checks pass. A request to “发布” authorizes this branch → PR → merge flow.
8. Let `.github/workflows/sync.yml` call FaaS `/content/sync`, which publishes changed Markdown/images to OSS and refreshes the MySQL navigation manifest.
9. Wait for the resource Action result. A successful Action is the default completion signal; report the merge and Action outcome without manually opening the production website. Promote the batch records to `status: "published"` in the next batch or a dedicated record-only change; failed Actions remain pending and must not be skipped as completed.

Do not touch or redeploy `fe-journey-faas`, `front-end-journey`, `front-end-journey-manager`, or any investment service for a normal content release. Investigate those repositories only when the resource Action itself fails and its logs point there, or when the user explicitly requests an infrastructure change.

The “no manual production verification” rule applies only after a successful publication Action. Continue to inspect generated images before committing them and continue all pre-merge content, manifest, citation, path, and diff checks.
