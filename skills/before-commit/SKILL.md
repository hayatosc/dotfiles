---
name: before-commit
description: Pre-commit quality gate (linters, formatters, security checks, bloat pass, local CI via actrun or manual fallback). Trigger whenever preparing a commit or PR.
---

# Before Commit Gate

Catch issues locally before committing. A quick local verification saves expensive CI round-trips and keeps the build green.

## Pre-Commit Workflow

1. **Inspect Scope**: Review `git status` and `git diff` to understand modified files and target languages.
2. **Formatting & Linting**: Run the project's linters/formatters (use auto-fix flags like `--fix` when available).
3. **Bloat & Debt Audit**: Inspect `git diff` for unnecessary abstractions or redundant dependencies. Verify any deliberate shortcut comments (`// deliberate:` or `// shortcut:`) include both the constraint ceiling and the upgrade trigger.
4. **Security & Sanity Checks**: Scan for committed secrets, merge conflict markers (`<<<<<<<`), or leftover `TODO`/`FIXME` items.
5. **Local CI Replay**: Run `npx @mizchi/actrun workflow run .github/workflows/<ci>.yml`. If `actrun` is unavailable or fails, execute the core test/build commands directly from the workflow file.
6. **Fix and Commit**: Re-verify failing checks until all pass. Create a clean commit using Conventional Commit format when requested.
