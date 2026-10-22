# Digital Agency Design System: provenance and artifact API

This is an **unofficial document adapter**, not a full DADS implementation or a claim of government endorsement. Use the bundled stylesheet as the authority for available classes and tokens. Do not reconstruct it from this reference, import a framework, or combine it with upstream component markup unchanged.

## Official sources and snapshot

Reviewed 2026-10-22. Website guidance evolves independently of repository revisions; the bundle is pinned to the following source commits, **not** to a purported site-wide `v2.18.0` release. Research links below are ordinary navigation links, never runtime dependencies.

| Source | What this adapter takes from it |
|---|---|
| [DADS foundations](https://design.digital.go.jp/dads/foundations/) | Accessibility-first design principles; use the individual foundations below for context. |
| [Color](https://design.digital.go.jp/dads/foundations/color/) | Primitive, neutral, semantic and key roles; foreground/background pairing; text contrast 4.5:1 and meaningful UI/graphics 3:1. Do not assume the large-text exception or rely on color alone. |
| [Typography](https://design.digital.go.jp/dads/foundations/typography/) and [text styles](https://design.digital.go.jp/dads/foundations/typography/text-style/) | Noto Sans JP/Mono, 400/700 weights, Standard type scale; 16px/1.7 prose. |
| [Layout](https://design.digital.go.jp/dads/foundations/layout/), [spacing](https://design.digital.go.jp/dads/foundations/spacing/) | Fluid layouts, reading order, related-element spacing, 8px base and 32px desktop gutters. |
| [Corner shapes](https://design.digital.go.jp/dads/foundations/corner-shapes/) and [elevation](https://design.digital.go.jp/dads/foundations/elevation/) | Radius/elevation scales, not decorative shadows everywhere. |
| [Link text](https://design.digital.go.jp/dads/foundations/link-text/) | Descriptive destinations, underline and accessible link presentation. |
| [design-tokens, commit a96c66793fef07af96b16f5e87f688a263b66df0](https://github.com/digital-go-jp/design-tokens/tree/a96c66793fef07af96b16f5e87f688a263b66df0) · [examples/tokens.css](https://github.com/digital-go-jp/design-tokens/blob/a96c66793fef07af96b16f5e87f688a263b66df0/examples/tokens.css) | Complete generated CSS token block, copied verbatim into `assets/dads.css`: palettes, font sizes, line heights, radii, elevations, semantic/key aliases. |
| [HTML examples, commit caa50d731cf515cfa5eae0093121f11ac5299235](https://github.com/digital-go-jp/design-system-example-components-html/tree/caa50d731cf515cfa5eae0093121f11ac5299235) | Reference implementations, not dependencies. See the exact component files below. |
| [button.css](https://github.com/digital-go-jp/design-system-example-components-html/blob/caa50d731cf515cfa5eae0093121f11ac5299235/src/components/button/button.css) | Key 900/1000/1200 states, medium 96×48px minimum, 8px radius, 4px transparent double solid-button border, distinct disabled outline treatment. |
| [link.css](https://github.com/digital-go-jp/design-system-example-components-html/blob/caa50d731cf515cfa5eae0093121f11ac5299235/src/components/link/link.css) | Blue-1000 default, magenta-900 visited, blue-900 hover, orange-800 active; 1px underline/3px offset, 3px hover underline, yellow/black focus. |
| [table.css](https://github.com/digital-go-jp/design-system-example-components-html/blob/caa50d731cf515cfa5eae0093121f11ac5299235/src/components/table/table.css) | Gray-420 borders, gray-500 header borders, gray-100 header fill; 20px/16px cells and 12px/16px dense cells. |
| [disclosure.css](https://github.com/digital-go-jp/design-system-example-components-html/blob/caa50d731cf515cfa5eae0093121f11ac5299235/src/components/disclosure/disclosure.css) and [heading.css](https://github.com/digital-go-jp/design-system-example-components-html/blob/caa50d731cf515cfa5eae0093121f11ac5299235/src/components/heading/heading.css) | Native disclosure semantics, focus styling, Standard heading scale; adapter keeps native disclosure markers rather than copying its icon API. |

The upstream repositories are MIT licensed ([tokens license](https://github.com/digital-go-jp/design-tokens/blob/a96c66793fef07af96b16f5e87f688a263b66df0/LICENSE), [examples license](https://github.com/digital-go-jp/design-system-example-components-html/blob/caa50d731cf515cfa5eae0093121f11ac5299235/LICENSE)). The copyright/permission notice is inside `assets/dads.css`, so generated files retain it. Keep it when updating the snapshot.

## Token contract

The complete official token block is bundled, not fetched. Use canonical names:

| Role | Token | Value/meaning |
|---|---|---|
| Primary action | `--color-key-900` | Blue-900 `#0017c1`; hover key-1000, active key-1200 |
| Text | `--color-neutral-black` | `#000000` on white |
| Body/secondary gray | `--color-neutral-solid-gray-800` / `--color-neutral-solid-gray-700` | `#333333` / `#4d4d4d` |
| Border | `--color-neutral-solid-gray-420` | `#949494`; verify contrast on nonwhite surfaces |
| Focus | `--color-primitive-yellow-300` + `--color-neutral-black` | `#ffd43d` ring/fill and black outline |
| Success | `--color-semantic-success-1` / `--color-semantic-success-2` | Green-600 / green-800 |
| Error | `--color-semantic-error-1` / `--color-semantic-error-2` | Red-800 / red-900 |
| Warning | `--color-semantic-warning-yellow-1` / `--color-semantic-warning-yellow-2` | Yellow-700 / yellow-900 |
| Orange warning | `--color-semantic-warning-orange-1` / `--color-semantic-warning-orange-2` | Orange-600 / orange-800 |
| Size/shape | `--font-size-36`, `--line-height-140`, `--border-radius-8`, `--elevation-1` | Official rem/unitless/shadow values; no invented variants |

**Local adapter roles** (not official token names): `--text`, `--text-secondary`, `--text-muted`, `--surface`, `--surface-subtle`, `--border`, `--border-strong`, `--link`, `--link-visited`, `--link-hover`, `--link-active`, `--focus-yellow`, `--font-sans`, `--font-mono`, `--space-1/2/3/4/6/8`, `--measure`, `--container`. Spacing is 0.5/1/1.5/2/3/4rem; prose max-width 42rem, outer container 72rem. Never redefine these in a generated document.

Old short palette aliases (`--key-*`, `--gray-*`, `--green-*`) and `--radius-*` are **not** supported. Use `--color-key-*`, `--color-neutral-solid-gray-*`, `--color-primitive-green-*`, `--border-radius-*`. The checker rejects unknown `var()` references, even with a fallback.

The official `--font-family-sans` names Noto Sans JP; the adapter deliberately uses `--font-sans` with **installed** Japanese/system fallbacks instead. The same applies to monospace. No `@font-face` or font download is needed. Glyph shape/metrics can differ by OS; exact Noto rendering is not guaranteed offline.

## Typography and accessibility

- Body: 1rem/1.7, 0.02em tracking. At default browser settings this is 16px; do not lock the root size or disable zoom.
- Headings h1/h2/h3/h4: 36/28/22/18px-equivalent rem sizes; line heights 1.4/1.5/1.5/1.6. The mapping is this adapter's document choice, not a mandatory DADS heading hierarchy. h1/h2 tracking is 0.01em.
- 14px-equivalent rem is reserved for metadata/captions/code, never general prose. No Japanese justification, fake italics, or spacer characters for alignment.
- Set foreground/background together. Success/error labels use semantic step 2 on the matching light fill. Warning badge text uses **yellow-1000**, not semantic yellow-900: yellow-900 on yellow-50 is only 4.16:1, below the 4.5:1 text target. Meaningful UI/graphics need 3:1; test changed pairings rather than assuming a token guarantees contrast.
- Focus: 4px black outline, 2px offset, 2px yellow ring; ordinary links and summary also receive yellow fill. Never remove it. Forced colors may substitute system colors.
- Semantic headings in order, descriptive links, table captions and `th scope`, `alt` for images. SVG needs unique title/description IDs and a text alternative. Color is never the sole signal.
- Test at 320px and 200% text size. Reading order follows DOM order. Do not hide page overflow to conceal a layout bug.

## Component API: this bundle only

These classes are **adapter APIs**. Upstream uses different selectors for several components (for example `data-type="solid-fill"`, `data-size="md"` on buttons and `.dads-table` on the table itself). Do not assume identical class names imply identical markup.

| Component | Supported markup/classes |
|---|---|
| Shell | `.dads-header` > `.dads-header__inner` with `__title`, `__meta`; `.dads-layout` contains optional `.dads-toc` and `main.dads-prose`; `.dads-footer` |
| TOC | `nav.dads-toc` with `.dads-toc__title` and an `ol` of fragment links. Below 1024px it is in normal flow; desktop sidebar only exists when a TOC is present. |
| Text | `.dads-lead`, `.dads-meta`, `.dads-caption`; semantic headings style themselves |
| Columns | `.dads-grid-2`: one column until 768px, two after; min-width-zero children, 32px gutter |
| Panel | `.dads-card` and optional `.dads-card__title`; 16px radius, 24px padding, gray-420 border; local document panel, not an official card specification |
| Callout | `.dads-callout` + `--info`, `--notice`, `--success`, `--warning`, `--error`, or `--emphasis`; `.dads-callout__title`. Include a visible text label; border/fill is not the meaning. These are local adaptations, not official notification banners. |
| Badge | `.dads-badge` + `--success`, `--error`, `--warning`, `--info`, or `--neutral`; local text labels, not the official chip-label API |
| Button link | `a.dads-button.dads-button--solid` or `--outline`, with a real destination. Medium 48px minimum height. Normal link-state CSS has zero specificity so it cannot turn white button text dark. Native disabled buttons may illustrate unavailable actions; `aria-disabled` alone is not sufficient. |
| Table | `div.dads-table` wrapping a `table`; optional `dads-table--dense` on the wrapper. Give the wrapper `role="region"`, `aria-label`, `tabindex="0"` for keyboard scrolling; caption and scoped headers inside. |
| Code | `pre` > `code`, with `tabindex="0"`/label on overflow regions. Screen preserves code lines with local scroll; print wraps them. |
| Disclosure | `details.dads-details` with `open`, native `summary`, body. Initial open is deliberate no-script print fallback; the bundled script opens reader-collapsed details before print and restores state after. |
| Diagram | `svg.dads-diagram`; for a wide labeled diagram wrap in `.dads-diagram-scroll`, `role="region"`, `aria-label`, `tabindex="0"`. Minimum 42rem screen width preserves label size; print fits it to paper. |
| Utilities | `.dads-skip-link` pointing to `main#main` (`tabindex="-1"`); `.dads-visually-hidden` for assistive text |

Modifiers are additive: write `class="dads-badge dads-badge--success"`, not the modifier alone. Do not invent BEM suffixes such as `dads-card__heading`. New document-specific classes must use the `artifact-` prefix and be defined in a separate inline style with known tokens. No token overrides or arbitrary scripts.

## Deliberate robustness adaptations

1. **Deterministic embedding:** builder injects the complete CSS and hash-approved print script; the checker detects truncation or manual rewrites. Tokens are not reconstructed by a model.
2. **Offline dependencies:** reset, local fonts, inline SVG/raster, no framework. CSP blocks external resources and arbitrary script; ordinary source links remain navigable.
3. **Light-only:** metadata and root CSS declare `only light`. DADS token snapshots here do not supply a verified dark semantic mapping; partial background inversion would break contrast. A dark OS preference must still show the light document. This does not disable user forced colors.
4. **Responsive:** minmax/min-width-zero layout, long-word wrapping, local labeled scroll regions. No `overflow-x:hidden` on the page. If `:has()` is unavailable, the shell stays a readable single column rather than requiring a polyfill.
5. **Print:** keep provenance/header, hide navigation, wrap wide code/table content, open disclosures then restore state; no blanket `break-inside:avoid` on arbitrarily tall tables/code blocks. `::details-content` is additional enhancement, not the sole print mechanism.

## Diagnosed failure modes

- The old template shipped an unresolved CSS marker and relied on an inline instruction to paste the stylesheet. Partial/model-retyped CSS was neither prevented nor detected; the builder now assembles exact assets.
- “Self-contained” was previously prose-only: external fonts/imports/CDNs, sibling assets, and SVG resource URLs were not checked. Installed font fallbacks, a dependency scan, and CSP now enforce the offline contract.
- Pairing semantic warning yellow-900 with the pale yellow surface yielded only 4.16:1 for small badge text; the adapter uses yellow-1000 for that pairing.
- Short token aliases and undocumented component APIs encouraged drift from official examples. The adapter now embeds canonical tokens and explicitly documents where its markup differs; official medium button height is 48px, not the old 44px.
- `a:any-link` had greater specificity than `.dads-button--solid`, turning button text blue on its blue fill. Generic link states now use zero-specificity `:where()` selectors.
- Layout/reset gaps included shrinkable grid children, long identifiers, and an unconditional sidebar even without a TOC. Theme support was unspecified, allowing partial dark inversion.
- Setting `display:block` on children of closed `details` does not reliably expose the browser's hidden disclosure content for print. The bundled helper opens disclosures, guards duplicate print events, and restores their state; code/tables wrap on paper. Wide SVGs use local scrolling instead of shrinking their labels into unreadability.

## Maintaining the bundle

Fetch official sources only while maintaining the skill, never when opening a generated file. Compare upstream token changes, replace the whole token block from the pinned generated CSS, retain the license, update commit links/date, then rerun regression tests and browser checks. Review button/link specificity, no-TOC layout, 320px reflow, dark preference, forced colors, and print of a reader-collapsed disclosure. A static pass does not prove visual/accessibility conformance.

Generated footers may say they use a document adapter based on DADS and link to the official site. Do not imply official approval or label local panels/callouts/dark behavior as normative DADS components.
