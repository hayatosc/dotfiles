# Node and CLI Toolchain

Use this file when the project is a Node service, CLI, worker, cron job, or other non-browser runtime.

## Install the core tools

Choose one package manager with the user.

If the environment standardizes on `ni`, prefer `ni -D ...` and `nr <script>` as wrappers. The commands below show the explicit underlying package manager choice.

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

## Bun runtime exception

If the user is intentionally standardizing on the Bun runtime, replace the `tsx` runtime scripts with Bun-native commands and keep the rest of the stack unchanged.

```json
{
  "scripts": {
    "dev": "bun --hot src/index.ts",
    "start": "bun src/index.ts"
  }
}
```

## Verification order

1. `tsgo --noEmit`
2. `tsc --noEmit`
3. `oxlint .`
4. `oxlint --type-aware .`
5. `vitest`
