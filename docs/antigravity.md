# Antigravity config

Antigravity settings are managed in [home/dot_gemini/antigravity-cli/private_settings.json.tmpl](file:///home/hayato/.local/share/chezmoi/home/dot_gemini/antigravity-cli/private_settings.json.tmpl).

> [!IMPORTANT]
> **Do not edit `~/.gemini/antigravity-cli/settings.json` directly for shared settings.**
> Always edit the template inside the repository at [home/dot_gemini/antigravity-cli/private_settings.json.tmpl](file:///home/hayato/.local/share/chezmoi/home/dot_gemini/antigravity-cli/private_settings.json.tmpl) and run `chezmoi apply` to deploy changes.

Machine-local trusted workspaces can be placed in [home/.chezmoidata/gemini.local.toml](/home/hayato/.local/share/chezmoi/home/.chezmoidata/gemini.local.toml), which is gitignored. A fresh environment can omit this file entirely.

In zsh, a successful `chezmoi re-add` automatically runs `~/.config/zsh/scripts/antigravity-sync-config.ts` to sync `~/.gemini/antigravity-cli/settings.json` back into the `chezmoi` source state.

`private_settings.json.tmpl` is updated only when non-`trustedWorkspaces` content changes.

`gemini.local.toml` stores `gemini.trusted_workspaces` as a list of strings.

When `~/.gemini/antigravity-cli/settings.json` already exists, `chezmoi apply` reads its current `trustedWorkspaces` block at render time so local workspace entries are preserved instead of being reverted.

Do not use `chezmoi add ~/.gemini/antigravity-cli/settings.json`, because it will discard the template/private attributes. Use `chezmoi re-add` instead.

## Example

```toml
[gemini]
trusted_workspaces = [
  "/home/hayato",
  "/home/hayato/.local/share/chezmoi"
]
```
