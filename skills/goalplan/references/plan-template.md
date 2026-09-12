# Plan Template

Fill in concrete criteria and exact paths. Preserve the original problem independently of the chosen implementation. Do not add elapsed-time, turn-count, or retry-count termination rules.

```markdown
# <Goal>

## Original problem and desired outcome
<the user's original need or failure, and the observable result that would resolve it>

## Definition of done
<implementation outcome and evidence, preserving the constraints below>
Completion also requires evaluation against the original problem and deletion of this run's planning files.

## Verification
<relevant commands or observations and expected results; explain how they address the original problem>

## Constraints and boundaries
<invariants, allowed paths/actions, and any actions needing further authorization>

## Planning files owned by this run
- Markdown: <exact path created for this run>
- HTML: <exact path created for this run>
These files are temporary. Preserve pre-existing plans and unrelated or later user edits.
If remote preview is used, record its URL, owned server/tunnel session handles, port, and exact staged copy/directory paths here. On the user's plan approval, close these sessions, remove their staged files and empty directory, and mark the preview closed. Retain the original planning files until goal completion.

## Checkpoints
- [ ] C1 <outcome-sized step> — evidence: <command, artifact, or observation>
- [ ] C2 <next outcome and evidence>
- [ ] Evaluate the result against the original problem and desired outcome.
- [ ] Preserve completion evidence in the final report or existing durable artifacts.
- [ ] Delete the two run-owned planning files and verify their absence before reporting completion.

## Progress log
| date | checkpoint | change | evidence | next |
|------|-----------|--------|----------|------|

## Original-purpose evaluation
<fill in at closeout: resolved / unresolved / inconclusive, with evidence and remaining gaps>
Passing the checks alone is insufficient if the original problem remains. Continue within scope if unresolved or inconclusive; do not lower the acceptance criteria.

## Blockers and resumption
<concrete missing access, facts, or user decisions; attempts and evidence; next action>
Retain this plan and its HTML companion while unfinished. Elapsed time or an execution interruption does not establish completion.

## Completion report and cleanup
Prepare a summary of the original problem, the result, evidence, and limitations before deleting plans.
First stop any recorded preview sessions and remove their staged copies and empty owned directories. Delete only the two exact run-owned plan paths above; verify both are absent. Preserve unrelated files and later user edits. If cleanup is blocked, report it as unfinished.
Then report the result and removed paths, without linking to deleted files or relying on them as the sole evidence. Mark the goal complete only now.
```
