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
- Viewing an artifact from SSH or another device: [remote-preview.md](references/remote-preview.md), covering Wrangler/Cloudflare tunnels, private SSH forwarding, and preview cleanup.

Read the relevant build or design reference, not every resource. Reuse the stylesheet rather than recreating its tokens.
For a new artifact, read `references/build.md` and start from the bundled template with its CSS inlined. Read `references/diagrams.md` before constructing SVG diagrams; use `references/dads.md` when changing styles beyond the template.

## Content and Design Contract

Understand the source and the reader's purpose. For a plan, preserve its objective, completion evidence, constraints, checkpoints, and risks. Choose prose, diagrams, comparisons, or callouts according to the information; do not force a section count or a diagram where prose is clearer.

- Include a descriptive title, a short orientation paragraph, and source/date provenance. Add a table of contents when the page needs navigation.
- Inline CSS, JavaScript, and visual assets. Do not load fonts, scripts, or styles from the network.
- Use DADS classes and tokens, semantic headings, accessible contrast, labeled controls, and visible keyboard focus. Meaning must not depend on color alone.
- Match `lang` to the content. Japanese body text uses 16px/1.7 and 0.02em letter spacing; avoid justification and spacer characters for layout.
- Add interaction only when it helps the reader. Controls must work from disk and with a keyboard; print styles must preserve content.

## Explain from Zero

Apply an ELI5 lens: a reader with no background should grasp the central idea from the opening text and visual. Respect the requested audience and depth; use an adult, direct tone unless the artifact is actually for children.

- Start with what the subject does and why it matters, using a familiar situation or concrete example before technical names. Define necessary jargon where it first appears.
- Give each explanatory step one idea. Prefer a large, clearly labeled picture and a short caption when they explain a relationship or change better than prose; avoid decorative diagrams.
- Use analogies only when they clarify the mechanism. Connect their parts to the real subject and state any limit that could mislead the reader.
- Let readers progress from a simple overview to the details needed for their purpose. For plans, keep objectives, completion evidence, constraints, and risks explicit even when simplifying their wording.
- During the content check, ask whether a newcomer can explain what happens, why, and what to do next without decoding unexplained terms or diagrams. Revise the confusing part instead of adding a generic summary.

Inspired by the [ELI5 skill](https://github.com/anthropics/claude-plugins-community/blob/main/eli5/skills/eli5/SKILL.md).

## Remote Viewing

When the user needs to view an artifact on an SSH host or another device, follow [remote-preview.md](references/remote-preview.md) and return a reachable preview URL alongside the source path. A remote filesystem path or `xdg-open` on the SSH host is not a usable browser handoff. Keep the original HTML self-contained and serve only an isolated copy of the intended artifact.

Use a Cloudflare Quick Tunnel for content authorized for public sharing; use SSH forwarding or an existing access-controlled tunnel for private content. An SSH connection alone does not authorize public disclosure. Keep the preview alive for the viewing session and provide the stop/cleanup instructions; do not close it immediately after returning the link. Follow the calling workflow or user's instructions for when viewing ends.

## Completion

Save beside the source or in the working directory, named for the subject (`PLAN.html` for a plan). Verify that template placeholders are resolved, assets are self-contained, and the requested content is present. When a browser is available, inspect layout and any controls, fixing observed problems. Report rendering limitations if it is unavailable; do not claim a visual inspection from markup checks alone.

Return the artifact link and any material limitation. Do not repeat the document in chat or add a second generic self-audit after the relevant checks pass.
