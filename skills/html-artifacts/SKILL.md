---
name: html-artifacts
description: Create a self-contained HTML explainer using the Digital Agency Design System when HTML is explicitly requested or another skill requires it. Skip ordinary chat and general app UI work.
---

# HTML Artifacts

Deliver one human-facing `.html` file that opens from disk and works offline. Use the bundled Japanese Digital Agency Design System (DADS) document adapter, not a CDN or a framework. Keep agent-facing source in Markdown. This is an unofficial document adapter, not a complete implementation of every DADS component.

## Procedure

### 1. Understand the reader and source

Identify the subject, audience, purpose, and evidence before choosing the structure. For plans, preserve objectives, completion evidence, constraints, checkpoints, and risks. Include a descriptive title, a short orientation, and source/date provenance. Add a TOC only when useful; do not force a section count or diagram.

Explain from zero: begin with a concrete situation and what the subject does, then introduce technical names. Define jargon on first use, give each step one idea, and use a labeled picture only when it explains more clearly than prose. Use analogies only when their connection and limits are explicit; keep an adult, direct tone unless writing for children. A newcomer should understand what happens, why, and what to do next.

### 2. Build mechanically — never retype the CSS

Read [build.md](references/build.md). Resolve the skill directory from this file's location, not the current project's working directory. With Python 3.10+:

```bash
python /absolute/path/to/html-artifacts/scripts/build.py /absolute/path/to/output.html --title "Subject"
```

The builder reads `assets/template.html`, embeds **all** of `assets/dads.css` and `assets/print.js`, and inserts an offline Content Security Policy (CSP). It refuses to overwrite an existing file. No downloads, package install, server, bundler, or adjacent asset folder is needed. In this repository, use its Python runner (`uv run python` also works).

### 3. Edit the content, not the foundation

Edit the generated file. Replace the starter's explanatory content, provenance, and TOC; remove unneeded sections. Keep `style#dads-css`, `script#dads-print`, the CSP, charset, viewport, and `only light` color-scheme metadata intact.

- Inline SVG and embedded raster images only. No remote/local stylesheet, script, font, image, iframe, import, fetch, or analytics dependency. Ordinary source hyperlinks may point to the web; label local source files as text rather than broken relative links.
- Use semantic HTML and the bundled classes/tokens. Read [dads.md](references/dads.md) for the class API, official sources, and local adaptations. Do not mix upstream `data-type`/`data-size` APIs with this adapter's modifiers.
- Use [diagrams.md](references/diagrams.md) before adding SVG. Give each meaningful diagram a title, description, labels, and a text alternative. Put wide diagrams in a labeled, keyboard-focusable `.dads-diagram-scroll` region.
- Use installed font fallbacks; missing Noto must not hide text. Match `lang` to the content. Body is 1rem/1.7 (16px at the default setting). Preserve browser zoom and reflow.
- Default to links and native disclosures. Keep disclosures initially `open` so no-script printing retains content; the bundled script also opens any reader-collapsed disclosure for printing and restores it afterward. Do not add tabs, dead buttons, arbitrary JavaScript, or event-handler attributes.
- Stay light in dark OS settings: this adapter has no verified official dark palette. Do not invert only the page background or invent a dark token set. Respect forced colors and reduced motion.
- Prefer existing components. If essential, put small document-specific rules in a **separate** inline `<style>`; new classes must be `artifact-*` and have definitions there. Use known tokens, never redefine them or alter the bundled CSS. Browser-check these rules; static validation is not a CSS parser or contrast audit.

### 4. Final self-check — fix failures before delivery

Run after the last edit:

```bash
python /absolute/path/to/html-artifacts/scripts/check.py /absolute/path/to/output.html
```

Then check the actual file in a browser, with networking disabled when possible:

1. **Content:** starter prose/placeholders are gone; requested evidence, sources, dates, and next actions remain. Read diagram descriptions independently; they must convey the meaning.
2. **Offline:** no resource requests, failed assets, CSP violations, or console errors. Source hyperlinks are navigation, not embedded dependencies.
3. **Mobile/desktop:** inspect screenshots at 390px and 1280px; additionally check reflow at 320px/200% text size. No page-wide horizontal overflow; only labeled, focusable code/table/diagram regions may scroll. Inspect actual Japanese glyphs and long URLs.
4. **Keyboard/states:** follow the skip link and TOC, tab to scroll regions, toggle disclosures, and inspect visible focus and button-link contrast (including visited/hover). No color-only meaning.
5. **Dark/print:** emulate dark preference (the page must remain legible light), print with a disclosure closed, verify its body prints, and check wide tables/code and page breaks. Preserve content without JavaScript by leaving disclosures open initially.

The checker enforces the bundled asset/policy contract, known classes/tokens, and conservative offline resource rules. It does **not** prove CSS syntax, layout, contrast, accessibility, or correctness of arbitrary HTML. If no browser is available, say which visual/interaction checks remain unverified; never claim screenshots from static checks alone.

### 5. Deliver

Save beside the source or in the working directory, named for the subject (`PLAN.html` for a plan). Return the artifact link and material limitations, not a copy of the document or a second generic self-audit.

For SSH/another device, follow [remote-preview.md](references/remote-preview.md). A remote path or `xdg-open` is not a usable viewing handoff. Serve only an isolated copy, use a public tunnel only for content authorized for public sharing, otherwise use SSH forwarding/access control, and provide cleanup instructions. Keep the original HTML offline-safe.

## Resources

- `assets/template.html`, `assets/dads.css`, `assets/print.js`: mechanically embedded sources.
- `scripts/build.py`, `scripts/check.py`: standard-library build and final contract check.
- [build.md](references/build.md): editing patterns and troubleshooting.
- [dads.md](references/dads.md): official provenance, tokens, adapter component API.
- [diagrams.md](references/diagrams.md): readable inline SVG patterns.
- [remote-preview.md](references/remote-preview.md): secure remote handoff.

The explain-from-zero approach is inspired by the [ELI5 skill](https://github.com/anthropics/claude-plugins-community/blob/main/eli5/skills/eli5/SKILL.md).
