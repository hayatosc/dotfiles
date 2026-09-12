---
name: hono-best-practices
description: Implement or review Hono routes, middleware, validation, and RPC typing. Use for Hono-specific behavior or inference issues, not generic TypeScript work.
---

# Hono Best Practices

Preserve the inference chain from route definitions to the RPC client and validate external input at runtime. Follow the repository's runtime, validator, and test setup.

## Required Baseline

- Keep the typed result of chained route definitions and export its type for RPC. Mount feature routers with `app.route()` rather than losing their inferred route types.
- Prefer inline route handlers. Before extracting handlers, read [routing.md](references/routing.md) and preserve path, validator, and middleware inference.
- Type bindings and context variables with the app's `Env`; ensure middleware initializes variables before handlers use them.
- Validate external input with the project's validator and consume the validated result. Set the matching Content-Type in JSON/form request tests.
- Register middleware in the intended scope and order. Keep authentication and error handling intact when reorganizing routes.

## Select the Relevant Reference

| Task | Reference |
|---|---|
| Route composition, handler extraction, or missing client routes | [routing.md](references/routing.md) |
| Bindings, context variables, middleware scope or ordering | [context-and-middleware.md](references/context-and-middleware.md) |
| Request validation and Content-Type pitfalls | [request-validation.md](references/request-validation.md) |
| Multiple validators, schema reuse, or OpenAPI | [validation-patterns.md](references/validation-patterns.md) |
| Sharing route types with a client | [rpc-basics.md](references/rpc-basics.md) |
| RPC error types, custom fetch, or monorepo setup | [rpc-patterns.md](references/rpc-patterns.md) |
| Error responses or request-level tests | [errors-and-testing.md](references/errors-and-testing.md) |

Read the reference that resolves the current question; these are independent routes, not a reading checklist. Check the installed version and [official Hono docs](https://hono.dev/) when an API or runtime detail is uncertain.

## Common Failure Signals

- Missing RPC routes: check whether the exported value retains the chained route type.
- Unknown context variables: check the `Env` generic and the middleware that initializes them.
- Empty JSON or form bodies: check the request's Content-Type.
- Weakened path parameter inference: check detached handlers and factory boundaries.

Complete the affected behavior and use the relevant project checks. For RPC changes, establish both server behavior and client type inference; do not introduce a new dependency or reshape unrelated routes merely to match an example.
