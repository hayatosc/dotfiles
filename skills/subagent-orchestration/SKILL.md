---
name: subagent-orchestration
description: Guide and rules for orchestrating and delegating tasks to subagents. Use this skill when you need to spawn, configure, manage, or communicate with subagents (e.g. coder, reviewer, explorer, deep-reviewer) via `invoke_subagent` and `send_message`, or when coordinating multi-agent workflows. Also trigger when the user says things like "do these in parallel", "run this in the background", "have another agent handle X", "split this across agents", or any request implying concurrent or delegated execution — even if they don't explicitly say "subagent".
---

# Subagent Orchestration

## When to delegate (and when not to)

Spawn a subagent only when the user or an applicable instruction explicitly asks for delegation or parallel agent work. Doing it silently on your own initiative surprises the user and can burn tokens and time on a task you could have handled directly. When in doubt, handle the task yourself.

## Spawning a subagent

Use `invoke_subagent` with a **clear, self-contained prompt** that includes all necessary context — the subagent won't have access to your conversation history. Specify the role explicitly using the name from the agent configuration file; don't rely on nicknames or task names.

### Harness-specific parameters

| Harness | Parameter | Example |
|---|---|---|
| **Antigravity** | `TypeName` | `TypeName: "self"` or `TypeName: "research"` |
| **Codex** | `agent_role` | `agent_role = "coder"` |
| **Claude Code** | `subagent_type` | `subagent_type = "reviewer"` |

### Available custom agent roles
`coder` · `reviewer` · `explorer` · `deep-reviewer`

## Communicating with running subagents

Use `send_message` with the subagent's conversation ID (returned by `invoke_subagent`) to send follow-up instructions or context.

## Waiting for results

After launching a subagent, **stop calling tools** — the system automatically wakes you when the subagent sends a message or completes. Polling with repeated `command_status` or inbox checks wastes tokens and doesn't speed anything up.
