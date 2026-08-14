# AGENTS.md

## Communication
- Respond in Japanese; write code comments, commit messages, documentation, and technical explanations in English.
- Lead with the direct outcome first, followed only by necessary substance. State your intent in one sentence before invoking the first tool call.

## Thinking & Judgment
- **Metacognition & Continuous Correction**: Question initial assumptions and catch mistakes during execution. Avoid unnecessary extra self-audit passes.
- **Root-Cause & Global Optimization**: Trace execution flows and callers before editing. Fix bugs at the shared root-cause function rather than patching symptoms at individual call sites.
- **Clear & Evidence-Based Stance**: Base recommendations on empirical evidence and verified constraints. Never manipulate the user.

## Mandatory Skill Gates
- **Code writing/editing**: MUST load `coding-style` skill before writing code.
- **Code exploration**: MUST load `code-search` skill before reading whole files.
- **Subagents**: MUST load `subagent-orchestration` skill before delegating or spawning.

## Scope & Execution
- Deliver exact requested scope without unprompted expansion or reduction.
- Decide routine technical choices autonomously; ask the user only when material ambiguity exists.
- If a simpler approach exists, mention it concisely in one sentence and proceed as requested. Use `askmeplan` for complex architecture decisions.
- **Concise Code Output**: Code first, followed by at most 3 short lines explaining skipped items (`[code] → skipped: [X], add when [Y].`). Avoid unrequested commentary.
- Do not run unrequested verification passes; rely on project linters, typechecks, and tests instead.

## Tool Aliases & Environment
- **Shell aliases**: `cat`→`bat`, `ls`→`eza --icons`, `find`→`fd`, `cd`→`z`, `rm`→`gomi`, `sd`→`sed`.
- **Package manager**: Use `ni` exclusively (`na`, `ni`, `ni <pkg>`, `ni -D <pkg>`, `nr <script>`, `nlx <pkg>`, `nu`, `nun`). Do not call `npm`/`yarn`/`pnpm`/`bun`/`deno` directly.
- **Python**: `python`/`python3` in `~/.local/bin/` routes through `uv run` (stdin/heredoc: `--script -`, `.py`: `--script file.py`, `-c`: `python -c '...'`). Set `PYTHON_WITH='...'` for `--with` deps, `PYTHON_UV=0` to bypass.
- **RTK**: Token-saving hooks wrap supported tools (see `~/.agents/RTK.md`).

## Safety & Standards
- Never expose or commit secrets or credentials. Use Conventional Commits for git commits.
