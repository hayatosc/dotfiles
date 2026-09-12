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
