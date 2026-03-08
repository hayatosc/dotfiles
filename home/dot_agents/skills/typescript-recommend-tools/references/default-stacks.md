# Default Stacks

Use this file when the user wants a quick recommendation without a long comparison.

| Project shape | Primary tools | Secondary tools | Notes |
| --- | --- | --- | --- |
| Node / CLI | `tsgo`, `tsx`, `Vitest`, `oxlint`, `oxlint --type-aware`, `oxfmt` | `tsc` | Use `tsx` for runtime and keep `tsc --noEmit` as a compatibility check. |
| Library / package | `tsgo`, `tsdown`, `Vitest`, `oxlint`, `oxlint --type-aware`, `oxfmt` | `tsc` | Keep `tsc` for compatibility checks and package edge cases. |
| Web app / web API | `tsgo`, `Hono`, `Vite`, `Vitest`, `oxlint`, `oxlint --type-aware`, `oxfmt` | `tsc` | Use `Hono` for the web framework and `Vite` when browser assets exist. |

## Shared Defaults

- Primary typecheck: `tsgo --noEmit`
- Secondary compatibility check: `tsc --noEmit`
- Type-aware lint: `oxlint --type-aware`
- Package manager: align on `bun` or `pnpm` with the user
- Module system: ESM-first
- If the environment standardizes on `ni`, use `ni` and `nr` wrappers while preserving the chosen underlying package manager.

## Shared Fallbacks

- Use `Biome` only when a single integrated formatter and linter is a better fit than the Oxc toolchain.
- Use `typescript-eslint` only when the repository depends on ESLint plugins or needs rules Oxlint cannot provide.
