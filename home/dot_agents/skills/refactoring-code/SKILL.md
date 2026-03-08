---
name: refactoring-code
description: Analyze and execute behavior-preserving refactors in small, verified steps. Use when the user asks to refactor, clean up code structure, extract functions or modules, reduce duplication, improve maintainability, or modernize code without changing external behavior.
---

# Refactoring Code

## Overview

Refactor code without changing externally observable behavior. Start by fixing the scope, preserved behavior, and verification path before editing. Prefer small, reviewable steps over broad rewrites.

## Workflow

Follow these steps in order:

### 1. Inspect repository constraints

- Read the current tests, build or typecheck scripts, and surrounding architecture before making changes.
- Reuse the repository's existing verification path. Do not introduce a new toolchain just to complete a refactor.
- Identify the smallest useful scope before touching code. Avoid turning local cleanup into a repo-wide rewrite.

### 2. Define the refactor contract

- State the goal, the non-goals, and the observable behavior that must remain unchanged.
- If the request mixes refactoring with behavior changes, split them into separate phases or ask for confirmation before combining them.
- Call out public APIs, persisted formats, CLI surfaces, or external integrations that must remain stable.

### 3. Establish a safety net

- Prefer existing automated tests first.
- If coverage is weak, identify the smallest useful safety net: narrow tests, characterization checks, sample inputs and outputs, snapshots, or a reliable manual repro.
- If behavior is unclear and cannot be protected cheaply, reduce scope before editing.

### 4. Slice the work

- Make one structural intention per step: rename, extract, split, move, isolate side effects, remove duplication, or simplify control flow.
- Prefer preparatory refactoring that makes the next step obvious and safer.
- Keep public interfaces stable unless the user explicitly asked to change them.

### 5. Execute incrementally

- After each meaningful slice, run the smallest relevant verification and inspect the resulting diff.
- Stop when the code is materially simpler or when additional cleanup becomes speculative.
- If a step reveals hidden behavior changes, pause and restate the plan before proceeding.

### 6. Report the outcome

- Summarize what changed structurally, what behavior was preserved, what verification ran, and what follow-up remains.
- Distinguish clearly between completed refactors and deferred cleanup.

## Default Rules

- Do not mix feature work with refactoring by default.
- Do not perform drive-by cleanup unrelated to the current scope.
- Prefer extraction, renaming, movement, and dependency isolation over rewriting whole files.
- Remove duplication only when the resulting abstraction is clearer than the repeated code.
- If the code is legacy or brittle, introduce seams and observability before ambitious cleanup.
- If a public API or data shape must change, call that out explicitly before proceeding.
- Keep diffs small enough to review and verify confidently.

## Output Pattern

Start with this structure unless the user asked for something else:

- `Goal:` the refactor target and main pain point
- `Preserved behavior:` the observable behavior that must not change
- `Plan:` the next 2-5 small slices
- `Verification:` the tests, checks, or manual repro that will guard the change

## References

- Read `references/refactor-playbook.md` for common behavior-preserving moves and selection heuristics.
- Read `references/legacy-safety-net.md` when tests are weak, behavior is unclear, or the code is difficult to isolate safely.
- Read `references/examples.md` when the request needs concrete patterns or example outputs.
