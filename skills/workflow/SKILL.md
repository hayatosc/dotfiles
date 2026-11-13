---
name: workflow
description: Run a nontrivial feature, bug fix, or refactor through plan, implement, review, and verification with recorded evidence. Use when the user asks for a change that needs a repeatable playbook.
disable-model-invocation: true
---

# Workflow

Use this for work that needs more than a local edit. The loop is plan -> implement -> review -> verify. A failed check returns to implementation.

## 1. Plan

- State the outcome, affected scope, constraints, and the evidence that will prove it.
- For a bug, reproduce it first.
- For a refactor, define the behavior that must not change.
- Choose the smallest change that satisfies the outcome.

## Ownership mode

Decide before editing and state it.

- **Maintainer**: the codebase is the agent's own long-term responsibility. Put this in the working context: "You are the owner and long-term maintainer of this codebase, and its design is up to you." Consolidating duplication and related fixes are in scope, but every behavior change must be reviewed and verified.
- **Surgical**: the user owns the code and wants the smallest change. Do not use the ownership sentence. Fix only the requested behavior; do not consolidate, rename, or clean up unrelated code.

A "no refactors" rule does not override maintainer mode. Choose surgical for bug fixes and small edits; choose maintainer for feature work where structure is part of the task.

## 2. Implement

- Work in small verifiable units; keep unrelated changes out.
- Run the project's existing checks as you go.

## 3. Review

- Review the diff independently of implementation: defects, contract changes, trust boundaries, missing tests.
- Review the reported diff and final files, not only the summary. List behavior changes and changes that were not requested; remove them or report them explicitly.
- Use the harness reviewer role or subagent when available; otherwise review explicitly.
- Each finding needs a file reference, a triggering case, the wrong behavior, and a fix.

## 4. Verify

- Use the `verification` skill and drive the real app, not only tests.
- Record command, expected, actual, and artifact path.
- If maintainer mode changed existing behavior, verify the previous behavior too or revert the extra change.
- If verification fails, return to implementation; do not report success.

## 5. Ship

- Run the relevant checks and report anything unverified.
- Commit, push, or open a PR only when requested.

## Rules

- Ownership mode is explicit. Never silently enter maintainer mode for a bug fix or small edit.
- Maintainer mode raises output and unrequested changes; review the diff, not just the summary.
- Separate review from verification; runtime changes need both.
- Do not parallelize agents until one agent can complete and verify the loop.
- Keep project commands in the project AGENTS.md or verification skill, not here.

Playbooks: [feature](references/feature.md), [bugfix](references/bugfix.md), [refactor](references/refactor.md).
