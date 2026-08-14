---
name: coding-style
description: Language-agnostic coding style, design principles, minimal code philosophy, The Ladder, code change rules, and safety guards. Loaded before writing or reviewing code.
---

# Coding Style

Language-agnostic policy. Language skills provide idiomatic detail within this philosophy; this policy takes precedence except for language-idiomatic conventions (e.g., Go explicit error handling).

## The Ladder

Before writing any code, stop at the first rung that holds:

1. **Needs to exist?** — Skip speculative needs (YAGNI). If asked for future-proofing, ship concrete parts and push back on speculative ones in one line.
2. **Stdlib covers it?** — Use standard library.
3. **Native platform feature?** — e.g. HTML5 inputs over picker libs, CSS over JS, DB constraints over app code.
4. **Existing dependency?** — Use installed packages; never add dependencies for what a few lines can do.
5. **One-liner?** — Keep it one line.
6. **Otherwise** — Minimum working code.

Prefer higher rungs. Verify external dependencies are maintained, lightweight, and non-redundant.

## Design

### Reuse & Existing Dependencies
- Search codebase before creating new utilities/types; reuse existing code.
- Check installed library documentation/types before writing custom implementations or adding packages.

### Modularity & Layered Growth
- Grow in working layers: start with the smallest working end-to-end version.
- Separate concerns cleanly.
- Build for the long term; reject temporary stopgaps.

### Keep It Small
- Simplest working implementation; avoid premature abstractions (no single-implementation interfaces, single-product factories, or static configs).
- Extract abstractions only when immediate consumers exist.
- No unused boilerplate, scaffolding, or error handling for impossible/internal states.
- Shortest working diff wins. Boring over clever.
- Between equal stdlib options, pick the robust one for edge cases.

### No Backward Compatibility by Default
- No compatibility layers, aliases, or silent fallbacks unless requested. Erase old code completely on breaking changes.
- Fail fast: raise explicit errors on missing required values or failures; never swallow errors or fall back silently.

## Code Changes
- Touch only what the task requires; do not refactor adjacent code or formatting.
- Match existing style.
- Mention unrelated dead code without deleting it.
- Remove only imports/definitions made unused by your changes.
- Complex request? Ship the minimal version and state default assumptions concisely.
- Add brief comments for deliberate shortcuts (state reason, ceiling, and upgrade path):
```
// deliberate: O(n²) scan — switch to index if list exceeds ~1000 items
// deliberate: global lock — replace with per-key lock if contention shows up
```

## Debugging
- Same error twice? Step back, research 3–5 candidate solutions, and pick the best. Never repeat failed attempts blindly.

## Safety Guards (Non-Negotiable)
- **Trust-boundary validation**: Validate all input crossing a trust boundary.
- **Data loss**: Guard against corruption or silent data loss.
- **Security**: Auth, authz, injection prevention, secret safety.
- **Accessibility**: Semantic HTML, ARIA, keyboard navigation.
