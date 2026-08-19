# Failure Semantics and Recovery Boundaries

The hard error-design question is not how to return `Result`; it is which facts callers can rely on after failure.

## Define the Post-Failure State

For every fallible operation with effects, document or encode:

- whether no effect occurred, a partial effect may exist, or the effect may have completed despite the error;
- whether retry is safe, unsafe, or requires an idempotency key/reconciliation read;
- which resources remain owned by the caller;
- whether a transaction, lock, or stream remains usable;
- whether cleanup errors can mask the primary failure.

APIs such as `fn write(&mut self, input: &[u8]) -> Result<usize, _>` expose progress. A higher-level “send” API that can time out after remote commit needs a different recovery contract. Do not flatten both into a generic I/O failure.

## Design Errors Around Caller Decisions

Expose stable distinctions only when callers act differently:

- retry now / retry later;
- reauthenticate / reconfigure;
- reject user input;
- reconcile ambiguous completion;
- abort because an invariant or dependency contract failed.

Keep internal causes in an error source chain or diagnostic fields. Publishing every dependency's variants couples the API to implementation. Conversely, string-erasing all failures at a library boundary prevents reliable recovery.

Treat “`thiserror` for libraries, `anyhow` for applications” as a tooling shortcut, not a design rule. A production application may need typed categories for protocol responses, metrics, alerts, retry policy, and tests; a library may erase many internal causes while exposing a small stable recovery interface. Decide at each boundary whether the consumer needs to branch, diagnose, aggregate, or only report and exit.

For evolving public enums, apply `#[non_exhaustive]` before release if variants will grow, and provide stable query methods or category codes. Remember that callers may still depend on `Display`, source chains, or retry behavior even when variants are hidden.

## Context Placement

Add context at abstraction transitions, where identifiers and intent would otherwise be lost:

- file path plus operation, not just the path;
- endpoint/operation ID, not secret-bearing payloads;
- job or record key plus workflow stage;
- feature/backend/platform when dispatch selected the failing implementation.

Avoid repeated wrappers that restate the same message. Preserve structured sources where diagnostics, telemetry, or retry classification needs them. Redact credentials and data subject to privacy controls before formatting an error.

## Panic and Unwind Boundaries

Panic is appropriate for an internal invariant violation only when safe external input cannot trigger it as routine behavior. Review panic as an unwind edge through:

- unsafe transient states;
- locks and poison policy;
- transactions and temporary files;
- callbacks and plugin boundaries;
- destructors and FFI.

`catch_unwind` isolates some Rust unwinding; it does not repair corrupted logical state, catch aborting panics, or make foreign unwinding sound. Place it at a boundary only with an explicit containment policy.

Destructors cannot report failure reliably. If flush, commit, close, join, or shutdown can fail, expose an explicit method. Define whether `Drop` retries, best-effort cleans up, logs, or deliberately leaks/abandons a resource; avoid panicking in `Drop`, especially during another unwind.

## Multiple Failures

When the main operation and cleanup both fail, choose a policy explicitly:

- return the primary error and attach/log cleanup failure;
- aggregate when callers need both;
- prefer cleanup failure only if it invalidates the meaning of the primary result;
- abort on a safety-critical invariant that cannot be restored.

Do not overwrite the causal error by using `?` in cleanup code without considering precedence.

## Retries

Retries require more than an error category:

- bounded attempts and deadline budget;
- backoff and jitter;
- cancellation propagation;
- idempotency or deduplication;
- classification of permanent versus transient failures;
- observability of final and intermediate failures;
- protection against synchronized retry storms.

Keep retry policy near the operation owner, not buried in a low-level client that cannot know the caller's deadline or idempotency semantics.

## Sources

- [Rust API Guidelines: dependability](https://rust-lang.github.io/api-guidelines/dependability.html)
- [Rust Reference: panic](https://doc.rust-lang.org/reference/panic.html)
- [`catch_unwind`](https://doc.rust-lang.org/std/panic/fn.catch_unwind.html)
- [Rustonomicon: exception safety](https://doc.rust-lang.org/nomicon/exception-safety.html)
- [Rust API Guidelines: error types are meaningful](https://rust-lang.github.io/api-guidelines/interoperability.html#c-good-err)
- [Community discussion: limits of “thiserror for libraries, anyhow for applications”](https://www.reddit.com/r/rust/comments/1cnhy7d/)
