# Working Preferences

- Respond in Japanese. Write code comments, commit messages, and repository documentation in English unless the requested artifact calls for another language.
- Lead with the outcome. Before the first tool call, state the intended action in one sentence; keep updates focused on findings and decisions. For repository edits, report changed files and relevant check results instead of pasting the diff.
- Complete the requested outcome, including necessary implementation, relevant project checks, and fixes for failures caused by the change. Continue through routine, reversible local steps without asking again. Stop when the outcome is met or a concrete blocker prevents further progress.
- Resolve routine choices from the repository and session context. Ask only when a missing decision materially changes the result or an action exceeds the user's authorization; continue independent work meanwhile.
- Use skills for the specific workflow they cover. Read supporting references only when relevant; a small edit does not require a stack of skills or a repository-wide survey. Use `goalplan` only for an explicit `/goal` planning request.
- Delegate only when the user or an applicable instruction requests agent delegation. In that case, use `subagent-orchestration` for ownership and handoff conventions.
- Preserve unrelated work, security controls, and secrets. Use Conventional Commits when a commit is requested.

## Shared Execution Baseline

Apply this baseline across models and harnesses; do not assume a particular model supplies missing steps automatically.

1. Establish the requested outcome and constraints from the conversation. Inspect the affected files and relevant callers before changing behavior; a mechanical edit needs only local context.
2. For implementation or code review, load `coding-style` once unless already available in context. Load the relevant language/framework skill for the code being changed. For unfamiliar execution paths, use `code-search`; do not load every skill detected in the repository.
3. Implement within scope, preserving unrelated work and security controls. Resolve routine choices locally; identify a specific missing decision before asking the user.
4. Run the relevant project checks, fix failures caused by the change, and rerun affected checks. Do not repeat passing checks without changes or new evidence. If a check cannot run, record the reason and the unverified behavior.
5. Report the outcome, changed file references, check results, and remaining blockers. A first draft or delegated report is not completion when implementation or verification remains.

Use the tools actually exposed by the harness, not assumed tool names. If skill discovery is unavailable, look under `~/.agents/skills/<name>/SKILL.md`; report a missing required resource instead of claiming it was used. If context has not been explicitly inherited, pass the outcome, constraints, and relevant skill paths in the handoff.

## Local Environment

- Shell aliases: `cat` → `bat`, `ls` → `eza --icons`, `find` → `fd`, `cd` → `z`, `rm` → `gomi`, `sd` → `sed`.
- Use `ni` and its companion commands (`na`, `nr`, `nlx`, `nu`, `nun`) for JavaScript package operations. Do not call `npm`, `yarn`, `pnpm`, `bun`, or `deno` directly.
- `python` / `python3` in `~/.local/bin/` route through `uv run`: stdin uses `--script -`, files use `--script file.py`, and inline code uses `python -c '...'`. Set `PYTHON_WITH='...'` for dependencies or `PYTHON_UV=0` to bypass the wrapper.
- RTK hooks wrap supported commands. Read `~/.agents/RTK.md` when troubleshooting filtered output or hook behavior.
