# Error Handling

In Go, errors are values. Treat them explicitly.

## Core Rules

- Do not discard errors with `_` unless you have a clear, documented reason.
- Keep the normal code path at minimal indentation. Handle errors and return early.

```go
// Good
f, err := os.Open(name)
if err != nil {
    return err
}
defer f.Close()

// Bad
f, err := os.Open(name)
if err == nil {
    // normal code deep in nesting
} else {
    return err
}
```

## Sentinel Errors

- Use package-level `var ErrFoo = errors.New("...")` for stable, comparable errors.
- Check with `errors.Is` to support wrapped errors.

```go
var ErrNotFound = errors.New("not found")

if errors.Is(err, ErrNotFound) {
    // handle
}
```

## Error Wrapping

- Wrap errors with `fmt.Errorf("...: %w", err)` when crossing API boundaries.
- Use `%w` only once per error chain level.
- Do not wrap errors when you are just propagating within the same abstraction layer.

```go
func parseFile(path string) error {
    b, err := os.ReadFile(path)
    if err != nil {
        return fmt.Errorf("read file: %w", err)
    }
    if err := parse(b); err != nil {
        return fmt.Errorf("parse: %w", err)
    }
    return nil
}
```

## Custom Error Types

- Implement `error` interface for domain-specific errors that need extra context.
- Keep error types unexported if possible. Expose them only if callers need to assert with `errors.As`.

```go
type NotFoundError struct {
    Resource string
    ID       string
}

func (e *NotFoundError) Error() string {
    return fmt.Sprintf("%s %s not found", e.Resource, e.ID)
}
```

## Error Strings

- Error strings should be lowercase and without trailing punctuation.
- This makes them easy to embed in larger messages.

```go
return errors.New("something bad") // Good
return errors.New("Something bad.") // Bad
```

## In-Band Errors

- Do not use in-band error values like `""` or `-1`. Return an explicit `bool` or `error`.
- The ok boolean should be the final return value.

```go
func Lookup(key string) (value string, ok bool) // Good
func Lookup(key string) string                  // Bad: empty string means error?
```

## Panic and Recover

- `panic` is for truly exceptional, unrecoverable conditions (e.g., programmer errors).
- Do not use `panic` for normal error handling.
- Use `recover` only in top-level HTTP/RPC handlers or `main` to prevent crashing the whole process.

## errors.Join (Go 1.20+)

- Use `errors.Join` to aggregate multiple independent errors, especially in cleanup or parallel operations.

```go
var errs []error
errs = append(errs, f1())
errs = append(errs, f2())
return errors.Join(errs...)
```
