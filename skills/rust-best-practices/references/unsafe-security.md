# Unsafe Rust: Designing and Auditing the Proof Boundary

Use unsafe only when a required operation cannot be expressed with an existing sound safe abstraction. The design goal is not a low count of `unsafe` tokens; it is a small, reviewable safety kernel whose invariants are owned by one module.

## Admission Gate

Evaluate options in this order:

1. A standard-library safe API.
2. A mature safe abstraction whose soundness boundary matches the need.
3. A different representation or algorithm that removes address, aliasing, layout, or initialization tricks.
4. A private unsafe kernel with a safe wrapper.
5. A caller-facing unsafe API when the caller must provide facts the module cannot validate or encode.

Unsafe may be justified for FFI, hardware/OS interfaces, implementing a fundamental container or synchronization primitive, or a measured hot path where safe designs miss a stated target. “The borrow checker rejects it,” “the pointer is non-null,” and “the benchmark might improve” are not sufficient justifications.

Before implementation, record:

- the capability unavailable in safe Rust;
- rejected safe designs and their concrete cost;
- the module that owns each invariant;
- the safe API surface and why arbitrary safe inputs cannot break it;
- the verification plan and supported platforms/toolchains.

## Build a Safety Ledger

For every unsafe operation, enumerate only the applicable obligations, but do not omit categories silently:

| Category | Questions to prove |
| --- | --- |
| Validity | Is every value valid for its Rust type at every point where Rust treats it as initialized? Are booleans, references, enums, function pointers, and niche values valid? |
| Initialization | Which elements/fields are initialized? Can panic or early return drop uninitialized memory or leak initialized values? |
| Bounds/alignment | Does the allocation cover the complete access and satisfy alignment, including zero-sized and overflow cases? |
| Aliasing | During the access, what other references or pointers may exist? Is mutation compatible with every live reference? |
| Provenance | Was the pointer derived from an allocation with permission for this access? Has an integer round trip exposed or lost provenance? |
| Lifetime | Does the referent outlive every reference created, callback, task, and returned wrapper? |
| Drop/unwind | Is each value dropped exactly once? What invariant survives a panic, foreign exception, callback, or destructor? |
| Concurrency | What synchronizes access? Are atomic orderings sufficient? Why are `Send` and `Sync` results sound? |
| Layout/ABI | Which representation and calling convention are guaranteed rather than observed? Are all bit patterns accepted by the foreign side valid in Rust? |

Distinguish a **validity invariant**, whose violation is immediate UB for a typed value, from a broader **safety invariant**, whose violation lets later safe operations cause UB. The distinction helps locate checks, but both belong in the proof.

## Shape the Safety Kernel

- Keep raw storage and unsafe operations private to one module where possible. Module privacy, constructors, and field privacy should prevent safe code from fabricating invalid states.
- Expose a safe wrapper only when its implementation establishes every obligation for all safe inputs, including zero lengths, panic paths, re-entrant callbacks, and adversarial safe trait implementations.
- If an obligation cannot be checked or encoded, expose `unsafe fn`/`unsafe trait` and document that obligation under `# Safety` in terms the caller can verify.
- Enable `unsafe_op_in_unsafe_fn`. An unsafe function grants obligations to the caller; it does not justify every operation in its body.
- Keep each unsafe block narrow enough that its `// SAFETY:` comment names the local facts establishing the callee's requirements. Never rely on an undocumented precondition behind a safe function.
- Convert generic inputs to concrete, validated representations before entering unsafe code. A safe trait implementation may behave adversarially, panic, re-enter, or violate informal semantic expectations while still satisfying Rust's type rules.

For high-impact kernels, review the proof separately from the implementation and use a reviewer who did not construct the original argument when practical. Re-open the soundness review when private fields, constructors, safe callers, generic bounds, or callback behavior change; an untouched unsafe block can become unsound when facts around it drift.

## References, Raw Pointers, and Provenance

- Do not create a reference until validity, alignment, dereferenceability, lifetime, and aliasing are established. A temporarily invalid or misaligned reference is not made acceptable by immediately converting it back to a pointer.
- Use raw-pointer operations for memory that is unaligned, partially initialized, potentially aliased, or not yet proven to be a valid referent.
- Treat pointers as carrying provenance, not merely numeric addresses. Prefer strict-provenance APIs (`addr`, `with_addr`, `map_addr`) when address manipulation is actually needed.
- Avoid pointer-to-integer-to-pointer round trips. Exposed-provenance APIs are an explicit escape hatch, not a default representation.
- Do not infer a complete aliasing model from current optimizer behavior. The Reference lists UB categories but explicitly does not promise an exhaustive formal model.

## Partial Initialization and Panic Safety

`MaybeUninit<T>` suspends the requirement that storage already contains a valid `T`; it does not relax the requirements after `assume_init`, reference creation, typed reads, or drop.

For arrays, buffers, and intrusive structures:

1. Track initialized elements independently from capacity.
2. Advance the initialized count only after construction succeeds.
3. Use a guard that drops exactly the initialized prefix on panic or early return.
4. Transfer ownership once, then disarm the guard.
5. Review zero-length, ZST, overflow, and destructor-panic behavior separately.

Do not use zero initialization unless every all-zero bit pattern is valid for the exact type. Do not read a non-`Copy` value twice from raw storage or reconstruct multiple owners from the same pointer.

Unsafe code may temporarily violate a safety invariant only while no panic, callback, destructor, allocation, formatting, or other operation can observe/unwind through that state. Prefer restoring validity before any such call. When that is impossible, install a repair/drop guard before breaking the invariant.

## `Pin` and Address-Sensitive Types

Use `Pin` only when correctness depends on an object remaining at a stable address, not merely because a type contains a pointer to its own allocation.

Audit all of the following together:

- how the value becomes pinned and whether it was moved beforehand;
- which fields are structurally pinned and how projections are implemented;
- whether `Unpin` is intentionally derived or suppressed;
- whether `Drop` behaves as if receiving `Pin<&mut Self>` and never moves pinned fields;
- whether replacement, assignment, container reallocation, and malicious `Deref` implementations preserve the invariant.

Prefer indices, stable owned indirection, handles, or a state machine when they express the relationship without self-reference. `Pin` is a library contract enforced through unsafe implementations; it does not make arbitrary pointer relationships valid.

## `unsafe impl Send` and `Sync`

Treat auto-trait implementations as public unsafe APIs.

Before `unsafe impl Send` or `Sync`, prove:

- every reachable shared mutation is synchronized;
- thread-affine resources cannot be accessed or destroyed on the wrong thread;
- callbacks and foreign handles obey the claimed thread contract;
- generic parameters impose the required `Send`/`Sync` bounds;
- `PhantomData` accurately models ownership, variance, drop checking, and auto traits;
- destruction cannot race with access.

Negative auto-trait behavior may be a deliberate safety property. A wrapper around a raw handle must not become `Send` or `Sync` merely because the underlying pointer type happens to permit an inference or because tests use one thread.

## FFI Boundary

Model FFI as a protocol, not a function declaration.

- Specify ABI separately from layout. `repr(C)` constrains layout for the annotated type; it does not validate inputs, make nested Rust-layout types portable, or define ownership.
- Prefer integer/tag plus payload validation over importing a foreign C enum directly when the foreign side may produce values outside Rust's enum discriminants.
- Specify nullability, alignment, length, valid ranges, encoding, lifetime, thread affinity, ownership transfer, allocator pairing, and version negotiation for every argument and return value.
- Use opaque handles and explicit create/destroy functions for long-lived resources. Make double-free, use-after-close, and allocator mismatch impossible in the safe wrapper.
- Assume callbacks can re-enter, block, invoke destructors, and observe partially updated state. Do not hold an exclusive borrow or lock across a callback unless re-entry is explicitly prevented.
- Do not let unwinding cross an ABI that forbids it. Choose an appropriate `-unwind` ABI only when both sides define the behavior; otherwise catch panics at exported Rust boundaries or abort according to the documented policy.
- Foreign code can introduce UB that invalidates the whole Rust program. Validate what can be validated and keep the trusted foreign surface small.

## Verification Matrix

No single tool proves soundness. Match evidence to the risk:

| Risk | Evidence |
| --- | --- |
| Alias, validity, use-after-free, uninitialized reads | Focused Miri tests across edge cases and panic paths |
| Native/FFI memory errors unsupported by Miri | Address/Memory/Thread sanitizers on supported targets |
| Parser or safe-wrapper input surface | Coverage-guided fuzzing plus a small structured seed corpus |
| Lock-free or atomic interleavings | Loom/model tests with minimized state space and explicit memory-order reasoning |
| Layout/ABI | Compile-time/runtime assertions against authoritative headers and every supported target/toolchain |
| Public safe boundary | Adversarial tests using only safe code, custom trait impls, re-entry, panics, and concurrency |

A clean Miri or sanitizer run means only that tested executions did not reveal a modeled violation. Keep the written proof as the primary artifact and require unsafe-focused review for changes to the kernel, its callers, or the invariants it depends on.

Assertions are evidence only when they execute. Never rely on `debug_assert!` to establish a safety precondition in optimized builds; validate with `assert!`/checked construction or make the obligation caller-visible in an unsafe API.

## Sources

- [Rust Reference: behavior considered undefined](https://doc.rust-lang.org/reference/behavior-considered-undefined.html)
- [Standard library developers guide: safety comments](https://std-dev-guide.rust-lang.org/policy/safety-comments.html)
- [Rustonomicon: working with unsafe](https://doc.rust-lang.org/nomicon/working-with-unsafe.html)
- [Rustonomicon: exception safety](https://doc.rust-lang.org/nomicon/exception-safety.html)
- [Standard library developers guide: generics and unsafe](https://std-dev-guide.rust-lang.org/tricky/generics-and-unsafe.html)
- [`std::ptr`: provenance](https://doc.rust-lang.org/std/ptr/index.html#provenance)
- [`MaybeUninit`](https://doc.rust-lang.org/std/mem/union.MaybeUninit.html)
- [`Pin`](https://doc.rust-lang.org/std/pin/)
- [Rustonomicon: `PhantomData`](https://doc.rust-lang.org/nomicon/phantom-data.html)
- [Rustonomicon: FFI](https://doc.rust-lang.org/nomicon/ffi.html)
- [Rust Reference: type layout](https://doc.rust-lang.org/reference/type-layout.html)
- [Miri](https://github.com/rust-lang/miri)
- [Rust Unstable Book: sanitizers](https://doc.rust-lang.org/unstable-book/compiler-flags/sanitizer.html)
- [Loom](https://docs.rs/loom/latest/loom/)
- [Community discussion: unsafe code in peer review](https://www.reddit.com/r/rust/comments/pk9pmc/)
- [Community discussion: improving unsafe Rust](https://www.reddit.com/r/rust/comments/1iyntvt/)

The Unsafe Code Guidelines glossary is useful vocabulary for validity, safety invariants, and provenance, but its own introduction says the project is largely abandoned and the Rust Reference remains authoritative: [UCG introduction](https://rust-lang.github.io/unsafe-code-guidelines/introduction.html), [UCG glossary](https://rust-lang.github.io/unsafe-code-guidelines/glossary.html).
