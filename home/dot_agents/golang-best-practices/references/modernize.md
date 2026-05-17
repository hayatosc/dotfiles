# Modern Go

Adopt new language features and standard library packages when they simplify code.

## Generics

- Use generics for type-safe data structures (sets, trees, generic helpers) and algorithms.
- Do not use generics to over-abstract simple functions that are clearer with concrete types.
- Prefer `any` over `interface{}`.

```go
func Map[T, U any](s []T, f func(T) U) []U {
    r := make([]U, len(s))
    for i, v := range s {
        r[i] = f(v)
    }
    return r
}
```

## Standard Library Additions

- `slices` and `maps` packages (Go 1.21+): use for generic sorting, binary search, cloning, and manipulation.
- `cmp` package (Go 1.21+): use `cmp.Compare` and `cmp.Or`.
- `min` and `max` builtins (Go 1.21+): use instead of manual conditionals.
- `clear` builtin (Go 1.21+): use to zero or delete all entries in maps and slices.

```go
import "slices"

sorted := slices.Clone(unsorted)
slices.Sort(sorted)
```

## Structured Logging

- Use `log/slog` (Go 1.21+) for new projects.
- Prefer structured logging over formatted strings.
- Pass `slog.Logger` explicitly or through `context.Context` with `slog.WithContext`.

```go
slog.Info("request handled", "method", r.Method, "path", r.URL.Path, "duration", d)
```

## Error Joining

- Use `errors.Join` (Go 1.20+) to aggregate multiple independent errors.

## Version Policy

- Support the latest two Go releases in production.
- Use `go` directive in `go.mod` to declare the minimum version.
- Update CI to test against the minimum supported version and the latest release.

## Context First

- Context is always the first parameter after the receiver (if any).
- Propagate context through every layer. Do not store it in structs.

## Concurrency

- Use `context.WithCancelCause` (Go 1.20+) to attach root causes to cancellation.
- Prefer `slog` with `slog.NewLogLogger` when adapting older code.

## Slices and Maps Best Practices

- Use `slices.Delete` instead of manual append for removing elements.
- Use `maps.Copy` and `maps.Clone` for map operations.
- Use `slices.Compact` to remove duplicates from sorted slices.
