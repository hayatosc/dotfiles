# AGENTS.md

## Scope
This file lists mandatory rules for all agents working in this repository.

## Chezmoi Dotfiles Management
- This system's dotfiles and configuration settings are managed by `chezmoi` in `/home/hayato/.local/share/chezmoi/`.
- If you need to modify any configuration files (e.g., settings under `~/.config/`, shell profiles, etc.), **DO NOT** edit them directly in the home directory.
- Instead, modify the source files under the repository's `home/` directory (e.g., `/home/hayato/.local/share/chezmoi/home/...`) and run `chezmoi apply` to apply the changes.

## Communication
- Respond in Japanese.

## Dependencies
- Research required libraries before implementation.
- Prefer the standard library; minimize external dependencies.

## Design
- Follow SOLID, DRY, KISS and YAGNI principles.
- Before writing any new function, type, or utility, search the existing codebase for similar implementations. Reuse them via import / source / require. Do not re-implement.
- No features beyond what was asked; no speculative abstractions or configurability.
- No error handling for impossible or internal-only scenarios.
- If a solution is 200 lines but could be 50, rewrite it.

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
  - for codex, rtk does not support codex hook yet, so you should mannualy use rtk command.

## Code Changes
- Touch only what the task requires; don't improve adjacent code or formatting.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.
- Remove only imports/variables/functions that YOUR changes made unused.
- Don’t fight errors! Whenever you encounter the same error twice, research the web and find 3-5 possible ways to fix it. Then choose the most efficient solution and implement it

## Safety
- Do not expose or commit secrets or credentials.

## Git
- Follow Conventional Commits for all git commit messages.
