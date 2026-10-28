# Inline SVG diagrams

Use a diagram only when it clarifies a relationship, mechanism, comparison, or sequence better than prose. Keep a concise text explanation next to it. SVG must be inline: no Mermaid/CDN, remote `<use>`, icon font, external image, or fetch. Do not use a chart-shaped decoration in place of evidence.

## Readable geometry

- Use a `viewBox`, predictable coordinates, and real `<text>` labels; do not convert text to outlines or use HTML `foreignObject`.
- Labels should be at least 17 SVG units at the intended reading width, with 1.5-line spacing. Native SVG text does not wrap automatically; use explicit `tspan` lines, allow room for Japanese, and shorten labels rather than shrinking them.
- Give boxes at least 16 units of horizontal padding. Center text using `text-anchor="middle"`; use baselines/tspans, not a large `dy` guess. Keep connector endpoints outside text areas.
- Prefer two to four concepts per diagram. Split a large graph or make it vertically stacked rather than fitting every detail onto one canvas.
- For a wide diagram, retain readable intrinsic width inside `.dads-diagram-scroll`. The bundle sets a 42rem minimum SVG width there, **not** a page-wide minimum. The region needs `role="region"`, a meaningful `aria-label`, and `tabindex="0"` for keyboard scrolling.
- The supplied diagram class is responsive, so a standalone wide SVG would shrink its text on mobile. Do not omit the scroll wrapper merely to remove a scrollbar. At print time it fits the paper; if labels become too small, simplify or stack the diagram.

Use `var(--font-sans)` for SVG text and known canonical color tokens. Do not use the old `--key-*`, `--gray-*`, `--radius-*` aliases. Radius and coordinates on SVG shapes are numeric geometry; their presence is not a design-token violation. `rx="8"` is appropriate for a small diagram node, not a new global radius token.

## Accessible labeled flow: complete copyable pattern

Rename **all** IDs and fragment/ARIA references when including another copy. `title` names the picture, `desc` explains the connection without needing to see the arrows, and the caption relates it to surrounding prose. Color is redundant with labels and arrow direction.

```html
<figure>
  <div class="dads-diagram-scroll" role="region" aria-label="処理の流れ（横にスクロールできます）" tabindex="0">
    <svg class="dads-diagram" viewBox="0 0 672 224" role="img"
         aria-labelledby="flow-title flow-desc" xmlns="http://www.w3.org/2000/svg">
      <title id="flow-title">入力から確認までの3段階</title>
      <desc id="flow-desc">利用者が内容を入力し、システムが検証して、利用者に確認結果を返します。</desc>
      <defs>
        <marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="var(--color-key-900)"/>
        </marker>
      </defs>
      <g fill="var(--surface)" stroke="var(--color-neutral-solid-gray-420)" stroke-width="2">
        <rect x="24" y="56" width="176" height="112" rx="8"/>
        <rect x="248" y="56" width="176" height="112" rx="8"/>
        <rect x="472" y="56" width="176" height="112" rx="8"/>
      </g>
      <g fill="none" stroke="var(--color-key-900)" stroke-width="2" marker-end="url(#flow-arrow)">
        <path d="M 208 112 H 240"/>
        <path d="M 432 112 H 464"/>
      </g>
      <g fill="var(--text)" font-family="var(--font-sans)" text-anchor="middle" font-size="17">
        <text x="112" y="102" font-weight="700">1. 入力</text>
        <text x="112" y="132">利用者が記入</text>
        <text x="336" y="102" font-weight="700">2. 検証</text>
        <text x="336" y="132">内容を確認</text>
        <text x="560" y="102" font-weight="700">3. 結果</text>
        <text x="560" y="132">利用者に返す</text>
      </g>
    </svg>
  </div>
  <figcaption>入力内容を検証した後、結果を利用者に返します。</figcaption>
</figure>
```

The three node rectangles end at x=200/424/648; each arrow stays in the gap with 8 units of clearance. The labels have explicit vertical positions and fit within their nodes. The marker is local, not an external URL. Keep node fills/text paired if changing colors.

## Choose the pattern to match the explanation

| Need | Geometry and labeling |
|---|---|
| Sequence | Two to four same-size nodes with directional arrows and numbered headings; explain what each arrow transfers. |
| Nested ownership | Outer frame with an explicit owner label above its children; leave room between nested borders, and do not imply an execution sequence without arrows. |
| Comparison | Equal-size panels with the same axes/units; write differences in labels, not just red/green fills. A semantic table is often better. |
| Cycle | Three or four nodes around a center with unambiguous arrowheads; number the starting point and explain what repeats. |
| Mobile-first narrative | Stack nodes vertically with short down-arrows; a 320–360-unit viewBox can remain readable without a wide scroll region. Check at 320px before choosing this approach. |

Avoid arbitrary CSS in SVG. Inline `fill`, `stroke`, `font-*`, geometry and local `url(#id)` references are sufficient for these patterns. New CSS classes, if truly needed, follow the documented `artifact-*` extension contract; preserve the bundled stylesheet.

## Final diagram check

1. Read the `desc` alone: can a nonvisual reader understand the mechanism and direction?
2. Check every ID is unique and every marker/ARIA reference resolves. Run `scripts/check.py` on the **complete generated HTML**, not the snippet.
3. Inspect Japanese glyphs, label padding, arrowheads and connectors at desktop and mobile widths. Tab into the scroll region and scroll horizontally with the keyboard.
4. Inspect print output. If scaling to paper makes the labels small, stack/split the picture. Do not claim legibility based on the desktop screenshot alone.
