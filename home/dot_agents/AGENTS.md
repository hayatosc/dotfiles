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

## Questions
- If anything is unclear, ask the user before proceeding.

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

## Safety
- Do not expose or commit secrets or credentials.
