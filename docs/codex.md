# Codex config

Shared Codex settings are managed in [home/dot_codex/private_config.toml.tmpl](/home/hayato/.local/share/chezmoi/home/dot_codex/private_config.toml.tmpl).

Machine-local trusted project paths should be placed in [home/.chezmoidata/codex.local.toml](/home/hayato/.local/share/chezmoi/home/.chezmoidata/codex.local.toml), which is gitignored.

zsh では `chezmoi re-add` 成功後に `~/.config/zsh/scripts/codex-sync-config.ts` が走り、`~/.codex/config.toml` を `chezmoi` source へ同期します。

`private_config.toml.tmpl` は `projects.*` 以外の差分が出た時だけ更新されます。

`codex.local.toml` には `projects.*` を raw TOML 文字列として保持します。将来 `trust_level` 以外の project 配下キーが増えても、そのまま残せます。

`projects.*` が live config の途中にあっても、source 側では末尾ブロックへ正規化されます。

`chezmoi add ~/.codex/config.toml` は template/private 属性を壊すので使わず、`chezmoi re-add` を使います。

## Example

```toml
codex.projects_toml = '''
[projects."/home/hayato/.local/share/chezmoi"]
trust_level = "trusted"

[projects."/home/hayato/rust-projects/rectangles"]
trust_level = "trusted"
'''
```
