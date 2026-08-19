# Risk-Directed Verification

Choose evidence from the failure mode. More tests of ordinary examples do not compensate for missing concurrency interleavings, feature unions, panic paths, or unsafe proof obligations.

## Map Risk to Evidence

| Claim | Strongest practical evidence |
| --- | --- |
| Public API remains source-compatible | Downstream fixture crates and a SemVer checker, plus manual behavioral review |
| Feature graph composes | Build/test default, none, all, and selected unions from downstream workspace positions |
| Parser preserves invariants for arbitrary input | Property tests plus coverage-guided fuzzing and resource limits |
| Unsafe wrapper is sound | Written proof, adversarial safe callers, Miri, fuzzing, sanitizers where applicable |
| Atomic/lock protocol is correct | Explicit invariant/linearization reasoning plus Loom/model tests |
| Cancellation does not lose/duplicate effects | Deterministic suspension at every await/commit boundary and state inspection |
| Panic preserves drop/invariants | Injected panic/failing callbacks at every unsafe or transactional transition |
| Performance target is met | Representative release benchmark with noise/regression threshold |
| MSRV/platform promise holds | Exact toolchain/target CI, not inference from stable |

## Test the Adversary the Type System Permits

For generic and unsafe code, write safe implementations that:

- panic, re-enter, return edge values, or change behavior between calls;
- have zero-sized or unusually aligned representations;
- drop with observable effects;
- are `!Send`/`!Sync` where permitted;
- create maximum/zero lengths and arithmetic boundaries.

Do not assume a safe trait implementation obeys undocumented semantic niceness. If soundness needs such behavior, it must be an unsafe trait obligation or enforced after conversion to a trusted concrete form.

## Cancellation and Concurrency Tests

Avoid timing-based sleeps as the primary synchronization. Use barriers, notifications, controllable fakes, paused time, and explicit yield/commit hooks.

For each suspension point of a stateful operation:

1. cancel before it;
2. cancel immediately after it;
3. inspect durable and in-memory state;
4. retry/reconcile according to the advertised contract;
5. verify cleanup and permit/lock release.

For shutdown, verify admission closes, queued work follows policy, tasks are observed, deadlines terminate, and blocking work does not silently outlive expectations.

Loom explores a modeled finite state space. Minimize the model, bound loops/threads, assert the core invariant, and separately reason about behavior omitted from the model.

## Panic and Partial Initialization

Inject failure after each successful initialization/mutation step. Assert:

- initialized values drop exactly once;
- uninitialized storage is never dropped/read as `T`;
- guards restore the module invariant;
- primary and cleanup errors follow the documented precedence;
- no safe handle can observe the temporary invalid state.

Run Miri over focused, small cases; large ordinary test suites often provide less unsafe coverage per execution budget.

## Differential and Property Testing

Use a simple trusted implementation as an oracle for an optimized/unsafe version. Properties should express contracts such as round-trip, ordering, idempotency, conservation, or state-machine legality—not restate the implementation.

Fuzz targets need:

- bounded allocation/recursion/runtime;
- a seed corpus covering format structure;
- assertions beyond “did not crash”;
- reproducible minimized failures;
- separate targets for parsing and subsequent trusted operations.

## Compatibility Fixtures

Keep small downstream crates that exercise:

- public trait implementations and trait objects;
- method resolution where new impls/items may collide;
- exhaustive/non-exhaustive matching expectations;
- auto traits and captured lifetimes;
- feature combinations and optional dependencies;
- supported MSRV and `no_std` modes.

Tooling can detect many signature changes but not retry semantics, panic behavior, performance, layout relied on through FFI, or operational shutdown contracts. Review those manually.

## Sources

- [Miri](https://github.com/rust-lang/miri)
- [Rust Fuzz Book](https://rust-fuzz.github.io/book/)
- [Loom](https://docs.rs/loom/latest/loom/)
- [Rust Unstable Book: sanitizers](https://doc.rust-lang.org/unstable-book/compiler-flags/sanitizer.html)
- [Cargo Book: features](https://doc.rust-lang.org/cargo/reference/features.html)
- [Cargo Book: SemVer compatibility](https://doc.rust-lang.org/cargo/reference/semver.html)
- [`cargo-semver-checks`](https://github.com/obi1kenobi/cargo-semver-checks)
