# RPC Patterns — Hono End-to-End Type Safety

## The Core Mechanism

Hono RPC works by encoding every route's input and output types into the
type of the route variable itself. When you write `typeof route`, you get
a structural type that `hc<AppType>()` can walk to build a typed proxy.
No JSON schema, no protobuf, no codegen — just TypeScript.

## Server Setup

```typescript
// server/index.ts
import { Hono } from 'hono'
import { sValidator } from '@hono/standard-validator'
import { z } from 'zod'

// Build the whole router as a single chain so all routes are captured
const route = new Hono()
  .get('/posts', (c) => {
    return c.json([{ id: 1, title: 'Hello Hono' }] as const)
  })
  .post(
    '/posts',
    sValidator('json', z.object({ title: z.string(), body: z.string() })),
    (c) => {
      const { title } = c.req.valid('json')
      return c.json({ ok: true, id: 1, title }, 201)
    }
  )
  .get('/posts/:id', (c) => {
    const id = c.req.param('id')
    return c.json({ id, title: 'Hello' })
  })
  .delete('/posts/:id', (c) => {
    return c.json({ ok: true })
  })

// Export the type — the value stays server-side
export type AppType = typeof route
export default route
```

## Client Setup

```typescript
// client/index.ts
import { hc } from 'hono/client'
import type { AppType } from '../server'  // type-only import

const client = hc<AppType>('http://localhost:8787')

// GET /posts
const res = await client.posts.$get()
const posts = await res.json()
// posts: { id: number; title: string }[]

// POST /posts — input type is enforced by the schema
const createRes = await client.posts.$post({
  json: { title: 'New Post', body: 'Content here' },
})
const created = await createRes.json()
// created: { ok: boolean; id: number; title: string }

// GET /posts/:id — note the bracket notation for path params
const postRes = await client.posts[':id'].$get({
  param: { id: '42' },
})

// DELETE /posts/:id
const deleteRes = await client.posts[':id'].$delete({
  param: { id: '42' },
})
```

## HTTP Method Mapping

| Server | Client |
|--------|--------|
| `.get()` | `.$get()` |
| `.post()` | `.$post()` |
| `.put()` | `.$put()` |
| `.patch()` | `.$patch()` |
| `.delete()` | `.$delete()` |

## Inferring Types Programmatically

Use `InferRequestType` and `InferResponseType` to derive types for use in
other functions (React Query hooks, form libraries, etc.):

```typescript
import { hc } from 'hono/client'
import type { InferRequestType, InferResponseType } from 'hono/client'
import type { AppType } from '../server'

const client = hc<AppType>('http://localhost:8787')

// Infer request body type
const $post = client.posts.$post
type PostRequest = InferRequestType<typeof $post>
// → { json: { title: string; body: string } }

// Infer response type (optionally filter by status code)
type PostResponse = InferResponseType<typeof $post, 201>
// → { ok: boolean; id: number; title: string }

// Use in a typed wrapper function
async function createPost(data: PostRequest['json']): Promise<PostResponse> {
  const res = await client.posts.$post({ json: data })
  if (!res.ok) throw new Error('Failed to create post')
  return res.json() as Promise<PostResponse>
}
```

## Monorepo Pattern

The canonical approach for monorepos with a separate API package:

```
packages/
  api/
    src/
      index.ts       ← exports AppType and default app
    package.json     ← name: "@myapp/api"
  web/
    src/
      lib/client.ts  ← hc<AppType>(process.env.API_URL!)
    package.json     ← depends on "@myapp/api"
```

```typescript
// packages/api/src/index.ts
const route = new Hono().get(...).post(...)
export type AppType = typeof route
export default route

// packages/web/src/lib/client.ts
import type { AppType } from '@myapp/api'
import { hc } from 'hono/client'

export const client = hc<AppType>(import.meta.env.VITE_API_URL)
```

Key: use `import type` for `AppType` to avoid pulling in server-side code.

## Custom Fetch (Interceptors, Auth Headers)

Pass a custom `fetch` function to inject headers, logging, or retry logic:

```typescript
const client = hc<AppType>('http://localhost:8787', {
  fetch: async (input, init) => {
    const token = await getAccessToken()
    return fetch(input, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${token}`,
      },
    })
  },
})
```

This is the idiomatic way to add auth to all requests without modifying
each individual call.

## Typed Error Responses

Hono RPC fully types success responses but not error responses out of the
box. The practical pattern is to type errors manually alongside the client:

```typescript
// server: return structured errors consistently
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message, code: err.status }, err.status)
  }
  return c.json({ error: 'Internal Server Error', code: 500 }, 500)
})

// client: define a shared error type and check res.ok
type ApiError = { error: string; code: number }

async function safeFetch<T>(
  call: () => Promise<Response & { json(): Promise<T> }>
): Promise<T> {
  const res = await call()
  if (!res.ok) {
    const err = await (res as Response).json() as ApiError
    throw new Error(`${err.code}: ${err.error}`)
  }
  return res.json()
}

const posts = await safeFetch(() => client.posts.$get())
```

## Testing with RPC-style Client

Use `testClient` from `hono/testing` instead of `hc` in unit tests — it
doesn't make real HTTP requests:

```typescript
import { testClient } from 'hono/testing'
import app from './index'

const client = testClient(app)

test('POST /posts creates a post', async () => {
  const res = await client.posts.$post({
    json: { title: 'Test', body: 'Content' },
  })
  expect(res.status).toBe(201)
  const data = await res.json()
  expect(data.ok).toBe(true)
})
```

If your app uses Cloudflare Workers Bindings (`env`), pass them as the
second argument: `testClient(app, env)`.

## Splitting Sub-Routers for Performance

Large chained routers create wide union types that slow down TypeScript.
Split into sub-routers and compose with `app.route()`:

```typescript
// routes/posts.ts
const postsRoute = new Hono()
  .get('/', handleList)
  .post('/', sValidator('json', schema), handleCreate)
  .get('/:id', handleGet)

export type PostsType = typeof postsRoute
export default postsRoute

// index.ts
const app = new Hono()
  .route('/posts', postsRoute)
  .route('/users', usersRoute)

export type AppType = typeof app
```

The client still resolves the full path: `client.posts.$get()`.

## Common Mistakes

**Mistake: exporting `typeof app` after unchained additions**

```typescript
// ❌ Only the last call's type is returned, earlier routes are lost
const app = new Hono()
app.get('/a', handlerA)    // side-effect, type not captured
app.get('/b', handlerB)
export type AppType = typeof app  // missing /a type info
```

**Mistake: importing the value instead of just the type**

```typescript
// ❌ Pulls in server-side code into the client bundle
import { AppType } from '../server'

// ✅ Type-only import — zero runtime cost
import type { AppType } from '../server'
```

**Mistake: missing `strict: true` in tsconfig**

Without strict mode, TypeScript's inference degrades to `any` silently.
Always verify this is set when RPC types look wrong.
