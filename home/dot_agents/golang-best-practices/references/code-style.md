# Code Style

Go style is mostly automated. Follow the tools, then apply these conventions.

## Formatting

- Run `gofmt` on every save. Use `goimports` to manage imports automatically.
- Use tabs for indentation.
- There is no strict line length limit, but keep lines readable. Break lines based on semantics, not character count.
- Do not put the opening brace of a control structure on its own line.

```go
// Good
if err != nil {
    return err
}

// Bad
if err != nil
{
    return err
}
```

## Naming

- Package names: short, lowercase, single word; no underscores or mixedCaps.
  - The package name is the default import name. Make it easy to type.
  - The name should be the base of the source directory (`encoding/base64` → package `base64`).
- Exported names start with uppercase; unexported with lowercase.
- Use `MixedCaps` or `mixedCaps`; never `snake_case` or `kebab-case`.
- Initialisms have consistent case: `ServeHTTP`, `urlPony`, `appID`, `XMLHTTPRequest`. Never `ServeHttp` or `appId`.
- Getters: use the field name without `Get`. Setter uses `Set`.
  - `obj.Owner()` not `obj.GetOwner()`; `obj.SetOwner(x)`.
- Interface names: one-method interfaces use the method name plus `-er`: `Reader`, `Writer`, `Formatter`.
- Avoid repetition with the package name: `ring.New` not `ring.NewRing`; `bytes.Buffer` not `bytes.ByteBuffer`.

## Comments

- Doc comments start with the name of the thing being described and are complete sentences.
- Every exported name must have a doc comment.
- Package comments come immediately before the `package` clause with no blank line.

```go
// Package math provides basic constants and mathematical functions.
package math
```

## Receivers

- Receiver names: short abbreviation of the type (`c` for `Client`, `srv` for `Server`).
- Never use generic names like `me`, `this`, or `self`.
- Be consistent within a type.
- Pointer vs value receiver:
  - If the method mutates the receiver, use a pointer.
  - If the receiver contains a `sync.Mutex`, use a pointer.
  - If the receiver is large, use a pointer.
  - If unsure, use a pointer.
  - Do not mix receiver types within a single type.

## Control Structures

- Use `if` with short variable declarations for error checking.
- Omit unnecessary `else` when the `if` body ends in `return`, `break`, or `continue`.
- Use `switch` for long `if-else` chains.
- Use `range` for iterating over slices, maps, strings, and channels.

## Named Result Parameters

- Name results when their meaning is unclear from context or when two or more share a type.
- Do not name results solely to enable naked returns.
- Naked returns are acceptable only in very short functions.

## Imports

- Group imports: standard library first, then blank line, then third-party, then blank line, then project internal.
- `goimports` handles this automatically.
- Avoid dot imports (`import . "foo"`) except in external test packages for circular dependency reasons.
- Avoid blank imports (`import _ "foo"`) except for side effects in `main` or tests.
