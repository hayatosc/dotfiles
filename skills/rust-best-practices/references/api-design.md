# Public API Design Under Evolution

Use this reference for library APIs and any internal interface with multiple independent consumers. Optimize for what the crate can change later, not only for today's call site.

## Classify the Extension Point

Before publishing a trait or type, decide who may extend what:

| Contract | Design |
| --- | --- |
| Users call behavior; crate controls implementations | Sealed trait or private implementation type |
| Users implement behavior; crate calls it | Minimal public trait; object-safety and future required methods planned up front |
| Users need runtime heterogeneous implementations | Dyn-compatible core trait; explicit ownership/lifetime of trait objects |
| Set of variants is closed and exhaustiveness is useful | Enum without `non_exhaustive` |
| Variants/fields will grow compatibly | Apply `#[non_exhaustive]` at initial release and document fallback behavior |

Sealing is not a cosmetic pattern: it reserves evolution rights by denying downstream implementation. Say that explicitly. Conversely, a public unsealed trait delegates part of the compatibility surface to unknown implementations.

## SemVer Traps Beyond Signatures

Review downstream source behavior, inference, method lookup, and layout—not just whether existing functions remain:

- Adding a required trait item or changing an item signature breaks implementors.
- A defaulted trait method can still collide with another trait method.
- A new associated item can make a formerly dyn-compatible trait unusable as `dyn Trait`.
- Tightening a bound is breaking; adding bounds to a public data type may force every user to satisfy them.
- Adding inherent methods, blanket impls, or trait impls can alter resolution/inference or overlap with downstream code.
- Adding enum variants breaks exhaustive matches unless non-exhaustiveness was part of the original contract.
- Adding `#[non_exhaustive]` later restricts existing construction/matching and is itself breaking.
- Changing a guaranteed layout/size/alignment is breaking. Default Rust representation should not be treated as stable layout.
- Removing or repurposing a Cargo feature, dropping `no_std`, or raising MSRV/platform requirements may break consumers even if Rust items are unchanged.
- Error variants, auto traits (`Send`, `Sync`, `Unpin`), panic behavior, blocking behavior, and destructor effects can be practical compatibility contracts.

Use downstream compile tests or a SemVer checker for high-impact changes, then manually review behavioral commitments that tooling cannot infer.

## Input Flexibility Without Generic Pollution

Generic convenience in every method increases inference failures, compile time, public bounds, and monomorphization.

- Accept a concrete borrowed type when callers naturally have it.
- Use `Into<T>` when ownership conversion is fundamental and ambiguity is low.
- Use `AsRef<T>` for cheap borrowed views, not arbitrary semantic conversion.
- Use `IntoIterator` when multiple collection forms are a meaningful part of the API.
- Put broad conveniences in outer constructors/builders while keeping the core operation concrete.

Do not make a public struct generic merely because one constructor accepts multiple representations. Convert at the boundary and store the canonical domain type.

## Return Types and Abstraction Commitments

- Returning a concrete public type exposes capabilities and may commit layout/trait behavior.
- `impl Trait` hides the concrete type but commits captured lifetimes, auto traits, and one implementation family; changing captures can be breaking.
- `Box<dyn Trait>` creates a runtime and allocation boundary but can stabilize implementation choice.
- Iterator-returning APIs should consider whether exact size, double-ended iteration, fused behavior, or concrete type identity becomes relied upon.

Choose the amount of hidden information that future changes require, then document only guarantees you intend to preserve.

## Error Contract

Expose what callers can act on:

- stable recovery categories or query methods;
- original source chain for diagnostics;
- whether an operation is safe to retry and whether effects may already have occurred;
- whether errors may grow over time (`#[non_exhaustive]` before release);
- whether cancellation, timeout, and shutdown are distinct outcomes.

Do not publish every internal dependency error as an enum variant. That couples SemVer to implementation choices. Do not erase all errors when callers need machine-readable recovery.

## Builder and State Decisions

Use a builder when optional configuration is open-ended, construction needs validation as a unit, or adding future options must be compatible. Use a direct constructor when required arguments are few and stable.

For required builder fields, choose deliberately:

- runtime validation gives a compact stable type;
- typestate catches omissions at compile time but expands generic API and documentation;
- separate validated config construction often balances both.

Never rely on `Drop` to report construction/flush failures. Provide explicit `finish`, `close`, or `shutdown` methods when failure matters; define what `Drop` does if they were skipped.

## Feature-Gated API

Feature gates are public API topology. A downstream graph may enable any union.

- Features should add capability and compose.
- Avoid changing the meaning or representation of the same public type incompatibly across feature combinations.
- Keep optional dependency names from unintentionally becoming permanent public feature names (`dep:` syntax where appropriate).
- Document whether a feature affects public items, MSRV, platform support, or safety/crypto backend.
- Test representative unions, not just each feature alone.

## Documentation as API Contract

Treat doc comments (`///` and `//!`) as primary interface specifications:

- Provide a concise 1-line summary before the first blank line for search and module index previews.
- Use intra-doc links ([`Type`], [`function()`]) to hyperlink domain concepts across docs.
- Include runnable `# Examples` using `?` error propagation rather than `unwrap()`.
- Explicitly document preconditions and failure contracts with `# Errors`, `# Panics`, and `# Safety` headers.
- Enforce public documentation with `#![warn(missing_docs)]` and `#![warn(rustdoc::missing_crate_level_docs)]`.

Read [documentation.md](documentation.md) for detailed doc comment structure, hidden setup lines (`#`), and doc test attributes (`should_panic`, `no_run`, `compile_fail`).

## Sources

- [Cargo Book: SemVer compatibility](https://doc.rust-lang.org/cargo/reference/semver.html)
- [Rust API Guidelines: future proofing](https://rust-lang.github.io/api-guidelines/future-proofing.html)
- [Rust API Guidelines: flexibility](https://rust-lang.github.io/api-guidelines/flexibility.html)
- [Rust API Guidelines: documentation](https://rust-lang.github.io/api-guidelines/documentation.html)
- [The Rustdoc Book](https://doc.rust-lang.org/rustdoc/)
- [Cargo Book: features](https://doc.rust-lang.org/cargo/reference/features.html)
- [Rust Reference: type layout](https://doc.rust-lang.org/reference/type-layout.html)
- [Rust Reference: dyn compatibility](https://doc.rust-lang.org/reference/items/traits.html#dyn-compatibility)
