# Library and Web Toolchains

Use this file when the project is either a publishable package or a Hono-based web service.

## Library and package stack

Choose one package manager with the user.

If the environment standardizes on `ni`, use it as the default command surface.

### `ni`

```bash
ni -D @typescript/native-preview typescript tsdown vitest oxlint oxlint-tsgolint oxfmt
```

`ni` will route to the repository's chosen package manager. If the user explicitly wants the underlying command, use one of the following:

### `bun`

```bash
bun add -d @typescript/native-preview typescript tsdown vitest oxlint oxlint-tsgolint oxfmt
```

### `pnpm`

```bash
pnpm add -D @typescript/native-preview typescript tsdown vitest oxlint oxlint-tsgolint oxfmt
```

### Recommended scripts

```json
{
  "scripts": {
    "build": "tsdown",
    "dev": "tsdown --watch",
    "typecheck": "tsgo --noEmit",
    "typecheck:compat": "tsc --noEmit",
    "lint": "oxlint .",
    "lint:types": "oxlint --type-aware .",
    "format": "oxfmt .",
    "format:check": "oxfmt --check .",
    "test": "vitest run"
  }
}
```

For libraries and packages, prefer `tsdown --watch` over `tsx` during development so the build output and watch behavior stay aligned with the actual packaging tool.

### Monorepo note

For `pnpm` workspaces, keep package-level `tsconfig` files scoped tightly, build dependent packages before running `oxlint --type-aware`, and avoid a root `tsconfig.json` that includes every source file directly.

## Hono web stack

Use `Hono` as the default web framework. Add `Vite` when the project serves or builds browser assets.

Prefer Hono for new APIs, lightweight services, and edge-capable applications. If the repository is already a large Express or Fastify application, recommend incremental toolchain improvements first and treat framework migration as a separate decision.

### Create a new Hono app

```bash
nlx create-hono@latest my-app
```

```bash
bun create hono@latest my-app
```

```bash
pnpm create hono@latest my-app
```

### Add the remaining core tools

```bash
ni -D @typescript/native-preview typescript tsx vite vitest oxlint oxlint-tsgolint oxfmt
```

```bash
bun add -d @typescript/native-preview typescript tsx vite vitest oxlint oxlint-tsgolint oxfmt
```

```bash
pnpm add -D @typescript/native-preview typescript tsx vite vitest oxlint oxlint-tsgolint oxfmt
```

If the project is API-only and does not build browser assets, drop `Vite` from this stack and keep `Hono` plus the shared testing and linting tools.

If the deployment target is Cloudflare Workers, Deno Deploy, or another edge runtime, keep Hono and adjust the entrypoint and adapter to that runtime instead of switching frameworks.

### Recommended scripts for Node-targeted Hono

```json
{
  "scripts": {
    "dev": "vite dev",
    "typecheck": "tsgo --noEmit",
    "typecheck:compat": "tsc --noEmit",
    "lint": "oxlint .",
    "lint:types": "oxlint --type-aware .",
    "format": "oxfmt .",
    "format:check": "oxfmt --check .",
    "test": "vitest"
  }
}
```

Use `vite dev` whenever the project already includes Vite. If the Hono project is API-only and does not use Vite, a simple `tsx watch` loop is an acceptable fallback.

### Recommended scripts for Bun-targeted Hono

```json
{
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "typecheck": "tsgo --noEmit",
    "typecheck:compat": "tsc --noEmit",
    "lint": "oxlint .",
    "lint:types": "oxlint --type-aware .",
    "format": "oxfmt .",
    "format:check": "oxfmt --check .",
    "test": "vitest"
  }
}
```

## Verification order

1. `tsgo --noEmit`
2. `tsc --noEmit`
3. `oxlint .`
4. `oxlint --type-aware .`
5. `vitest`
