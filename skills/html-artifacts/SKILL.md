---
name: html-artifacts
description: >
  Build a detailed, easy-to-understand, self-contained HTML explainer styled with the
  Digital Agency Design System (デジタル庁デザインシステム). Use when the user explicitly
  asks to explain something in HTML: "html-artifacts", "HTMLで分かりやすく説明して",
  "HTMLで図解して", "可視化して", "HTMLにまとめて", "make an HTML explainer", or when
  another skill (for example goalplan) instructs you to explain a plan or artifact with
  this skill. The deliverable is one human-facing .html file; agent-facing sources stay
  in Markdown. Do not trigger for ordinary chat replies, code-only answers, or short
  summaries the user did not ask to render visually.
---

# html-artifacts

Turn a specified subject into **one self-contained HTML file** that explains it in detail and is
easy to read. The reader is a human; the file must work when opened directly from disk.

Design system: the Digital Agency of Japan Design System (DADS), v2.18.0.

| File | Use |
|---|---|
| `assets/template.html` | Skeleton; the build command in step 3 starts from it |
| `assets/dads.css` | The stylesheet, inlined by that command — never retype it |
| `references/dads.md` | Full token tables and component rules; read before styling |
| `references/diagrams.md` | Copyable inline-SVG patterns, geometry, and arrow markers |

Read `references/dads.md` once per session before styling, and `references/diagrams.md` before
drawing the first diagram.

## Working principles

- **Explain, don't decorate.** Every visual element must carry meaning: a diagram shows structure,
  a table shows comparison, a callout marks a caveat. If a section has nothing spatial, write it
  as clean prose.
- **One file, no network.** CSS in `<style>`, JS in `<script>`, images as inline SVG or data URIs.
  No CDN, no external font. The artifact must render offline and when double-clicked.
- **Detail plus orientation.** Always include: a title, a one-paragraph TL;DR, a table of contents
  for long pages, and a provenance footer (what this explains, source path, generation date).
- **Japanese typography is a design decision.** Set `lang="ja"`, body 16px/1.7 with 0.02em
  letter-spacing, keep body text near 全角40字 (about 42em), and never use `text-align: justify`
  or spacer characters for layout.

## Workflow

### 1. Read and target

Read the complete source before designing: the file, plan, diff, or topic. Identify what is being
explained, who reads it, and what they should understand or do afterwards. If the source is a
`PLAN.md`, every section of the plan becomes content; do not summarize away the checkpoints.

### 2. Outline before HTML

Write a short outline first. For each section, name the **visual device** that carries it:

| Content shape | Device |
|---|---|
| Process, flow, architecture, state | Inline SVG diagram with labeled boxes and arrows |
| Options, trade-offs, before/after | Two- or three-column comparison, or a table |
| Hierarchy, taxonomy, timeline | Nested list, indented tree, or dated timeline |
| Evidence, results, commands | Table or code block with annotated result |
| Risk, constraint, caveat | Callout block (info / warning / error) |
| Long reference material | TOC + collapsible `<details>` sections |

Diagram sections carry the most risk of coming out crooked; take the geometry from
`references/diagrams.md` rather than inventing coordinates.

Aim for 3–7 sections. If the outline is a 1:1 copy of Markdown headings, the design is not adding
anything; restructure it around what the reader needs to see.

### 3. Build

Build the starting file with the CSS already inlined — never retype the stylesheet. From the skill
directory:

```bash
awk -v css="$PWD/assets/dads.css" \
    '/@@DADS_CSS@@/{while((getline l < css)>0) print l; next} {print}' \
    "$PWD/assets/template.html" > /path/to/output.html
```

Then edit `output.html`: fill the template's placeholders, delete the sections you do not need, and
add your own. Use DADS classes and tokens; do not invent colors, radii, or shadows. Content rules:

- Headings follow the DADS Standard scale: h1 `Std-36B-140`, h2 `Std-28B-150`, h3 `Std-22B-150`,
  h4 `Std-18B-160`.
- Body text: 16px, line-height 1.7, letter-spacing 0.02em. 14px only for tight UI metadata.
- Links: DADS default (blue-1000, underlined 1px, offset 3px; hover blue-900 with 3px underline).
- Diagrams: inline SVG only, built on the `references/diagrams.md` patterns; label every shape;
  never encode meaning in color alone.
- Interactivity: add only when it removes real work (sticky TOC, tabs for parallel views, a copy
  button for code). Every control must be keyboard reachable and work without a server.
- Print styles: expand `<details>`, hide navigation, keep code and tables on one page where
  possible.

### 4. Verify

Run these mechanical checks first — they catch what reading the markup does not:

```bash
grep -nEi '<link|<script[^>]+src=|@import|url\(["'"'"']?https?:' out.html   # must print nothing
grep -c -- '--key-900' out.html                                            # >0: CSS really inlined
grep -n '@@DADS_CSS@@\|<!-- ' out.html                                     # no leftover placeholders
# paired tags must balance; each line prints "<tag> <open> <close>"
for t in div section figure table details svg ul ol; do
  printf '%s %s %s\n' "$t" "$(grep -o "<${t}[ >]" out.html | wc -l)" "$(grep -o "</${t}>" out.html | wc -l)"
done
```

Then run the checklist below, open the file (`xdg-open <file>.html` on Linux, `open` on macOS), and
tell the user the path. If no browser is available, still report the path.

## DADS rules to apply (condensed)

These are the rules most likely to be violated; `references/dads.md` has the full tables.

- **Contrast**: text 4.5:1 minimum against its background (all sizes — DADS does not use the
  large-text 3:1 exception); non-text UI and borders 3:1. Always set foreground and background
  together; never rely on the browser default white.
- **Focus ring**: `outline: 4px solid #000` with `outline-offset: 2px` plus a `#ffd43d` yellow
  ring (`box-shadow: 0 0 0 2px`). Never remove or restyle it.
- **Links**: default blue-1000 `#00118f`, visited magenta-900 `#8b008b`, hover blue-900 `#0017c1`,
  active orange-800 `#c74700`; always underlined. Link text must state its purpose — no 「こちら」.
- **Key color**: blue-900 `#0017c1` for primary actions; hover blue-1000, active blue-1200. White
  text on key color passes contrast; do not place colored text directly on key fills.
- **Semantics**: success `#259d63`, error `#ec0000`, warning-yellow `#b78f00`, warning-orange
  `#fb5b01`. Keep the hue; adjust only lightness if needed.
- **Type**: Noto Sans JP, weights 400/700 only. Line-height 1.7 for body, 1.4–1.5 for headings.
  Avoid italic for Japanese.
- **Spacing, radius, elevation, layout**: use the `--space-*`, `--radius-*`, `--elevation-*` tokens
  and the `dads-*` classes; they already encode the 8px scale, the radius steps, and the 768px
  single-column-first layout. Any raw px value in your CSS is a bug — see `references/dads.md` §3–6.
- **Accessibility**: semantic HTML first, keyboard reachable, target size ≥24×24px, no justification
  or `&nbsp;` alignment, no image-of-text, headings in order, `alt`/`aria-label` on meaningful
  icons and diagrams.

## Anti-patterns

- A Markdown document ported 1:1 into stacked headings.
- "Card soup": every paragraph in its own rounded card with a gradient.
- Emoji as section icons; decorative hero banners on an internal document.
- Color-only encoding (red/green dots with no label or icon).
- Animations that run on load and distract from reading.
- Shrinking text below 16px, or above 14px metadata, to fit more onto a page.

## Output mechanics

- Name the file after the subject: `PLAN.html` next to `PLAN.md`, or
  `onboarding-flow-explainer.html` in the working directory. kebab-case, `.html`.
- Save beside the source when the source is a file; otherwise save in the working directory.
- One artifact per file; if two files belong together, put them in one folder.
- Report the path and offer to open it. Do not re-explain the whole artifact in chat.

## Self-check

Every artifact must satisfy all of these before you report it:

- [ ] Single self-contained file; opens offline with no console errors
- [ ] Title, TL;DR paragraph, and provenance footer present
- [ ] TOC for pages longer than three screens
- [ ] Content restructured around visuals, not 1:1 Markdown headings
- [ ] All colors, radii, and shadows come from `assets/dads.css` tokens
- [ ] Text contrast ≥4.5:1 and borders/non-text ≥3:1; foreground and background set together
- [ ] Focus ring intact and visible on every interactive element
- [ ] Meaning never depends on color alone
- [ ] Keyboard navigation works; interactive controls have labels
- [ ] `lang` matches the content language; Japanese text follows DADS typography
- [ ] Diagrams: nothing overflows the `viewBox`, every shape labeled, `title` + `desc` present
- [ ] Print styles do not cut off code, tables, or diagrams
