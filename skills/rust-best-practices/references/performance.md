# Performance Decisions Without Folklore

Performance work changes ownership, API, code size, and sometimes soundness proof burden. Require representative evidence before making those commitments.

## Frame the Constraint

State the metric, workload, and bound:

- tail/median latency, throughput, memory peak, allocation rate, binary size, startup, or compile time;
- representative input distribution and concurrency;
- target hardware, allocator, platform, and release profile;
- regression threshold and noise budget.

Profile an optimized build. A debug profile can invert costs and produce irrelevant hot paths.

## Choose the Cheapest Reversible Layer

Optimize in this order unless evidence points elsewhere:

1. algorithm and I/O pattern;
2. unnecessary repeated work and contention;
3. data layout/locality and allocation count;
4. representation/dispatch specialization;
5. compiler/profile settings;
6. unsafe micro-optimization.

Earlier layers usually provide larger gains with less proof and compatibility cost. Re-measure after each material change.

## Clone Versus Lifetime Complexity

Classify a hot clone:

- refcount increment (`Arc`) with possible contention;
- small inline copy;
- heap allocation/copy;
- deep graph duplication;
- copy needed to release a lock/borrow before expensive work.

Removing it may lengthen borrows, retain large owners, force public lifetimes, increase lock duration, or require arenas. Measure retained memory and contention as well as copy time. Keep an intentional clone when it buys a cleaner ownership boundary and is outside the bottleneck.

## Layout and Allocation Choices

- `Vec<T>` favors dense traversal; pointer-rich structures favor mutation/identity but cost locality and allocation.
- `Box<T>` can stabilize address and reduce enum/struct size but adds indirection/allocation.
- arenas amortize allocation and enable indices, but retain memory and couple lifetimes to arena epochs.
- small-vector/string optimizations help only when the measured size distribution matches inline capacity; they may enlarge every value.
- hashers trade denial-of-service resistance and speed; do not replace a keyed/default hasher on attacker-controlled keys without a threat-model decision.

Check whole-structure size, alignment, padding, cache behavior, and drop cost. Do not transmute or depend on default Rust field order to “optimize layout.”

## Static Versus Dynamic Dispatch

Generics may enable inlining and specialization but increase monomorphization, compile time, and binary size. `dyn Trait` adds indirection and restricts optimization but can shrink code and stabilize boundaries. Enum dispatch may give a closed-set compromise.

Benchmark at the call-pattern level. Dispatch overhead is often irrelevant beside allocation, I/O, cache misses, or work inside the call.

When generics spread through a large subsystem, consider a thin generic adapter that converts into a concrete representation or calls a non-generic/trait-object inner function. This retains boundary ergonomics while limiting repeated code generation. Treat the conversion, lost inlining, compile time, and binary size as jointly measurable costs.

## Unsafe Optimization Gate

Before replacing safe indexing, initialization, synchronization, or representation with unsafe:

1. show the safe version misses a stated target in a representative profile;
2. show the unsafe operation addresses the measured cause;
3. benchmark against the best clear safe alternative;
4. isolate the unsafe kernel and write its proof before code review;
5. add differential/property tests and appropriate Miri/sanitizer/model coverage;
6. retain benchmark thresholds so the extra proof burden can be removed if the gain disappears.

Prefer a safe design within measurement noise. Optimization is not permanent justification for unsafe code after compilers or libraries improve.

## Benchmark Validity

- Prevent constant folding/dead-code elimination where relevant.
- Separate setup/allocation from the measured operation when the product path does.
- Include warm/cold cache behavior according to reality.
- Report distributions and noise, not a single best run.
- Verify output correctness; a faster wrong path is easy to benchmark.
- Use end-to-end measurements for changes affecting scheduling, I/O, allocator contention, or batching.

## Sources

- [The Rust Performance Book: profiling](https://nnethercote.github.io/perf-book/profiling.html)
- [The Rust Performance Book: heap allocations](https://nnethercote.github.io/perf-book/heap-allocations.html)
- [The Rust Performance Book: type sizes](https://nnethercote.github.io/perf-book/type-sizes.html)
- [Cargo Book: profiles](https://doc.rust-lang.org/cargo/reference/profiles.html)
- [Criterion.rs statistics](https://bheisler.github.io/criterion.rs/book/analysis.html)
- [Rust Benchmarking Interest Group](https://github.com/rust-lang/rustc-perf)
- [Rust community: dynamic dispatch cost and code-size tradeoffs](https://users.rust-lang.org/t/how-much-slower-is-a-dynamic-dispatch-really/98181)
- [Rust community: generics and compile-time experience](https://users.rust-lang.org/t/soft-question-significantly-improve-rust-compile-time-via-minimizing-generics/103632)
