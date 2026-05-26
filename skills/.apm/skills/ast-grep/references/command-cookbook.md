# ast-grep Command Cookbook

## Table of Contents

1. Quick structural search
2. Scope and performance controls
3. Rewrite rollout patterns
4. Rule-based scanning
5. Test and scaffold
6. JSON and CI output

## 1. Quick structural search

```bash
# One-off AST match (default command is run)
ast-grep run -p 'Promise.all($$$ARGS)' -l TypeScript src

# Equivalent explicit form
ast-grep run --pattern 'Promise.all($$$ARGS)' --lang TypeScript src

# Show syntax tree for pattern debugging
ast-grep run -p 'foo($A)' -l JavaScript --debug-query=ast
```

## 2. Scope and performance controls

```bash
# Restrict to selected file patterns
ast-grep run -p 'console.log($$$ARGS)' --lang TypeScript src \
  --globs '**/*.ts' --globs '!**/*.test.ts'

# Inspect why files/rules are skipped
ast-grep scan --inspect summary

# Search hidden files only when needed
ast-grep run -p '$X' --no-ignore hidden .
```

Use this ordering to reduce noise:
1. Narrow path
2. Add `--lang`
3. Add `--globs`
4. Tune pattern or strictness

## 3. Rewrite rollout patterns

```bash
# Preview rewrite diff only
ast-grep run -p 'foo($A)' -r 'bar($A)' -l TypeScript src

# Interactive apply
ast-grep run -p 'foo($A)' -r 'bar($A)' -l TypeScript src --interactive

# Apply all (only after confidence is high)
ast-grep run -p 'foo($A)' -r 'bar($A)' -l TypeScript src --update-all
```

Roll out in batches:
1. Rewrite one package/module
2. Run project checks
3. Expand scope

## 4. Rule-based scanning

```bash
# Scan using project config (sgconfig.yml)
ast-grep scan

# Run a single YAML rule file
ast-grep scan --rule rules/no-console.yml src

# Prototype quickly without files
ast-grep scan --inline-rules '
id: no-console
language: TypeScript
rule:
  pattern: console.log($$$ARGS)
' src

# Run subset by rule id regex
ast-grep scan --filter '^(no-console|prefer-logger)$' src
```

## 5. Test and scaffold

```bash
# Initialize ast-grep project in current directory
ast-grep new project -y

# Create rule/test skeletons
ast-grep new rule no-console -l TypeScript -y
ast-grep new test no-console -y

# Run rule tests
ast-grep test
ast-grep test --filter '*no-console*'
```

## 6. JSON and CI output

```bash
# Stream JSON lines for tooling pipelines
ast-grep run -p 'dangerous($X)' -l TypeScript src --json=stream

# SARIF for static-analysis workflows
ast-grep scan --format sarif > ast-grep.sarif

# GitHub Action annotation format
ast-grep scan --format github
```

Use `--include-metadata` with `scan --json` when rules carry metadata fields.
