---
name: refactoring-code
description: Behavior-preserving refactoring and de-engineering in small verified steps. Use when asked to refactor, clean up structure, extract functions, reduce duplication, or remove bloat.
---

# Refactoring Code

Execute behavior-preserving refactors in small, verified steps. The goal is to make the code cleaner and simpler without introducing regression bugs.

## Workflow

1. **Inspect Repository Constraints**: Read current tests, build scripts, and architecture before editing. Reuse existing verification paths.
2. **Define the Refactor Contract**: Fix the goal, non-goals, and observable public behavior. Do not mix feature work with refactoring.
3. **Establish a Safety Net**: Rely on existing automated tests or the smallest runnable check. If safety coverage is weak or brittle, reduce scope.
4. **Slice the Work Incrementally**: Execute one structural intention per step (rename, extract, split, move). Search the codebase to reuse existing helpers before adding new ones.
5. **De-engineering & Simplification**: Eliminate premature abstractions (single-implementation interfaces/factories, delegating wrappers, unused configs). Replace custom code with standard library or native platform features. Categorize changes using tags: `delete:`, `stdlib:`, `native:`, `yagni:`, `shrink:`. Aim for `net: -<N> lines`.
6. **Verify Incrementally**: Run relevant verification after each slice. Stop when the code is materially simpler.

## Output Pattern

```markdown
- Goal: [Refactor target]
- Preserved Behavior: [Stable contract/APIs]
- Plan: [2-5 small slices]
- Verification: [Test command or check run]
```
