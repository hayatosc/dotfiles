# ast-grep Rule Authoring Guide

## Table of Contents

1. Minimal rule template
2. Pattern design tactics
3. Filtering with constraints and utils
4. Safe rewrite patterns
5. Multi-rule migrations
6. Testing strategy

## 1. Minimal rule template

```yaml
id: no-console-log
language: TypeScript
rule:
  pattern: console.log($$$ARGS)
severity: warning
message: Avoid console.log in production code.
fix: logger.info($$$ARGS)
files:
  - src/**/*.ts
ignores:
  - src/**/__tests__/**
```

Keep `id` stable and descriptive. Use one concern per rule.

## 2. Pattern design tactics

1. Start with a narrow pattern that already excludes obvious false positives.
2. Prefer meta variables over hard-coded literals:
   - `$X`: single node
   - `$$$XS`: multiple nodes
3. Control matching shape using pattern context (call, statement, declaration).
4. Use explicit `language` matching file extensions in the repo.

## 3. Filtering with constraints and utils

Use `constraints` to add post-filter checks for a single meta variable:

```yaml
rule:
  pattern: console.log($ARG)
constraints:
  ARG:
    kind: identifier
```

Use `utils` for reusable local predicates:

```yaml
utils:
  is-function:
    any:
      - kind: function
      - kind: function_declaration
rule:
  matches: is-function
```

## 4. Safe rewrite patterns

Use string fix for simple substitutions:

```yaml
fix: logger.info($$$ARGS)
```

Use `FixConfig` when surrounding syntax must be removed/expanded:

```yaml
fix:
  template: ''
  expandEnd:
    regex: ','
```

Use `transform` for text manipulation before rewrite:

```yaml
transform:
  NEW_NAME: replace($OLD, replace='^old', by='new')
fix: $NEW_NAME
```

## 5. Multi-rule migrations

Group related rules in one YAML file using `---` separators.

Recommended migration split:
1. Rename declarations
2. Rename call sites
3. Rewrite import/export edges

Run targeted subsets with:

```bash
ast-grep scan --filter '^(rename-.*|migrate-.*)$'
```

## 6. Testing strategy

1. Create rule test fixtures with `ast-grep new test`.
2. Run `ast-grep test` after each meaningful rule change.
3. Use `--update-all` only when snapshot updates are intentional.
4. Keep fixtures minimal and include at least one negative case.
