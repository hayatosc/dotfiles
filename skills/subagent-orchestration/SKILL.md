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

**Never spawn a subagent to verify or double-check your own work.** You catch and fix your own mistakes as you go; a verifier agent pays a full cold start to re-derive what you already know and mostly confirms it. The "clean, unbiased view" case above means reviewing code *someone else* wrote — a diff, a PR, an existing codebase — not auditing the output you just produced.

If one subagent can complete the task, use one rather than several. Keep spawn counts low: prefer widening a single agent's task over splitting it across agents that each pay a cold start.

## Spawning a subagent

Use `invoke_subagent` with a **clear, self-contained prompt** that includes all necessary context — the subagent won't have access to your conversation history. Specify the role explicitly using the name from the agent configuration file; don't rely on nicknames or task names.

### Prompt contract

Structure every spawn prompt as:

1. **Goal** — the deliverable, in one sentence.
2. **Required skills** — list the skill names the subagent must read before starting (see [Skill injection](#skill-injection) below).
3. **Context** — paths, decisions already made, relevant facts. Paste what the subagent needs; it cannot see your conversation.
4. **Scope limits** — what NOT to do (no drive-by fixes, no new dependencies, don't touch X).
5. **Report format** — demand a compact report: conclusions first, `path:line` evidence, deviations and open questions. Forbid raw file dumps in the report; isolating bulk output is the reason you delegated.

Phrase the job as the subagent's own work. Never forward the user's delegation phrasing ("have another agent do X") into the spawn prompt — the subagent may take it literally and try to delegate again, chaining cold starts.

### Skill injection

Subagents start cold — they don't inherit your loaded skills. Before spawning a coding or review subagent, detect the target project's tech stack and inject relevant skill references into the spawn prompt so the subagent applies the right best-practices from the start.

**Detection procedure** (run once per delegation batch, not per subagent):

1. Check for project marker files in the working directory:

   | Marker file | Skill to inject |
   |---|---|
   | `tsconfig.json` or `*.ts`/`*.tsx` | `typescript-best-practices` |
   | `go.mod` | `golang-best-practices` |
   | `*.svelte` or `svelte.config.*` | `svelte-core-bestpractices` |
   | `*.vue` or `vite.config.*` with vue plugin | `vue-best-practices` |
   | `moon.mod.json` | `moonbit-agent-guide` |
   | Hono in dependencies | `hono-best-practices` |

   This table is not exhaustive — if you know a relevant skill exists for the stack, include it even if it is not listed here.

2. Also include **task-type skills** when applicable:
   - Refactoring task → `refactoring-code`
   - Security audit → `security-audit`
   - UI/frontend work → `frontend-design`, `modern-web-guidance`

3. Always include `coding-style` for any code-writing or code-review subagent — it is the base policy that language-specific skills build on.

4. Always include `code-search` for any **review** subagent — reviewers need to trace call paths, verify that cited symbols exist, and check cross-file impact before signing off.

**How to inject**: Add a section to the spawn prompt after the Goal:

```
Required skills — read each SKILL.md before starting work:
- coding-style
- typescript-best-practices
(Skill paths are under the standard skills directory.)
```

Do **not** paste the full skill contents into the prompt — that wastes context. The subagent can read the SKILL.md files itself. Only list the skill names.

> [!TIP]
> If you are unsure whether a skill is relevant, include it. The subagent can skim a SKILL.md in a few hundred tokens — far cheaper than producing code that violates a best-practice rule and needing a re-do.

#### Reviewer-specific guidance

Reviewers benefit most from thorough skill injection — they must catch violations they didn't author.

- Include **all** tech-stack skills detected, not just the primary one. A TypeScript + Hono project should get both `typescript-best-practices` and `hono-best-practices`.
- Always add `code-search` so the reviewer can efficiently navigate unfamiliar code instead of reading whole files.
- If the review involves UI, add `web-design-guidelines` in addition to `frontend-design`.
- In the spawn prompt, instruct the reviewer to **check the code against each injected skill's rules** and cite the specific rule when flagging a violation. A review that says "this looks wrong" without a concrete reference is not actionable.

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
| **OpenCode** | `subagent_type` | `subagent_type: "explorer"` or `subagent_type: "coder"` |

### Model selection

**Do not pass a `model` override.** Each custom role already declares the model it should run on in its agent configuration file, chosen deliberately for that role's job. Passing `model` silently replaces that choice for every agent in the batch, and a batch of role agents forced onto the top-tier model is the single largest avoidable cost in a delegated workflow — especially when the user asked you to keep cost down.

Override only when you have a concrete, stated reason this specific task exceeds the role's configured tier, and say so in one line when you spawn. "This is important work" is not such a reason; escalating a review is what the `deep-reviewer` role is for.

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
