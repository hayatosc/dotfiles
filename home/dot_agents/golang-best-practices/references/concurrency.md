# Concurrency

Concurrency is powerful in Go but easy to misuse. Prefer simplicity.

## Goroutine Lifetimes

- Make goroutine lifetimes obvious. If they aren't obvious, document when and why they exit.
- Never leak goroutines. A leaked goroutine holds memory and can block forever.
- Prefer synchronous functions. Let the caller add concurrency if needed.

## Context Propagation

- `context.Context` is the first argument: `func F(ctx context.Context, ...) error`.
- Pass `ctx` through the entire call chain.
- Do not store Context in a struct. Add it as a parameter to each method that needs it.
- Use `context.WithCancel`, `context.WithTimeout`, `context.WithDeadline` appropriately.
- Always call the cancel function returned by `WithCancel`, `WithTimeout`, or `WithDeadline`, typically with `defer`.

## Synchronization

- Use `sync.Mutex` or `sync.RWMutex` to protect shared state.
- Keep critical sections small. Do not do I/O or long computations while holding a mutex.
- Use `sync.WaitGroup` to wait for a collection of goroutines to finish.
- Use `sync.Once` for one-time initialization.
- Use `atomic` for simple numeric counters when performance is critical.

## Channels

- The sender closes the channel. Do not close from the receiver.
- Closing a channel is optional if range isn't used.
- Use buffered channels only when they solve a specific synchronization problem.
- Use `for range` over a channel when the sender will close it.
- Use `select` with a `default` case only for non-blocking sends/receives.

```go
// Good: producer owns the channel and closes it
func producer() <-chan int {
    ch := make(chan int)
    go func() {
        defer close(ch)
        for i := 0; i < 10; i++ {
            ch <- i
        }
    }()
    return ch
}
```

## Race Conditions

- Run tests with `-race` in CI.
- Do not read and write a variable from different goroutines without synchronization.
- Prefer passing data explicitly via channels over shared memory protected by mutexes when feasible.

## sync.Pool

- Use `sync.Pool` to reuse temporary objects and reduce GC pressure.
- Do not assume objects retrieved from a pool are in any particular state. Reset them before use.

## Common Patterns

- Pipeline: chain channels together, each stage in its own goroutine.
- Worker pool: fixed number of goroutines reading from a jobs channel.
- Fan-out/Fan-in: distribute work across workers, then merge results with a WaitGroup or a result channel.
