---
name: golang-best-practices
description: "Comprehensive Go best practices for writing production-ready, idiomatic, secure, and maintainable code. Use when: (1) writing or reviewing Go code, (2) designing project structure and layout, (3) handling errors and contexts, (4) implementing concurrency, (5) writing tests or benchmarks, (6) optimizing performance, (7) applying security practices, (8) modernizing Go codebases. Covers coding style, project organization, error handling, testing, concurrency, performance, security, and modernization."
---

# Go Best Practices

## Core Principles

- **Simplicity**: Prefer clear, readable code over clever code.
- **Explicit over implicit**: Make dependencies and side effects visible.
- **Composition over inheritance**: Use interfaces and embedding, not subclassing.
- **Fail fast**: Return errors immediately; keep the happy path left-aligned.
- **Zero value is useful**: Design types so their zero value is valid.
- **Don't over-abstract**: Solve the problem at hand; add abstraction only when needed.

## Quick Navigation

Load the appropriate reference when working on a specific area:

- **Project layout**: [project-layout.md](references/project-layout.md)
- **Code style and naming**: [code-style.md](references/code-style.md)
- **Error handling**: [error-handling.md](references/error-handling.md)
- **Concurrency**: [concurrency.md](references/concurrency.md)
- **Testing**: [testing.md](references/testing.md)
- **Performance**: [performance.md](references/performance.md)
- **Security**: [security.md](references/security.md)
- **Modern Go features**: [modernize.md](references/modernize.md)

## Universal Rules

1. Run `gofmt` and `goimports` on every save. Do not fight the formatter.
2. Use ` MixedCaps` or `mixedCaps`; never `snake_case` in identifiers.
3. Context is the first parameter: `func F(ctx context.Context, ...) error`.
4. Always check errors. Never silently ignore them with `_` unless justified.
5. Document all exported names with a complete sentence starting with the name.
6. Keep the normal code path at minimal indentation; handle errors and return.
7. Prefer synchronous APIs; let the caller add concurrency if needed.
8. Use `crypto/rand` for security-sensitive randomness, never `math/rand`.
9. Avoid `panic` for normal error handling. Return `error` values.
10. Use interfaces on the consumer side, return concrete types from producers.

## When to Use References

- Starting a new project or module: read `project-layout.md` first.
- Reviewing or refactoring code style: read `code-style.md`.
- Adding error propagation or custom errors: read `error-handling.md`.
- Adding goroutines, channels, or synchronization: read `concurrency.md`.
- Writing or reviewing tests: read `testing.md`.
- Investigating slow code or allocations: read `performance.md`.
- Handling user input, secrets, or crypto: read `security.md`.
- Upgrading Go version or adopting new stdlib features: read `modernize.md`.
