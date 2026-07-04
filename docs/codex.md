# Codex config

Shared Codex settings are managed in [home/dot_codex/private_config.toml.tmpl](file:///home/hayato/.local/share/chezmoi/home/dot_codex/private_config.toml.tmpl).

> [!IMPORTANT]
> **Do not edit `~/.codex/config.toml` directly for shared settings.**
> Always edit the template inside the repository at [home/dot_codex/private_config.toml.tmpl](file:///home/hayato/.local/share/chezmoi/home/dot_codex/private_config.toml.tmpl) and run `chezmoi apply` to deploy changes.

Machine-local seed data lives in [home/.chezmoidata/codex.local.toml](/home/hayato/.local/share/chezmoi/home/.chezmoidata/codex.local.toml), which is gitignored. A fresh environment can omit this file entirely.

`private_config.toml.tmpl` never contains `projects.*` or `hooks.*` data itself. Every `chezmoi apply` parses the live `~/.codex/config.toml` with chezmoi's built-in `fromToml`, merges it with the hand-written shared settings via `mergeOverwrite` (shared settings win, everything else — trusted projects, hook approval hashes — passes through untouched), and re-serializes with `toToml`. If the live file doesn't exist yet (fresh machine), `codex.local.toml` is parsed the same way as a seed.

Because the merge always reads from the live file directly, the template source is stable and hand-edited only — `chezmoi apply` never rewrites it.

In zsh, a successful `chezmoi re-add` automatically runs `~/.config/zsh/scripts/codex-sync-config.ts`, which regenerates `codex.local.toml` from the current `~/.codex/config.toml` (via `chezmoi execute-template` with `pick ... "projects" "hooks" | toToml`), so a wiped machine can bootstrap from the last known trusted projects and hook approvals.

Do not use `chezmoi add ~/.codex/config.toml`, because it will discard the template/private attributes. Use `chezmoi re-add` instead.

Note: because `toToml` sorts keys alphabetically and indents nested tables, `~/.codex/config.toml` will look reformatted after the first `apply` under this scheme. This is cosmetic only — TOML key order isn't semantic, and Codex CLI rewrites the file in its own style whenever it saves a trust/hook decision anyway.

## Example

`codex.local.toml` is plain TOML — the same shape as the relevant subset of the live config:

```toml
[projects."/home/hayato/.local/share/chezmoi"]
trust_level = "trusted"

[projects."/home/hayato/rust-projects/rectangles"]
trust_level = "trusted"

[hooks.state."~/.codex/hooks.json:pre_tool_use:0:0"]
trusted_hash = "sha256:..."
```
