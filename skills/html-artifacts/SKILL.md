---
name: html-artifacts
description: Create a self-contained HTML explainer using the Digital Agency Design System when HTML is explicitly requested or another skill requires it. Skip ordinary chat and general app UI work.
---

# HTML Artifacts

Deliver one human-facing `.html` file that opens directly from disk, works offline, and explains the requested subject. Use the bundled Digital Agency of Japan Design System (DADS, v2.18.0) assets. Keep any agent-facing source in Markdown.

## Resources

- Starting markup and inline stylesheet: `assets/template.html` and `assets/dads.css`.
- Creating the file and applying the core design rules: [build.md](references/build.md).
- Token or component details when styling needs them: [dads.md](references/dads.md).
- SVG geometry and labeled diagram patterns when a diagram is useful: [diagrams.md](references/diagrams.md).

Read the relevant build or design reference, not every resource. Reuse the stylesheet rather than recreating its tokens.
For a new artifact, read `references/build.md` and start from the bundled template with its CSS inlined. Read `references/diagrams.md` before constructing SVG diagrams; use `references/dads.md` when changing styles beyond the template.

## Content and Design Contract

Understand the source and the reader's purpose. For a plan, preserve its objective, completion evidence, constraints, checkpoints, and risks. Choose prose, diagrams, comparisons, or callouts according to the information; do not force a section count or a diagram where prose is clearer.

- Include a descriptive title, a short orientation paragraph, and source/date provenance. Add a table of contents when the page needs navigation.
- Inline CSS, JavaScript, and visual assets. Do not load fonts, scripts, or styles from the network.
- Use DADS classes and tokens, semantic headings, accessible contrast, labeled controls, and visible keyboard focus. Meaning must not depend on color alone.
- Match `lang` to the content. Japanese body text uses 16px/1.7 and 0.02em letter spacing; avoid justification and spacer characters for layout.
- Add interaction only when it helps the reader. Controls must work from disk and with a keyboard; print styles must preserve content.

## Completion

Save beside the source or in the working directory, named for the subject (`PLAN.html` for a plan). Verify that template placeholders are resolved, assets are self-contained, and the requested content is present. When a browser is available, inspect layout and any controls, fixing observed problems. Report rendering limitations if it is unavailable; do not claim a visual inspection from markup checks alone.

Return the artifact link and any material limitation. Do not repeat the document in chat or add a second generic self-audit after the relevant checks pass.
