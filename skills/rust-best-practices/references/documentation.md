# Documentation Comments and Rustdoc Standards

Use this reference when writing, reviewing, or testing doc comments (`///` and `//!`) for crates, modules, and API items. In Rust, documentation is part of the public API contract: doc tests ensure code samples remain accurate and functional across refactorings, intra-doc links navigate the type graph safely, and standard section headers clearly define invariants and failure modes.

## Doc Comment Types and Placement

Choose the doc comment flavor according to the target element (RFC 1574):

| Syntax | Type | Target Element | Scope & Placement |
| --- | --- | --- | --- |
| `//!` | Inner line | Containing item (parent) | Crate root (`src/lib.rs`, `src/main.rs`) and standalone module files (`foo.rs`, `mod.rs`) |
| `///` | Outer line | Next following item | Structs, enums, functions, methods, traits, fields, and inline `mod foo { ... }` blocks |

- **Line comments exclusively**: Always use line doc comments (`///` or `//!`). Avoid block doc comments (`/** ... */` or `/*! ... */`) for consistency and clean git diffs (RFC 1574).
- **File headers**: Place `//!` at the very beginning of the file (before imports and code) to document the crate or module as a unified concept.

## Standard Section Structure

Structure each doc comment with progressive detail (RFC 1574 / Rustdoc conventions):

1. **Short Summary**: The very first sentence/line before the first blank line. Keep it concise, informative, and active (e.g., `Returns true if the option is a Some value.`). Rustdoc extracts this summary for module-level item lists and search result snippets.
2. **Detailed Description**: Expanded prose explaining behavior, domain context, edge cases, and motivations.
3. **Standard Section Headings (Markdown `# Heading`)**:

| Section | Applicability | What to Document |
| --- | --- | --- |
| `# Examples` | Every public item | Practical, runnable code snippet demonstrating the primary use case. Copy-pasteable and idiomatic. |
| `# Errors` | Any function returning `Result` | Exact conditions under which `Err` is returned, the error types/variants, and whether retry/recovery is possible. |
| `# Panics` | Any function that can panic | Preconditions or edge cases that trigger a panic (e.g., index out of bounds, invariant violation). |
| `# Safety` | Any `unsafe fn` or `unsafe trait` | Non-negotiable caller proof obligations and invariants required to prevent undefined behavior. |

```rust
/// Calculates the integer quotient and remainder.
///
/// Divides `numerator` by `denominator`, returning both the quotient and the remainder.
///
/// # Errors
///
/// Returns [`MathError::DivisionByZero`] if `denominator` is zero.
///
/// # Examples
///
/// ```
/// use my_crate::divide_rem;
/// # fn main() -> Result<(), Box<dyn std::error::Error>> {
/// let (quotient, rem) = divide_rem(10, 3)?;
/// assert_eq!(quotient, 3);
/// assert_eq!(rem, 1);
/// # Ok(())
/// # }
/// ```
pub fn divide_rem(numerator: i32, denominator: i32) -> Result<(i32, i32), MathError> {
    // ...
}
```

## Intra-Doc Links (RFC 1946 / C-LINK)

Use intra-doc markdown links to reference Rust items instead of raw text or external URLs:

- **Types & Traits**: `[`MyStruct`]`, `[`std::io::Error`]`, `[`Option<T>`]`.
- **Functions & Methods**: `[`my_function()`]` or `[`MyStruct::my_method()`]` (trailing `()` explicitly targets functions/methods).
- **Macros**: `[`my_macro!`]`, `[`println!`]`.
- **Disambiguation / Aliasing**:
  - `[`Baz<T>`][Baz]` or `[`Baz<T>`]: Baz` (maps link text with generics to the concrete type).
  - `[`foo`]: #method.foo` (disambiguates methods from same-named types/fields).

Hyperlink all domain concepts, associated types, and related methods across documentation prose so users can navigate the crate's type graph seamlessly.

## Doc Tests in Code Blocks (`cargo test --doc`)

Code blocks (```` ``` ````) in doc comments are compiled and executed as unit tests during `cargo test --doc` (and `cargo test`).

### 1. Use `?` Over `unwrap()` (C-QUESTION-MARK)
Demonstrate practical, idiomatic error handling. Avoid `unwrap()` or `panic!` in examples so users can copy-paste production-ready code directly.

### 2. Hide Setup Boilerplate with `#`
Prefix lines with `# ` to execute them during `cargo test --doc` while hiding them from the rendered HTML documentation:

```rust
/// Reads configuration from a file.
///
/// # Examples
///
/// ```
/// use my_crate::read_config;
/// # fn main() -> Result<(), Box<dyn std::error::Error>> {
/// let config = read_config("app.toml")?;
/// assert_eq!(config.port, 8080);
/// # Ok(())
/// # }
/// ```
pub fn read_config(path: &str) -> Result<Config, io::Error> {
    // ...
}
```

### 3. Code Block Attributes

Control test execution using code block attributes when applicable:

| Attribute | Behavior in `cargo test --doc` | Use Case |
| --- | --- | --- |
| *(default)* / `rust` | Compiles and executes; succeeds if no panic occurs. | Normal runnable examples. |
| `should_panic` | Compiles and executes; succeeds only if it panics. | Demonstrating panicking precondition violations. |
| `no_run` | Compiles successfully but is not executed. | Code requiring network/IO, infinite loops, or external system state. |
| `compile_fail` | Must fail compilation. | Verifying that invalid usage (e.g., lifetime violation, private field access) is rejected. |
| `ignore` | Not compiled or run. | Incomplete pseudocode or platform-unavailable code. |
| `shell`, `toml`, `text` | Syntax-highlighted only; ignored by `cargo test --doc`. | Configuration or CLI output examples. |

```rust
/// Demonstrates panicking on out-of-bounds access.
///
/// ```should_panic
/// let list = [1, 2, 3];
/// let _ = list[10];
/// ```
```

## Scope-Specific Documentation Guidelines

### Crate-Level Documentation (`//!` in `lib.rs` / `main.rs`)
- State the crate's purpose, domain role, and core value proposition in the opening summary.
- Provide a clear "Quick Start" code example using `?`.
- Offer a navigational roadmap linking to primary modules, structs, and builder workflows.
- Keep repository logistics (CI badges, contributing rules, MSRV details, license) in `README.md` rather than cluttering API docs.

### Module-Level Documentation (`//!` in module file or `///` on `mod`)
- Explain the module's domain responsibility and design philosophy at a high level.
- Compare included types/algorithms to guide callers on *when to choose what* (e.g., `std::collections` guidance).
- Provide subsystem workflow examples combining multiple items.
- Document performance tradeoffs, concurrency models, or memory characteristics relevant to the module.

### Item-Level Documentation (`///` on structs, enums, functions)
- Document the exact contractual behavior, parameters, return values, errors, panics, and safety obligations.
- Document enum variants and struct fields whenever their meaning or constraints are not self-evident.

## Lints and Verification

Enforce and audit documentation completeness and quality across the workspace:

- **Warn on Missing Docs**:
  ```rust
  #![warn(missing_docs)]
  #![warn(rustdoc::missing_crate_level_docs)]
  ```
- **Local Review**:
  ```bash
  cargo doc --no-deps --open
  ```
- **Doc Test Execution**:
  ```bash
  cargo test --doc
  ```
- **Coverage Measurement (Nightly)**:
  ```bash
  RUSTDOCFLAGS='-Z unstable-options --show-coverage' cargo +nightly doc --no-deps
  ```

## Sources

- [Rust Reference: Doc comments](https://doc.rust-lang.org/stable/reference/comments.html#doc-comments)
- [The Rustdoc Book: How to write documentation](https://doc.rust-lang.org/rustdoc/how-to-write-documentation.html)
- [The Rustdoc Book: Linking to items by name](https://doc.rust-lang.org/rustdoc/write-documentation/linking-to-items-by-name.html)
- [The Rustdoc Book: Documentation tests](https://doc.rust-lang.org/rustdoc/write-documentation/documentation-tests.html)
- [Rust API Guidelines: Documentation](https://rust-lang.github.io/api-guidelines/documentation.html)
- [RFC 1574: More API Documentation Conventions](https://rust-lang.github.io/rfcs/1574-more-api-documentation-conventions.html)
- [RFC 1946: Intra Rustdoc Links](https://rust-lang.github.io/rfcs/1946-intra-rustdoc-links.html)
- [Zenn: Rustのドキュメンテーションコメントの書き方 (Masaki)](https://zenn.dev/masaki_wk/articles/20230715-rust-doc-comment)
