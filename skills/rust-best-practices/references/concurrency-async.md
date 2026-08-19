# Concurrency and Async Design Decisions

Async Rust makes suspension and task lifetime explicit, but it does not choose ownership, backpressure, cancellation, or shutdown policy. Decide those before selecting primitives.

## Own Every Task

For each spawned task, identify:

- who retains its handle;
- how completion and error are observed;
- what requests cancellation;
- what state survives cancellation;
- how shutdown waits for cleanup;
- whether the task may outlive the service/request that created it.

Dropping Tokio's `JoinHandle` detaches the task and loses the ability to observe its result. That is acceptable only for deliberately unobserved process-lifetime work whose errors and resource use are handled elsewhere. Structured ownership—task sets, trackers, or explicit join phases—should be the default for service work.

Do not transfer cancellation semantics from another runtime or wrapper by analogy. Some task handles abort on drop; Tokio's does not. Confirm the exact handle/runtime contract and test shutdown rather than inferring it from RAII expectations.

## Cancellation Is a State-Machine Property

A future may be dropped at any `.await`. Review each suspension point as an early-return edge.

An operation is cancellation-safe when dropping and recreating its future does not lose progress, duplicate effects, corrupt framing, or strand a resource. Techniques include:

- keep durable progress in state owned outside the temporary future;
- update state only at explicit commit points;
- make external effects idempotent with operation IDs;
- use a transaction or compensating action;
- complete a critical sub-operation in a separately owned task and rejoin it;
- make the API consume/return state so partial progress cannot disappear.

Do not blindly retry after timeout. A timeout can mean “caller stopped waiting,” not “operation did not occur.” Document whether cancellation is pre-commit, best-effort, or completion-guaranteed.

Memory-safe cancellation can still be business-unsafe. Request handlers that redeem purchases, acknowledge messages, mutate remote state, or emit audit records need durable commit/reconciliation semantics even though dropping their futures cannot cause Rust UB.

## Shutdown Protocol

A robust service separates:

1. detect shutdown;
2. stop admitting work;
3. notify owned tasks;
4. drain or cancel according to policy;
5. wait with a bounded deadline;
6. force termination only with documented data-loss/resource consequences.

Cancellation tokens broadcast intent; they do not wait for completion. Track tasks separately. Ensure producers stop before consumers are drained, or define how remaining messages are rejected/persisted.

## Locks, Actors, and Ownership

Choose from the protected resource and contention pattern:

- synchronous mutex: short CPU-only critical sections whose guards never cross `.await`;
- async mutex: the protected operation itself must suspend, with fairness/overhead accepted;
- actor/single-owner task: stateful resource has sequential semantics and message backpressure can be defined;
- sharding/per-key locks: independent keys dominate contention;
- atomics: a small invariant can be proven under a specific memory-order protocol.

Never select an async mutex merely because code is async. Moving I/O outside a critical section via snapshot → operate → conditional commit often gives clearer cancellation and contention behavior. An actor avoids shared mutation but introduces mailbox capacity, overload, response cancellation, and actor-failure decisions.

## Backpressure

Unbounded task spawning and unbounded channels convert load into memory growth and shutdown latency.

Specify:

- maximum in-flight work and queue capacity;
- behavior when full: wait, reject, shed oldest, coalesce, or persist;
- fairness/priority expectations;
- whether cancellation releases permits and queue slots;
- how metrics expose saturation.

Use a semaphore or bounded worker set around `spawn_blocking`; executor pools otherwise cannot prevent the underlying blocking system from being overwhelmed.

## Blocking Work

`spawn_blocking` is for bounded blocking calls or CPU work that cannot be made async. Once such a task starts, Tokio generally cannot abort it. Provide cooperative cancellation inside long operations, constrain concurrency, and include these tasks in shutdown accounting.

For sustained CPU parallelism, a dedicated compute pool or service may be a clearer boundary than consuming the async runtime's blocking pool. For sync libraries exposed to async callers, isolate async orchestration instead of creating nested runtimes or calling `block_on` from arbitrary runtime threads.

## `Send`, `'static`, and Local Executors

`spawn` requirements describe task lifetime and mobility, not a recommendation to make all state global/thread-safe.

- If a future is not `Send`, find the value live across `.await`; end its lexical scope or move out only needed data.
- `drop(value)` may not always make generator-state analysis forget the value; a smaller scope is clearer.
- Use a local executor intentionally for thread-affine GUI/runtime objects or `Rc`-based state, and isolate that choice at a boundary.
- Never add unsafe `Send`/`Sync` to satisfy an executor. Change execution topology or prove the auto-trait contract independently.
- Satisfy `'static` by owning task inputs or using scoped task APIs, not by leaking.

## Atomic and Lock-Free Escalation

Use atomics only when profiling shows lock/contention cost or the primitive itself requires lock-free behavior. Document the linearization point, allowed states, memory order for every edge, reclamation strategy, ABA exposure, and progress guarantee. Test interleavings with Loom, but retain the proof: model coverage is finite.

## Sources

- [Tokio task module: cancellation and blocking tasks](https://docs.rs/tokio/latest/tokio/task/index.html)
- [Tokio `JoinHandle`](https://docs.rs/tokio/latest/tokio/task/struct.JoinHandle.html)
- [Tokio graceful shutdown](https://tokio.rs/tokio/topics/shutdown)
- [Tokio shared state](https://tokio.rs/tokio/tutorial/shared-state)
- [Async Book: `Send` approximation](https://rust-lang.github.io/async-book/07_workarounds/03_send_approximation.html)
- [Async Book: synchronization](https://rust-lang.github.io/async-book/part-guide/sync.html)
- [Tokio: bridging synchronous and asynchronous code](https://tokio.rs/tokio/topics/bridging)
- [Loom](https://docs.rs/loom/latest/loom/)
- [Community correction: dropping a Tokio `JoinHandle` does not cancel](https://www.reddit.com/r/rust/comments/1c7xv7l/)
- [Community discussion: async cancellation and transactions](https://www.reddit.com/r/rust/comments/14gy470/)
