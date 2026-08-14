# Refactor Playbook

## Structural Moves

- **Rename**: Match current role. Do not bundle with structural edits.
- **Extract**: Move sub-purposes or pure logic into named helpers.
- **Split**: Separate phases (parse, validate, execute, format) or uncouple file-history-only dependencies.
- **Move**: Move logic toward data owner. Finish renames/extractions first.
- **Isolate Side Effects**: Push I/O & state mutations to edges; keep decision logic pure.
- **Remove Duplication**: Unify genuine duplication (same rule/evolution path). Do NOT unify accidental similarity.
- **De-engineering**: Inline 1-impl interfaces/factories, remove delegating wrappers, replace custom code with stdlib (`stdlib:`) or native platform features (`native:`). Purge dead flags (`yagni:` / `delete:`). Aim for `net: -<N> lines`.

## Duplication Cleanup Workflow

1. **Detect**: Search via `rg` (literals, regex) or structural search.
2. **Classify**: Genuine (same rule) vs Accidental (different semantics).
3. **Migrate**: Extract shared helper -> migrate call sites 1-by-1 -> test -> delete old code.

## Code Smells & Actions

- Giant function -> Split by phase.
- Entangled I/O -> Isolate side effects.
- 1-impl interface -> Inline.
- Delegating wrapper -> Delete & direct call.
- Custom algorithm -> Replace with stdlib/native.
