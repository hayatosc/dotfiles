---
name: refactoring-code
description: Refactor existing code while preserving observable behavior. Use for requested structural simplification, extraction, deduplication, or removal of unnecessary abstractions.
---

# Refactoring Code

Establish the requested structural outcome and the behavior that must remain stable. Trace affected callers and reuse the repository's existing checks; inspect architecture or build configuration only when the change depends on it.

Make coherent changes that simplify ownership, control flow, or duplication. Prefer existing helpers, standard libraries, and native platform features when they fit. Preserve public compatibility unless a breaking change is part of the request; fewer lines are not a completion criterion by themselves.

## References

- Structural moves and duplication decisions: [refactor-playbook.md](references/refactor-playbook.md).
- Worked transformations: [examples.md](references/examples.md).
- Weak or brittle existing coverage: [legacy-safety-net.md](references/legacy-safety-net.md).

Use relevant checks at meaningful integration points. Add a focused behavior check when the affected contract lacks coverage. Continue until the requested refactor is complete and affected checks pass; report a concrete blocker rather than silently reducing scope. Summarize what became simpler, preserved behavior, and verification evidence.
