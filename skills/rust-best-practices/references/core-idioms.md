# Ownership Architecture and Type-System Pressure

Use this reference when compiler pressure is producing clones, shared ownership, pervasive lifetimes, boxing, self-reference, or coherence workarounds.

## Borrowing Is a Temporal Contract

Do not decide `T`, `&T`, or `&mut T` from a style rule. Decide from the boundary:

- **Own** when the callee stores, queues, transfers, retries, or outlives the call. Owning at service/task/storage boundaries often removes brittle public lifetimes.
- **Borrow** when work is synchronous and the caller retains lifecycle control.
- **Copy/clone** when independent ownership is semantically real and the measured cost is acceptable. The problem is accidental cloning, not cloning itself.
- **Share** with `Rc`/`Arc` only when ownership is genuinely multiple. Shared ownership does not decide mutation serialization, shutdown, or cycle handling.

When a borrow fails, inspect its full lexical/dataflow span. Separate phases such as lookup → decide → mutate, return an index/key rather than a reference, or move a value out and replace it. Do not immediately redesign the entire API around longer lifetimes.

## Lifetime Escalation

A lifetime parameter commits callers to a relationship. Add one when the returned or stored value truly borrows from an input; do not add it to demonstrate that a local reference is short-lived.

Warning signs:

- lifetimes propagate through unrelated domain types;
- a public service object borrows configuration or storage for its entire existence;
- `'static` is requested to satisfy a task rather than a domain constraint;
- an attempted clone removal adds lifetime parameters to multiple public types.

At long-lived boundaries, owning a modest value is usually more evolvable. In hot or large-data paths, measure the copy and consider an arena, handle, or caller-owned buffer only if its lifecycle matches the domain.

## Self-Reference and Stable Identity

Before `Pin` or raw internal pointers, compare:

1. Store indices/keys and resolve on access.
2. Store owned indirection whose allocation address is stable while the owner moves.
3. Split construction from borrowing so references never live inside the owner.
4. Use a generational arena when identity and stale-handle detection are central.
5. Use `Pin` only when the public/unsafe contract is genuinely address-sensitive.

Each alternative changes failure behavior: indices require bounds/staleness policy; arenas impose bulk lifetime and memory-retention behavior; indirection allocates; `Pin` imposes projection and drop proof obligations. Choose from the domain, not merely to silence a move error.

## Typestate and Invariant Placement

Typestate is useful when invalid transitions are few, stable, and materially dangerous. It is counterproductive when it explodes generic signatures, leaks workflow internals into public APIs, or makes dynamic state persistence awkward.

Prefer:

- a private state enum plus checked methods for runtime-driven workflows;
- distinct types when stages expose genuinely different capabilities;
- a validated newtype when one local invariant removes repeated checks;
- runtime validation at untrusted/deserialization boundaries even if internal types are strict.

Do not confuse “unrepresentable internally” with “impossible to receive externally.” Parsing and version skew still require validation.

## Generics, `dyn`, and Enums

Choose the dispatch model deliberately:

| Model | Best fit | Cost/commitment |
| --- | --- | --- |
| Generic | Closed composition at compile time; inlining matters; concrete types flow naturally | Monomorphization/code size; type propagation; public bounds become API |
| `dyn Trait` | Runtime plugins/heterogeneity; stable boundary; compile-time/code-size pressure | Indirection; allocation/lifetime ergonomics; dyn-compatibility constraints |
| Enum dispatch | Small closed set of variants | Central coordination; adding a variant affects exhaustive matches |

When a trait must support both generic helpers and trait objects, keep the runtime core dyn-compatible and put generic conveniences in extension traits or methods constrained with `Self: Sized`. Verify that downstream object users do not lose required operations.

## Coherence Is a Design Budget

Public trait implementations influence method resolution and prevent future overlapping implementations.

- Use a local newtype when you need control over foreign type/trait combinations.
- Use a local extension trait for opt-in methods on foreign types.
- Seal a public trait when downstream implementation is not an intended extension point; document the restriction.
- Avoid broad blanket implementations unless their future overlap and downstream inference effects are understood.
- Treat adding inherent methods or impls as potentially breaking even when SemVer guidance classifies some cases as low-risk.

Do not work around coherence with unsafe casts, hidden global registries, or macros that duplicate the same semantic type.

## Sources

- [Rust Reference: implementation coherence](https://doc.rust-lang.org/reference/items/implementations.html)
- [Rust Reference: trait objects](https://doc.rust-lang.org/reference/types/trait-object.html)
- [`dyn` keyword and dispatch tradeoffs](https://doc.rust-lang.org/std/keyword.dyn.html)
- [`Pin`](https://doc.rust-lang.org/std/pin/)
- [Rust API Guidelines: flexibility](https://rust-lang.github.io/api-guidelines/flexibility.html)
- [Cargo Book: SemVer compatibility](https://doc.rust-lang.org/cargo/reference/semver.html)
