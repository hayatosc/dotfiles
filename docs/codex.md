# Codex config

Shared Codex settings are managed in [home/dot_codex/private_config.toml.tmpl](/home/hayato/.local/share/chezmoi/home/dot_codex/private_config.toml.tmpl).

Shared default values live in [home/.chezmoidata/codex.toml](/home/hayato/.local/share/chezmoi/home/.chezmoidata/codex.toml).

Machine-local trusted project paths should be placed in [home/.chezmoidata/codex.local.toml](/home/hayato/.local/share/chezmoi/home/.chezmoidata/codex.local.toml), which is gitignored.

`chezmoi` merges both data files and renders them into `~/.codex/config.toml`.

## Example

```toml
[codex.trusted_projects]
"/home/hayato/.local/share/chezmoi" = "trusted"
"/home/hayato/rust-projects/rectangles" = "trusted"
```
