# Google Rust Style Guide Baseline

Reference: <https://google.github.io/styleguide/rustguide.html>

## Core Principles

- **Readability & LSCs**: Prioritize readability and maintainability over writeability, and favor patterns that support Large-Scale Changes (LSCs).
- **Library vs. Application**: API design rules are binding for library code; for application code, favor simplicity and directness over premature generalization.
- **Formatting**: Rely on `rustfmt` for formatting; avoid unstable features and running code before `main()`.

## Code Organization & Imports

- Name source files and leaf modules after their primary user-defined item. Do not implement APIs directly in non-leaf modules (re-exporting is fine).
- **No glob imports** (`use foo::*;`). Keep one module per `use` statement and prefer locally-scoped trait imports.
- **Qualify function calls, unqualify types**: Call top-level functions as `module::func()`, while importing type names and using them unqualified.

## Ownership, Types & APIs

- Prefer unique ownership and borrowing over `Rc`/`Arc`; prefer borrows over deep copies.
- Accept flexible immutable inputs (`&[T]`, `&str`, iterators/slices) and use `enum` instead of `bool` parameters for clarity.
- Prefer named struct fields over tuples or non-newtype tuple structs; use newtypes over type aliases when distinct type safety is needed.
- Pair important `From` implementations with explicit constructor methods; options structs should implement `Default`.
- Mark publicly-exposed enums (and public structs with public fields) `#[non_exhaustive]`; use `#[must_use]` on functions and types whose return values should not be silently ignored.

## Implementation Discipline

- Do not overuse type inference when explicit types improve clarity.
- Prefer pattern matching over check-then-unwrap, and prefer `expect("context")` over `unwrap()`.
- Use context strings on assertions (`assert!(cond, "context: ...")`).
- Prefer direct `for` loops over convoluted iterator combinator chains when clearer.
- Do not use `panic::catch_unwind` for normal control flow; prefer `format!`/`write!` for string concatenation.
