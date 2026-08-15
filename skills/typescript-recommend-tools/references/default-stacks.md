# Default Stacks

Use this file when the user wants a quick recommendation without a long comparison.

| Project shape | Primary tools | Notes |
| --- | --- | --- |
| Node / CLI | `tsc`, `oxc-node` (`@oxc-node/cli`), `Vitest`, `oxlint`, `oxlint --type-aware`, `oxfmt` | Use `oxnode` only when there is no tool-specific dev loop. Prefer `bun run` on Bun-native runtimes. |
| Library / package | `tsc`, `tsdown`, `Vitest`, `oxlint`, `oxlint --type-aware`, `oxfmt` | Prefer `tsdown --watch` for development. |
| Web app / web API | `tsc`, `Hono`, `Vite`, `Vitest`, `oxlint`, `oxlint --type-aware`, `oxfmt` | Use `Hono` for the web framework and `Vite` when browser assets exist. Prefer `vite dev` over `oxnode` in Vite-based projects. |

## Shared Defaults

- Typecheck: `tsc --noEmit` (TypeScript 7 ships the native Go compiler as `tsc`)
- Type-aware lint: `oxlint --type-aware`
- Package manager: align on `bun` or `pnpm` with the user
- Module system: ESM-first
- If the environment standardizes on `ni`, use `ni` and `nr` wrappers while preserving the chosen underlying package manager.

## Shared Fallbacks

- Use `Biome` only when a single integrated formatter and linter is a better fit than the Oxc toolchain.
- Use `typescript-eslint` only when the repository depends on ESLint plugins or needs rules Oxlint cannot provide.
