---
name: before-commit
description: >
  Pre-commit quality gate: runs linters, formatters, security checks,
  and local CI (via mizchi/actrun or manual fallback) before code is
  committed. Use whenever the user is about to commit, preparing a PR,
  running "git commit", or asks to "check changes", "run pre-commit",
  "prepare for commit", or "verify before pushing". Also trigger when
  the conversation is heading toward a commit after completing a code
  change task — catching issues locally is far cheaper than a failed
  CI round-trip.
---

# Before Commit Checks

Catch errors before they leave the developer's machine. A local check that takes seconds saves a CI round-trip that takes minutes and blocks the whole team.

## 1. Initial State Check

Understand the scope before running anything — running the wrong checks wastes time and produces confusing output.

- Review `git status` and `git diff --cached` (or `git diff` if not staged yet) to understand what files are being modified.
- Identify the languages and frameworks involved (e.g., Python, Node.js, Go, Rust) to determine appropriate linters and formatters.
- If a language-specific best-practices skill exists (e.g., typescript-best-practices, golang-best-practices), consult it for the recommended tooling.

## 2. Formatting and Linting (Fast Checks First)

Fast feedback first: formatting and lint issues are cheap to find and fix. Running these before heavy test suites avoids wasting minutes on a build that will fail anyway due to a missing semicolon.

- Detect the project's formatters/linters from config files (`package.json` scripts, `.pre-commit-config.yaml`, `tox.ini`, `pyproject.toml`, `Makefile`, etc.) and run them.
- If errors are found, automatically fix them (e.g., using `--fix` flags) and stage the updated files.
- **Security & Sanity Checks:** Scan for secrets (API keys, tokens), merge conflict markers (`<<<<<<<`), or `TODO`/`FIXME` that shouldn't ship. These are easy to miss in a large diff and expensive to discover in production.

## 3. Local CI Execution (The Core Check)

The goal is to reproduce what CI will do, locally. This catches integration-level failures (type errors, broken imports, failing tests) that lint alone can't find.

### Using `actrun` (mizchi/actrun)
If `.github/workflows/` exists, use `mizchi/actrun` to replay the CI workflow locally — it mirrors the actual CI steps, reducing "works on my machine" gaps:
`npx @mizchi/actrun workflow run .github/workflows/<your-ci-file>.yml`
1. Identify the core CI workflow file.
2. Run the CI workflow using the command above.
   *Note: `actrun` defaults to using a temporary worktree (`--worktree`) to protect your local files. If it fails due to environment issues or unsupported features, fall back to manual execution.*

### Manual Fallback (If `actrun` fails or cannot be used)
If `actrun` fails to run:
1. Read the CI configuration files (e.g., `.github/workflows/*.yml`).
2. Identify the core testing, linting, and build commands defined in the steps.
3. Execute these commands directly in the local terminal.

## 4. Fix and Re-verify

Fixing and immediately re-running only the failing check keeps the feedback loop tight — don't re-run the full suite until the specific failure is resolved.

- If any check or test fails, analyze the error output.
- Modify the code to fix the issues.
- After fixing, re-run the specific failing check until it passes.
- Do not proceed to commit if the tests are failing unless explicitly instructed by the user to bypass.

## 5. Final Confirmation

- Once all checks pass, summarize the checks that were run and their results.
- If the user asked you to commit, generate a commit message following the project's conventions (see AGENTS.md for commit message rules) and commit the changes.
