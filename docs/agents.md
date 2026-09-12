# Agent Prompts and Skills

## Source Ownership

| Surface | Source | Use |
|---|---|---|
| Repository instructions | `AGENTS.md` | Edit locations and chezmoi deployment |
| Shared preferences | `home/dot_agents/AGENTS.md` | Language, local tools, authorization, and completion |
| Agent role prompts and descriptions | `home/.chezmoitemplates/agent_*` | Shared by Codex, Claude Code, and OpenCode wrappers |
| Harness role configuration | `home/dot_codex/agents/`, `home/dot_claude/agents/`, `home/dot_config/opencode/agents/` | Models, effort, and tool permissions |
| Self-authored skills | `skills/<name>/SKILL.md` | Task-specific routing and completion contracts |
| Supporting knowledge | `skills/<name>/references/` and `assets/` | Examples and details loaded for the selected task |
| External skills | `skills/apm.yml` and `skills/apm.lock.yaml` | APM dependencies; installed copies are not source files |

Chezmoi's `symlink_*` templates link `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`, and `~/.gemini/GEMINI.md` to `~/.agents/AGENTS.md`. The corresponding skill links point to `~/.agents/skills/`.

## Deployment

`home/` is chezmoi's source root; `skills/` is outside it. After source edits, inspect `chezmoi status` and run `chezmoi apply --force`. If unrelated destination drift exists, pass the affected target paths to apply rather than overwriting it.

[The APM script](../home/.chezmoiscripts/run_onchange_after_apm-install.sh.tmpl) reruns when the skill sources or manifest change. It stages local skills with temporary symlinks under `skills/.apm/skills/`, runs `apm install --target agent-skills` into `skills/.agents/skills/`, syncs the result to `~/.agents/skills/`, and removes staging directories. Self-authored skills live directly under `skills/`, not in those temporary directories.

## Maintaining Prompts

Use [OpenAI's skill and prompt guidance](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra) as the rationale for concise routing and task-specific detail. Preserve guidance useful to the other configured models as well.

- Keep shared instructions about this environment; place domain examples in the relevant skill.
- Descriptions identify the work that needs a skill. Avoid keyword lists that activate it for unrelated tasks.
- State the required outcome, evidence, and real authorization boundary. Let the agent choose routine steps.
- Use relevant existing checks; do not require extra reviews or repeated passing tests for every edit.

### Cross-Model Baseline

Keep the short inspect → implement → check → report workflow explicit in shared instructions. Preserve role-specific skill loading and essential domain rules in entrypoints; move lengthy examples and specialized procedures into references. Short descriptions should still activate a language skill for implementation, not only after a model recognizes a difficult design problem.

Claude role files preload their baseline skills. The shared role prompts request the same skills when another harness does not preload them, without rereading contents already in context. Delegation instructions cover missing inheritance, skill discovery, and unsupported roles using the available tool schema.

The optimization target is consistent task completion across the configured models, not the shortest prompt. Preserve required steps and output evidence while removing duplicate prose, unrelated reading, and repeated passing checks. Rendering validation checks configuration consistency; behavioral parity requires representative runs on each model and is not established by file-size reduction.

For a task prompt, supply the outcome, affected scope, constraints, and completion evidence. For example:

```text
Update the shared reviewer prompt so findings include a triggering scenario and file reference.
Preserve model and permission settings. Render the affected harness templates and apply the changes through chezmoi.
Finish when the intended prompts are deployed; report any rendering or deployment blocker.
```

Shorter prompts and valid templates do not by themselves prove better model behavior. Compare representative real tasks before adding new global rules in response to a failure.

## RTK

RTK hooks filter supported command output. Use `rtk gain` for usage information or `rtk proxy <command>` when unfiltered output is needed. See [the local RTK reference](../home/dot_agents/private_RTK.md) for hook troubleshooting.
