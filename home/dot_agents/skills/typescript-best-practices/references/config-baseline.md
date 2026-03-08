# Configuration Baseline

Use this reference before changing `tsconfig`, `tsgo` or `tsc` workflows, `oxlint`, or `typescript-eslint` settings.

## TypeScript Compiler Baseline

Prefer this baseline when the repository is actively improving type safety:

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `useUnknownInCatchVariables: true`

These settings catch different classes of mistakes. Apply them incrementally when turning them all on at once would create too much unrelated churn.

Assume an ESM-first codebase by default. Prefer consistent `import` and `export` syntax and avoid mixing CommonJS and ES modules in the same workflow unless the repository already does that intentionally.

If the repository uses a `tsgo`-first workflow, keep `tsgo --noEmit` as the primary check and retain `tsc --noEmit` as a compatibility command. Do not silently remove `tsc` from mature repositories without checking their CI, editor, and package build expectations.

## Oxc Baseline

If the repository uses the Oxc stack, prefer:

- `oxlint` for the default lint pass
- `oxlint --type-aware` with `oxlint-tsgolint` for type-aware linting
- `oxfmt` for formatting when the repository has adopted the Oxc formatter

Keep compiler checks and type-aware linting separate by default. Treat `oxlint --type-aware --type-check` as an opt-in CI simplification, not the default migration path.

When `oxlint-tsgolint` is enabled, keep its TypeScript rule baseline aligned with the `@typescript-eslint` baseline below. Use the same rule intent and the same option values where both tools support them:

- `typescript/no-explicit-any`
- `typescript/no-unsafe-type-assertion`
- `typescript/no-unnecessary-type-assertion`
- `typescript/consistent-type-imports` with `{ prefer: "type-imports", fixStyle: "separate-type-imports", disallowTypeAnnotations: true }`
- `typescript/switch-exhaustiveness-check` with `{ allowDefaultCaseForExhaustiveSwitch: true, considerDefaultExhaustiveForUnions: false, requireDefaultForNonUnion: false }`

The first and fourth rules can run in the default `oxlint` pass. The second, third, and fifth require `oxlint --type-aware`.

## typescript-eslint Baseline

Start from `recommended-type-checked` when the repository already runs ESLint with type information. Keep its explicit TypeScript rule baseline aligned with `oxlint-tsgolint`:

- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/no-unsafe-type-assertion`
- `@typescript-eslint/no-unnecessary-type-assertion`
- `@typescript-eslint/consistent-type-imports` with `{ prefer: "type-imports", fixStyle: "separate-type-imports", disallowTypeAnnotations: true }`
- `@typescript-eslint/switch-exhaustiveness-check` with `{ allowDefaultCaseForExhaustiveSwitch: true, considerDefaultExhaustiveForUnions: false, requireDefaultForNonUnion: false }`

Add these rules explicitly when they are not already covered by the shared config so the intended baseline stays visible in the repository config.

Do not default to `strict-type-checked`. Treat it as an opt-in ruleset for repositories that already want a highly opinionated, proficiency-dependent setup.

## Type-Level Test Tooling

Reuse the repository's existing type-level testing tools if they already exist. Good options include `tsd`, `expectTypeOf`, framework-native type tests, or compile-only fixtures checked by `tsc`.

If no type-level testing setup exists, prefer small `.ts` fixtures that run through the standard typecheck command. Do not add a new dependency solely to test types unless the user asks.

Treat `ts-reset` and similar opinionated standard-library patches as opt-in. Do not introduce them during routine type-safety work unless the repository already uses them or the user explicitly requests them.

## Adoption Order

1. Confirm the current typecheck and lint commands.
2. Tighten the lowest-churn items first, such as type-only imports and exhaustiveness checks.
3. Enable stricter compiler flags one at a time when you can fix the resulting errors in scope.
4. Re-run typecheck after each configuration change.
5. Run lint and tests after the final change set.

## When Not to Change Configuration

- The request is a narrow bug fix and strictness changes would dominate the patch.
- The configuration change would surface unrelated repository-wide migration work.
- The framework or toolchain owns the configuration and the repository has an established override pattern you have not inspected yet.

In those cases, keep the code change local and describe the configuration gap separately.

## Verification

- Prefer the repository's existing typecheck script.
- If none exists, run the relevant `tsgo --noEmit` or `tsc --noEmit` command against the active `tsconfig`, following the repository's current toolchain.
- If ESLint is type-aware, run it after the typecheck passes.
- If the repository uses Oxlint type-aware linting, run `oxlint --type-aware` after compiler checks pass.
- If compile-time type tests are part of the change, make sure they run under the same verification flow rather than creating a parallel unchecked path.
