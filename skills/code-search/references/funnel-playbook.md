# Funnel Playbook

Concrete commands per funnel stage, fallbacks, and a worked example. Tool-agnostic; pattern syntax lives in the `ast-grep` skill.

## Stage 0 — Orient

```bash
# Repo shape and entry points
fd -t d -d 2 .                 # top-level layout
fd -e json -e toml -d 2 'package|go.mod|Cargo|pyproject'  # manifests
```
Read only the manifest(s) you found, not the whole tree.

## Stage 1 — Locate candidates

```bash
# Content: a symbol, string, or error message (cheap, returns file:line)
rg -n 'createSession' --type-add 'src:*.{ts,go,py,rs}' -t src

# Filename when you know roughly what it's called
fd -t f 'session'

# Structural when regex would false-positive (e.g. only the *call*, not comments/strings)
ast-grep run -p 'createSession($$$ARGS)' -l typescript src/*.ts   # see ast-grep skill for -l/--globs
```
Goal: shrink "whole repo" → a handful of files. Do **not** read them yet.

## Stage 2 — Map structure (outline's sweet spot)

```bash
# One candidate file → table of contents (exports, classes, methods) without reading it
ast-grep outline src/session.ts

# A whole module → its public/exported surface (bare directory path returns nothing; use a glob)
ast-grep outline src/session/*.ts
# or multiple extensions:
ast-grep outline src/session/*.{ts,tsx}

# What a file depends on (follow the graph cheaply, don't re-grep)
ast-grep outline src/session.ts --items imports
```
Decide from the map *which symbols and which line ranges* are worth opening.

> **Note:** `ast-grep outline <directory>` silently returns nothing. Always expand to files via a shell glob or list them from Stage 1's `fd`/`rg` output.

## Stage 3 — Zoom to one symbol

```bash
# Expand one symbol's members + signature + exact range
ast-grep outline src/session.ts --match SessionManager --view expanded

# Who calls it / where is it used (call sites, not definitions)
ast-grep run -p 'new SessionManager($$$ARGS)' -l typescript src/*.ts
```

## Stage 4 — Read only the survivors

```text
Read src/session.ts  offset=<line from outline>  limit=<span>
```
Read the whole file only if you're about to edit it or it's genuinely small.

## Fallback chain (when outline can't help)

`outline` is alpha and language-limited. Degrade gracefully:

1. **Structural still works?** `ast-grep run -p '<pattern>'` to find the construct.
2. **Language unsupported / broken syntax?** `rg -n -A 8 -B 2 '<anchor>'` — grep with just enough context to see the block.
3. **Last resort:** bounded `Read` (`offset`/`limit`), never the whole file blindly.

## Delegating to the Explore subagent

When locating means sweeping many directories or naming conventions, run the entire funnel inside the **Explore** subagent so intermediate file dumps never enter the main context. Ask it for the conclusion plus `file:line` anchors, then do Stage 4 yourself.

> Prompt shape: "Find where <behavior> is implemented. Use the funnel: rg/fd to locate, `ast-grep outline` to map candidates, return the defining file:line and a 2-line summary — do not paste full file bodies."

## Worked example — "How does logout invalidate the session?"

```bash
# 1. Locate — find the handler, not every mention
rg -n 'logout' src                              # → src/auth/handlers.ts:88

# 2. Map — TOC of that file instead of reading 400 lines
ast-grep outline src/auth/handlers.ts           # → logout() at 88, also imports sessionStore

# 3. Follow the import the map revealed
ast-grep outline src/auth/handlers.ts --items imports   # → sessionStore from ./session
ast-grep outline src/auth/session.ts --match sessionStore --view expanded  # → invalidate() at 142

# 4. Read only the two relevant spans
#    Read handlers.ts offset=88 limit=20   and   session.ts offset=142 limit=15
```
Four cheap steps, two small reads — versus reading two full files to answer one question.
