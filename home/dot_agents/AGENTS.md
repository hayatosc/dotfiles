# AGENTS.md

## Scope
This file lists mandatory rules for all agents working in this repository.

## Communication
- Respond in Japanese.

## Dependencies
- Research required libraries before implementation.
- Prefer the standard library; minimize external dependencies.

## Design
- Follow SOLID and DRY principles.
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

## Code Changes
- Touch only what the task requires; don't improve adjacent code or formatting.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.
- Remove only imports/variables/functions that YOUR changes made unused.

## Safety
- Do not expose or commit secrets or credentials.

## Git
- Follow Conventional Commits for all git commit messages.
