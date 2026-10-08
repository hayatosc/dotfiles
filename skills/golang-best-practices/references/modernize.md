# Modern Go

Adopt new language features and standard library packages when they simplify code and improve performance. Target Go 1.27 conventions.

## Generic Methods (Go 1.27+)

Method declarations can declare their own type parameters, independent of the receiver type.

- Use generic methods when an operation on a concrete type or struct is generic over an input or output type.
- Do not attempt to declare type parameters on interface methods (interfaces cannot define generic methods).
- Generic methods cannot be used to satisfy non-generic interface contracts.

```go
type Processor struct {
    ID string
}

// Convert declares its own type parameter T
func (p *Processor) Convert[T any](input T) Result[T] {
    return Result[T]{Value: input, ProcessorID: p.ID}
}
```

## Standard Library Additions (Go 1.27)

- `uuid`: Native RFC 9562 UUID support. Use `uuid.New()` (UUIDv4) or `uuid.NewV7()` (time-ordered UUIDv7). Parse with `uuid.Parse(s)` or `uuid.MustParse(s)`. Eliminates third-party UUID dependencies.
- `encoding/json/v2`: Modern, strict, high-performance JSON library. Replaces `encoding/json` for new projects with better error messages, duplicate key detection, and customizable options.
- Struct Literal Field Selectors: Initialize nested or embedded struct fields directly in struct literals (e.g., `Config{Server.Port: 8080}`).
- `crypto/mldsa`: Standard post-quantum digital signature algorithms (ML-DSA).
- `go fix`: Modernized analyzers (`atomictypes`, `embedlit`, `slicesbackward`, `unsafefuncs`) to automate upgrading legacy idioms.

## Pointer Expressions: new(expr) (Go 1.26+)

The built-in `new` function accepts expressions, eliminating the need for temporary variables or custom pointer helper functions (`ptr(v)`):

```go
// Go 1.26+: Direct pointer initialization from expression
type Config struct {
    Timeout  *time.Duration
    Retries  *int
    Endpoint *string
}

cfg := Config{
    Timeout:  new(30 * time.Second),
    Retries:  new(3),
    Endpoint: new("https://api.example.com"),
}
```

## Concurrency and Time Testing: testing/synctest (Go 1.25+)

Use `testing/synctest` for deterministic concurrent testing using virtual time:

- Wrap concurrent or time-dependent tests in `synctest.Test(t, func(t *testing.T) { ... })`.
- Within the test bubble, `time.Sleep` advances virtual time immediately once all goroutines in the bubble are blocked.
- Use `synctest.Wait()` to ensure all goroutines in the bubble reach a durable block before asserting state.
- Eliminates flaky tests caused by real-world `time.Sleep` delays.

```go
import (
    "testing"
    "testing/synctest"
    "time"
)

func TestWorkerTimeout(t *testing.T) {
    synctest.Test(t, func(t *testing.T) {
        w := NewWorker(10 * time.Minute)
        go w.Run()

        synctest.Wait()
        // Virtual time advances instantly to trigger the timeout
        if !w.TimedOut() {
            t.Fatal("expected worker to time out")
        }
    })
}
```

## Benchmarks: b.Loop() (Go 1.24+)

Use `for b.Loop()` in benchmarks instead of `for i := 0; i < b.N; i++`:

- Automatically manages timer (resets on first iteration, stops when loop completes).
- Runs setup and cleanup code exactly once.
- Prevents compiler dead-code elimination of loop body results.

```go
func BenchmarkProcess(b *testing.B) {
    data := prepareData() // Runs once, excluded from timer

    for b.Loop() {
        Process(data)
    }
}
```

## Directory-Scoped Filesystem: os.Root (Go 1.24+)

Use `os.Root` (`os.OpenRoot(dir)`) to confine filesystem operations within a root directory:

- Prevents directory traversal attacks and symlink escape vulnerabilities natively.
- Use `root.Open`, `root.Create`, and `root.Stat` instead of manual path cleaning with `filepath.Clean`.

```go
root, err := os.OpenRoot("/safe/data/dir")
if err != nil {
    return err
}
defer root.Close()

// Secure against path traversal even if name is "../../etc/passwd"
f, err := root.Open(untrustedName)
```

## Iterators and Range-Over-Func (Go 1.23+)

Use `iter.Seq` and `iter.Seq2` for custom sequences and iterator-driven data pipelines:

- Standard iterator signatures:
  - `iter.Seq[V any] func(yield func(V) bool)`
  - `iter.Seq2[K, V any] func(yield func(K, V) bool)`
- Use `slices.All`, `slices.Values`, `slices.Collect`, `slices.Chunk`, and `slices.Backward`.
- Use `maps.Keys`, `maps.Values`, `maps.All`, and `maps.Collect`.

```go
import (
    "iter"
    "maps"
    "slices"
)

// Iterating over map keys in sorted order
keys := slices.Sorted(maps.Keys(m))
for _, k := range keys {
    // ...
}
```

## Value Canonicalization: unique (Go 1.23+)

Use `unique.Make` for interning values (strings, comparable structs) to deduplicate memory and make equality comparisons O(1):

```go
import "unique"

type Symbol unique.Handle[string]

func NewSymbol(name string) Symbol {
    return Symbol(unique.Make(name))
}
```

## Loop Variable Scoping & Integer Range (Go 1.22+)

- Loop variables in `for` loops are per-iteration: closures and goroutines within loops safely capture the variable without `v := v`.
- Range over integers: `for i := range 10` instead of `for i := 0; i < 10; i++`.

## HTTP Routing: net/http.ServeMux (Go 1.22+)

Use standard `net/http.ServeMux` for method-aware and wildcard path routing without third-party routers:

```go
mux := http.NewServeMux()
mux.HandleFunc("GET /items/{id}", handleGetItem)
mux.HandleFunc("POST /items", handleCreateItem)

func handleGetItem(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    // ...
}
```

## Structured Logging & Standard Collections (Go 1.21+)

- Use `log/slog` for structured logging.
- Use `slices` and `maps` packages for generic algorithms.
- Use `cmp.Or` for fallback/default value selection.
- Built-ins: `min`, `max`, and `clear`.

## Error Joining & Cancellation Causes (Go 1.20+)

- Use `errors.Join` to aggregate multiple errors.
- Use `context.WithCancelCause` to propagate cancellation causes. Retrieve causes with `context.Cause(ctx)`.

## Version Policy

- Target the latest two Go releases in production (currently **Go 1.27** and **Go 1.26**).
- Declare the minimum version using the `go` directive in `go.mod` (`go 1.27`).
- Update CI to test against the minimum supported version and the latest release.
