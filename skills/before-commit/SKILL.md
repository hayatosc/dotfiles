---
name: before-commit
description: Prepare a requested commit or PR using the repository's checks and Conventional Commits. Does not authorize committing or publishing by itself.
---

# Before Commit

Review the intended diff and preserve unrelated work. Check for accidental secrets, conflict markers, and changes outside the requested scope.

Use the repository's relevant formatting, lint, typecheck, and test commands. Reuse passing results for unchanged code. Fix failures introduced by this change and rerun affected checks; report unrelated failures with evidence instead of expanding the task.

When local CI replay is useful, inspect the workflow first for external writes, deployment steps, and required services. Use an existing runner or the workflow's underlying commands; do not install a runner or replay every workflow by default. Use `nlx` rather than direct package-manager commands if a temporary runner is needed and authorized.

Finish the requested commit or PR once the applicable checks pass, using Conventional Commits. Report anything that could not be verified; a request for local edits alone does not authorize a commit, push, or PR.
