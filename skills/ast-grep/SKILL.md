---
name: ast-grep
description: Explore and transform large codebases with ast-grep using AST-aware search, rule-based scanning, and safe codemod workflows. Use when requests involve structural code search beyond regex, writing/testing ast-grep YAML rules, reducing noisy matches by syntax, or applying multi-file rewrites with controlled rollout. Also trigger when the user needs to find code patterns that regex can't reliably match (like "all useEffect calls with empty dependency arrays", "functions with more than 3 parameters", "class methods that call super"), when grep/ripgrep returns too many false positives due to syntax variations, or when the user wants to enforce code patterns across a codebase. Any request for syntax-aware code search or transformation should use this skill.
---

# ast-grep

Use ast-grep for syntax-aware exploration, linting, and rewrite that stays resilient in large or mixed-language repositories.

## Start

1. Confirm `ast-grep` is installed.
2. Identify the task mode: exploration/search (using `outline` or `run`), one-off rewrite (`run --rewrite`), or rule-driven scanning/linting (`scan`).
3. For file exploration, ALWAYS use `outline` first to get a map before reading the whole file to save tokens.
4. Restrict search/replace surface (path, language, globs, ignore policy).
5. Apply modifications in small batch rollouts.

## Choose Workflow

1. Use **Search / Explore Workflow** to inspect code structures or find specific AST patterns.
2. Use **Replace / Rewrite Workflow** for one-off modifications or safe automated refactoring.
3. Use **Rule / Lint Workflow** for repeatable scans, custom linting rules, and large migrations requiring tests.

## Search / Explore Workflow

### 1. Structural Map with `ast-grep outline` (First Pass)
Before opening or reading the full source of a file, use `outline` to obtain a syntax-aware table of contents (exports, imports, classes, structs, methods) without building an index.
- **Inspect file structure**:
  ```bash
  ast-grep outline src/parser.ts
  ```
- **List exported surface of a directory** (use a glob — bare directory path returns nothing):
  ```bash
  ast-grep outline src/*.ts
  ```
- **Filter and inspect file imports**:
  ```bash
  ast-grep outline src/parser.ts --items imports
  ```
- **Expand specific symbol details**:
  ```bash
  ast-grep outline src/parser.ts --match Parser --view expanded
  ```
- **Find specific dependency imports across a folder**:
  ```bash
  ast-grep outline src/*.ts --items imports --match ast-grep-core --view signatures
  ```

### 2. AST Pattern Search
Use `run` to perform structural search.
- **AST pattern match**:
  ```bash
  ast-grep run -p 'Promise.all($$$ARGS)' -l TypeScript src
  ```
- Narrow down search via `--globs` and specify `--lang` when extension inference is unreliable.
- Inspect pattern parsing with `--debug-query=ast` when matches are missing.

Use command examples from:
- `references/command-cookbook.md`

## Replace / Rewrite Workflow

### 1. Quick Rewrites
Perform one-off changes using `run --rewrite`.
- **Preview changes (diff only)**:
  ```bash
  ast-grep run -p 'foo($A)' -r 'bar($A)' -l TypeScript src
  ```
- **Interactive apply**:
  ```bash
  ast-grep run -p 'foo($A)' -r 'bar($A)' -l TypeScript src --interactive
  ```
- **Apply all changes**:
  ```bash
  ast-grep run -p 'foo($A)' -r 'bar($A)' -l TypeScript src --update-all
  ```
## Rule / Lint Workflow

1. Initialize project/rule/test scaffolding with `ast-grep new ...`.
2. Write rule YAML with `id`, `language`, `rule`, `constraints`, and `fix`.
3. Validate rule behavior with `ast-grep test`.
4. Scan with `ast-grep scan` (or `scan --inline-rules`).

Use authoring details from:
- `references/rule-authoring.md`

## Execution Rules

1. **Outline First**: Always summarize a target file using `ast-grep outline` before opening it, especially in large codebases (helps reduce Claude Code costs by up to 55%).
2. **Narrow Scope First**: Order of narrowing to reduce noise: Path -> `--lang` -> `--globs` -> Pattern strictness.
3. Prefer `scan --inline-rules` for quick hypothesis testing; promote stable logic to YAML files.
4. Prefer `--json=stream` for large output pipelines; avoid pretty JSON for machine processing.
