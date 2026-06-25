# AGENTS.md

## Scope
This file lists mandatory rules for all agents working in this repository.

## Chezmoi Dotfiles Management
- This system's dotfiles and configuration settings are managed by `chezmoi` in `/home/hayato/.local/share/chezmoi/`.
- If you need to modify any configuration files (e.g., settings under `~/.config/`, shell profiles, etc.), **DO NOT** edit them directly in the home directory.
- Instead, modify the source files under the repository's `home/` directory (e.g., `/home/hayato/.local/share/chezmoi/home/...`) and run `chezmoi apply` to apply the changes.

## Communication
- Respond in Japanese.

## Coding Style
- You **MUST** load and read the `coding-style` skill before writing any code. All rules regarding dependencies, design principles, and code changes have been moved there.

## Code Exploration
- When exploring or navigating a codebase (finding where something is defined, understanding how a feature works, tracing a call path), use the `code-search` skill before reading whole files.

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
