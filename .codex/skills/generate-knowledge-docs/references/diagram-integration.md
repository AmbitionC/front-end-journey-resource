# Editable technical diagrams

User policy for Agent Journey, effective 2026-10-29. This policy overrides the broader diagram capabilities advertised by either tool.

| Meaning to explain | Renderer | Editable source |
|---|---|---|
| Ordered process, branches, approval, retry, state transitions, data pipeline | Archify `workflow`, `lifecycle`, or `dataflow` | `{key}-{concept}.archify.json` |
| Participants and messages over time, request/response ordering | Archify `sequence` | `{key}-{concept}.archify.json` |
| Components, layers, services, stores, deployment, ownership or trust boundaries | Excalidraw | `{key}-{concept}.excalidraw` |

Choose by what the diagram teaches, not by the article title. A “RAG architecture” view uses Excalidraw; its ingestion process or request sequence uses Archify. Split a mixed view when necessary. Existing correct Mermaid, SVG, screenshots, charts and Archify diagrams may remain; when an architecture diagram is redrawn, use Excalidraw. Quantitative charts still use standard plotting tools.

## Installed skills and reproducible rendering

Read the selected installed skill before drawing: normally `~/.codex/skills/archify/SKILL.md` or `~/.codex/skills/excalidraw-skill/SKILL.md`. Follow its schema, authoring references and actual CLI. On this device, `~/.codex/tools/diagram-toolchain.json` records verified versions and executable paths; resolve them rather than assuming `npx latest` is the reviewed version. Check the original upstream stable release when updating, preserve local workflow policy, and record the selected release/commit. Do not install unrelated updates as part of an article batch.

- **Archify:** author typed JSON using its mode schema, then run `node <archify-cli> finalize <type> <source.json> <output.html> --quality showcase --json`. Keep real validation/browser receipts and the HTML. Follow the installed export contract for SVG/PNG. Inspect the exported teaching view as well as the HTML. A successful automated receipt alone does not establish visual or factual quality.
- **Excalidraw:** keep a native `.excalidraw` scene. The installed CLI supports `node <excalidraw-cli> render <source.excalidraw> --format svg --out <output.svg>` and `render <source.excalidraw> --out <output.png> --scale 2`. Offline render avoids altering an existing shared canvas. If live editing is necessary, inspect/snapshot that canvas first; do not clear unrelated work. Share/upload is a separate action, not required for repository publication.

## Publication assets

1. Keep the editable source in the content repository beside the article, or in its established source directory. Use a new versioned object name for every replacement. Preserve the old image and its evidence until publication and rollback are verified.
2. Store reviewed static exports in `images/`; default to PNG for the current Markdown/PDF path. Reference the canonical resource OSS URL from Markdown; source JSON is for editing, not a reader image URL. SVG and PNG must show the same relationships. For Chinese labels, verify glyphs and record required fonts; an SVG that merely names an unavailable system font is not a portable export.
3. For routine replacements, use the static image path already supported by the website and PDF builder. Existing `/archify/*.html` embeds depend on frontend assets outside this repository: do not invent such a URL or claim deploying the content repository also deployed the frontend. A separate interactive upgrade must use its existing authorized workflow.
4. Inspect arrows, message order, boundary membership, conditions, labels, overlap, wrapping and readability at article/PDF size. Review technical meaning against the article's actual sources. Deterministic rendering can faithfully render an incorrect specification.
5. Every referenced SVG or iframe needs a reviewed PNG fallback in `knowledge/pdf-static-images.json`, including a newly added view. If the article is already pinned, refresh affected article/source/output fingerprints and retain complete coverage; do not weaken checks or remove unrelated entries. Run tree/release checks and the affected PDF preflight before publishing.
6. Publish article, source, export, required pins and history atomically through the existing resource PR/Action flow. Verify the actual synchronization result and PDF export as required by the current workflow.

## Historical replacement ledger

Maintain a separate diagram migration ledger keyed by article key **and current legacy asset SHA-256**. The existing `.codex/knowledge-update-history.json` tracks article processing; `published` or merged `pending` does not mean its generated image was replaced. Leave those records and source/heat identities intact for an image-only change.

Use observable states: `queued` → `drafted` → `rendered` → `reviewed` → `merged` → `published`. `published` requires a merge commit, successful content synchronization and any required PDF acceptance. Record tool/version, editable-source and exported-image hashes, replaced asset hash, and review evidence. A queue entry is not an active batch. Before resuming, check current article bytes, existing branches/PRs and the ledger to avoid duplicate work; re-inventory when the knowledge tree, article, or referenced asset bytes change.

Work in batches of 5–10 articles. Prioritize known pending repairs and semantic risk, then frequently referenced core knowledge, then stable tree order. Keep correct text, keys, hierarchy, interview heat and source identity unchanged unless separately justified. An article with both Archify and an old generated image remains in the legacy backlog until every in-scope generated image is replaced or explicitly reviewed and removed.

Report both article-processing progress and diagram-migration progress with separate denominators. Count only current tree leaves/current references for the audit; orphaned or unreferenced old images, Mermaid blocks and PDF-generated derivatives are not additional articles or AI-generated originals. Do not infer an exact image-model version from a PNG/WebP extension or a historical batch name. Separate direct provenance, documented historical attribution and unresolved candidates.

## Renderer or export failure

Keep the source and a `DIAGRAM_PENDING` draft, report the failing stage, and resume the same batch after repair. Do not silently substitute image2/image2.5 or another raster generation model. Never publish pending blocks, a fake export URL, a missing glyph, or a diagram whose known semantic error remains.
