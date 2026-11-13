# Dotfiles Repository

Configurations are managed by chezmoi with `home/` as its source root. Edit sources here, not deployed files.

- After editing configuration or skills, run `chezmoi apply --force`; inspect the pending scope first and report apply failures separately.
- Self-authored skills live in `skills/<name>/`; external dependencies are declared in `skills/apm.yml`. Do not edit `apm_modules/` or installed copies.
- More detail: `docs/agents.md`.
