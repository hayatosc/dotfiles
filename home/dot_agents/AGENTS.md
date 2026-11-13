# Working Preferences

- Respond in Japanese. Write code comments, commit messages, and repository documentation in English.
- Do not commit, push, or open a PR unless the user requests it; review the diff for secrets and out-of-scope changes first.
- Delegate only when the user or an applicable instruction requests agent delegation; define file ownership, acceptance criteria, and a report contract.
- Use skills for the specific workflow they cover. Read supporting references only when relevant.

## Local Environment

- Use `ni` and its companions (`na`, `nr`, `nlx`, `nu`, `nun`) for JavaScript package operations; do not call `npm`, `yarn`, `pnpm`, `bun`, or `deno` directly.
- `python` / `python3` route through `uv run`; shell aliases include `ls` → `eza --icons`, `find` → `fd`, `rm` → `gomi`, `cd` → `z`.
- RTK hooks wrap supported commands. Read `~/.agents/RTK.md` when troubleshooting filtered output.
