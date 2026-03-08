# Tool Selection Rules

Use this file when the user wants the reasoning behind a recommendation.

## `tsgo` and `tsc`

- Recommend `tsgo` as the primary typechecker and fast feedback loop.
- Keep `tsc` installed as a compatibility check and fallback command.
- Prefer separate scripts such as `typecheck` and `typecheck:compat` instead of silently replacing `tsc`.
- If a project exposes a gap between `tsgo` and the stable compiler, treat `tsc` as the source of compatibility truth and document the gap clearly.

## `bun` and `pnpm`

- Prefer `bun` when the user also wants the Bun runtime, wants fewer moving parts, or is building a Hono service on Bun.
- Prefer `pnpm` when the repository is a monorepo, depends on Node compatibility, or values mature workspace behavior and lockfile conventions.
- If the repository already has `bun.lock` or `pnpm-lock.yaml`, follow it and do not propose a switch casually.
- If the execution environment standardizes on `ni`, use `ni` and `nr` as command wrappers while keeping the underlying `bun` or `pnpm` choice explicit in the recommendation.

## `oxlint`, `oxlint-tsgolint`, and formatter choices

- Recommend `oxlint` as the default lint command for speed.
- Recommend `oxlint --type-aware` when the repository wants type-aware linting. Assume `oxlint-tsgolint` is installed for that path.
- Keep `tsgo --noEmit` as the primary typecheck even when type-aware lint is enabled.
- Treat `oxlint --type-aware --type-check` as an opt-in combined path, not the default flow.
- Treat `oxfmt` as the default formatter when the repository is already aligned with the Oxc toolchain.
- Install `oxfmt` explicitly as a dev dependency. Do not assume it arrives transitively with `oxlint`.
- Recommend `Biome` only when an integrated formatter and linter across many asset types is more valuable than keeping the Oxc stack separate.
- Recommend `typescript-eslint` only when the repository already depends on ESLint plugins or specific rules that Oxlint cannot yet replace.

## Runtime and build choices

- Prefer `tsx` for Node and CLI runtime workflows unless the user is explicitly standardizing on the Bun runtime.
- Prefer `tsdown` for libraries and packages that need bundling or distribution outputs.
- Prefer `Hono` for web frameworks, especially APIs, edge workloads, and lightweight services.
- If the repository is already a large Express or Fastify codebase, prefer incremental toolchain adoption over recommending a framework rewrite.
- Add `Vite` only when the project includes browser assets, a frontend app, or other client-side build needs.
