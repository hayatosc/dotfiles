# Performance

Premature optimization is the root of all evil, but knowingly pessimizing code is also bad.

## Allocations and Preallocation

- Preallocate slices and maps when the final size is known.
- Use `unique.Make` (Go 1.23+) to intern strings and comparable types in memory-intensive applications, reducing memory footprint and making comparisons O(1).
- Reuse buffers with `sync.Pool` for hot paths.
- Take advantage of runtime allocator improvements (Swiss Tables maps in Go 1.24+, small object allocator optimizations up to Go 1.27).

```go
results := make([]int, 0, len(inputs))
m := make(map[string]int, estimatedSize)
```

## Strings

- Use `strings.Builder` for string concatenation in loops.
- Avoid converting between `string` and `[]byte` repeatedly.

```go
var b strings.Builder
for _, s := range items {
    b.WriteString(s)
}
result := b.String()
```

## Slices and Maps

- Pass slices by value (they are small descriptors). Only use a pointer if you must modify the slice header (length/capacity).
- Maps are reference types; pass them by value unless you need to replace the map itself.
- Use `slices` and `maps` package functions (`slices.Grow`, `slices.Clip`, `slices.Compact`) and iterators (`slices.Collect`) to avoid superfluous allocations.
- Do not over-allocate. Use capacity hints, but do not guess wildly.

## Pointers vs Values

- Do not pass pointers to function arguments just to save a few bytes.
- Pass values for small, immutable structs. Pass pointers for large structs or mutable structs.
- `time.Time`, `string`, and small structs are good candidates for value passing.

## Benchmarking

- Use `for b.Loop()` (Go 1.24+) in benchmarks to ensure setup code runs once and results are protected from compiler elimination.
- Profile before optimizing. Use `go test -bench=. -cpuprofile=cpu.out`.
- Use `go tool pprof` and `go tool trace` to find actual bottlenecks.
- Optimize the real bottleneck, not what looks expensive.

## I/O

- Reuse `bufio.Reader` and `bufio.Writer` wrappers.
- Use `io.Copy` instead of manual read/write loops when possible.
- Batch small writes; flush judiciously.

## Reflection

- Avoid `reflect` in hot paths. It is slow and hard to maintain.
- Use type switches or generics instead.
