# Validation Patterns — Hono

## Choosing a Validator

Default to **`@hono/standard-validator`** (`sValidator`). It works with any
[Standard Schema](https://standardschema.dev/)-compliant library (Zod, Valibot,
ArkType…) and lets you swap schemas without touching route code.

Reach for `@hono/zod-validator` only when you specifically need to access
`ZodError` internals (e.g., `.error.flatten()` for client-side form field
errors) and Standard Schema's `.issues` array is not enough.

| Package | When to use |
|---------|-------------|
| `@hono/standard-validator` | **Default** — Zod, Valibot, ArkType, or when you might switch |
| `@hono/zod-openapi` | Need OpenAPI 3.x spec auto-generated alongside validation |
| `@hono/zod-validator` | Exception: need `ZodError`-specific API (`.flatten()`, `.format()`) |
| `@hono/typebox-validator` / `@hono/effect-validator` | Niche schema libraries |

Install:

```bash
ni @hono/standard-validator zod          # standard (default)
ni @hono/zod-openapi zod @hono/swagger-ui  # OpenAPI path
```

## Standard Schema Validator (`sValidator`)

```typescript
import { sValidator } from '@hono/standard-validator'
import { z } from 'zod'

const userSchema = z.object({
  name: z.string().min(1),
  age:  z.number().int().positive(),
})

app.post(
  '/users',
  sValidator('json', userSchema),
  (c) => {
    const { name, age } = c.req.valid('json')  // { name: string; age: number }
    return c.json({ id: crypto.randomUUID(), name, age }, 201)
  }
)
```

The same pattern works with Valibot or ArkType — only the schema import changes:

```typescript
// Valibot
import * as v from 'valibot'
const schema = v.object({ name: v.string(), age: v.number() })
app.post('/users', sValidator('json', schema), handler)

// ArkType
import { type } from 'arktype'
const schema = type({ name: 'string', age: 'number' })
app.post('/users', sValidator('json', schema), handler)
```

## Custom Error Hook

The third argument to `sValidator` intercepts validation failures.
Return a response to short-circuit; return nothing to continue normally:

```typescript
app.post(
  '/users',
  sValidator('json', userSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: 'Validation failed',
          issues: result.issues,   // Standard Schema issue list
        },
        400
      )
    }
    // returning nothing → next handler runs
  }),
  (c) => {
    const data = c.req.valid('json')
    return c.json({ success: true, data }, 201)
  }
)
```

To use `HTTPException` inside the hook:

```typescript
import { HTTPException } from 'hono/http-exception'

sValidator('json', schema, (result, c) => {
  if (!result.success) {
    throw new HTTPException(422, { message: 'Unprocessable Entity' })
  }
})
```

## Multi-Target Validation

Multiple validators can be chained on the same route:

```typescript
const querySchema = z.object({ page: z.coerce.number().default(1) })
const bodySchema  = z.object({ title: z.string(), body: z.string() })

app.post(
  '/posts',
  sValidator('query', querySchema),
  sValidator('json',  bodySchema),
  (c) => {
    const { page }          = c.req.valid('query')  // { page: number }
    const { title, body }   = c.req.valid('json')   // { title: string; body: string }
    return c.json({ ok: true, page, title, body })
  }
)
```

## Validation Targets

| Target | When to use |
|--------|-------------|
| `'json'` | `Content-Type: application/json` body |
| `'form'` | `Content-Type: application/x-www-form-urlencoded` or `multipart/form-data` body |
| `'query'` | URL query string (`?key=value`) |
| `'param'` | Path parameters (`/:id`) |
| `'header'` | Request headers |
| `'cookie'` | Cookies |

> ⚠️ **Content-Type is required for `json` and `form`.** If the header is
> missing, the body parses as an empty object — validators will fail with
> confusing errors. In tests, always set `'Content-Type': 'application/json'`
> explicitly.

## Reusing Schemas Across Server and Client

Put shared schemas in a `schemas/` package (or directory) that both the
server and client import from:

```
packages/
  shared/
    src/
      schemas/
        post.ts      ← z.object({ title: z.string(), body: z.string() })
        user.ts
  api/               ← imports from @myapp/shared
  web/               ← imports from @myapp/shared
```

```typescript
// packages/shared/src/schemas/post.ts
import { z } from 'zod'

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  body:  z.string().min(1),
})

export type CreatePostInput = z.infer<typeof createPostSchema>

// packages/api/src/routes/posts.ts
import { createPostSchema } from '@myapp/shared/schemas/post'
app.post('/posts', sValidator('json', createPostSchema), handler)

// packages/web/src/forms/CreatePost.tsx
import { createPostSchema, type CreatePostInput } from '@myapp/shared/schemas/post'
// use with react-hook-form + zodResolver, etc.
```

## OpenAPI + Validation with `@hono/zod-openapi`

When you need both validation and auto-generated OpenAPI docs, use
`@hono/zod-openapi`. It wraps `Hono` and integrates `@hono/swagger-ui`:

```typescript
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'

const PostSchema = z.object({
  id:    z.number().openapi({ example: 1 }),
  title: z.string().openapi({ example: 'Hello' }),
})

const route = createRoute({
  method:   'get',
  path:     '/posts/{id}',
  request:  { params: z.object({ id: z.coerce.number() }) },
  responses: {
    200: { content: { 'application/json': { schema: PostSchema } }, description: 'Post' },
  },
})

const app = new OpenAPIHono()

app.openapi(route, (c) => {
  const { id } = c.req.valid('param')     // number, not string
  return c.json({ id, title: 'Hello' })
})

// Serve Swagger UI
app.get('/ui', swaggerUI({ url: '/doc' }))
app.doc('/doc', { openapi: '3.0.0', info: { title: 'My API', version: '1.0.0' } })
```

## Manual Validation (Escape Hatch)

For logic that schemas can't express cleanly, use the built-in `validator`
helper with a custom function. Return the validated value to type it:

```typescript
import { validator } from 'hono/validator'

app.post(
  '/upload',
  validator('form', (value, c) => {
    const file = value['file']
    if (!(file instanceof File)) return c.text('file is required', 400)
    if (file.size > 10 * 1024 * 1024) return c.text('file too large', 400)
    return { file } as { file: File }   // typed return narrows c.req.valid('form')
  }),
  (c) => {
    const { file } = c.req.valid('form')  // File
    return c.json({ name: file.name, size: file.size })
  }
)
```

## Common Mistakes

**Mistake: validating query params with number types without `z.coerce`**

Query parameters are always strings. Use `z.coerce.number()` to convert:

```typescript
// ❌ Will always fail — query params arrive as strings
z.object({ page: z.number() })

// ✅ Coerce the string "1" to the number 1
z.object({ page: z.coerce.number().int().positive().default(1) })
```

**Mistake: not returning from the hook for error paths**

If the hook function does not `return` a response when `!result.success`,
execution continues to the main handler with invalid data:

```typescript
// ❌ Missing return — handler runs with bad data
sValidator('json', schema, (result, c) => {
  if (!result.success) {
    c.json({ error: 'bad input' }, 400)  // no return!
  }
})

// ✅ Always return the response in the error branch
sValidator('json', schema, (result, c) => {
  if (!result.success) {
    return c.json({ error: 'bad input' }, 400)  // return!
  }
})
```
