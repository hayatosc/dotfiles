---
name: verification
description: Prove runtime behavior by driving the real app and recording evidence. Use when a change affects a CLI, service, browser UI, desktop app, queue, migration, or generated output, or when tests alone cannot show the result.
---

# Verification

Verification proves behavior by driving the real system the way a user does. A passing unit test is not verification unless it exercises that behavior.

## When to use

- A change affects runtime behavior: CLI, HTTP service, browser UI, desktop app, queue, migration, or generated output.
- A bug fix needs a reproduction that the current tests miss.
- The repository has no scripted end-to-end check.

Do not use this for type-only changes or edits already covered by a trustworthy end-to-end check.

## Create the project-local skill

1. Find how the project runs: README, package scripts, mise tasks, Makefile, Cargo, Docker, or CI.
2. Choose the smallest driver that exercises the behavior:
   - CLI/TUI: a shell script invoking the built binary with fixtures.
   - HTTP/service: start it, send requests, assert status and body.
   - Browser UI: the harness browser tool or a project Playwright script.
   - Desktop: the harness computer/browser tools where available.
3. Commit the driver as a project script with subcommands: `doctor`, `start`, `exercise`, `capture`, `stop`.
4. Write `verify-<app>/SKILL.md` in the project skill folder:
   - `.agents/skills/` for DSH, Codex, OpenCode, and Pi
   - `.claude/skills/` for Claude Code
   - `.pi/skills/` for Pi
   - `.cursor/skills/` for Cursor
5. Include run commands, expected observations, a feature map, failure handling, and evidence paths.
6. Prove the verifier: run it on a known-good state, then introduce one small break and confirm it fails.

## Driver rules

- Deterministic and fast; no network unless the feature needs it.
- Print expected vs actual on failure and exit non-zero.
- Write evidence under an ignored path such as `tmp/verify-<app>/`.
- Never print secrets or full environment dumps.
- Prefer the project's own commands over reimplemented setup.

## Evidence

Evidence is a command, expected result, actual result, and artifact path. Do not report success without running the driver. If the driver cannot run, report the blocker and the unverified behavior.

## Maintenance

Update the skill when a feature or invariant changes. Stale verification is worse than none. Remove checks that no longer describe the product.

## Output contract

Report what was driven, evidence paths, pass/fail, and remaining gaps.

See [skill-template.md](references/skill-template.md) and [driver-patterns.md](references/driver-patterns.md).
