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
  [rpc-patterns.md](rpc-patterns.md)
