---
name: code-search
description: Token-efficient codebase exploration funnel (locate -> outline -> zoom -> targeted read). Use to find definitions, trace call paths, or navigate large codebases without reading full files.
---

# Code Search Funnel

Explore unfamiliar code by descending a token-efficient funnel. Minimize bytes read into context per unit of understanding; full-file reads are a last resort.

## The Funnel

Descend only as far as the question requires:

| Stage | Question | Tool / Command |
|---|---|---|
| 0. Orient | What shape is this repo? | `fd`, read manifests (`package.json`, `go.mod`, `Cargo.toml`) |
| 1. Locate | Which file(s)? | `rg` (symbols/strings), `fd` (filenames) |
| 2. Map | What's in that file? | `ast-grep outline <file>` or `outline <dir>/*.ts` |
| 3. Zoom | Specific symbol/callers? | `outline <file> --match Foo --view expanded` or `rg` for callers |
| 4. Read | Target line range | `Read` with bounded line ranges |

## Core Heuristics

- **Trace All Callers First**: Before modifying any function or fixing a bug, grep all invocation sites. Locating the shared root cause prevents scattering symptom guards across callers.
- **Search for Codebase Reuse**: Search the repository (`rg`/`fd`) for existing helpers or types before creating new ones.
- **Budget and Stop**: Stop descending once you can answer the task. Skip the funnel for small/known files or single-file edits.
- **Delegate Wide Sweeps**: Delegate multi-directory exploratory sweeps to subagents to keep file dumps out of the main context window.
