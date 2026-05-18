# Linting and Formatting: Oxlint and Oxfmt Configuration

Recommended configurations for `oxlint` and `oxfmt` in TypeScript projects.

## Quick Reference

| Tool | Default Config | Primary Command |
| --- | --- | --- |
| `oxlint` | `extended` or `recommended` preset | `oxlint` |
| `oxlint` (type-aware) | + `oxlint-tsgolint` | `oxlint --type-aware` |
| `oxfmt` | 2-space indentation, 100 char line width | `oxfmt --write .` |

## Oxlint Configuration

### `.oxlintrc.json` - Preset Selection

**Preset options**:
- `"recommended"` (default): Production-ready, balanced coverage
- `"all"`: Maximum strictness, includes style-focused rules
- `"nursery"`: Experimental rules under development

### Node / CLI Project

```json
{
  "env": {
    "node": true,
    "es2022": true
  },
  "extends": "recommended",
  "rules": {
    "no-console": "off",
    "no-process-exit": "off",
    "no-only-tests": "error"
  }
}
```

**Rationale**: CLI tools legitimately use `console` and `process.exit()`. Prevent accidental test-only code.

### Library / Package Project

```json
{
  "env": {
    "node": true,
    "es2022": true,
    "jest": true
  },
  "extends": "recommended",
  "rules": {
    "no-console": "warn",
    "no-only-tests": "error"
  }
}
```

**Rationale**: Libraries should minimize console output (warn level). Test-only checks prevent regressions.

### Web App / Web API Project (Hono + Vite)

```json
{
  "env": {
    "node": true,
    "browser": true,
    "es2022": true
  },
  "extends": "recommended",
  "rules": {
    "no-console": "warn",
    "no-only-tests": "error"
  }
}
```

**Rationale**: Both server-side (Hono) and client-side (Vite) contexts exist. Console warnings acceptable in development.

### File Ignoring

Add to `.oxlintrc.json`:

```json
{
  "ignorePatterns": ["dist", "build", "node_modules", "coverage"]
}
```

## Type-Aware Linting

### When to Enable

Use `oxlint --type-aware` when:
- Project has strict TypeScript configuration
- Type-based rules provide significant value
- False positives from fast linting cause friction

**Do not** enable type-aware linting by default. Keep `tsgo --noEmit` as primary type check.

### Setup in `package.json`

```json
{
  "scripts": {
    "typecheck": "tsgo --noEmit",
    "typecheck:compat": "tsc --noEmit",
    "lint": "oxlint",
    "lint:type-aware": "oxlint --type-aware",
    "lint:fix": "oxlint --fix"
  }
}
```

## Oxfmt Configuration

### `.oxfmtrc.json` - Recommended

```json
{
  "indent_size": 2,
  "line_width": 100
}
```

**Why these values**:
- `indent_size: 2`: Aligns with modern JavaScript/TypeScript conventions
- `line_width: 100`: Balances readability with typical screen dimensions

### Alternative: No Config

For most projects, omit `.oxfmtrc.json` and use `oxfmt` defaults. The tool is intentionally opinionated to reduce bikeshedding.

### Full Configuration Options

```json
{
  "indent_size": 2,
  "line_width": 100,
  "use_tabs": false,
  "trailing_comma": "es5"
}
```

- `use_tabs`: Use tabs instead of spaces (default: `false`)
- `trailing_comma`: `"es5"` | `"all"` | `"none"` (default: `"es5"`)

## Integration: `package.json` Scripts

### Minimal

```json
{
  "scripts": {
    "lint": "oxlint",
    "format": "oxfmt --write ."
  }
}
```

### Comprehensive

```json
{
  "scripts": {
    "typecheck": "tsgo --noEmit",
    "typecheck:compat": "tsc --noEmit",
    "lint": "oxlint",
    "lint:type-aware": "oxlint --type-aware",
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
| `oxlint` | Lint files in current directory |
| `oxlint --fix` | Lint and auto-fix fixable issues |
| `oxlint --type-aware` | Enable type-aware rules (slower) |
| `oxfmt --write .` | Format all files in-place |
| `oxfmt --check .` | Check formatting without changes |

## Inline Rule Disable

For specific exceptions, use ESLint-compatible directives:

```typescript
// eslint-disable-next-line no-console
console.log('debug info');

// eslint-disable-next-line
const debugValue = expensiveComputation();
```

## Environment-Specific Setup

If using `ni` and `nr` wrappers:

```bash
ni lint          # runs: oxlint
nr format        # runs: oxfmt --write .
nr check         # runs: oxlint && oxfmt --check .
```

Scripts remain the same; wrappers handle package manager selection.

## Migration Checklist

### From ESLint + Prettier

1. Install: `npm install -D oxlint oxfmt oxlint-tsgolint`
2. Create `.oxlintrc.json` (use preset above for your project type)
3. Create `.oxfmtrc.json` (or omit and use defaults)
4. Test without code changes: `oxlint` and `oxfmt --check .`
5. Update `package.json` scripts
6. Gradually deprecate old ESLint and Prettier configs

### From Biome

1. Both tools are fast and comprehensive
2. Create `.oxlintrc.json` using preset above
3. Create `.oxfmtrc.json` matching your current Biome style
4. Update scripts and remove Biome
5. Keep type-aware linting optional unless central to your current setup

## Troubleshooting

**Rule too strict?**
- Check preset matches project type
- Use `"warn"` instead of `"error"` during learning phase
- Document exceptions in `.oxlintrc.json`

**Performance issues?**
- Avoid `--type-aware` by default (use only in opt-in script)
- Verify `ignorePatterns` excludes build directories
- Profile with tool timing if needed

**Need ESLint plugins?**
- Keep `oxlint` as primary
- Layer `typescript-eslint` for specific missing rules only
- Document this layering in contribution guide

## References

- [Oxlint documentation](https://oxc.rs/docs/guide/linter.html)
- [Oxfmt documentation](https://oxc.rs/docs/guide/formatter.html)
- [Oxc rules reference](https://oxc.rs/docs/rules/index.html)
