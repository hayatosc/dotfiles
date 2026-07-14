---
name: subagent-orchestration
description: Guide and rules for orchestrating and delegating tasks to subagents. Use this skill when you need to spawn, configure, manage, or communicate with subagents (e.g. coder, reviewer, explorer, deep-reviewer) via `invoke_subagent` and `send_message`, or when coordinating multi-agent workflows.
---

# Subagent Orchestration

This skill defines the rules and protocols for spawning, managing, and delegating tasks to subagents.

## Rule of Engagement
When delegating work to subagents, follow these instructions strictly:

- **Explicit Delegation Only**: Do NOT spawn subagents unless the user or an applicable instruction explicitly asks for delegation or parallel agent work. If there is no explicit instruction to use a subagent, handle the task yourself.
- **Explicit Role Arguments**: Always pass the explicit role argument that matches the agent configuration file's `name`. Do not rely on task names, nicknames, or prefixes to select an agent configuration.

### Harness-Specific Parameters
- In **Codex**, use the `agent_role` parameter (e.g., `agent_role = "coder"`).
- In **Claude Code**, use the `subagent_type` parameter (e.g., `subagent_type = "reviewer"`).

### Available Custom Agent Roles
- `coder`
- `reviewer`
- `explorer`
- `deep-reviewer`

## Workflow and Communication
- Use `invoke_subagent` to spawn a subagent with a clear, actionable prompt containing all necessary context and constraints.
- Communicate with active subagents using `send_message` with their conversation ID.
- Avoid polling command status or inbox in a loop; the system automatically notifies you when a subagent finishes or sends a message. Call no more tools to yield execution while waiting.
