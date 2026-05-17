# Testing

Go's testing package is sufficient for most needs. Prefer table-driven tests.

## Table-Driven Tests

- Use a slice of anonymous structs with `name`, `input`, and `want` fields.
- Run each case with `t.Run` so they have individual names in output.

```go
func TestFoo(t *testing.T) {
    tests := []struct {
        name  string
        input int
        want  int
    }{
        {"positive", 1, 2},
        {"zero", 0, 0},
        {"negative", -1, -2},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got := Foo(tt.input)
            if got != tt.want {
                t.Errorf("Foo(%d) = %d; want %d", tt.input, got, tt.want)
            }
        })
    }
}
```

## Test Naming

- Test functions start with `Test`.
- Use `TestFunction` for testing a function; `TestFunction_Case` for subcases.
- Example functions demonstrate usage: `func ExampleFoo() { ... }`.

## Test Helpers

- Extract shared setup into helper functions.
- Call `t.Helper()` at the top of every helper so line numbers point to the caller.

```go
func assertEqual(t *testing.T, got, want int) {
    t.Helper()
    if got != want {
        t.Errorf("got %d; want %d", got, want)
    }
}
```

## Assertions

- Do not import heavy assertion libraries. Use the standard `testing` package.
- Error messages should say what was wrong, what input was used, what was expected, and what was got.
- Order: actual first, expected second in the message.

```go
t.Errorf("Foo(%q) = %d; want %d", tt.in, got, tt.want) // Good
```

## Benchmarks

- Use `func BenchmarkFoo(b *testing.B)`.
- Reset or stop the timer around expensive setup.
- Use sub-benchmarks (`b.Run`) to compare variations.

```go
func BenchmarkFoo(b *testing.B) {
    data := make([]byte, 1024)
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        Foo(data)
    }
}
```

## Fuzzing

- Add fuzz tests for functions that parse untrusted input.
- Start with a small seed corpus of valid inputs.

```go
func FuzzFoo(f *testing.F) {
    f.Add("hello")
    f.Fuzz(func(t *testing.T, s string) {
        Foo(s)
    })
}
```

## Mocks and Interfaces

- Define interfaces on the consumer side, not the producer side.
- Test with real implementations when possible. Use fakes or stubs only when real dependencies are too slow or unavailable.
- Avoid mock-first design. It couples tests to implementation details.

## Coverage

- Aim for high coverage on business-critical code. 100% coverage is not a goal in itself.
- Run `go test -coverprofile=c.out` and inspect with `go tool cover -html=c.out`.
- CI should enforce a minimum coverage threshold for key packages.
