---
name: code-search
description: Token-efficient codebase exploration funnel (locate -> outline -> zoom -> targeted read). Use to find definitions, understand flows, trace call paths, or navigate large/unfamiliar codebases without reading full files.
---

# code-search

Explore unfamiliar code by descending a **funnel**. Minimize bytes read into context per unit of understanding. Full-file reads are the last resort.

## The Funnel

Descend only as far as the question requires.

| Stage | Question | Tool | Why it's cheap |
|---|---|---|---|
| 0. Orient | What shape is this repo? | `fd`, read manifests (`package.json`, `go.mod`, `Cargo.toml`), entry points | One-time, tiny |
| 1. Locate | Which file(s)? | `rg` (strings/symbols/errors), `fd` (filenames), `ast-grep run` (structural) | `file:line` only, no bodies |
| 2. **Map** | What's in that file? | **`ast-grep outline <file>`** / **`outline <dir>/*.ts`** | Syntax-aware TOC without full read |
| 3. Zoom | The one symbol? | `outline <file> --match Foo --view expanded`; call sites via `ast-grep run -p` | Member line ranges only |
| 4. Read | Target lines | `Read` with line ranges from stage 3 | Reads only what survives the funnel |

## Heuristics

1. **Outline-first**: Run `ast-grep outline` on unfamiliar files >40 lines; read only relevant line ranges.
2. **Follow imports**: Use `outline <file> --items imports` to trace dependencies instead of re-grepping.
3. **dir → file → symbol**: Start broad with `outline <dir>/*.ext`, narrow to file, then `--match` one symbol. (Note: bare directory paths return nothing; always use shell globs like `src/**/*.ts`).
4. **Budget and stop**: Stop descending once you can answer the question.
5. **Fallback chain**: Unsupported syntax/languages → `ast-grep run` → `rg -A/-B` → bounded `Read`.
6. **Batch outline**: Outline multiple candidate files in a single turn.
7. **Delegate wide sweeps**: Delegate multi-directory exploratory sweeps to subagents to keep file dumps out of main context.

## When NOT to funnel
Skip straight to `Read` for small/known files, direct single-file edits, or when exact bytes are needed for immediate changes.

## Tool Selection

| Need | Tool |
|---|---|
| File path | `fd` / Glob |
| String, symbol, error literal | `rg` |
| Structural pattern | `ast-grep run` (see `ast-grep` skill) |
| File/directory structure | `ast-grep outline` |
| Target line range | `Read` with offset/limit |

Concrete commands, fallbacks, and worked examples: `references/funnel-playbook.md`. For deep pattern syntax and rewrites, see the **`ast-grep`** skill.
