# Community Field Practice and Agent-Skill Review

Use this reference when a question asks for “idiomatic,” “production-ready,” or “best practice” but the language specification does not select one design. Community evidence is useful for locating recurring failure modes; it does not turn a popular preference into a guarantee.

## How to Use Community Evidence

Classify each claim before applying it:

- **Contract-backed practice:** community experience repeatedly exposes a consequence already implied by Rust, Cargo, or runtime contracts. Treat it as strong guidance.
- **Operational pattern:** practitioners report success under recognizable constraints. Transfer the constraints, not only the solution.
- **Contested heuristic:** experienced users choose differently. Surface the decision variables and require repository evidence or measurement.
- **Cargo cult:** a tool, crate, lint group, allocator, threshold, or type is prescribed without a workload or contract. Do not import it.

Prefer independent discussions that converge on the same failure mode. A highly voted thread can identify a blind spot, but votes do not prove soundness or performance.

## Repeated Field Lessons

### Borrow-checker friction is often architecture feedback

Users repeatedly report that the durable fix was changing data flow, splitting phases/structures, or clarifying ownership—not adding a local clone or longer lifetime. This supports using compiler friction as a diagnostic signal. It does **not** mean every compiler rejection demands a rewrite: an intentional clone or owned task input may be the correct boundary.

Practical review move: ask which component owns the next phase of work. If the answer is “the background task, queue, cache, or service,” forcing a borrow through that boundary usually creates more complexity than ownership transfer.

Sources: [“the borrow checker isn't the hard part; designing around it is” discussion](https://www.reddit.com/r/rust/comments/1rw12u6/rusts_borrow_checker_isnt_the_hard_part_its/), [Rust forum discussion on async borrowing versus boxing](https://users.rust-lang.org/t/borrowing-vs-boxing-in-async-heavy-code-how-do-you-mentor-juniors-through-lifetime-hell/131782), [Rust forum discussion on pervasive `Rc<RefCell<_>>`](https://users.rust-lang.org/t/if-you-use-enough-rc-refcell-t-does-rust-become-a-garbage-collected-language/61152).

### Async's worst failures are lifecycle failures

Community discussions consistently elevate cancellation safety, async deadlocks, detached tasks, and blocking work over syntax-level async mistakes. One especially instructive failure was a published cancellation pattern corrected by users: dropping Tokio's `JoinHandle` detaches rather than aborts the task. This is why runtime behavior must be checked against primary documentation even when a community example looks established.

Production implication: treat handler/request cancellation as a logical correctness boundary. For purchases, durable writes, framing, and external side effects, “memory-safe when dropped” is weaker than “business-safe to cancel.” Define commit, ambiguous completion, reconciliation, and task ownership.

Sources: [community correction of a `JoinHandle` cancellation example](https://www.reddit.com/r/rust/comments/1c7xv7l/), [discussion of cancellation and transactions](https://www.reddit.com/r/rust/comments/14gy470/), [common async cancellation mistakes](https://www.reddit.com/r/rust/comments/18hdp6j/), [blocking in async functions](https://www.reddit.com/r/rust/comments/ebpzqx/).

### Cargo feature additivity is discovered too late

Experienced users report learning feature unification only after years of Rust or after two otherwise-correct dependents enabled an invalid union. The operational lesson is stronger than “features should be additive”: test from downstream workspace positions because maintainers often never build the feature set Cargo constructs for consumers.

Separate crates, runtime selection, or supporting the union are common remedies. A compile error for `feature_a + feature_b` may protect local code, but it leaves downstream graphs unable to compose and can make an unrelated dependency update break a build.

Sources: [Cargo features have to be additive](https://www.reddit.com/r/rust/comments/sgegah/), [mutually exclusive workspace features](https://www.reddit.com/r/rust/comments/10uhpbm/), [feature permutation costs in large workspaces](https://www.reddit.com/r/rust/comments/1qzvkwf/workspace_feature_permutations_hell/).

### Unsafe review starts with a proof, not a tool

Practitioners converge on precise `# Safety`/`// SAFETY:` obligations, small unsafe regions, safe-wrapper review from an adversarial caller's perspective, and additional scrutiny for unsafe changes. They also repeatedly point out that Miri, sanitizers, and tests observe executions rather than proving all safe callers sound.

Useful process additions:

- require the author to state why safe designs were rejected before reviewing code mechanics;
- review the invariant ledger separately from the implementation diff;
- use a reviewer who did not construct the proof for high-impact kernels;
- re-review callers and private invariants when a safe wrapper changes, even if its unsafe block does not;
- never let `debug_assert!` carry a safety obligation in release builds.

Sources: [unsafe in peer review](https://www.reddit.com/r/rust/comments/pk9pmc/), [improving unsafe Rust](https://www.reddit.com/r/rust/comments/1iyntvt/), [the Soundness Pledge discussion](https://www.reddit.com/r/rust/comments/eqcefv/), [forum example where Miri did not settle soundness](https://users.rust-lang.org/t/unsafecell-based-immutable-access-to-wrapper-for-mutable-reference-is-this-sound/96098).

### Error strategy follows recovery and observability, not crate layout

“`thiserror` for libraries, `anyhow` for applications” is a useful onboarding shortcut, not an architecture rule. Production users report needing typed errors inside applications for metrics, alerts, protocol responses, retry classification, and tests. Libraries sometimes erase internal causes while preserving stable recovery categories.

Choose where to retain structure from who consumes the error:

- callers branch or automate recovery → stable typed category/query;
- operators need diagnosis → context and source chain;
- telemetry groups failures → stable machine-readable classification;
- top-level process only reports and exits → erasure can be appropriate;
- dependency implementation details may change → translate rather than expose every foreign variant.

Sources: [limits of the library/application slogan](https://www.reddit.com/r/rust/comments/1cnhy7d/), [production error-handling pain points](https://www.reddit.com/r/rust/comments/1qg3gkn/error_handling/), [public `anyhow::Error` discussion](https://users.rust-lang.org/t/is-it-a-good-idea-to-have-anyhow-error-in-a-public-type/66842).

### Dynamic dispatch can be an engineering boundary

Community experience highlights compile time, binary size, instruction-cache pressure, and generic-type propagation as reasons to use `dyn Trait`, not only runtime plugins. Conversely, hot-path dispatch cost is often too small to matter beside the work performed.

Practical pattern: keep a thin generic adapter where caller ergonomics or inlining matters, then convert to a concrete or dynamic non-generic inner operation. Measure both runtime and build/binary effects before turning static dispatch into ideology.

Sources: [dynamic dispatch cost discussion](https://users.rust-lang.org/t/how-much-slower-is-a-dynamic-dispatch-really/98181), [generics and compile-time experience](https://users.rust-lang.org/t/soft-question-significantly-improve-rust-compile-time-via-minimizing-generics/103632), [static versus dynamic dispatch motivation](https://users.rust-lang.org/t/clarify-static-dynamic-dispatch-in-one-function/62227).

## Lessons from Other Rust Agent Skills

The following public skills were inspected as design inputs, not copied as authorities:

- [actionbook/rust-skills](https://github.com/actionbook/rust-skills): its strongest idea is routing a visible compiler symptom upward through language mechanics, design choice, and domain constraints. Its modular progressive disclosure is useful. Some leaf skills reduce judgment to beginner checklists or contain unsafe oversimplifications, so individual rules require independent verification.
- [joshuadavidthomas/agent-skills Rust skill](https://github.com/joshuadavidthomas/agent-skills/tree/main/rust): strong at naming agent failure modes, separating boundary DTOs from domain models, and cross-linking focused references. Statements such as “every domain string is a newtype” or “every external call needs a timeout” are intentionally forceful teaching defaults, not universal production rules.
- [NAV Copilot rust-development](https://github.com/navikt/copilot/tree/main/skills/rust-development): useful example of a production-oriented skill with concrete procedures. Its fixed dependency set, `tokio` feature choice, allocator recommendation, and blanket public-API rules show why project setup advice must not be generalized without workload and compatibility context.
- [huiali/rust-skills](https://github.com/huiali/rust-skills): useful topic decomposition across ownership, async, unsafe, FFI, testing, and performance. Much of its top-level guidance is elementary, and some unsafe tables imply that `MaybeUninit`, `NonNull`, or `repr(C)` solve obligations they only help represent.

Patterns adopted here:

- route symptoms to the underlying design/domain layer;
- organize references by the decision being made;
- name recurring agent rationalizations explicitly;
- keep the top-level skill as a decision protocol rather than an encyclopedia.

Patterns deliberately rejected:

- universal dependencies, lint groups, allocators, numeric thresholds, or runtime feature sets;
- “always use type X” rules that omit lifecycle and workload constraints;
- unsafe checklists that conflate non-nullness with validity, layout with ABI/protocol, or tool success with proof;
- beginner syntax advice that the target agent already knows;
- popularity or repository stars as evidence that technical content is correct.
