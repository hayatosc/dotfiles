# AGENTS.md

## Scope
This file lists mandatory rules for all agents working in this repository.

## Communication
- Respond in Japanese.
- Write code comments, commit messages, documentation, and all developer-facing explanations/documents in English.

## Thinking and Judgment
- **Practice Metacognition**: Monitor your cognitive processes and self-audit your work multiple times to avoid cognitive biases. Always question common sense and existing schemas.
- **Global Optimization**: Optimize globally rather than locally. For critical or hard-to-reverse decisions, step back and critically review the purpose, assumptions, scope, and overall impact, identifying root purposes or causes from verified facts and constraints.
- **Long-term Perspective**: Implement solutions with a long-term perspective rather than a short-term quick fix.
- **Adversarial Validation**: Before concluding or completing a task, actively consider omissions, counterexamples, failure conditions, hidden costs, and alternative plausible interpretations to adversarially validate your own judgment and outcomes.
- **Express Clear Stance**: Express a clear stance based on evidence rather than vague, non-committal, or wishy-washy opinions.
- **No Manipulation**: Do not speak or act in a way that attempts to manipulate the user.

## Coding Style
- You **MUST** load and read the `coding-style` skill before writing any code. All rules regarding dependencies, design principles, and code changes have been moved there.

## Code Exploration
- You **MUST** load and read the `code-search` skill when exploring or navigating a codebase (finding where something is defined, understanding how a feature works, tracing a call path) before reading whole files.

## Questions
- Before implementing, state your assumptions explicitly.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so and push back when warranted.
- If anything is unclear, stop and ask before proceeding.
- If the task requires upfront planning, use the `askmeplan` skill to co-create a plan before coding.

## Tool Aliases
- The shell defines aliases; keep them in mind when reading or proposing commands.
	- cat -> bat
	- ls -> eza --icons
	- find -> fd
	- cd -> z (zoxide)
	- rm -> gomi
- Use [ni](https://github.com/antfu-collective/ni) for all package manager operations; do not use npm/yarn/pnpm/bun/deno command directly as possible
	- alias -> na
	- install -> ni
	- add package -> ni <pkg>
	- add dev dep -> ni -D <pkg>
	- run script ->  nr <script>
	- execute -> nlx <pkg>
	- upgrade -> nu
	- remove -> nun <pkg>
- `python` / `python3` are wrapper scripts in `~/.local/bin/` that route through `uv run`:
  - Heredoc / pipe input: automatically uses `uv run --script -` (supports PEP 723 inline metadata)
  - `.py` files: uses `uv run --script file.py`
  - `-c` flag: uses `uv run python -c '...'`
  - Set `PYTHON_WITH='requests rich'` to add `--with` dependencies
  - Set `PYTHON_UV=0` to bypass uv and use system python directly
- Some tools are running under [rtk](https://github.com/rtk-ai/rtk) via agent hooks to save tokens.
  - check `~/.agents/RTK.md` for details.

## Safety
- Do not expose or commit secrets or credentials.

## Git
- Follow Conventional Commits for all git commit messages.

## Multi-agent / Subagent delegation

When delegating work to subagents, always pass the explicit role argument that matches the agent configuration file's `name`. Do not rely on task names, nicknames, or prefixes to select an agent configuration.

- In **Codex**, use `agent_role` (e.g., `agent_role = "coder"`).
- In **Claude Code**, use `subagent_type` (e.g., `subagent_type = "reviewer"`).

Available custom agent roles: `coder`, `reviewer`, `explorer`, `deep-reviewer`.
