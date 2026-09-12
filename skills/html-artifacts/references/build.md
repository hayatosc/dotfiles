# Building the Artifact

Run the commands from the skill directory, using a new or task-owned output path. Paths below that start with `assets/` or `references/` are relative to that directory.

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
