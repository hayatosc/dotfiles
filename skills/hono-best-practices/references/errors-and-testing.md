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
