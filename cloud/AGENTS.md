## Cloud Session

- This is a disposable cloud session, not the workstation. Workstation aliases, wrappers, and hooks are absent; use the tools actually installed.
- `rtk` is installed. Repositories cloned before setup get rtk rewrite hooks in `.claude/settings.local.json` and `.codex/hooks.json`; Codex runs its hook only after the project and hook are trusted. Elsewhere, or when output is not compacted, prefix output-heavy commands yourself, such as `rtk git status`, `rtk git diff`, `rtk grep`, `rtk find`, or `rtk test <command>`. Use `rtk proxy <command>` when the full raw output matters. If `rtk` is not on `PATH`, call `~/.local/bin/rtk`. Read `~/.agents/RTK.md` when troubleshooting filtered output.
- Skills provide instructions; their other optional CLI dependencies are not installed by the cloud bootstrap.
- Follow the current repository's instructions and the session's branch, commit, and publishing rules. Skills such as `before-commit` do not authorize publishing by themselves.
