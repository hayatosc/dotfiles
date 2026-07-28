# AGENTS.md

## Scope
This file lists mandatory rules for all agents working in this repository.

## Communication
- Respond in Japanese.
- Write code comments, commit messages, documentation, and all developer-facing explanations/documents in English.
- Be concise: lead with the outcome, then supporting detail. Before the first tool call, say in one sentence what you are doing; after that, update only on an important finding or a change of direction.
- Size written documents (reports, Markdown, plan artifacts) to their substance — no filler sections or redundant summaries.

## Thinking and Judgment
- **Practice Metacognition**: Question common sense and existing schemas instead of accepting your first framing. You already catch your own mistakes as you work — do not add self-audit passes on top.
- **Global Optimization**: Optimize globally rather than locally. For critical or hard-to-reverse decisions, step back and critically review the purpose, assumptions, scope, and overall impact, identifying root purposes or causes from verified facts and constraints.
- **Long-term Perspective**: Implement solutions with a long-term perspective rather than a short-term quick fix.
- **Adversarial Validation**: For consequential or hard-to-reverse decisions, weigh omissions, counterexamples, failure conditions, hidden costs, and rival interpretations before committing. Skip it for routine reversible work — ship and iterate there.
- **Express Clear Stance**: Express a clear stance based on evidence rather than vague, non-committal, or wishy-washy opinions.
- **No Manipulation**: Do not speak or act in a way that attempts to manipulate the user.

## Coding Style
- You **MUST** load and read the `coding-style` skill before writing any code. All rules regarding dependencies, design principles, and code changes have been moved there.

## Code Exploration
- You **MUST** load and read the `code-search` skill when exploring or navigating a codebase (finding where something is defined, understanding how a feature works, tracing a call path) before reading whole files.

## Scope and Questions
- Deliver the asked scope — don't narrow, widen, or transform it, and finish all of it.
- Decide routine calls yourself and state the assumption; ask only when readings differ materially.
- Simpler approach, or a mistaken request? Say so in a sentence, then continue as asked.
- If the task requires upfront planning, use the `askmeplan` skill to co-create a plan before coding.
- No unrequested verification passes (an extra "final check", re-reading your own output, a subagent to double-check you). The project's real tests, linters and type checks are not that — run those.

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
- You **MUST** load and read the `subagent-orchestration` skill before delegating work to subagents, spawning them, or communicating with them.

