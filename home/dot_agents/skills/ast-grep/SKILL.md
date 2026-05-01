---
name: ast-grep
description: Explore and transform large codebases with ast-grep using AST-aware search, rule-based scanning, and safe codemod workflows. Use when requests involve structural code search beyond regex, writing/testing ast-grep YAML rules, reducing noisy matches by syntax, or applying multi-file rewrites with controlled rollout.
---

# ast-grep

Use ast-grep for syntax-aware exploration and rewrite that stays resilient in large or mixed-language repositories.

## Start

1. Confirm `ast-grep` is installed.
2. Identify the task mode: one-off query (`run`) or rule-driven scan (`scan`).
3. Restrict search surface before matching (path, language, globs, ignore policy).
4. Run preview-only search first.
5. Apply rewrite interactively or in batches.
6. Re-run scan/tests after each batch.

## Choose Workflow

1. Use **Run Workflow** for one-off structural queries or quick codemods.
2. Use **Rule Workflow** for repeatable checks, team-wide policies, or migrations requiring tests/snapshots.
3. Use **Safe Rewrite Script** for guarded rollout of a single pattern rewrite.

## Run Workflow

1. Build a minimal pattern with explicit language when extension inference is unreliable.
2. Add scope constraints (`--globs`, path) before changing strictness.
3. Inspect pattern parsing with `--debug-query` when matches are missing.
4. Rewrite with preview first, then `--interactive` or `--update-all`.

Use command examples from:
- `references/command-cookbook.md`

## Rule Workflow

1. Initialize project/rule/test scaffolding with `ast-grep new ...`.
2. Write rule YAML with `id`, `language`, `rule`, and optional `constraints`/`fix`.
3. Add file targeting with `files`/`ignores` in YAML.
4. Validate rule behavior with `ast-grep test`.
5. Execute selective rollout with `scan --filter` or bounded paths.

Use authoring details from:
- `references/rule-authoring.md`

## Execution Rules

1. Prefer narrowing by syntax (`--lang`, AST pattern shape) before adding broad regex-like workarounds.
2. Prefer `scan --inline-rules` for quick hypothesis tests; promote stable logic to YAML files.
3. Prefer `--json=stream` for large output pipelines; avoid pretty JSON for machine processing.
4. Use `--inspect summary` to debug unexpected file/rule discovery behavior.
5. Apply rewrites in small slices when touching many modules to reduce rollback cost.
