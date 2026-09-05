---
name: coding-style
description: Language-agnostic coding style, minimal code philosophy, readability principles, The Ladder, code change rules, and safety guards. Loaded before writing or reviewing code.
---

# Coding Style

Language-agnostic policy. Optimize code so others understand it in the shortest possible time. Language skills take precedence for language-specific idiomatic conventions.

## The Ladder

Before writing any code, stop at the first rung that satisfies the requirement. The ladder is a reflex that runs *after* understanding the problem (tracing flows and grepping callers):

1. **Needs to exist at all? (YAGNI)** — Skip speculative requirements.
2. **Already in this codebase?** — Search the repository to reuse existing helpers, types, or patterns before creating new ones.
3. **Stdlib covers it?** — Use standard library features over custom code.
4. **Native platform feature?** — Prefer platform built-ins (`<input type="date">`, CSS, DB constraints) over wrapper libraries.
5. **Existing dependency?** — Use installed packages; never add new dependencies for what a few lines can accomplish.
6. **Can it be a one-liner?** — Keep simple logic to a single line.
7. **Only then: minimum working code** — Write the simplest implementation that correctly solves the task.

## Readability & Clarity

- **Naming Precision**:
  - Suffix units (`delay_ms`, `size_bytes`) and critical qualifiers (`plaintext_password`, `raw_html` vs `escaped_html`).
  - Use unambiguous verbs and boundary names (distinguish `truncate` vs `remove`; use `first`/`last` [inclusive], `begin`/`end` [inclusive/exclusive], `min`/`max` [limits]).
- **High-Signal Comments**:
  - Never state the obvious. If code is messy, improve the code instead of adding comments.
  - Document *why*, not *what*: design rationale / director's commentary, constant tuning intent (`// deliberate: 50ms debounce`), and subtle traps/gotchas.
- **Decompose Expressions & Control Flow**:
  - Break compound logic into explanatory variables or apply De Morgan's laws to simplify/unnest negations (e.g. `!(a || b)` -> `!a && !b`).
  - Eliminate control-flow flags (e.g. `let done = false`) in favor of early `return`, `break`, or `continue`.
  - Narrow variable scope; eliminate useless intermediate variables.
- **Isolate Sub-problems & One Task at a Time**:
  - Extract pure utility / lower-level tasks out of main business logic.
  - Do one thing per function/block; separate distinct operations into logical paragraphs.

## Over-Engineering & Bloat Prevention

- **Avoid Premature Abstractions**: Do not create single-implementation interfaces, single-product factories, delegating wrappers, or static configs nobody changes.
- **Platform Native First**: Prefer built-in language/runtime/DB features over third-party packages or custom code.
- **Shortest Working Diff Wins**: Prefer boring over clever code. Never sacrifice correctness, input validation, or security for line-count brevity (no unsafe code-golfing).

## Code Changes & Bug Fixing

- **Root-Cause Fixes**: Fix bugs at the shared root-cause function. Grep all callers before editing; a single guard at the shared root is cleaner than scattering symptom guards across callers.
- **No Compatibility Layers**: Erase old code completely on breaking changes unless backward compatibility is explicitly requested. Fail fast with clear errors.
- **Deliberate Shortcut Comments**: Mark intentional simplifications or known ceilings with a `deliberate:` or `shortcut:` comment naming the limit and upgrade path:
  ```
  // deliberate: O(n²) scan — switch to index if list exceeds ~1000 items
  ```
- **Smallest Runnable Check**: Non-trivial logic should leave ONE minimal runnable check (`assert`-based self-check or small test file). Avoid heavy test frameworks unless requested.

## Output Format

Code first, followed by at most 3 short lines explaining what was skipped and when to add it:
`[code] → skipped: [X], add when [Y].`

## Safety Guards (Non-Negotiable)

Never simplify away:
- Input validation at trust boundaries
- Error handling preventing data corruption
- Security controls (authentication, authorization, secret safety)
- Basic accessibility (semantic HTML, keyboard navigation)
