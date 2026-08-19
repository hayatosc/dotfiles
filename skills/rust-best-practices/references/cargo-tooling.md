# Cargo Contracts and Feature Topology

Treat Cargo metadata as part of the product contract. The difficult failures appear in downstream dependency graphs, alternate toolchains, and feature unions—not the maintainer's default build.

## Feature Design

Cargo normally unifies features requested for a package, so any union can appear even when no direct consumer requested that exact combination.

- Make features additive: enabling one must not disable another feature or remove public behavior.
- Prefer runtime selection or separate crates for fundamentally incompatible backends. A compile-time error for `a + b` pushes graph incompatibility onto downstream users who may not control unification.
- Distinguish capabilities (`serde`, `tls`) from policy choices (“use backend X exclusively”). Capabilities compose more naturally.
- Keep optional dependencies private to feature naming with `dep:name` when the dependency name should not become a permanent public feature.
- Avoid putting expensive or environment-specific capabilities into `default` unless most users require them; removing a default feature later can break assumptions.
- Use resolver v2/current workspace resolver behavior intentionally, but do not assume it eliminates all unification across normal dependency edges.

Test no-default, default, all-features, and meaningful pairs/unions. For a workspace, test from representative downstream packages because the root invocation may not reproduce consumer resolution.

## MSRV Is a Dependency-Graph Policy

Set `package.rust-version` when an MSRV is promised. Test the exact supported toolchain, not only stable. A crate can remain syntactically compatible while a transitive dependency raises its MSRV.

Decide:

- fixed MSRV versus rolling window;
- whether a minor release may raise it;
- which feature combinations/platforms the promise covers;
- how dependency updates are constrained and tested;
- whether resolver behavior may select older compatible dependencies.

Do not infer MSRV from edition. An edition migration and compiler-version policy are separate decisions.

## Public Dependency Exposure

A dependency becomes part of your API when public signatures expose its types, traits, macros, derive behavior, feature flags, or serialized formats. Then updates may become SemVer decisions rather than internal maintenance.

Before exposing one:

- assess its stability/MSRV/licensing and whether multiple versions can coexist;
- consider a local newtype or conversion boundary;
- avoid re-exporting a dependency wholesale merely for convenience;
- document which feature activates the interoperation;
- test with the dependency versions your manifest permits.

Dependencies with proc macros, build scripts, native compilation, Git sources, or significant unsafe code deserve extra trust and reproducibility review.

## Lockfile and Resolution Policy

Applications usually commit `Cargo.lock` to make deployed resolution reviewable. Published libraries should still keep a lockfile for their own CI/repository reproducibility even though dependents resolve their own graph; follow an explicit repository policy.

Test compatibility against both the locked graph and periodically updated allowed dependencies. A green locked build does not prove that declared version ranges compose with current registry resolution.

Use minimal-version testing only with awareness of Cargo's support status and ecosystem manifests; it is a diagnostic, not a substitute for choosing correct lower bounds.

## Lint Policy as Compatibility

Pin lint expectations to the supported toolchain strategy. New compiler/Clippy lints can appear as toolchains change, and `-D warnings` can turn that into unrelated breakage.

- Keep correctness/soundness lints strict.
- Enable individual opinionated/restriction lints with a reason; never enable the entire Clippy restriction group.
- Scope allows narrowly and explain the invariant or generated-code boundary.
- Do not weaken a lint globally to land one exception.
- For libraries, account for downstream compilation contexts and generated macro code.

## CI Matrix from Contracts

Build the matrix from promises and risks, not every Cartesian product:

- exact MSRV plus stable;
- required targets and `no_std`/alloc modes;
- default, no-default, all, and high-risk feature unions;
- public examples/doctests;
- dependency-update/compatibility job;
- Miri/sanitizer/fuzz/model tests only for relevant kernels;
- SemVer/downstream checks for public API changes.

Nightly-only diagnostics should not silently make nightly part of the supported build unless that is the declared product contract.

## Sources

- [Cargo Book: features and unification](https://doc.rust-lang.org/cargo/reference/features.html)
- [Cargo Book: resolver versions](https://doc.rust-lang.org/cargo/reference/resolver.html#resolver-versions)
- [Cargo Book: `rust-version`](https://doc.rust-lang.org/cargo/reference/rust-version.html)
- [Cargo Book: SemVer compatibility](https://doc.rust-lang.org/cargo/reference/semver.html)
- [Cargo Book: workspaces](https://doc.rust-lang.org/cargo/reference/workspaces.html)
- [Clippy lint groups](https://doc.rust-lang.org/clippy/lints.html)
- [Cargo Book: lock files](https://doc.rust-lang.org/cargo/guide/cargo-toml-vs-cargo-lock.html)
