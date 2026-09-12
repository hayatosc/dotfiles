---
name: typescript-best-practices
description: Implement or review TypeScript code with safe narrowing, precise API types, and compiler checks. Includes guidance for type errors and strictness changes; skip styling-only work.
---

# TypeScript Best Practices

Preserve precise types and runtime guarantees without silencing the checker. Follow the repository's module system, dependencies, and check scripts.

- Prefer local inference and explicit public contracts. Use `unknown` and narrowing for untrusted data; avoid `any` and assertions that hide a runtime mismatch.
- Model related states with discriminated unions and handle variants exhaustively. Add branded types when confusing otherwise identical primitives is a concrete domain risk.
- Reuse existing runtime validation. A typing fix alone does not justify another validation dependency.
- Document non-obvious public constraints, errors, and usage according to repository conventions; do not duplicate self-explanatory signatures.
- Inspect compiler and lint configuration when the error or requested change depends on it. Keep strictness changes scoped rather than turning a local fix into a toolchain migration.

## Default Workflow

1. Identify the affected types, runtime inputs, and the project's typecheck command. Inspect the active `tsconfig` when module behavior or compiler settings matter.
2. Implement with inference locally and explicit contracts at public boundaries. Prefer narrowing, discriminated unions, or `satisfies` to assertions; `as const` is appropriate for preserved literal values.
3. Use ESM for new code unless the project or runtime requires CommonJS. Document exported APIs' intent and non-obvious constraints without restating types.
4. Run typecheck and affected behavior tests. Do not suppress errors, relax strictness, or skip tests to make the change pass. Distinguish unrelated existing failures from regressions.

## References

- Narrowing, generics, brands, and assertion replacements: [type-safety-patterns.md](references/type-safety-patterns.md).
- Compiler or lint settings: [config-baseline.md](references/config-baseline.md).

Use the project's typecheck and relevant behavior tests. Add compile-time tests when a public inference contract could regress without a runtime failure. Reuse passing results until the code changes; report pre-existing failures separately instead of weakening types to pass.
