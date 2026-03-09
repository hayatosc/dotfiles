# Codex config

Shared Codex settings are managed in [home/dot_codex/private_config.toml.tmpl](/home/hayato/.local/share/chezmoi/home/dot_codex/private_config.toml.tmpl).

Machine-local trusted project paths can be placed in [home/.chezmoidata/codex.local.toml](/home/hayato/.local/share/chezmoi/home/.chezmoidata/codex.local.toml), which is gitignored. A fresh environment can omit this file entirely.

In zsh, a successful `chezmoi re-add` automatically runs `~/.config/zsh/scripts/codex-sync-config.ts` to sync `~/.codex/config.toml` back into the `chezmoi` source state.

`private_config.toml.tmpl` is updated only when non-`projects.*` content changes.

`codex.local.toml` stores `projects.*` as raw TOML text, so future keys under each project can be preserved as-is, not just `trust_level`.

Even if `projects.*` appears in the middle of the live config, it is normalized into a trailing block in the source template.

Do not use `chezmoi add ~/.codex/config.toml`, because it will discard the template/private attributes. Use `chezmoi re-add` instead.

## Example

```toml
codex.projects_toml = '''
[projects."/home/hayato/.local/share/chezmoi"]
trust_level = "trusted"

[projects."/home/hayato/rust-projects/rectangles"]
trust_level = "trusted"
'''
```
