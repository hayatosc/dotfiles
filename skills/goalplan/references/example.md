# Worked Example

The repeated test runs below are acceptance evidence for an intermittent failure, not a limit on how long the goal may continue.

## Request

> /goalplan ログインの E2E が固定時間の待機に依存して不安定なので、安定させたい。

## Established Context

- `e2e/auth.spec.ts` starts assertions after an arbitrary delay instead of observing login completion.
- The project provides `nr test:e2e --grep auth` and the full `nr test:e2e` suite.
- The user wants ten consecutive successful auth runs, with the existing assertions preserved and no added retries or skips.
- Only test code may change. If traces show an application defect, report the evidence and request the required scope decision.
- `PLAN.md` and `PLAN.html` do not exist and will be created for this run. Existing plans would require distinct paths.

## Contract

```text
/goal Remove the timing-dependent login E2E failure: auth assertions must wait for observable login completion, preserving the assertions and production code.
Verify with ten consecutive successful `nr test:e2e --grep auth` runs, no arbitrary waits in e2e/auth.spec.ts, and the full `nr test:e2e` suite passing.
Follow ./PLAN.md and record meaningful evidence there; ./PLAN.html is its companion. Both are temporary files created for this run. Only e2e/ and playwright.config.ts may be changed, plus these planning files; src/ is read-only.
Continue based on evidence without an elapsed-time, turn-count, or retry-count cutoff. If an application defect requires broader scope, report the traces and needed decision and retain both plans.
Before completion, return to the original timing-dependent failure: establish that the new wait observes login completion, not merely that ten runs happened to pass. Continue if that is unresolved or unproven.
Prepare the final problem/result/evidence summary, delete only ./PLAN.md and ./PLAN.html, and verify that neither remains. Report resolution, evidence, limitations, and removed paths; mark complete only after cleanup.
```

## PLAN.md

```markdown
# Stabilize Login E2E

## Original problem and desired outcome
Auth assertions race with login completion because they depend on a fixed delay. Assertions must run after the actual login result is observable, preserving what the test verifies.

## Definition of done
Ten consecutive auth runs and the full E2E suite pass, with no fixed waits, added retries, skipped tests, or weakened assertions. The original timing issue is evaluated as resolved, then this run's two planning files are removed.

## Verification
- `nr test:e2e --grep auth` → ten consecutive successful runs, recorded individually.
- Inspect the changed wait and traces: assertions follow the expected authenticated UI state.
- `rg 'waitForTimeout' e2e/auth.spec.ts` → no matches (exit 1).
- `nr test:e2e` → exit 0 with existing assertions intact.

## Constraints and boundaries
Edit only e2e/ and playwright.config.ts, plus the two planning files below. Read src/ and existing CI traces as needed. Do not change application code, add retries, or skip assertions.

## Planning files owned by this run
- Markdown: ./PLAN.md
- HTML: ./PLAN.html
Neither existed before this run. Delete these exact files only after successful original-purpose evaluation; preserve unrelated files and later user edits.

## Checkpoints
- [ ] Capture the failure and identify what indicates login completion.
- [ ] Replace the fixed delay with a wait for that observable state.
- [ ] Collect the agreed auth and regression evidence.
- [ ] Evaluate whether the original assertion/login race is resolved.
- [ ] Prepare the final evidence summary, delete the two run-owned plans, and verify absence before reporting completion.

## Progress log
| date | checkpoint | change | evidence | next |
|------|-----------|--------|----------|------|

## Original-purpose evaluation
Pending. Explain why the wait now follows actual login completion. If passing runs still leave the race unexplained, continue investigation instead of marking complete.

## Blockers and resumption
If traces locate the problem in application code, report the evidence and scope decision needed. Preserve both planning files while unfinished; an interrupted run does not establish resolution.

## Completion report and cleanup
Summarize the initial race, the replacement wait, recorded check results, and remaining limitations. Delete ./PLAN.md and ./PLAN.html, verify both are absent, then report completion and the removed paths. If cleanup fails, report it as unfinished.
```

Render the same content as `PLAN.html` with `html-artifacts`. If shared through a remote preview, stop its server and tunnel and remove the staged copy when the user approves the plan. Both original planning files remain at handoff and throughout implementation. Their removal belongs to goal closeout, after evaluating the original problem; plan approval must not delete them.
