# Digital Agency Design System (DADS) reference

Source: デジタル庁デザインシステムβ版 v2.18.0 (2026-09-09)
- Site: https://design.digital.go.jp/dads/
- Foundations docs: https://design.digital.go.jp/dads/foundations/
- HTML snippets: https://github.com/digital-go-jp/design-system-example-components-html
- Tailwind tokens: https://github.com/digital-go-jp/tailwind-theme-plugin

All values below are taken from the official design tokens and example components. When a rule
here conflicts with the artifact's need, follow DADS; do not invent values.

## 1. Color

### 1.1 Primitive palettes

Each hue has 13 steps (50 = lightest, 1200 = darkest). `key` is an alias for `blue`; the artifact
may point `--key-*` at any hue, but blue is the DADS default.

| Hue | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000 | 1100 | 1200 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Blue / key | #e8f1fe | #d9e6ff | #c5d7fb | #9db7f9 | #7096f8 | #4979f5 | #3460fb | #264af4 | #0031d8 | #0017c1 | #00118f | #000071 | #000060 |
| Light blue | #f0f9ff | #dcf0ff | #c0e4ff | #97d3ff | #57b8ff | #39abff | #008bf2 | #0877d7 | #0066be | #0055ad | #00428c | #00316a | #00234b |
| Cyan | #e9f7f9 | #c8f8ff | #99f2ff | #79e2f2 | #2bc8e4 | #01b7d6 | #00a3bf | #008da6 | #008299 | #006f83 | #006173 | #004c59 | #003741 |
| Green | #e6f5ec | #c2e5d1 | #9bd4b5 | #71c598 | #51b883 | #2cac6e | #259d63 | #1d8b56 | #197a4b | #115a36 | #0c472a | #08351f | #032213 |
| Lime | #ebfad9 | #d0f5a2 | #c0f354 | #ade830 | #9ddd15 | #8cc80c | #7eb40d | #6fa104 | #618e00 | #507500 | #3e5a00 | #2c4100 | #1e2d00 |
| Yellow | #fbf5e0 | #fff0b3 | #ffe380 | #ffd43d | #ffc700 | #ebb700 | #d2a400 | #b78f00 | #a58000 | #927200 | #806300 | #6e5600 | #604b00 |
| Orange | #ffeee2 | #ffdfca | #ffc199 | #ffa66d | #ff8d44 | #ff7628 | #fb5b01 | #e25100 | #c74700 | #ac3e00 | #8b3200 | #6d2700 | #541e00 |
| Red | #fdeeee | #ffdada | #ffbbbb | #ff9696 | #ff7171 | #ff5454 | #fe3939 | #fa0000 | #ec0000 | #ce0000 | #a90000 | #850000 | #620000 |
| Magenta | #f3e5f4 | #ffd0ff | #ffaeff | #ff8eff | #f661f6 | #f137f1 | #db00db | #c000c0 | #aa00aa | #8b008b | #6c006c | #500050 | #3b003b |
| Purple | #f1eafa | #ecddff | #ddc2ff | #cda6ff | #bb87ff | #a565f8 | #8843e1 | #6f23d0 | #5c10be | #5109ad | #41048e | #30016c | #21004b |

### 1.2 Neutral colors

| Name | Value | Notes |
|---|---|---|
| white / black | #ffffff / #000000 | Both are specified together with any foreground color |
| Solid gray 50 | #f2f2f2 | Page-level subtle background |
| Solid gray 100 | #e6e6e6 | Table header, code background |
| Solid gray 200 | #cccccc | Disabled borders |
| Solid gray 300 | #b3b3b3 | Disabled fill |
| Solid gray 400 | #999999 | Decorative only |
| Solid gray 420 | #949494 | Minimum gray for 3:1 non-text on white |
| Solid gray 500 | #7f7f7f | Strong table border |
| Solid gray 536 | #767676 | Minimum gray for 4.5:1 text on white |
| Solid gray 600 | #666666 | Minimum gray adjacent to black for 3:1 |
| Solid gray 700 | #4d4d4d | Secondary text |
| Solid gray 800 | #333333 | Table body text |
| Solid gray 900 | #1a1a1a | Strong text |

Opacity grays mirror solid grays using black at 5 %–90 % alpha (50/100/200/300/400/420/500/536/600/700/800/900). Prefer solid grays for text.

### 1.3 Roles

- **Key color**: the brand voice. Primary `blue-900 #0017c1` (CTA, active states, primary buttons); hover `blue-1000 #00118f`; active `blue-1200 #000060`. Secondary/tertiary are lighter/darker steps of the same hue. Primary color must reach 4.5:1 against the main background when used for text.
- **Common colors**: neutrals for text, borders, dividers, surfaces. Text/background contrast 4.5:1; non-text UI/borders 3:1.
- **Links (functional)**: default `blue-1000 #00118f`, visited `magenta-900 #8b008b`, hover `blue-900 #0017c1`, active `orange-800 #c74700`; always underlined (1px, 3px offset; 3px on hover).
- **Focus**: two-layer indicator, `yellow-300 #ffd43d` fill plus a black outline. Never change it.
- **Search highlight**: cyan or magenta — light background with a darker border of the same hue.
- **Accent colors**: hues outside the key color, used sparingly for callouts and emphasis. Check contrast like any other color.
- **Semantic colors**: success `#259d63` / `#197a4b`; error `#ec0000` / `#ce0000`; warning-yellow `#b78f00` / `#927200`; warning-orange `#fb5b01` / `#c74700`. Hue is fixed (error must look red); only lightness may be tuned. Icon/border 3:1, text 4.5:1.

### 1.4 Contrast rules (JIS X 8341-3:2016 / WCAG 2.2)

- Text and images of text: **4.5:1 minimum**, regardless of size. DADS does not apply the large-text 3:1 exception.
- UI components, graphical objects, focus indicators, borders: **3:1 minimum** against adjacent colors.
- Always specify foreground and background together; never leave the background to the browser default.
- Never use color as the only means of conveying information (WCAG 1.4.1). Pair color with text, icons, or patterns.
- Diagrams: if a chart's gridlines or series colors are below 3:1, place 4.5:1 text labels next to the values, and provide a text alternative that carries the same information.

## 2. Typography

- Families: `'Noto Sans JP', sans-serif` for everything; `'Noto Sans Mono', monospace` for code. Both are SIL OFL 1.1 and available as web fonts. Using OS system fonts is not prohibited, but do not block text scaling.
- Weights: only **N = 400** and **B = 700**.
- Minimum body size: 16 CSS px. 14 px is allowed only for constrained UI metadata (never below 14).
- Body line-height: 1.5 minimum; 1.7 is the DADS default for prose. Headings use 1.4–1.5.
- Letter-spacing: 0 for display and dense styles, 0.01em for 32–45 px Standard, 0.02em for Standard body/headings and Mono; 0 for code.

### 2.1 Standard (Std) — the default for documents

| Token | Size | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|
| Std-45N/B-140 | 45px | 400/700 | 1.4 | 0 |
| Std-36N/B-140 | 36px | 400/700 | 1.4 | 0.01em |
| Std-32N/B-150 | 32px | 400/700 | 1.5 | 0.01em |
| Std-28N/B-150 | 28px | 400/700 | 1.5 | 0.01em |
| Std-26N/B-150 | 26px | 400/700 | 1.5 | 0.02em |
| Std-24N/B-150 | 24px | 400/700 | 1.5 | 0.02em |
| Std-22N/B-150 | 22px | 400/700 | 1.5 | 0.02em |
| Std-20N/B-150 | 20px | 400/700 | 1.5 | 0.02em |
| Std-18N/B-160 | 18px | 400/700 | 1.6 | 0.02em |
| Std-17N/B-170 | 17px | 400/700 | 1.7 | 0.02em |
| Std-16N/B-170 | 16px | 400/700 | 1.7 | 0.02em |
| Std-16N/B-175 | 16px | 400/700 | 1.75 | 0.02em |

Recommended heading mapping for artifacts: h1 → Std-36B-140, h2 → Std-28B-150, h3 → Std-22B-150, h4 → Std-18B-160, body → Std-16N-170.

### 2.2 Other styles

- **Display (Dsp-64/57/48, B/N, 140 %)**: hero/head copy only, letter-spacing 0.
- **Dense (Dns 14/16/17, B/N, 120–130 %)**: data tables and dense admin UI, letter-spacing 0.
- **Oneline (Oln 14/16/17, B/N, 100 %)**: single-line UI labels such as buttons, letter-spacing 0.02em.
- **Mono (Mono 14/16/17, B/N, 150 %)**: code, letter-spacing 0. Same sizes B/N.

### 2.3 Text presentation

- Body text width: target **半角80字 / 全角40字** (about 42em) per line. Wider blocks need compensating devices (short lead, TOC, chunking).
- Do not use `text-align: justify` or spacer characters (`&nbsp;`, ideographic spaces) for layout; they break screen readers and create rivers.
- Do not use italic for Japanese (fonts compose fake obliques); keep italics out of long passages.
- Paragraph spacing: at least 1.5× the line box (≥2.25× font size) between paragraphs.
- Do not render text as images; exceptions are logos and cases where the text itself is the object.
- Text must survive 200 % zoom and reflow to a 320 px viewport without loss of function.

## 3. Spacing

- Base unit: **8 CSS px**. A style guide usually defines 3–5 steps; DADS examples use 8 / 24 / 64.
- Same-type elements share the same spacing; hierarchy is shown by spacing size (more important = more space).
- Related elements sit closer together than unrelated ones (e.g. image and its caption closer than caption and body).
- Section separation: 48–64px; heading to body: 16–24px; inline element gaps: 8px.
- Responsive: scale spacing with the viewport; keep proportions consistent.
- Never use whitespace characters for alignment.

## 4. Corner shapes (radius)

| Shape | Radius | Typical use |
|---|---|---|
| None | 0 | Tables, separators, full-bleed surfaces |
| Small | 8px | Buttons, inputs, tags |
| Medium | 12–16px | Cards, panels (16 px square / 12 px wide) |
| Large | 16–32px | Large containers, feature panels |
| Full | 50 % of height/short side | Pills, avatars, circular icons |

Roundness reads stronger on small shapes: adjust the radius per component size so roundness looks uniform. Mixing shape styles can emphasize one element, but do it deliberately.

## 5. Elevation

- Drop shadows, 8 levels: `--elevation-1` `0 2px 8px 1px rgba(0,0,0,.1), 0 1px 5px 0 rgba(0,0,0,.3)` up to `--elevation-8` `0 14px 40px 7px rgba(0,0,0,.1), 0 3px 16px 0 rgba(0,0,0,.3)` (see `assets/dads.css` for all values).
- Level 0 (no shadow) is the default for nearly everything. Shadows mark overlays (dialogs, popovers, snackbars) or hover lift.
- Shadows cannot satisfy contrast: give every elevated element a border with 3:1 contrast against its surface.
- Use a small, consistent set of levels; levels are relative and may change by context.

## 6. Layout

- Grid: 12 columns for complex pages, 1 column for documents; margins on both sides, gutters between columns.
- Gutter width: at least **2× the body font size** (32 px with 16 px text).
- Breakpoint: **768 px** — below is mobile/tablet, at and above is desktop. Liquid (fluid-width) layouts only; don't hide the horizontal scrollbar.
- Keep DOM order equal to visual/reading order; don't use grid `order` to rearrange content.
- Reading measure: about 42em for Japanese prose.

## 7. Link text

- State colors and underline as in §1.3. Underline is mandatory so links are recognizable without color.
- Link text must describe its destination; avoid 「こちら」「ここ」「詳細はこちら」as the whole link. Link the noun phrase, or the whole sentence if needed.
- Target size: at least 24×24 CSS px, or 16 px height with 4 px vertical spacing that does not overlap neighbors.
- Links opening a new tab or pointing to non-HTML resources need an icon with alternative text (e.g. "新しいタブで開きます", "PDF・100KB").

## 8. Accessibility essentials

- Semantic structure first: `header`, `nav`, `main`, `section` with `aria-labelledby`, `footer`; headings in order, no level skips.
- Focus visible on every interactive element: `outline: 4px solid #000; outline-offset: 2px; border-radius: 4px; box-shadow: 0 0 0 2px #ffd43d`.
- Icons are paired with labels; icon-only controls get `aria-label`. Decorative SVGs get `aria-hidden="true"`; meaningful diagrams get `role="img"` and a `<title>`/`<desc>`.
- Forms: `<label for>`, error text tied with `aria-describedby`, no placeholder-as-label.
- Tables: `<caption>` or a preceding heading; header cells use `<th scope>`.
- Skip link to `#main` as the first focusable element.
- Motion: respect `prefers-reduced-motion`; no auto-playing animation that carries meaning.

## 9. Component specifications

### Button

- Font: 16px bold, line-height 1, letter-spacing 0.02em; padding makes the target at least 44 px tall.
- Radius 8px (small 6px, link-like 4px).
- Solid fill: background key-900 `#0017c1`, white text; hover key-1000 with 1px underline on the label; active key-1200; disabled gray-300 fill with gray-50 text.
- Outline: white background, 1px `currentColor` border, key-900 text; hover key-200 background and key-1000 text.
- Focus-visible uses the standard two-layer ring (black outline + yellow shadow), never removed.
- Text links styled as buttons still need underline semantics; don't fake buttons with `<div>`.

### Card / panel

- Radius 16px, 1px border `solid-gray-420`, white surface; optional `--elevation-1` only if the card floats above other content.
- Padding 16–24px; heading first; one idea per card; avoid nesting cards.

### Table

- Border color `solid-gray-420` (`solid-gray-500` for header cells), body text `solid-gray-800`.
- Cell padding 20px/16px (dense variant 12px/16px, line-height 1.3).
- Column headers: bold, background `solid-gray-100`, text `solid-gray-900`, `scope="col"`.
- Keep numeric alignment consistent; right-align numbers.

### Callout / notice block

- Info: 1px key-700 border, white or key-50 background, radius 8px.
- Notice: 1px gray-420 border with `solid-gray-50` background and a bold title row.
- Emphasis/disclosure: square corners with a thick left border (4px) in the semantic color.
- Semantic colors per §1.3; pair the color with an icon and a text label ("エラー", "注意") so meaning survives grayscale.

### Tabs and disclosure

- Tabs use 4px radius, 1px border for the active tab, and real `<button role="tab">` semantics with arrow-key support.
- Prefer native `<details>/<summary>` for collapsible reference material; style the marker, keep keyboard behavior free.

### Code

- `Noto Sans Mono`, 14–16px, line-height 1.5, letter-spacing 0.
- Block code: `solid-gray-50` background, 1px `solid-gray-200` border, radius 8px, horizontal scroll (never wrap code), copy button optional.
- Inline code: `solid-gray-100` background, no border, 0.1em horizontal padding.

## Attribution

Artifacts generated with this skill should note in the footer that they follow the デジタル庁デザインシステム (Digital Agency Design System), with a link to https://design.digital.go.jp/dads/.
