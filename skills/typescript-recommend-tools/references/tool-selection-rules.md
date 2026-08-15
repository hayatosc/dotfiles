# Tool Selection Rules

Use this file when the user wants the reasoning behind a recommendation.

## TypeScript 7 and `tsc`

- TypeScript 7 ships the native Go-based compiler as `tsc` inside the main `typescript` npm package.
- Use `tsc --noEmit` as the single typecheck command. There is no longer a separate `tsgo` command or `@typescript/native-preview` package to install.
- Keep a `typecheck` script in `package.json`; no separate `typecheck:compat` script is needed.
- If the repository depends on tools that consume the TypeScript programmatic API (such as `typescript-eslint`, `ts-morph`, or custom transformers), those tools may not yet support the TypeScript 7 API. Check each tool's compatibility and use `@typescript/typescript6` as a peer dependency where needed until TypeScript 7.1 stabilizes the programmatic API.

## `bun` and `pnpm`

- Prefer `bun` when the user also wants the Bun runtime, wants fewer moving parts, or is building a Hono service on Bun.
- Prefer `pnpm` when the repository is a monorepo, depends on Node compatibility, or values mature workspace behavior and lockfile conventions.
- If the repository already has `bun.lock` or `pnpm-lock.yaml`, follow it and do not propose a switch casually.
- If the execution environment standardizes on `ni`, use `ni` and `nr` as command wrappers while keeping the underlying `bun` or `pnpm` choice explicit in the recommendation.

## `oxlint`, `oxlint-tsgolint`, and formatter choices

- Recommend `oxlint` as the default lint command for speed.
- Recommend `oxlint --type-aware` when the repository wants type-aware linting. Assume `oxlint-tsgolint` is installed for that path.
- Keep `tsc --noEmit` as the primary typecheck even when type-aware lint is enabled.
- Treat `oxlint --type-aware --type-check` as an opt-in combined path, not the default flow.
- Treat `oxfmt` as the default formatter when the repository is already aligned with the Oxc toolchain.
- Install `oxfmt` explicitly as a dev dependency. Do not assume it arrives transitively with `oxlint`.
- Recommend `Biome` only when an integrated formatter and linter across many asset types is more valuable than keeping the Oxc stack separate.
- Recommend `typescript-eslint` only when the repository already depends on ESLint plugins or specific rules that Oxlint cannot yet replace.

## Runtime and build choices

- Prefer the tool-owned dev command first. Use `tsdown --watch` for library development and `vite dev` for Vite-based web projects before introducing `oxc-node` (`oxnode`).
- Prefer `oxc-node` (`oxnode` via `@oxc-node/cli` or register hook via `@oxc-node/core`) for simple Node and CLI runtime workflows when there is no better project-specific dev loop.
- Prefer `bun run` for Bun-native runtime workflows rather than layering `oxnode` on top of Bun by default.
- Prefer `tsdown` for libraries and packages that need bundling or distribution outputs.
- Prefer `Hono` for web frameworks, especially APIs, edge workloads, and lightweight services.
- If the repository is already a large Express or Fastify codebase, prefer incremental toolchain adoption over recommending a framework rewrite.
- Add `Vite` only when the project includes browser assets, a frontend app, or other client-side build needs.
