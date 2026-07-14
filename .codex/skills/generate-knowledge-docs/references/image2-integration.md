# image2 integration

Use this reference only when a document needs generated illustrations.

## Required capability

The integration must support image generation with image2 from a prompt and requested aspect ratio. The resulting bytes must then reach the document's durable publication path.

For a standalone document using a user-provided upload interface, that interface must support these two logical operations, whether exposed as one endpoint or two:

1. Generate an image with image2 from a prompt and requested aspect ratio.
2. Upload the resulting image and return a stable, Markdown-renderable URL.

For FrontEnd Journey project mode, follow `fe-journey-integration.md`: save accepted bytes under the resource repository's `images/` directory and let its synchronization workflow publish them. Do not require a separate upload endpoint in that mode.

Otherwise, do not assume endpoint paths, authentication headers, request fields, response fields, or storage URLs. Read the actual interface documentation or configuration supplied by the user.

## Generation request

Translate the illustration specification into a prompt that explicitly states:

- educational diagram or explanatory illustration;
- subject, components, relationships, and reading order;
- exact essential labels and language;
- layout and aspect ratio;
- consistent visual system: clean vector-like shapes, restrained palette, high contrast, generous spacing;
- no decorative objects, logos, watermarks, fabricated UI, or extra labels;
- factual constraints that must remain true.

Favor one central idea per image. Split an overloaded diagram into multiple images. Ask image2 to keep labels short; explain details in the Markdown body.

## Verification and retry

Inspect the generated image before upload. Confirm that:

- all required components are present;
- arrows, hierarchy, sequence, and direction are correct;
- labels are readable and not duplicated or misspelled;
- the image adds information instead of merely restating the heading;
- no relationship or detail was invented.

Regenerate with a corrected prompt when a semantic error would mislead readers. Do not publish a known-wrong diagram.

## Upload and Markdown insertion

Publish only the accepted image. In standalone mode, capture the stable public or user-accessible URL returned by the upload interface, then insert:

```markdown
![Specific alt text describing the concept and relationships](stable-returned-url)
*图：一句话指出读者应该关注的关系或步骤。*
```

Use a deterministic, readable filename when the interface allows it, such as `event-loop-phases.png`. Never expose credentials, signed request headers, or other secrets in the document.

## Failure behavior

- If generation fails transiently, retry once with a simplified prompt.
- If upload fails transiently, retry once without regenerating the accepted image.
- If configuration, credentials, or endpoint documentation is missing, emit an `IMAGE2_PENDING` block using the format in `SKILL.md`.
- If the interface returns only a temporary local path, do not present it as a durable Markdown URL; keep the pending block and report the missing upload result.
