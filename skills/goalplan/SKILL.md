---
name: goalplan
description: Create a /goal completion contract, PLAN.md, and PLAN.html when the user explicitly requests goalplan or planning for /goal. Does not implement the planned task or handle ordinary planning.
---

# Goal Planning

Deliver a runnable `/goal` contract, an operational `PLAN.md`, and a human-readable `PLAN.html`. The contract defines the observable end state, evidence, constraints, and execution boundaries.

## Resolve the Contract

Use the conversation and relevant repository evidence to establish what is already known. Inspect the affected source or verification commands when the goal depends on them; a planning request does not require a full repository survey. Preserve existing planning artifacts and unrelated work.

Ask focused rounds of questions only for unresolved decisions that materially affect the goal: the outcome, evidence, compatibility constraints, allowed resources, or a real stopping boundary. Use the current harness's question tool when appropriate. Keep each round manageable and allow answers to resolve dependent questions before asking them.

If no question tool is available, ask concise numbered questions in ordinary text. A missing answer is not authorization: keep material unresolved decisions as blockers, while recording low-impact assumptions explicitly.

Do not ask the user to reconfirm settled authorization or routine choices. State low-impact assumptions. If the user asks to wrap up, write the draft with unresolved decisions clearly marked; do not present those as execution authorization.

For broad or subjective work, choose an observable artifact or prototype as the first finish line. Separate unrelated objectives. Include a time or turn cap only if specified by the user or harness; do not invent an early stopping limit.

Before presenting a runnable contract, account for each field: observable objective, completion evidence, invariants, authorized scope, plan path, progress recording, completion/blocker conditions, and any user or harness resource limit. If no additional cap is specified, record that explicitly; completion and blocker conditions still apply. Ask about a budget when an otherwise unbounded resource commitment materially affects authorization. A contract with unresolved scope, evidence, or authorization is a draft, not ready to execute.

## Write the Artifacts

Use [plan-template.md](references/plan-template.md) for the plan shape and [example.md](references/example.md) when a worked contract would help.

The plan records:

- The outcome and evidence that establishes completion.
- Relevant constraints, allowed actions, and actions that still require authorization.
- Outcome-sized checkpoints, with commands or observable artifacts where useful.
- A progress log for meaningful results and decisions, plus risks and concrete blockers.

Write the plan as part of the planning request once material decisions are settled. There is no additional confirmation gate for writing a draft. Use repository planning conventions; preserve an existing unrelated `PLAN.md` by choosing a distinct path.

Render the same plan with `html-artifacts` as `PLAN.html` next to the Markdown file, linking the two. Markdown remains the executing agent's source of truth. If the skill or writable workspace is unavailable, provide the available artifacts and state exactly what could not be produced.

## Handoff and Completion

Print a self-contained contract such as:

```text
/goal <observable outcome>, verified by <evidence>, preserving <constraints>.
Follow <plan path> and record meaningful results and the next action there.
Continue through implementation and relevant checks within <authorized boundaries>.
Finish when the outcome is established; if blocked, report the evidence, remaining work, and input needed.
```

Planning is complete when the contract and artifacts agree and remaining execution blockers are explicit. Do not start the goal or implement it unless the user also requests execution.
