---
name: rust-best-practices
description: Resolve high-judgment Rust design and review problems involving ownership boundaries, public API evolution, async cancellation and task lifetime, Cargo feature topology, performance tradeoffs, FFI, and unsafe soundness. Use when a Rust change compiles only after clones, leaks, broad Arc/Mutex use, boxed futures, trait-object workarounds, unsafe code, or compatibility compromises; when reviewing public crates or concurrency; and whenever `.rs` or `Cargo.toml` work requires choosing among multiple valid designs. Skip elementary syntax and generic style advice.
---

# Rust Design Decisions

## Scope

Apply this skill to decisions where multiple Rust designs compile but differ in soundness, cancellation behavior, compatibility, operational cost, or proof burden. Do not spend output on elementary ownership rules, `Option` versus `Result`, routine formatting, or other defaults unless they are the cause of the specific failure.

## Decision Protocol

1. Read [stumbling-blocks.md](references/stumbling-blocks.md) when starting from a compiler error, workaround, or vague design discomfort. Diagnose the architectural pressure before changing syntax.
2. Write down the contracts that matter:
   - invariant and trust boundary;
   - owner and lifetime of each resource;
   - failure, cancellation, and cleanup semantics;
   - public API, MSRV, feature, layout, and trait commitments;
   - measured performance constraint.
3. Separate reversible choices from commitments. A private allocation strategy is reversible; a public trait implementation, error variant, feature, auto-trait result, layout, or callback contract may not be.
4. Compare viable designs by proof burden and failure mode, not line count. Prefer the weakest mechanism that expresses the contract: scoped ownership before shared ownership, safe abstraction before unsafe, concrete type before dynamic dispatch, and private policy before public commitment.
5. Test the disputed contract directly. Compilation alone does not establish cancellation safety, panic safety, feature composability, FFI validity, or unsafe soundness.

## Evidence Discipline

Treat advice according to its evidence level:

1. Language/library guarantees and documented runtime behavior establish what is sound or supported.
2. Repeated production and community failure reports reveal where correct-looking designs are routinely misunderstood.
3. Personal preferences, crate choices, lint sets, allocator choices, numeric thresholds, and architecture slogans are hypotheses until the repository's constraints or measurements support them.

When community advice conflicts, preserve the decision variables instead of manufacturing a universal rule. Read [community-practice.md](references/community-practice.md) for recurring field lessons and the agent skills reviewed while building this skill.

## Stop Conditions

Do not paper over the following signals:

- repeated `clone`, `Arc`, `'static`, `Box::leak`, or `Box::pin` solely to satisfy the compiler;
- a lock guard, transaction, partially initialized buffer, or external handle surviving a suspension or callback;
- an `unsafe` comment that depends on undocumented caller behavior behind a safe API;
- a public API change reviewed only at the source-signature level;
- mutually exclusive Cargo features or a feature that disables behavior;
- optimization justified without a representative profile or benchmark;
- detached tasks whose completion, errors, or shutdown behavior are unobserved.

At these signals, return to the ownership, state-machine, API, or safety boundary.

## Reference Routing

Read only the references needed for the decision:

- Symptom-driven diagnosis and common expert traps: [stumbling-blocks.md](references/stumbling-blocks.md)
- Community field lessons, disputed heuristics, and lessons from other Rust agent skills: [community-practice.md](references/community-practice.md)
- Ownership topology, self-reference, lifetimes, pinning, and trait coherence: [core-idioms.md](references/core-idioms.md)
- Public API evolution, traits, dynamic dispatch, errors, and SemVer: [api-design.md](references/api-design.md)
- Failure taxonomy, partial effects, retries, cleanup, and panic boundaries: [error-handling.md](references/error-handling.md)
- Task ownership, cancellation, backpressure, locks, and blocking work: [concurrency-async.md](references/concurrency-async.md)
- Risk-directed testing, model checking, fuzzing, and unsafe verification: [testing.md](references/testing.md)
- Measurement-led choices around allocation, dispatch, layout, and unsafe optimization: [performance.md](references/performance.md)
- Unsafe proof design, `MaybeUninit`, provenance, FFI, pinning, and `Send`/`Sync`: [unsafe-security.md](references/unsafe-security.md)
- Feature topology, MSRV, resolver behavior, dependency exposure, and CI matrices: [cargo-tooling.md](references/cargo-tooling.md)

## Review Order

1. Soundness, validity, aliasing, provenance, data races, ABI, and unwind boundaries.
2. Lost work, partial effects, cancellation, cleanup, deadlocks, and resource lifetime.
3. Public compatibility: downstream implementations, inference, feature combinations, MSRV, layout, and auto traits.
4. Ownership topology and operability: backpressure, observability, shutdown, and error context.
5. Measured performance and compile-cost tradeoffs.

Report a concrete failure scenario and the violated contract. Label optional simplifications separately from correctness or compatibility defects.
