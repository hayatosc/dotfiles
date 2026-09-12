---
name: subagent-orchestration
description: Coordinate explicitly requested or instruction-authorized agent delegation, including file ownership, context handoff, and result integration. Ordinary background commands do not trigger this skill.
---

# Subagent Orchestration

Delegate only when the user or an applicable instruction requests agent delegation. Choose a bounded task that can run independently while you make useful progress; handle short or tightly sequential work locally.

## Handoff

Use the current harness's available agent tool and actual parameter schema. Supply:

- The outcome, relevant paths, known decisions, and acceptance criteria.
- File or responsibility ownership. Tell editing agents they share the workspace, must preserve others' edits, and should adapt to concurrent changes.
- Only the skill references relevant to the assigned task. Account for context already inherited by the agent instead of requiring every project skill again.
- Boundaries such as read-only work, no new dependencies, or no further delegation.
- A compact report contract: conclusion, changed files or `path:line` evidence, check results, and blockers.

Use configured roles where available: `coder` for implementation, `explorer` for read-only navigation, and `reviewer` for an assigned review. Use `deep-reviewer` only for an explicit user request for deep or advanced review. Preserve the configured model; an override requires a concrete stated reason.

## Harness Differences

| Capability | Required fallback |
|---|---|
| Context inheritance | Unless explicitly guaranteed, include the outcome, relevant facts, constraints, and paths in the task. Do not assume the child saw the conversation. |
| Skill preloading | Name the relevant skills and instruct the child to read missing ones; an installed skill is not necessarily loaded. |
| Custom roles or model selection | Use the configured role and model when supported. If a role is unavailable, use a general agent with the same scope and read-only/editing constraints, and report the substitution. |
| Agent tools or notifications | Use the exposed schema and completion/wait mechanism. If delegation is unavailable, finish locally when possible and report the limitation. |

Select skills from the assigned files: TypeScript → `typescript-best-practices`, Go → `golang-best-practices`, Hono → `hono-best-practices`, and the corresponding framework skill for Vue, Svelte, or MoonBit. Include `coding-style` for coding/review and `code-search` for exploration/review. Do not scan unrelated modules solely to collect skills.

## Coordination and Completion

Split by independent ownership, not arbitrary file counts. Reuse an existing agent for follow-up work that benefits from its context. Continue your independent work while agents run; use completion notifications or the harness's wait tool when their result is the next dependency.

Integrate reports against the requested outcome and existing check evidence. Resolve conflicting edits or unsupported claims before relying on them, without duplicating completed searches and checks. Send a focused follow-up when needed, or finish locally if a delegate fails.

Delegation is complete only when the assigned results are integrated and the parent task's acceptance criteria are met, or a concrete blocker is reported. Summarize the result for the user; do not assume they saw an agent's report.
