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

## 2. Implement

- Work in small verifiable units; keep unrelated changes out.
- Run the project's existing checks as you go.

## 3. Review

- Review the diff independently of implementation: defects, contract changes, trust boundaries, missing tests.
- Use the harness reviewer role or subagent when available; otherwise review explicitly.
- Each finding needs a file reference, a triggering case, the wrong behavior, and a fix.

## 4. Verify

- Use the `verification` skill and drive the real app, not only tests.
- Record command, expected, actual, and artifact path.
- If verification fails, return to implementation; do not report success.

## 5. Ship

- Run the relevant checks and report anything unverified.
- Commit, push, or open a PR only when requested.

## Rules

- Separate review from verification; runtime changes need both.
- Do not parallelize agents until one agent can complete and verify the loop.
- Keep project commands in the project AGENTS.md or verification skill, not here.

Playbooks: [feature](references/feature.md), [bugfix](references/bugfix.md), [refactor](references/refactor.md).
