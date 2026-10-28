# Building and checking an artifact

Paths in this reference are relative to the installed skill directory. Do not assume the current directory contains the skill. Python 3.10+ and its standard library are sufficient; no package or network access is needed.

## Build once, then edit the generated HTML

```bash
python /absolute/path/to/html-artifacts/scripts/build.py /path/to/output.html --title "Document title"
```

The output must not already exist. The builder escapes the title, fills the date, inserts the **exact** CSS/print script, derives the print script's CSP hash, and validates the result before writing. The bundled template is source with markers, not a directly deliverable HTML file. Never manually copy/retype the CSS, insert an external `<link>`, or use the old `awk` substitution recipe (it does not insert the print script/CSP).

Edit the output's body, title, language, metadata, and provenance for the requested subject. Keep `style#dads-css` and `script#dads-print` unchanged and leave the offline CSP early in `head`. The builder creates a working starter, not finished content: the checker intentionally cannot decide whether the prose satisfies the user's request.

## Components without class drift

Use the adapter APIs listed in [dads.md](dads.md). Modifiers are additive:

```html
<div class="dads-callout dads-callout--warning">
  <strong class="dads-callout__title">注意</strong>
  <p>State the constraint in words, not just color.</p>
</div>
<a class="dads-button dads-button--outline" href="#evidence">Read the evidence</a>
<details class="dads-details" open>
  <summary>Supporting detail</summary>
  <p>Initially visible for no-script printing; readers can collapse it.</p>
</details>
```

Use normal links rather than actionless buttons. A native `disabled` button is acceptable to illustrate an unavailable action; `aria-disabled` alone does not disable behavior. There is no tab behavior or arbitrary script extension point. The only executable script is the hash-approved print handler.

Wrap a wide table with `.dads-table`, `role="region"`, a useful `aria-label`, and `tabindex="0"`; use a caption and `th scope`. Make code blocks keyboard-focusable if they overflow. For prose use natural wrapping, not page-wide `overflow-x:hidden`. Diagrams use their own scroll region so 17px labels do not shrink to unreadable mobile text.

## Small necessary additions

Do not rewrite the core stylesheet or create new tokens. Prefer existing layout classes. If the requested explanation requires a specific rule, place it in a separate style block, using only known tokens and `artifact-*` classes:

```html
<style>
.artifact-equation { border-inline-start: 4px solid var(--color-key-900); padding-inline-start: var(--space-2); }
</style>
```

This is an explicit, browser-verified exception, not an invitation to redesign every document. Literal geometry such as `4px` borders, SVG coordinates, and media-query thresholds is legitimate; the former instruction that *every raw px value is a bug* was incorrect. Use tokens for palette, typography, spacing, shape, and elevation wherever applicable. CSS escapes, imports, `@font-face`, external `url()`, and custom token definitions are intentionally unsupported.

## Final validation

```bash
python /absolute/path/to/html-artifacts/scripts/check.py /path/to/output.html
```

Exit codes: **0** passes the static contract, **1** has violations, **2** is a CLI/read error. The checker reports locations for markup issues. It accepts ordinary HTTPS/HTTP/mail/phone links, local fragment links, inline SVG, and base64 PNG/JPEG/GIF/WebP images. It rejects resource links (including relative files), remote SVG uses/images, `srcset`, fetching CSS, unknown tokens/classes, changed/missing core CSS, arbitrary scripts/event handlers, unresolved markers, duplicate IDs, and broken fragment/label references. Its CSP independently blocks external loads, including future accidental resource types. It is neither an HTML/CSS standards validator nor a sanitizer for hostile input.

Follow SKILL.md's final visual/keyboard/print checklist after static success. A passing check alone is not evidence that a page looks right.

## Troubleshooting style failures

| Symptom | Cause and repair |
|---|---|
| Unstyled or partially styled | Opened the template directly, incomplete CSS insertion, or retyped CSS; rebuild into a new path and transfer only the content. |
| Missing font/blank diagram | Web-font, icon CDN, remote SVG, or adjacent asset dependency; use installed fonts and inline SVG/embedded rasters. Installed fonts may differ across platforms. |
| Unstyled component | Upstream `data-type` markup mixed with adapter classes, misspelled modifier, or absent base class; use the API in dads.md. |
| Unknown token | Old `--key-*`, `--gray-*`, or invented alias; use `--color-key-*` and `--color-neutral-solid-gray-*`. Do not suppress the check. |
| Button text loses contrast | Generic link states override a button class; retain bundled zero-specificity link selectors and explicit button states. |
| Dark canvas/light controls mismatch | Partial theme override; retain `only light` in metadata and root CSS. Forced colors remain user-controlled. |
| Mobile page overflow | Grid child minimum width or an unwrapped long identifier; use min-width-zero bundled layout and local scroll regions. |
| Folded details missing in print | Keep initial `open`, exact print script and its matching CSP; print preview must open collapsed details and restore them afterward. |

For maintainers: regression tests live at `tests/test_html_artifacts.py`; run `python -m unittest discover -s tests -p test_html_artifacts.py -v` from the repository root. Test in disposable output paths; never deploy desktop settings to validate this skill.
