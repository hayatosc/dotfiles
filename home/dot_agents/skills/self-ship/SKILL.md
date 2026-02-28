---
name: self-ship
description: Self-review, improve, commit, and push code that Claude has just written. Use this skill when the user asks Claude to "self-ship", "review and ship", "review then commit and push", or wants Claude to autonomously review its own output, apply improvements, and publish the changes to the remote repository. Triggered by: "self-ship", "ship it", "review and push", "review my changes and commit", or similar requests to complete the full write → review → commit → push cycle.
---

# Self-Ship

Autonomously review the code you just wrote, apply improvements, commit, and push.

## Workflow

Follow these steps in order:

### 1. Identify scope

Determine which files were modified in the current session. Check git status to confirm:

```bash
git status
git diff
```

### 2. Self-review

Critically review every file you touched. Check for:

- **Correctness** – logic errors, off-by-one errors, missing edge cases
- **Security** – injection vulnerabilities, exposed secrets, unsafe operations
- **Simplicity** – over-engineering, unnecessary abstractions, dead code
- **Consistency** – naming conventions, code style, patterns used elsewhere in the repo
- **Completeness** – missing error handling at system boundaries (user input, external APIs)

Write a brief internal review summary noting issues found.

### 3. Apply improvements

Fix every issue identified in the review. Keep changes minimal and focused—do not refactor code unrelated to the review findings.

### 4. Final check

Re-read the improved files to confirm the fixes are correct. Run tests if a test suite exists:

```bash
# run tests
```

### 5. Commit

Stage only the files you modified. Verify what is staged before committing:

```bash
git add <specific files>
git diff --staged
git commit -m <commit message>
```

### 6. Push

Push to the current branch's upstream:

```bash
git push
```

If no upstream is set:

```bash
git push -u origin <current-branch>
```

## Guidelines

- **Never use `--no-verify`** to bypass pre-commit hooks. If a hook fails, fix the underlying issue and create a new commit.
- **Never force-push** to `main`/`master`. Warn the user if the current branch is a protected branch.
- **Never commit secrets** (`.env`, credentials, tokens). Warn the user if any staged file looks like it contains credentials.
- **Prefer new commits over amending** published commits.
- **Stage specific files**—never `git add -A` or `git add .` without explicitly checking what is staged.
- If the push requires confirmation (e.g., force-push, protected branch), **stop and ask the user** before proceeding.
