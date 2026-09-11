# Inline SVG diagrams for DADS artifacts

Hand-written SVG is the part of an artifact most likely to come out crooked. Copy a pattern from
here instead of inventing geometry, and keep every diagram inside `assets/dads.css` tokens — inline
SVG inherits the page CSS, so `fill="var(--key-50)"` works.

## Canvas conventions

- `viewBox="0 0 720 H"`, no `width`/`height` attributes. `.dads-diagram` makes it liquid.
  H: 160 for one row, 240 for two rows, +100 per extra row.
- Grid: 24px margin, boxes 160×64 (or 200×64 for long labels), 40px horizontal gap for the arrow,
  32px vertical gap between rows. Stick to multiples of 8, like the page spacing scale.
- Text: 15px labels, 13px annotations, never below 12px. `font-family: inherit`,
  `text-anchor="middle"`, `dominant-baseline="central"` so a label centers on the box center.
- Labels are short — around 全角10字. Anything longer belongs in the `figcaption` or a table.
- Stroke widths: 1.5 for boxes, 2 for arrows. Radius 8 (`rx="8"`).
- More than ~10 shapes means the content is a table, not a diagram. Switch devices.

## Accessibility (required on every figure)

```html
<figure>
  <svg class="dads-diagram" viewBox="0 0 720 160" role="img"
       aria-labelledby="fig1-t fig1-d">
    <title id="fig1-t">検証フロー</title>
    <desc id="fig1-d">実装、テスト、レビューの順に進み、テストが失敗した場合は実装へ戻る。</desc>
    ...
  </svg>
  <figcaption>図1 検証フロー。破線は失敗時の差し戻しを表す。</figcaption>
</figure>
```

`desc` states the structure in words so the diagram survives a screen reader. Meaning never rides
on color alone: pair every fill with a label, and every line style difference with a legend entry.

## Arrow marker (put one `<defs>` in the first diagram of the page)

```html
<defs>
  <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
          markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--gray-700)"/>
  </marker>
</defs>
```

Use it as `marker-end="url(#arrow)"`. A dashed return path adds `stroke-dasharray="6 4"`.

## Pattern A — linear flow

```html
<svg class="dads-diagram" viewBox="0 0 720 160" role="img" aria-labelledby="figA-t figA-d">
  <title id="figA-t">…</title><desc id="figA-d">…</desc>
  <g fill="var(--key-50)" stroke="var(--key-900)" stroke-width="1.5">
    <rect x="24"  y="48" width="180" height="64" rx="8"/>
    <rect x="270" y="48" width="180" height="64" rx="8"/>
    <rect x="516" y="48" width="180" height="64" rx="8"/>
  </g>
  <g fill="var(--text)" font-size="15" text-anchor="middle" dominant-baseline="central"
     font-family="inherit">
    <text x="114" y="80">実装</text>
    <text x="360" y="80">検証</text>
    <text x="606" y="80">記録</text>
  </g>
  <g stroke="var(--gray-700)" stroke-width="2" marker-end="url(#arrow)">
    <line x1="204" y1="80" x2="262" y2="80"/>
    <line x1="450" y1="80" x2="508" y2="80"/>
  </g>
</svg>
```

Grouping the shapes by role (`<g>` for boxes, one for text, one for arrows) keeps the markup short
and the styling consistent. Add a failure path as
`<path d="M 360 112 V 136 H 114 V 112" fill="none" stroke-dasharray="6 4" marker-end="url(#arrow)"/>`.

## Pattern B — checkpoint timeline

A horizontal rule with dots at each checkpoint; label above, evidence below.

```html
<svg class="dads-diagram" viewBox="0 0 720 160" role="img" aria-labelledby="figB-t figB-d">
  <title id="figB-t">…</title><desc id="figB-d">…</desc>
  <line x1="40" y1="88" x2="680" y2="88" stroke="var(--border-strong)" stroke-width="2"/>
  <g fill="var(--key-900)"><circle cx="120" cy="88" r="8"/><circle cx="360" cy="88" r="8"/><circle cx="600" cy="88" r="8"/></g>
  <g font-size="15" fill="var(--text)" text-anchor="middle" font-family="inherit">
    <text x="120" y="64">C1 分割</text><text x="360" y="64">C2 型検査</text><text x="600" y="64">C3 完了</text>
  </g>
  <g font-size="13" fill="var(--text-secondary)" text-anchor="middle" font-family="inherit">
    <text x="120" y="118">npm test</text><text x="360" y="118">tsc --noEmit</text><text x="600" y="118">bench</text>
  </g>
</svg>
```

## Pattern C — state or layered structure

Nest rectangles: outer `fill="var(--gray-50)" stroke="var(--border)"` as the container, inner boxes
as Pattern A. Put the container name at the top-left with `text-anchor="start"` at `x + 16`,
`y + 24`, 13px, `fill="var(--text-secondary)"`.

## Checks before shipping a diagram

- Every shape has a label; the legend explains any dash or fill difference.
- Nothing overflows the `viewBox` (largest `x + width` ≤ 720, `y + height` ≤ H).
- `title` and `desc` exist and `aria-labelledby` points at both ids, unique per page.
- Colors come from tokens; no raw hex.
- Read the `desc` alone: it should still convey the structure.
