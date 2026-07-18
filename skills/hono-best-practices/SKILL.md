---
name: hono-best-practices
description: >
  Best practices for building type-safe Hono applications. Use whenever
  working with Hono — writing routes, middleware, validators, RPC clients,
  or reviewing Hono code. Covers route structure, end-to-end type safety
  with RPC (hono/client), Standard Schema validation (Zod/Valibot/ArkType),
  the factory pattern for handler splitting, error handling, testing, and
  common gotchas that silently break TypeScript inference. Trigger for any
  task involving Hono: "write a Hono API", "add validation to this route",
  "share types between server and client", "set up Hono RPC", "create a
  middleware", "fix TypeScript errors in Hono code", "structure a Hono project",
  or any Hono-related question — even if the user doesn't say "best practices".
---

# Hono Best Practices

Hono's biggest strength is end-to-end type safety without code generation.
Its type inference flows directly from route definitions — but it breaks the
moment you deviate from a few key patterns. Keep those patterns in mind throughout.

For detailed API usage, runtime differences, platform-specific configurations, and official guidelines, always refer directly to the official Hono documentation at https://hono.dev/.

## Project Structure

Organize by **feature (vertical slice)**, not by layer. Grouping by
`controllers/`, `services/`, `repositories/` means every change touches
multiple directories. Grouping by feature keeps changes local:

```
src/
  features/
    users/
      route.ts      # routes and handlers defined inline here
      schema.ts     # zod/valibot schemas
    posts/
      route.ts
      schema.ts
  middleware/        # cross-cutting: auth, logger, CORS
  lib/               # DB connections, external clients
  app.ts             # root router — mounts all features
```

```typescript
// src/features/users/route.ts
import { Hono } from 'hono'

const users = new Hono()
  .get('/', (c) => c.json({ users: [] }))
  .get('/:id', (c) => c.json({ id: c.req.param('id') }))

export default users

// src/app.ts
import { Hono } from 'hono'
import users from './features/users/route'
import posts from './features/posts/route'

const app = new Hono()
  .route('/users', users)
  .route('/posts', posts)

export type AppType = typeof app   // export for RPC
export default app
```

Each feature's `route.ts` exports a chained Hono instance so RPC types
propagate correctly. The root `app.ts` composes them all.

## Don't make "Controllers" when possible

Avoid MVC/Ruby-on-Rails-style Controllers. In traditional frameworks like Rails or
Express, developers separate routes and controller classes/methods. In Hono, this
is a major type safety anti-pattern.

### Why Controllers are an anti-pattern in Hono

1. **Breaks Path Param Inference**: When handlers are moved into separate functions or classes typed with `Context`, TypeScript can no longer infer path parameters (`c.req.param("id")`) correctly.
2. **Breaks Middleware Context Variable Types**: Context variables set by middleware (`c.var.user`) lose their type safety when handlers are disconnected from the routing chain where the middleware is applied.

### The solution: Keep handlers inline or split by Router

Instead of extracting handler logic into an external class or controller file:

- **Prefer inline handlers** directly inside the chained route definitions (`.get('/', (c) => ...)`).
- **Split by Router, not by Controller**: If a route file is getting too large, split it into smaller nested routers using `app.route()`, keeping the route definitions and handlers together.

## Route Definition — The Rules That Make Types Work

**Rule 1: Define handlers inline, not as named functions.**
Pulling handlers into separate `Context`-typed functions destroys path param inference:

```typescript
// ❌ Breaks: TypeScript cannot infer the path structure
const listBooks = (c: Context) => c.json('list books')
app.get('/books', listBooks)

// ✅ Works: inference follows the chain
app.get('/books', (c) => c.json('list books'))
```

**Rule 2: Chain method calls and assign the result.**
For RPC to work, the type of the whole router must be captured in a single
variable. Separate `app.get()` / `app.post()` calls fragment the type:

```typescript
// ❌ Fragments the type — RPC clients won't see all routes
app.get('/posts', handler1)
app.post('/posts', handler2)

// ✅ Chains preserve the accumulated type
const route = app
  .get('/posts', handler1)
  .post('/posts', handler2)
export type AppType = typeof route
```

**When you must split handlers into files**, use `createFactory` — it is the
only safe way to separate handlers while preserving types (e.g. for complex
business logic):

```typescript
// features/posts/handlers.ts
import { createFactory } from 'hono/factory'
import { sValidator } from '@hono/standard-validator'
import { z } from 'zod'

type Env = { Variables: { userId: string } }
const factory = createFactory<Env>()

export const createPost = factory.createHandlers(
  sValidator('json', z.object({ title: z.string(), body: z.string() })),
  (c) => {
    const { title } = c.req.valid('json')    // fully typed
    return c.json({ ok: true, title }, 201)
  }
)

// features/posts/route.ts
import { Hono } from 'hono'
import { createPost } from './handlers'

const posts = new Hono().post('/', ...createPost)
```

Note that path param inference (`c.req.param('id')`) is weakened inside
`createHandlers` — it may return `string | undefined` instead of `string`.
Inline handlers are better for param-heavy routes.

## Typing the App: Bindings and Variables

Pass a generic `Env` to `new Hono<Env>()` to type environment bindings
(Cloudflare Workers secrets, D1, KV…) and context variables set by middleware:

```typescript
type Env = {
  Bindings: { DB: D1Database; API_KEY: string }
  Variables: { user: User; requestId: string }
}

const app = new Hono<Env>()
// c.env.DB        → D1Database
// c.var.user      → User (once set by middleware)
```

Middleware that sets variables should carry the same `Variables` type:

```typescript
import { createMiddleware } from 'hono/factory'

const authMiddleware = createMiddleware<{ Variables: { user: User } }>(
  async (c, next) => {
    const user = await verifyToken(c.req.header('Authorization'))
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    c.set('user', user)
    await next()
  }
)
```

## Middleware

### Priority: built-in → third-party → custom

Before writing a middleware, check whether Hono already ships one.
Re-implementing something that already exists adds maintenance burden and
often misses edge cases (timing-safe comparison, correct header casing, etc.).

**1. Built-in first.** These come with Hono at zero extra cost:

| Need | Import |
|------|--------|
| Request logging | `import { logger } from 'hono/logger'` |
| CORS | `import { cors } from 'hono/cors'` |
| JWT verification | `import { jwt } from 'hono/jwt'` |
| Bearer token auth | `import { bearerAuth } from 'hono/bearer-auth'` |
| Basic auth | `import { basicAuth } from 'hono/basic-auth'` |
| Secure headers (CSP, HSTS…) | `import { secureHeaders } from 'hono/secure-headers'` |
| Request ID | `import { requestId } from 'hono/request-id'` |
| Rate limiting (combine helper) | `import { some, every, except } from 'hono/combine'` |
| Response timing | `import { timing } from 'hono/timing'` |
| ETag | `import { etag } from 'hono/etag'` |
| Body size limit | `import { bodyLimit } from 'hono/body-limit'` |

```typescript
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'

const app = new Hono()
  .use(logger())
  .use(secureHeaders())
  .use('/api/*', cors({ origin: 'https://example.com' }))
```

**2. Third-party (`@hono/` namespace) — check before adding.**
A number of well-maintained packages live under the `@hono/` scope:
`@hono/sentry`, `@hono/prometheus`, `@hono/clerk-auth`, `@hono/oidc-auth`,
`hono-rate-limiter`, etc. Before reaching for one, confirm with the user:
- Is this package actively maintained?
- Does the project already have a preferred solution (e.g., an existing
  auth provider)?
- Is the added dependency worth it, or can the built-in `bearerAuth` /
  `jwt` cover the need?

Never silently add third-party middleware — propose it, explain the trade-off,
and get agreement first.

**3. Custom `createMiddleware` — last resort, not first instinct.**
Write a custom middleware only when neither built-in nor third-party covers
the requirement. Use `createMiddleware` (not a raw `async (c, next)` function)
so the `Variables`/`Bindings` types are preserved:

```typescript
import { createMiddleware } from 'hono/factory'

const requestLogger = createMiddleware(async (c, next) => {
  const start = performance.now()
  await next()
  const ms = (performance.now() - start).toFixed(2)
  c.res.headers.set('X-Response-Time', `${ms}ms`)
})
```

If the built-in `logger` or `timing` middleware already covers your logging
need, use those instead of writing the above.

### Middleware execution order

Hono uses an **onion model**: middleware registered first wraps outermost.
Code before `await next()` runs on the way in (request order), code after
runs on the way out (reverse order):

```
Request → MW1 before → MW2 before → Handler → MW2 after → MW1 after → Response
```

Register global middleware before route-specific middleware:

```typescript
app
  .use(logger())                      // global
  .use('/api/*', authMiddleware)      // route-scoped
  .get('/api/me', (c) => c.json(c.var.user))
```

Forgetting `await next()` silently swallows all subsequent handlers — the
response will hang or return nothing. Always `await next()` unless you are
intentionally short-circuiting (e.g., returning a 401 early).

### Don't repeat logic in handlers — use `app.use()`

If the same check or setup appears in multiple handlers, pull it into
`app.use()`. Handlers should only contain the operation-specific logic.

**Common smell: same check repeated in every handler**

```typescript
// ❌ Auth check copy-pasted into every handler
app.get('/posts', async (c) => {
  const user = await verifyToken(c.req.header('Authorization'))
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  // ... fetch posts
})

app.post('/posts', async (c) => {
  const user = await verifyToken(c.req.header('Authorization'))
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  // ... create post
})

app.delete('/posts/:id', async (c) => {
  const user = await verifyToken(c.req.header('Authorization'))
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  // ... delete post
})
```

```typescript
// ✅ Register once with app.use() — handlers never touch auth again
import { createMiddleware } from 'hono/factory'

const auth = createMiddleware<{ Variables: { user: User } }>(async (c, next) => {
  const user = await verifyToken(c.req.header('Authorization'))
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  c.set('user', user)
  await next()
})

const app = new Hono()
  .use('/api/*', auth)          // applies to every /api/* route — register once
  .get('/api/posts', (c) => fetchPosts(c.var.user))
  .post('/api/posts', (c) => createPost(c.var.user, c.req.valid('json')))
  .delete('/api/posts/:id', (c) => deletePost(c.var.user, c.req.param('id')))
```

The same principle applies to any repeated setup: logging context, tenant
resolution, feature-flag gates, rate-limit checks, standard response headers.
If it appears in more than one handler, it belongs in `app.use()`.

**Route-group scoping**

Use path patterns to apply middleware only where needed:

```typescript
const app = new Hono()
  .use(logger())                     // every route
  .use(secureHeaders())              // every route
  .use('/api/*', auth)               // authenticated API only
  .use('/admin/*', auth, adminOnly)  // admin routes need both
  .get('/health', (c) => c.json({ ok: true }))  // no auth needed
```

## Validation

Always use a schema validator — manual string checks lose type information.

**Recommended: `@hono/standard-validator` (`sValidator`)**
Works with Zod, Valibot, ArkType, and any [Standard Schema](https://standardschema.dev/)
compliant library. Swap schemas without changing route code:

```typescript
import { sValidator } from '@hono/standard-validator'
import { z } from 'zod'          // or: import * as v from 'valibot'

const postSchema = z.object({ title: z.string(), body: z.string() })

app.post(
  '/posts',
  sValidator('json', postSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Invalid input', issues: result.issues }, 400)
    }
  }),
  (c) => {
    const { title, body } = c.req.valid('json')   // typed as { title: string; body: string }
    return c.json({ ok: true, title }, 201)
  }
)
```

Validation targets: `'json'`, `'query'`, `'param'`, `'header'`, `'cookie'`, `'form'`.

**One pitfall:** validators on `json` and `form` require the caller to send a
matching `Content-Type` header. In tests, set it explicitly or the body comes
through as an empty object.

→ Detailed patterns and multi-validator examples: `references/validation-patterns.md`

## RPC — End-to-End Type Safety

Hono RPC shares types from server to client using TypeScript alone — no
code generation, no build step. The client calls HTTP endpoints as typed
function calls.

**Server:**

```typescript
// server/index.ts
import { Hono } from 'hono'
import { sValidator } from '@hono/standard-validator'
import { z } from 'zod'

const route = new Hono()
  .get('/posts', (c) => c.json([{ id: 1, title: 'Hello' }]))
  .post(
    '/posts',
    sValidator('json', z.object({ title: z.string() })),
    (c) => c.json({ ok: true }, 201)
  )
  .get('/posts/:id', (c) => c.json({ id: c.req.param('id') }))

export type AppType = typeof route   // export the type, not the value
export default route
```

**Client:**

```typescript
// client/index.ts
import { hc } from 'hono/client'
import type { AppType } from '../server'     // import only the type

const client = hc<AppType>('http://localhost:8787')

const posts = await (await client.posts.$get()).json()
                                          // → inferred as { id: number; title: string }[]
const res = await client.posts.$post({ json: { title: 'New' } })
const param = await client.posts[':id'].$get({ param: { id: '1' } })
```

**Monorepo pattern** (packages sharing types):

```typescript
// packages/api/src/index.ts  → export type AppType = typeof route
// packages/web/src/api.ts    → import type { AppType } from '@myapp/api'
```

→ Full RPC patterns, `InferRequestType`/`InferResponseType`, custom fetch:
  `references/rpc-patterns.md`

## Error Handling

Use `HTTPException` for expected failures. Centralize unexpected errors in
`app.onError`:

```typescript
import { HTTPException } from 'hono/http-exception'

app.get('/users/:id', async (c) => {
  const user = await db.find(c.req.param('id'))
  if (!user) throw new HTTPException(404, { message: 'User not found' })
  return c.json(user)
})

app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse()
  console.error(err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

app.notFound((c) => c.json({ error: 'Not Found' }, 404))
```

## Testing

Hono apps require no real HTTP server — `app.request()` dispatches
directly. This makes unit tests fast and easy to colocate with code.

**`app.request()` — low-level, flexible:**

```typescript
import { describe, it, expect } from 'vitest'
import app from '../src/app'

describe('users API', () => {
  it('GET /users returns 200', async () => {
    const res = await app.request('/users')
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data.users)).toBe(true)
  })

  it('POST /users returns 400 on invalid body', async () => {
    const res = await app.request('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },  // required!
      body: JSON.stringify({ name: '' }),                // fails min(1)
    })
    expect(res.status).toBe(400)
  })
})
```

**`testClient()` — type-safe, mirrors the RPC client:**

```typescript
import { testClient } from 'hono/testing'

const client = testClient(app)

const res = await client.posts.$post({
  json: { title: 'Hello', body: 'Content' },
})
expect(res.status).toBe(201)
const data = await res.json()
expect(data.ok).toBe(true)  // typed — TypeScript knows the shape
```

## Quick Reference: Common Gotchas

| Symptom | Cause | Fix |
|---------|-------|-----|
| Not all routes visible on client | Unchained route definitions | Chain `.get().post()...` on one variable |
| `c.var.foo` is `unknown` | `Variables` type not passed to `Hono<Env>` | Add `Env` generic |
| Body always empty in tests | Missing `Content-Type` header | Add `'Content-Type': 'application/json'` |
| Path params are `string \| undefined` in factory handlers | `createHandlers` weakens param types | Use inline handlers for param-heavy routes |
| TypeScript slows down in large apps | Huge union type from chaining | Split into sub-routers with `app.route()` |

## Reference Files

- `references/rpc-patterns.md` — RPC deep-dive: `InferRequestType`, `InferResponseType`, custom fetch, error type patterns, monorepo setup
- `references/validation-patterns.md` — Validation deep-dive: multi-validator chains, OpenAPI integration, `@hono/zod-openapi`, schema reuse
