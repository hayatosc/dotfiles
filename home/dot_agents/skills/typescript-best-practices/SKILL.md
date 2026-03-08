---
name: typescript-best-practices
description: Implement, review, and refactor TypeScript code with a strong bias toward type safety. Use to fix TypeScript errors, remove `any` or unsafe `as`, review type safety, tighten TypeScript or lint settings, and ship ESM-first code that passes the repository's typecheck without weakening types.
---

# TypeScript Best Practices

## Overview

Write and revise TypeScript with a bias toward precise types, safe narrowing, and passing typecheck without silencing errors. Prefer fixing the root cause over weakening types, widening signatures, or bypassing the checker.

## Workflow

Follow these steps in order:

### 1. Inspect repository constraints

- Read the active `tsconfig` files, ESLint configuration, and package scripts before changing code.
- Reuse the repository's existing toolchain. If a typecheck script exists, run that. If the repository follows `typescript-recommend-tools`, prefer `tsgo --noEmit` as the main check and keep `tsc --noEmit` as the compatibility fallback. Otherwise, use the repository's current `tsc --noEmit` path.
- For exported APIs, shared utilities, and non-trivial domain logic, sketch or confirm the types first. Prefer to model input, output, and invariants before writing implementation details.

### 2. Implement safely

- Prefer inference for local variables and explicit types at public boundaries.
- Treat network, file, JSON, DOM, environment, and third-party data as `unknown` until narrowed.
- Replace `any` with concrete types, generics, `unknown`, or utility types.
- Replace unsafe `as` with narrowing, predicates, discriminated unions, `satisfies`, or small refactors that make the type relationship explicit.

### 3. Tighten configuration when it materially improves safety

- If the user asks for TypeScript cleanup, type safety review, or strictness improvements, update `tsconfig` and `typescript-eslint` config as part of the work when the change is scoped and reviewable.
- If the repository uses the Oxc stack, consider `oxlint --type-aware` with `oxlint-tsgolint` alongside compiler checks rather than introducing a separate ESLint migration by default.
- Apply stricter settings incrementally. Do not turn a small fix into a repo-wide migration unless the user asked for that scope.
- Read `references/config-baseline.md` before changing compiler or lint settings.

### 4. Verify

- Run typecheck after every meaningful change set and finish only when it passes.
- When a change affects exported generics, reusable utility types, branded domain types, or library-like APIs, add or update compile-time type tests.
- Run lint and tests when the repository already provides them.
- If stricter settings expose unrelated repository-wide debt, describe the follow-up work clearly and keep the current patch focused.

## Default Rules

- Prefer type-first design for reusable APIs and complex domain logic.
- Avoid `any`. If the value is unknown, model it as `unknown` and narrow it.
- Avoid unsafe type assertions. `as const` and framework-required assertions are acceptable only when the runtime shape is already guaranteed.
- Prefer `interface` for extendable object shapes and `type` for unions, mapped types, and aliases.
- Extract complex inline types into named aliases or interfaces when they carry domain meaning, are reused, or make the implementation hard to read.
- Use branded types for IDs and validated domain values only when the distinction prevents real mixups.
- Make union and enum handling exhaustive.
- Assume ES modules by default. Prefer `import` and `export`, and do not introduce `require`, `module.exports`, or mixed-module patterns unless the repository is already CommonJS or the toolchain requires it.
- Prefer type-only imports when importing types.
- Prefer derived types such as `Pick`, `Omit`, `Partial`, `Required`, and `Record` over duplicated handwritten shapes.
- Keep runtime and compile-time truth aligned. Add guards at external boundaries, and do not add a new validation library solely for typing unless the user asks or the repository already uses one.
- If runtime validation is needed, prefer the repository's existing library. If the repository has none, keep lightweight manual guards by default and add tools such as `zod` or `valibot` only on explicit request or when the repository already standardizes on them.

## References

- Read `references/type-safety-patterns.md` for concrete replacements for `any` and unsafe `as`, plus review heuristics.
- Read `references/config-baseline.md` before changing TypeScript or `typescript-eslint` settings.
