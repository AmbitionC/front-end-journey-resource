# Complete the Remaining 91 Knowledge Documents

Date: 2026-07-18

## Goal

Finish every knowledge-tree leaf that is not yet recorded in the generation history. The batch starts from 209 recorded documents out of 300 and ends at 300/300.

## Scope

- Update exactly the 91 existing published articles selected by the difference between `knowledge/_tree.json` leaves and `.codex/knowledge-update-history.json` keys.
- Preserve useful, correct material. Substantially rewrite weak or obsolete documents; augment strong documents with missing evidence, current boundaries, one focused illustration, and references.
- Keep the knowledge taxonomy unchanged because all 300 leaves are already published.
- Promote the previous 50 pending history records to published, then append 91 pending records under batch ID `complete-remaining-91-2026-07-18`.
- Do not delete or overwrite old image assets. Articles that currently embed multiple old images will be changed to reference one new uniquely named illustration; unused legacy assets remain untouched.

## Content Standard

Every article must:

1. Explain the concept progressively: motivation, mental model, mechanics, practical use, pitfalls, and a short summary or checklist where appropriate.
2. Use current official specifications, official documentation, standards, or primary papers for material claims.
3. Put source links close to the claims they support and end with `## 参考资料` containing only sources actually used in the article body.
4. Avoid unsupported performance claims, universal prescriptions, and version-sensitive statements without an explicit boundary.
5. Embed exactly one newly generated, topic-specific illustration from the repository image directory.

## Illustration Standard

- One unique WebP image per article with a collision-free descriptive filename.
- Exact output size: 1672 × 941 pixels, RGB WebP.
- Bright warm-white canvas, readable dark text, clear hierarchy, no decorative black or near-black background.
- Automated brightness gates: mean luminance at least 185; pixels below 45 at most 10%; pixels at least 190 at least 60%; corner luminance at least 150.
- Image links must resolve locally and use the repository OSS URL convention.

## Execution Shape

Process the deterministic tree-order list in ten reviewable groups: nine groups of ten and a final group of one. Each group updates article text and its matching illustration before committing. Weak short documents receive full rewrites; long documents receive targeted accuracy, source, structure, and illustration improvements.

## Expected Repository Delta

- 91 Markdown articles
- 91 new WebP illustrations
- 1 generation-history JSON file
- this design document and one implementation plan
- no knowledge-tree mutation and no file deletions

Expected total changed files: 185.

## Publication Contract

After review and merge:

- GitHub Actions must finish successfully.
- The exact sync payload should report 0 changed manifests, 91 articles, 91 images, 0 deletions, and no errors. The manifest count is zero because `_tree.json` is intentionally unchanged.
- The final history contains 300 unique records: 209 published and 91 pending immediately after this batch merges.
- Final knowledge-document completion is 300/300 (100%).
