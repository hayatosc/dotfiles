# Node and CLI Toolchain

Use this file when the project is a Node service, CLI, worker, cron job, or other non-browser runtime.

## Install the core tools

Choose one package manager with the user.

If the environment standardizes on `ni`, use it as the default command surface.

### `ni`

```bash
ni -D @typescript/native-preview typescript tsx vitest oxlint oxlint-tsgolint oxfmt
```

`ni` will route to the repository's chosen package manager. If the user explicitly wants the underlying command, use one of the following:

### `bun`

```bash
bun add -d @typescript/native-preview typescript tsx vitest oxlint oxlint-tsgolint oxfmt
```

### `pnpm`

```bash
pnpm add -D @typescript/native-preview typescript tsx vitest oxlint oxlint-tsgolint oxfmt
```

## Recommended scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts",
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

Treat this `tsx` loop as the default fallback for plain Node and CLI projects. If the repository already has a stronger tool-owned dev loop, use that instead.

## Bun runtime exception

If the user is intentionally standardizing on the Bun runtime, replace the `tsx` runtime scripts with Bun-native commands and keep the rest of the stack unchanged.

```json
{
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "start": "bun run src/index.ts"
  }
}
```

## Verification order

1. `tsgo --noEmit`
2. `tsc --noEmit`
3. `oxlint .`
4. `oxlint --type-aware .`
5. `vitest`
