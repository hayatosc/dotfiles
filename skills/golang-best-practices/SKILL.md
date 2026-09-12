---
name: golang-best-practices
description: Implement or review Go code using shared API, error handling, concurrency, and testing conventions. Use the references for specialized design decisions.
---

# Go Best Practices

Respect the module's Go version and established conventions. Prefer synchronous APIs with caller-owned concurrency, useful zero values, consumer-side interfaces, and explicit error handling. Use `crypto/rand` for security-sensitive randomness.

## Baseline for Implementation and Review

- Use `MixedCaps` names and document exported APIs with a sentence beginning with the name.
- Pass `context.Context` first when an operation accepts context; propagate cancellation to work it starts.
- Check returned errors. Explain intentional discards; return errors for normal failures rather than panicking.
- Make goroutine ownership, shutdown, and error reporting explicit. Do not start background work with no owner.
- Use `gofmt` and the project's import formatter on changed files. Run the affected package tests, plus race checks when the change concerns shared state and the environment supports them.

## References

Read only the reference relevant to the task:

- New module or package boundaries: [project-layout.md](references/project-layout.md).
- Naming, comments, or style decisions: [code-style.md](references/code-style.md).
- Error propagation or custom errors: [error-handling.md](references/error-handling.md).
- Goroutines, channels, cancellation, or synchronization: [concurrency.md](references/concurrency.md).
- Test design: [testing.md](references/testing.md).
- Slow code or allocations: [performance.md](references/performance.md).
- User input, secrets, or cryptography: [security.md](references/security.md).
- Version upgrades or modern standard library features: [modernize.md](references/modernize.md).

Format changed Go files with the project's formatter and use relevant project checks. Rerun after changes or failures, not on every save. Finish when the requested behavior and affected contracts are established; document remaining limitations without broadening the task.
