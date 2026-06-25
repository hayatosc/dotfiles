---
name: code-search
description: Strategy for exploring and understanding an unfamiliar codebase with minimal context/token cost. Descends a funnel — locate candidate files (fd/rg), map their structure cheaply with `ast-grep outline` instead of reading them whole, zoom to the one relevant symbol, then read only the precise line range. Use when the user needs to find where something is defined, understand how a feature or flow works, trace a call path, navigate a large or unfamiliar repo, or answer "where is X / how does X work / who calls Y" — especially before reading whole files. Also trigger whenever a full-file read or a broad grep would waste context and a structural table-of-contents would answer faster. Tool-agnostic orchestration layer; defer to the `ast-grep` skill for structural pattern syntax and rewrites.
---

# code-search

Explore unfamiliar code by descending a **funnel**, not by reading files. Each step is cheaper than the next; only expand the branch you need, and stop the moment you can answer the question.

## Core principle

**Minimize bytes read into context per unit of understanding.** A full-file `Read` is the *last* resort, not the first move. Most exploration questions are answered by a structural map plus a few targeted line ranges — never the whole file.

## The Funnel

Descend only as far as the question requires.

| Stage | Question | Tool | Why it's cheap |
|---|---|---|---|
| 0. Orient | What shape is this repo? | `fd`, read manifests (`package.json`, `go.mod`, `Cargo.toml`), entry points | One-time, tiny |
| 1. Locate | Which file(s)? | `rg` for strings/symbols/error messages; `fd` for filenames; `ast-grep run` when the target is structural | Returns `file:line`, no bodies |
| 2. **Map** | What's in that file? | **`ast-grep outline <file>`** / **`outline <dir>/*.ts`** | Syntax-aware TOC, no full read, no index |
| 3. Zoom | The one symbol? | `outline <file> --match Foo --view expanded`; call sites via `ast-grep run -p` | Members + exact line range only |
| 4. Read | The remaining bytes | `Read` with `offset`/`limit` on the range stage 3 gave | Reads only what survives the funnel |

## Heuristics (the part that actually saves tokens)

1. **Outline-first.** Before any full `Read` of an unfamiliar file longer than ~40 lines, run `ast-grep outline` on it. Decide *which symbols / line ranges* matter, then read only those.
2. **Follow imports, don't re-grep.** To traverse the dependency graph, `outline <file> --items imports` is cheaper than reading a file and grepping its references back out.
3. **dir → file → symbol.** Start broad with `outline <dir>/*.ext` (public/API surface), narrow to a file, then `--match` one symbol. Never jump straight to reading. Note: passing a bare directory path to `outline` returns nothing — always use a shell glob (e.g. `src/**/*.ts`).
4. **Budget and stop.** Once you can answer the question, stop descending. Do not read source you will not use or cite.
5. **Fallback chain.** `outline` is alpha and language-limited. If a language/file is unsupported or has broken syntax: `ast-grep run` with a structural pattern → `rg` with context (`-A/-B`) → finally a bounded `Read`.
6. **Parallelize the map.** When several files are candidates, `outline` them in one batch (multiple calls in a single turn) rather than serially.
7. **Delegate wide fan-out.** When "find it" means sweeping many dirs/naming conventions, hand the whole funnel to the **Explore** subagent so file dumps stay out of the main context — you get back only the conclusion.

## When NOT to funnel

Don't over-engineer. Skip straight to `Read` when: the file is already known and small, the task touches a single file you'll edit anyway, or you need exact bytes to modify (not just to understand). The funnel pays off on *unfamiliar* and *large* surfaces.

## Tool selection cheat-sheet

| You want… | Reach for |
|---|---|
| A file by name/path | `fd` / Glob |
| A string, symbol, or error-message literal | `rg` / Grep |
| A structural pattern (regex can't express it reliably) | `ast-grep run` — see the **`ast-grep`** skill |
| A file's or directory's structure without reading it | `ast-grep outline` |
| The precise final bytes | `Read` with `offset`/`limit` |

Concrete commands, fallbacks, and a worked end-to-end example:
- `references/funnel-playbook.md`

## ast-grep details live in the `ast-grep` skill

This skill owns the **exploration strategy** (the funnel and when to descend) and shows only the minimal `outline`/`run` invocations needed to follow it. For anything deeper about ast-grep itself — full `outline`/`run`/`scan` flags, the pattern/meta-variable syntax, debugging unmatched patterns, rule authoring, and rewrites — **load and read the `ast-grep` skill**. Do not reinvent ast-grep usage here; defer to it.
