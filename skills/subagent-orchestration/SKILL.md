---
name: subagent-orchestration
description: Guide and rules for orchestrating and delegating tasks to subagents efficiently. Use this skill when you need to spawn, configure, manage, or communicate with subagents (e.g. coder, reviewer, explorer, deep-reviewer) via `invoke_subagent` and `send_message`, when coordinating multi-agent workflows, or when deciding whether delegation pays off at all (context economy, parallel dispatch, report contracts). Also trigger when the user says things like "do these in parallel", "run this in the background", "have another agent handle X", "split this across agents", or any request implying concurrent or delegated execution — even if they don't explicitly say "subagent".
---

# Subagent Orchestration

## When to delegate (and when not to)

Spawn a subagent only when the user or an applicable instruction explicitly asks for delegation or parallel agent work. Doing it silently on your own initiative surprises the user and can burn tokens and time on a task you could have handled directly. When in doubt, handle the task yourself.

Every subagent starts cold and must re-derive context you already have — that fixed cost is the unit of account. Once delegation is on the table, it pays off when:

- the work produces **bulky intermediate output** (wide searches, long logs, test runs) and you only need the conclusion — the dumps stay out of your context
- **independent tasks can run in parallel**
- the task benefits from a **clean, unbiased view** (review, evaluation) — there, your accumulated context is a liability, not an asset

It does not pay off for tasks worth only a few tool calls, for work whose entire output you would have to read anyway, or for sequential steps that each depend on your judgment between steps.

## Spawning a subagent

Use `invoke_subagent` with a **clear, self-contained prompt** that includes all necessary context — the subagent won't have access to your conversation history. Specify the role explicitly using the name from the agent configuration file; don't rely on nicknames or task names.

### Prompt contract

Structure every spawn prompt as:

1. **Goal** — the deliverable, in one sentence.
2. **Context** — paths, decisions already made, relevant facts. Paste what the subagent needs; it cannot see your conversation.
3. **Scope limits** — what NOT to do (no drive-by fixes, no new dependencies, don't touch X).
4. **Report format** — demand a compact report: conclusions first, `path:line` evidence, deviations and open questions. Forbid raw file dumps in the report; isolating bulk output is the reason you delegated.

Phrase the job as the subagent's own work. Never forward the user's delegation phrasing ("have another agent do X") into the spawn prompt — the subagent may take it literally and try to delegate again, chaining cold starts.

### Parallel dispatch

- Launch independent subagents **in a single message** (multiple tool calls in one turn), not one-by-one across turns.
- Split work by **independence, not by size**: two tasks that share files or decisions belong to one agent, or must run serially.
- Don't over-shard. N tiny agents each paying cold-start cost lose to one agent doing N related things.

### Harness-specific parameters

| Harness | Parameter | Example |
|---|---|---|
| **Antigravity** | `TypeName` | `TypeName: "self"` or `TypeName: "research"` |
| **Codex** | `agent_role` | `agent_role = "coder"` |
| **Claude Code** | `subagent_type` | `subagent_type = "reviewer"` |
| **OpenCode** | `subagent_type` | `subagent_type: "@explorer"` or `subagent_type: "@coder"` |

> [!IMPORTANT]
> When spawning a subagent in **OpenCode**, you must prefix the agent name with `@` (e.g., `@explorer`, `@coder`) in the `subagent_type` parameter. Omitting the `@` prefix will result in an "Unknown agent type" error.

### Available custom agent roles
`coder` · `reviewer` · `explorer` · `deep-reviewer`

These roles exist only where the harness's agent configuration defines them. If the harness is not in the table above, or it rejects the role name (e.g. "unknown agent type"), fall back to the harness's default/general agent type and note the substitution in your report — do not retry the same rejected role.

## Communicating with running subagents

Use `send_message` with the subagent's conversation ID (returned by `invoke_subagent`) to send follow-up instructions or context.

Prefer continuing an existing subagent over spawning a fresh one when the follow-up builds on its accumulated context (it already paid the warm-up cost). Spawn fresh only when you need an unbiased read — e.g. re-reviewing something the previous agent produced.

## Waiting for results

After launching a subagent, **stop calling tools** — the system automatically wakes you when the subagent sends a message or completes. Polling with repeated `command_status` or inbox checks wastes tokens and doesn't speed anything up.

## Integrating results

- Treat reports as claims, not facts: spot-check the load-bearing ones (the file compiles, the test passes, the cited line exists) before building on them.
- Relay what matters to the user — a subagent's final message is not shown to them.
- If a report is insufficient, send a follow-up message to that subagent instead of re-deriving the work yourself; if it is wrong, say so in the follow-up and have it fix its own output.
- If a subagent fails outright (or returns nothing usable) and the remaining work is small, do it directly and note the fallback in your report. Never return to the user empty-handed because a delegate failed.
