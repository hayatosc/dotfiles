---
name: ast-grep
description: Search or rewrite syntax patterns with ast-grep, or author its lint rules. Use when AST structure matters; ordinary filename and text searches do not need this skill.
---

# ast-grep

Use syntax-aware matching when it makes the requested search or rewrite more reliable. Restrict the path, language, and globs to the intended scope.

- For searches, rewrites, and optional structural outlines, use [command-cookbook.md](references/command-cookbook.md).
- For reusable scan rules and their positive/negative fixtures, use [rule-authoring.md](references/rule-authoring.md).
- Check the installed tool's help when a command is unavailable; use text search or bounded reads if they answer the question. An outline is useful for a large unfamiliar file, not a prerequisite for every read.

## Rewrite Contract

Preview matches and replacements before applying a codemod. Confirm the pattern captures the intended syntax, including relevant non-matches, then apply within the authorized scope.

`--rewrite` only replaces matched nodes: it does not create imports or definitions. Resolve any introduced identifiers in affected files and run the relevant project typecheck, build, or tests. Inspect remaining matches against the intended scope; zero matches is required only when the request calls for complete replacement.

Finish when the requested search is answered or the rewrite and relevant checks are complete. Report matches or changed paths, evidence, and any unsupported syntax or unresolved cases.
