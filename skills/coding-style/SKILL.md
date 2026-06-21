---
name: coding-style
description: >
  Coding style guidelines, design principles, and code change discipline.
  Covers The Ladder (dependency decision framework), YAGNI, minimal code
  philosophy, code change rules (touch only what's needed, match existing
  style), error handling strategy, and non-negotiable safety guards
  (trust-boundary validation, data-loss handling, security, accessibility).
  Loaded automatically before any code writing task via AGENTS.md rule.
  Use whenever the user asks to write code, review code, refactor, add
  a feature, fix a bug, or plan an implementation — even if they don't
  mention "coding style" explicitly.
---

# Coding Style

Lazy means efficient, not careless. The best code is the code never written.

This skill sets language-agnostic policy. Language-specific skills (e.g., typescript-best-practices, golang-best-practices) provide idiomatic detail within the same philosophy. When a language skill's recommendation conflicts with this policy, this skill takes precedence — except for language-idiomatic patterns (e.g., Go's explicit error propagation), where the language skill's judgment is respected.

## The Ladder

Before writing any code, stop at the first rung that holds:

1. **Does this need to exist at all?** — Speculative need = skip it, say so in one line. (YAGNI)
2. **Stdlib does it?** — Use it.
3. **Native platform feature covers it?** — `<input type="date">` over a picker lib, CSS over JS, DB constraint over app code.
4. **Already-installed dependency solves it?** — Use it. Never add a new one for what a few lines can do.
5. **Can it be one line?** — One line.
6. **Only then:** — the minimum code that works.

Two rungs work → take the higher one and move on.
The first lazy solution that works is the right one.

When choosing between libraries, research before committing. Prefer the standard library; if an external dependency is unavoidable, verify it's maintained, small, and doesn't duplicate what's already installed.

## Design

### Reuse first

- Before writing any new function, type, or utility, search the existing codebase for similar implementations. Reuse them via import / source / require. Do not re-implement.

### Keep it small

- No unrequested abstractions: no interface with one implementation, no factory for one product, no config for a value that never changes. During refactoring, extract an interface or function only when there is a concrete, immediate consumer — not for hypothetical future use.
- No boilerplate, no scaffolding "for later" — later can scaffold for itself.
- No error handling for impossible or internal-only scenarios.
- If a solution is 200 lines but could be 50, rewrite it.
- Deletion over addition. Boring over clever — clever is what someone decodes at 3am.
- Minimize new files. Shortest working diff wins. (In large projects, follow the existing module structure rather than forcing everything into one file.)
- Two stdlib options, same size? Take the one that's correct on edge cases. Lazy means writing less code, not picking the flimsier algorithm.

### No backward compatibility by default

Backward compatibility, compatibility layers, aliases, silent fallbacks, and ad-hoc alternate paths are not added unless explicitly requested. When making a breaking change, erase all historical traces cleanly — modify the codebase as if the new way was always the way. The goal is a codebase that reads as if the old design never existed, not one that carries archaeological layers of past decisions.

Fail fast: if something cannot safely continue, raise a clear error. Do not silently swallow failures or provide default-value fallbacks (e.g., `os.getenv("KEY")` with a default instead of erroring on a missing required value).

## Code Changes

- Touch only what the task requires; don't improve adjacent code or formatting.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.
- Remove only imports/variables/functions that YOUR changes made unused.
- Complex request? Ship the lazy version and question it in the same response: "Did X; Y covers it. Need full X? Say so." Never stall on an answer you can default.
- Mark deliberate simplifications with a short comment explaining the intent, so simple reads as intent, not ignorance. When a shortcut has a known ceiling, the comment names the ceiling and the upgrade path.

```
// deliberate: O(n²) scan — switch to index if list exceeds ~1000 items
// deliberate: global lock — replace with per-key lock if contention shows up
```

## Debugging

- Don't fight errors: if you encounter the same error twice, step back and research. Find 3-5 possible approaches, pick the most efficient one, and implement it. Repeating the same failed attempt is wasted motion.

## Safety Guards

These are never on the chopping block, no matter how minimal the solution:

- **Trust-boundary validation** — validate all input crossing a trust boundary.
- **Data-loss handling** — protect against silent data corruption or loss.
- **Security** — authentication, authorization, injection prevention, secrets management.
- **Accessibility** — when building UI: semantic HTML, ARIA attributes, keyboard navigation.
