---
name: typescript-recommend-tools
description: Recommend a modern TypeScript toolchain. Use when choosing or updating a TypeScript stack for Node or CLI projects, libraries or packages, and web apps or APIs; selecting tsgo as the primary typechecker with tsc as compatibility fallback; recommending Hono, tsx, tsdown, Vite, Vitest, oxlint, oxlint-tsgolint, oxfmt, or deciding between bun and pnpm.
---

# TypeScript Recommend Tools

## Overview

Recommend a tsgo-first TypeScript toolchain for the current project shape. Start from a clear default stack, explain why it fits, and only branch when runtime, packaging, workspace, or repository constraints require it.

## Workflow

Follow these steps in order:

### 1. Classify the project

- Decide whether the project is a `Node/CLI`, `library/package`, or `web app / web API` codebase.
- Detect the existing runtime, module system, lockfile, workspace layout, and repository conventions before recommending changes.

### 2. Choose the package manager with the user

- If the repository already uses `bun` or `pnpm`, follow it.
- If the repository is undecided, explain the tradeoffs and align with the user instead of hardcoding one package manager.
- If the operating environment standardizes on `ni` and `nr`, use those wrappers for commands while still making the underlying `bun` or `pnpm` choice explicit.

### 3. Recommend the default stack

- Use `tsgo` as the primary typecheck command.
- Keep `tsc` as a compatibility and fallback check.
- Use `Vitest` for testing, `oxlint` for fast linting, `oxlint --type-aware` with `oxlint-tsgolint` for type-aware linting, and `oxfmt` for formatting.
- Assume ESM-first unless the repository is intentionally CommonJS.

### 4. Add the project-specific runtime and build tools

- `Node/CLI`: use `tsx` when there is no more specific tool-owned dev loop. If the project runs on Bun, prefer `bun run`.
- `library/package`: prefer `tsdown`, and prefer its watch or dev mode over wiring `tsx` into package build workflows.
- `web app / web API`: prefer `Hono`, and add `Vite` when browser assets or a frontend build are part of the stack. Prefer `vite dev` over `tsx` when Vite is already part of the project. Highlight Hono's Node, Bun, and edge runtime support when it matters.

### 5. Explain fallbacks and exceptions

- Keep `tsc` in the toolchain even when `tsgo` is primary.
- Use `Biome` only when the repository clearly benefits from a single integrated formatter and linter across multiple asset types.
- Use `typescript-eslint` only when the repository already depends on the ESLint plugin ecosystem or Oxlint cannot provide the required rules.
- For large existing frameworks or entrenched stacks, prefer incremental migration advice over framework replacement advice.

## Default Rules

- Prefer `tsgo` for primary typechecking.
- Keep `tsc` as `typecheck:compat` or other explicit compatibility checks.
- Prefer tool-owned dev loops such as `tsdown --watch` and `vite dev` before reaching for `tsx`.
- Prefer `Hono` for web frameworks.
- Assume ESM-first.
- Decide between `bun` and `pnpm` with the user or the repository state. Do not force one without context.

## References

- Read `references/default-stacks.md` for the quick matrix of recommended stacks and the shared defaults.
- Read `references/tool-selection-rules.md` for when to choose `bun`, `pnpm`, `Hono`, `Biome`, `typescript-eslint`, or Bun-native vs `tsx` dev loops.
- Read `references/node-cli-toolchain.md` for concrete Node and CLI scripts.
- Read `references/library-and-web-toolchains.md` for concrete library, package, and Hono web scripts.
