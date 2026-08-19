# Diagnostic Map for Rust Stumbling Blocks

Use this map before applying a local workaround. The visible compiler error is often the last symptom of an earlier ownership or API decision.

## Symptom to Design Problem

| Symptom or tempting workaround | Likely underlying decision | Prefer when | Avoid |
| --- | --- | --- | --- |
| Clone until borrow checking passes | The borrow spans too many phases, or ownership transfer is unspecified | Split read/decide/mutate phases; move owned data at a real boundary; clone only when independent ownership is intended and cheap enough | Treating every clone as a performance bug, or hiding large copies behind a convenience API |
| Add `'static`, leak a value, or wrap everything in `Arc` for a spawned task | The task may outlive its creator | Own the task input; use scoped concurrency when supported; retain and await/cancel the task handle | `Box::leak` for lifecycle management; detached work with no owner |
| Future is not `Send` | A non-`Send` value remains live across `.await` | End its lexical scope before suspension, move required data out, or deliberately use a local executor | Adding unsafe `Send`; assuming `drop(x)` always shortens the generator state |
| Use an async mutex to quiet a guard-across-`.await` issue | A critical section crosses suspension | Move I/O outside the lock; snapshot/commit in short sections; use an async mutex only when the protected operation must suspend | Holding synchronous guards across `.await`; using async mutexes for ordinary short data access without reason |
| `Arc<Mutex<_>>` spreads through the codebase | Ownership topology and serialization policy are implicit | A single owner plus messages for stateful resources; sharded state for independent keys; a lock for genuinely shared, short-lived mutation | One global lock as an architecture; lock ordering known only by convention |
| `async fn` recursion requires boxing | The future would contain itself and have infinite size | Box only the recursive edge, or rewrite as an explicit work stack/state machine when depth or allocation matters | Boxing the entire API without checking recursion depth and cancellation semantics |
| A self-referential struct seems to require `Pin` | Stable addresses are being used to encode internal references | Prefer indices, owned indirection, or two-phase access; use `Pin` only for an address-sensitive invariant with correct projection and destruction | Assuming `Pin` pins pointee fields automatically or makes raw pointers safe |
| Trait is not dyn compatible | Static and dynamic polymorphism were mixed after API design | Split an object-safe runtime interface from generic extension methods; use enum dispatch for a closed set | Erasing types merely to shorten signatures; adding `Self: Sized` without checking lost object behavior |
| Orphan, overlap, or blanket-impl conflict | The extension point was assigned to the wrong crate/type, or coherence budget was spent | Local newtype; local extension trait; sealed trait when downstream implementations are not part of the contract | Broad blanket impls in public crates without downstream-coherence analysis |
| A new impl or inherent method is “additive” but breaks users | Method resolution, inference, or coherence changed | Run downstream/semver checks; choose names and impl scope conservatively | Equating “no item removed” with SemVer compatibility |
| Error enum keeps growing or callers match every variant | Internal causes and caller recovery actions are coupled | Expose stable recovery categories; keep sources for diagnostics; use `#[non_exhaustive]` before release when extension is expected | Adding `#[non_exhaustive]` later and calling it non-breaking |
| “It is an application, so erase every error” | Project layout was substituted for consumer needs | Preserve typed categories where protocol behavior, retry, metrics, alerts, or tests branch; erase at an orchestration boundary that only reports | Treating `anyhow`/`thiserror` as an architecture rather than implementation tools |
| Feature works alone but fails in a workspace | Cargo unifies features across dependents | Make features additive and test default, none, all, and meaningful pairs; split incompatible backends into separate crates or runtime selection | `feature_a` meaning “not feature_b”; assuming local `--no-default-features` controls all dependency edges |
| `spawn_blocking` task ignores cancellation | Blocking work has no suspension point and may not be abortable after start | Add cooperative cancellation inside the blocking operation, bound concurrency, and plan shutdown | Treating task abortion as thread interruption |
| Select/timeout loses partial work | The future is not cancellation-safe at each suspension point | Keep progress in owned state outside the cancelled future, or make the operation transactional/idempotent | Retrying a partially applied operation without an idempotency or reconciliation design |
| Unsafe code passes tests and Miri | The exercised executions happened not to expose UB | Maintain a proof over all safe inputs, then add Miri/fuzz/sanitizer/model-checking coverage for likely violations | Treating any tool as a soundness proof or assuming current aliasing behavior is a stable guarantee |
| Removing a clone causes pervasive lifetime parameters | The API is trying to borrow across an ownership or storage boundary | Keep ownership at long-lived boundaries; optimize only measured large/hot clones; use arenas only when their lifetime model matches | Turning a local optimization into a public lifetime commitment |
| Make the whole subsystem generic “for zero cost” | Dispatch preference is spreading type and code-generation cost | Keep a thin generic edge and concrete/dynamic inner boundary when compile time or binary size matters; measure the hot call | Assuming `dyn Trait` is always slow or generics are free |
| `repr(C)` appears to make FFI safe | Layout is only one part of the foreign contract | Specify ABI, valid values, ownership, allocator, unwinding, callback re-entry, threading, and versioning | Passing Rust references, enums, trait objects, or unwinding behavior across FFI by layout guess |
| Copy a recommended lint/dependency/runtime template wholesale | A teaching scaffold is being mistaken for project evidence | Derive choices from MSRV, targets, threat model, workload, and existing policy | Blanket `pedantic`, `tokio/full`, global allocator changes, or universal timeouts without cost/behavior review |

## Diagnostic Questions

Before editing, answer the smallest relevant set:

1. Who owns completion, cancellation, and cleanup?
2. Which state must remain valid during panic, suspension, re-entry, or partial initialization?
3. Can arbitrary safe caller input or an adversarial safe trait implementation violate the assumption?
4. Is this a private implementation choice or a downstream compatibility commitment?
5. Does the design still work when Cargo enables this feature together with every other feature?
6. Is a compiler error preventing an invalid model, or merely requiring an explicit representation such as indirection?
7. What evidence distinguishes a performance problem from an aesthetic objection to allocation or dynamic dispatch?

## Sources

- [Rust error E0502: conflicting borrows](https://doc.rust-lang.org/error_codes/E0502.html)
- [Rust error E0038: dyn compatibility](https://doc.rust-lang.org/error_codes/E0038.html)
- [Async Book: `Send` approximation](https://rust-lang.github.io/async-book/07_workarounds/03_send_approximation.html)
- [The `Pin` module](https://doc.rust-lang.org/std/pin/)
- [Rust Reference: implementation coherence](https://doc.rust-lang.org/reference/items/implementations.html)
- [Cargo Book: feature unification](https://doc.rust-lang.org/cargo/reference/features.html#feature-unification)
- [Tokio `JoinHandle`](https://docs.rs/tokio/latest/tokio/task/struct.JoinHandle.html)
- [Tokio task cancellation](https://docs.rs/tokio/latest/tokio/task/index.html#cancellation)
- [Cargo Book: SemVer compatibility](https://doc.rust-lang.org/cargo/reference/semver.html)
