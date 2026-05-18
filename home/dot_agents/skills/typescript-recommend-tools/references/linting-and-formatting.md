# Linting and Formatting: Oxlint and Oxfmt Configuration

Recommended configurations for `oxlint` and `oxfmt` in TypeScript projects, enforcing strict type safety by rejecting unsafe `any` and `as` type assertions.

## Quick Reference

| Tool | Strategy | Primary Command |
| --- | --- | --- |
| `oxlint` | Type-aware with strict rules | `oxlint` |
| `oxfmt` | Single quote, trailing comma all, 100 char width | `oxfmt --write .` |
| Safety focus | Reject `any` and unsafe type assertions | Auto-enforced |

## Oxfmt Configuration

### `.oxfmtrc.json` - Recommended

```json
{
  "$schema": "./node_modules/oxfmt/configuration_schema.json",
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "quoteProps": "as-needed",
  "printWidth": 100,
  "sortImports": true,
  "ignorePatterns": ["dist/**", "node_modules/**"]
}
```

**Configuration details**:
- `semi: false`: Omit semicolons (JavaScript style)
- `singleQuote: true`: Use single quotes
- `trailingComma: all`: Add trailing commas in all contexts (ES5+)
- `printWidth: 100`: 100-character line width
- `sortImports: true`: Auto-sort import statements
- `ignorePatterns`: Exclude build and dependency directories

## Oxlint Configuration: Strict Type Safety

### `.oxlintrc.json` - Type-Aware with Strict Rules

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "unicorn", "oxc"],
  "options": {
    "typeAware": true
  },
  "categories": {
    "correctness": "error"
  },
  "ignorePatterns": ["dist/**", "node_modules/**"],
  "rules": {
    "typescript/no-explicit-any": "error",
    "typescript/no-unsafe-type-assertion": "error",
    "typescript/no-unnecessary-type-assertion": "error",
    "typescript/consistent-type-imports": "error",
    "typescript/no-unused-vars": "error",
    "typescript/no-floating-promises": "error",
    "typescript/switch-exhaustiveness-check": "warn",
    "typescript/consistent-type-assertions": "warn",
    "typescript/no-non-null-assertion": "warn"
  },
  "env": {
    "builtin": true
  }
}
```

**Safety rules explained**:
- `no-explicit-any`: **Error** - Reject bare `any` types
- `no-unsafe-type-assertion`: **Error** - Reject unsafe `as` type casts
- `no-unnecessary-type-assertion`: **Error** - Reject redundant assertions
- `consistent-type-imports`: **Error** - Use `import type {}` consistently
- `no-unused-vars`: **Error** - Catch dead code
- `no-floating-promises`: **Error** - Await all promises

### Node / CLI Project

Use base config above with console exceptions:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "unicorn", "oxc"],
  "options": {
    "typeAware": true
  },
  "categories": {
    "correctness": "error"
  },
  "ignorePatterns": ["dist/**", "node_modules/**"],
  "rules": {
    "typescript/no-explicit-any": "error",
    "typescript/no-unsafe-type-assertion": "error",
    "typescript/no-unnecessary-type-assertion": "error",
    "typescript/consistent-type-imports": "error",
    "typescript/no-unused-vars": "error",
    "typescript/no-floating-promises": "error",
    "typescript/switch-exhaustiveness-check": "warn",
    "typescript/consistent-type-assertions": "warn",
    "typescript/no-non-null-assertion": "warn",
    "no-console": "off"
  },
  "env": {
    "builtin": true
  }
}
```

### Library / Package Project

Use base config with test file exceptions:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "unicorn", "oxc"],
  "options": {
    "typeAware": true
  },
  "categories": {
    "correctness": "error"
  },
  "ignorePatterns": ["dist/**", "node_modules/**"],
  "rules": {
    "typescript/no-explicit-any": "error",
    "typescript/no-unsafe-type-assertion": "error",
    "typescript/no-unnecessary-type-assertion": "error",
    "typescript/consistent-type-imports": "error",
    "typescript/no-unused-vars": "error",
    "typescript/no-floating-promises": "error",
    "typescript/switch-exhaustiveness-check": "warn",
    "typescript/consistent-type-assertions": "warn",
    "typescript/no-non-null-assertion": "warn"
  },
  "overrides": [
    {
      "files": ["src/**/*.test.ts", "src/**/*.test.tsx"],
      "rules": {
        "typescript/await-thenable": "off"
      }
    }
  ],
  "env": {
    "builtin": true
  }
}
```

### Web App / Web API Project (Hono + Vite)

Use base config with browser and vite exceptions:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "unicorn", "oxc"],
  "options": {
    "typeAware": true
  },
  "categories": {
    "correctness": "error"
  },
  "ignorePatterns": ["dist/**", "node_modules/**", "src/**/*.config.ts"],
  "rules": {
    "typescript/no-explicit-any": "error",
    "typescript/no-unsafe-type-assertion": "error",
    "typescript/no-unnecessary-type-assertion": "error",
    "typescript/consistent-type-imports": "error",
    "typescript/no-unused-vars": "error",
    "typescript/no-floating-promises": "error",
    "typescript/switch-exhaustiveness-check": "warn",
    "typescript/consistent-type-assertions": "warn",
    "typescript/no-non-null-assertion": "warn"
  },
  "overrides": [
    {
      "files": ["vite.config.ts", "vitest.config.ts"],
      "rules": {
        "typescript/no-floating-promises": "off"
      }
    }
  ],
  "env": {
    "builtin": true
  }
}
```

## Type-Aware Linting Strategy

**Key principle**: Type-aware linting is enabled by default via `typeAware: true`. This allows rules like `no-floating-promises` and unsafe assertion detection to work across the codebase.

### Performance Note

Type-aware linting is slower than fast linting. For projects where CI speed is critical:

```json
{
  "options": {
    "typeAware": false
  }
}
```

Then add a separate type-aware check script in `package.json`:

```json
{
  "scripts": {
    "lint:strict": "oxlint --type-aware"
  }
}
```

## Integration: `package.json` Scripts

```json
{
  "scripts": {
    "typecheck": "tsgo --noEmit",
    "typecheck:compat": "tsc --noEmit",
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "format": "oxfmt --write .",
    "format:check": "oxfmt --check .",
    "check": "npm run typecheck && npm run lint && npm run format:check"
  }
}
```

## Command Reference

| Command | Purpose |
| --- | --- |
| `oxlint` | Run type-aware linting on all files |
| `oxlint --fix` | Lint and auto-fix fixable issues |
| `oxfmt --write .` | Format all files in-place |
| `oxfmt --check .` | Check formatting without changes |

## Inline Rule Disable

For exceptions, document clearly and use ESLint-compatible directives:

```typescript
// Unsafe cast intentional: external API requires this workaround
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const typed = unknownValue as SpecificType;
```

Avoid using `any` or unsafe assertions without documenting the reason.

## Environment-Specific Setup

If using `ni` and `nr` wrappers:

```bash
ni lint          # runs: oxlint
nr format        # runs: oxfmt --write .
nr check         # runs: oxlint && oxfmt --check .
```

## Troubleshooting

**`no-explicit-any` too strict?**
- Document why `any` is necessary with a comment
- Use a more specific type instead (prefer `unknown` if truly unknown)
- As a last resort: `// eslint-disable-next-line`

**`no-unsafe-type-assertion` blocking me?**
- Reconsider the type hierarchy (often indicates a design issue)
- Use gradual typing with explicit intermediate types
- Document why the unsafe cast is necessary

**Performance degradation?**
- Profile with `oxlint --timing`
- Consider disabling type-aware linting in fast CI, enable in strict CI

## References

- [Oxlint documentation](https://oxc.rs/docs/guide/linter.html)
- [Oxfmt documentation](https://oxc.rs/docs/guide/formatter.html)
- [Oxc rules reference](https://oxc.rs/docs/rules/index.html)
- [TypeScript strict mode guide](https://www.typescriptlang.org/tsconfig#strict)
