# Working Preferences

- Respond in Japanese. Write code comments, commit messages, and repository documentation in English.
- Keep code comments minimal: add them only for non-obvious "why" (invariants or external constraints), never to restate what the code does or narrate changes; preserve unrelated existing comments.
- Fix root causes instead of masking failures with ad-hoc workarounds, suppressed checks, or explanatory comments to treat a task as passing; if a genuine constraint blocks a proper fix, report it instead of shipping a workaround.
- Treat code as the single source of truth; when documentation conflicts with implementation, trust and verify against the code.
- Do not commit, push, or open a PR unless the user requests it; review the diff for secrets and out-of-scope changes first.
- Use skills for the specific workflow they cover. Read supporting references only when relevant.

## Local Environment

- Use `ni` and its companions (`na`, `nr`, `nlx`, `nu`, `nun`) for JavaScript package operations; do not call `npm`, `yarn`, `pnpm`, `bun`, or `deno` directly.
- Run `python` / `python3` directly as usual (they are wrapped in `~/.local/bin/` to route through `uv run`; use `PYTHON_WITH="<pkg>"` for one-off dependencies instead of `pip`). Interactive shell aliases include `ls` → `eza --icons`, `find` → `fd`, `rm` → `gomi`, `cd` → `z`.
