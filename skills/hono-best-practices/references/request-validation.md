## Validation

Preserve runtime validation and inferred input types. Reuse the project's validator; the example below uses Standard Schema when a schema library is already available.

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

→ Detailed patterns and multi-validator examples: [validation-patterns.md](validation-patterns.md)
