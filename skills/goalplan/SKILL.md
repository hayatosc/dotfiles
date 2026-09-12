---
name: goalplan
description: Create a /goal contract, PLAN.md, and PLAN.html for explicit goal planning, including original-problem evaluation and cleanup on completion. Does not execute the planned task.
---

# Goal Planning

Deliver a runnable `/goal` contract, an operational `PLAN.md`, and a human-readable `PLAN.html`. The contract covers implementation, evaluation against the original problem, and removal of this run's planning files before completion.

## Establish the Original Purpose

Record the user's original problem, the observable result they need, and relevant constraints before choosing implementation checkpoints. Keep this purpose separate from the proposed solution and test commands: completing a checklist is not proof that the original problem is solved.

Use the conversation and relevant repository evidence to resolve known facts. Inspect affected source and verification commands as needed; do not require a full repository survey. For subjective work, define observable acceptance evidence with the user. A prototype can be a checkpoint, but does not replace a broader original objective without the user's agreement.

Ask focused rounds of questions only for unresolved decisions that materially affect the outcome, evidence, or authorization. Use the harness's question tool when available; otherwise ask concise numbered questions in ordinary text. A missing answer is not authorization. State low-impact assumptions and do not reconfirm settled decisions.

If the user asks to wrap up, write a draft with material unresolved decisions marked as blockers. Do not present that draft as ready to execute.

## Execution and Interruption

Do not introduce, request, or include a goal timeout, turn limit, or retry-count cutoff. Choose the next action from the evidence and continue within the authorized scope until the original problem is resolved or a concrete blocker prevents progress. Repeated failure calls for a revised approach, not blind retries or an arbitrary stopping count.

A harness interruption or a tool timeout is not goal completion. Preserve progress and resume unfinished work when execution is available again; these instructions do not disable platform limits or operational timeouts needed by individual tools. For a real blocker, record what was tried, the evidence, remaining work, and the access or decision needed. Retain planning files while the goal is unfinished. If the user cancels, follow their direction rather than reporting success.

Before presenting a runnable contract, account for the original problem, observable outcome, evidence, invariants, authorized scope, exact plan paths, progress recording, original-purpose evaluation, blocker handling, and cleanup. Missing material requirements make the contract a draft.

## Write the Planning Files

Use [plan-template.md](references/plan-template.md) for the plan structure and [example.md](references/example.md) for a complete example.

Choose and record the exact Markdown and HTML paths before writing them. Preserve pre-existing or unrelated plans by selecting distinct paths following repository conventions. Only the planning files created for this run are eligible for automatic cleanup; do not take ownership of existing files merely because they are named `PLAN.md` or `PLAN.html`.

Write the plan once material decisions are settled; no additional approval is needed to write a task-owned draft. Record outcome-sized checkpoints, relevant commands or artifacts, and a progress log of meaningful evidence and decisions.

Use `html-artifacts` to render the same plan as `PLAN.html` beside the Markdown file and link the two. Markdown remains the executing agent's source of truth. If the skill or writable workspace is unavailable, provide what is possible and identify the missing deliverable. Do not delete either file at planning handoff: the executing agent still needs them.

If a remote HTML preview is running, the user's approval of the plan ends that preview session. Stop its owned server and tunnel, remove its staged copy and empty temporary directory, and record cleanup without asking again. Retain the original `PLAN.md` and `PLAN.html` for execution; their deletion belongs to goal completion. Approval closes the preview but does not by itself authorize starting execution.

## Evaluate and Clean Up Before Goal Completion

Include this sequence in both the contract and the plan so it survives a handoff to any model or harness:

1. Compare the implemented result with the recorded original problem and desired outcome. Explain whether the initial failure or user need is resolved, using relevant evidence and preserved constraints. Reuse valid check results; run another check only to close an actual evidence gap.
2. If the problem remains or the evidence is inconclusive, update the plan and continue within scope. Do not weaken acceptance criteria to call the goal complete. Escalate a specific blocker if progress needs a new decision or access.
3. Once resolution is supported, prepare a final summary of the original problem, result, evidence, and limitations. Keep the necessary evidence in the final report or existing durable artifacts, not solely in planning files that will be deleted.
4. If a remote preview was started, stop its owned tunnel/server sessions and remove the recorded staged HTML copy and empty temporary directory first. Then delete the exact Markdown and HTML planning files created for this run and verify that both are absent. Do not use name-based searches, wildcards, or recursive directory deletion. Preserve unrelated files and later user edits; if ownership is unclear or cleanup fails, report cleanup as unfinished rather than claiming completion.
5. Only after evaluation and cleanup, report completion with the outcome, supporting evidence, and removed paths. Do not link to deleted plans as the evidence or mark the goal complete before cleanup finishes.

## Handoff

Emit a self-contained contract with the real paths and observable criteria filled in:

```text
/goal Resolve <original problem> so that <observable outcome>, verified by <evidence>, preserving <constraints>.
Follow <Markdown plan path>; its human-readable companion is <HTML plan path>. Both are temporary planning files created for this run.
Implement and record meaningful progress within <authorized boundaries>; do not end the goal because of elapsed time, turn count, or retry count.
After the checkpoints, evaluate whether the original problem is actually solved. If unresolved or unproven, continue or report a concrete blocker and retain the plans.
After successful evaluation, preserve the result and evidence in the final report, close any recorded preview sessions and remove their staged copies, then delete only these two run-owned plan files and verify their absence.
Mark the goal complete only after evaluation and cleanup; report the original problem, resolution, evidence, limitations, and deleted paths.
```

Planning is complete when the contract and both planning files agree. Do not start the goal, perform its implementation, or remove its planning files unless the user also requests execution. Goal completion is the later evaluation-and-cleanup sequence above.
