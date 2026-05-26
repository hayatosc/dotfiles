# AGENTS.md

Welcome! This file provides an overview of this repository for AI agents to help you navigate and modify configurations correctly.

## Repository Overview

This repository contains the **dotfiles** for user `hayato`, managed using **chezmoi**.

### Directory Structure

- `home/`: The source directory representing the user's home folder (`/home/hayato`). Chezmoi templates and files are defined here:
  - `home/dot_config/` -> `~/.config/` (contains configs for `yazi`, `zsh`, `cage`, `sheldon`, `starship.toml`, `mise`, `tmux`, `micro`, `opencode`)
  - `home/dot_zshrc`, `home/dot_zshenv`, `home/dot_zprofile`, `home/dot_profile` -> Zsh / shell configurations
  - `home/dot_agents/` -> `~/.agents/` (cross-harness agent rules only; skills are managed separately under `skills/`)
  - `home/dot_claude/` -> `~/.claude/` (Claude-specific configurations)
  - `home/dot_gemini/` -> `~/.gemini/` (Gemini-specific configurations)
  - `home/dot_codex/` -> `~/.codex/` (Codex-specific configurations)
  - `home/dot_gitconfig` -> `~/.gitconfig`
  - `home/.chezmoidata/` -> Chezmoi data variables (e.g. `codex.local.toml`)
  - `home/.chezmoiscripts/` -> One-time or run-on-change scripts executed by chezmoi (e.g., package installation, symlinking)
  - `home/.chezmoitemplates/` -> Templates reused across chezmoi configurations
- `skills/`: Microsoft APM project root for agent skills (not deployed by chezmoi). `apm.yml` declares external skill dependencies; `.apm/skills/` holds self-authored skills. `chezmoi apply` triggers `apm install` via `home/.chezmoiscripts/run_onchange_after_apm-install.sh.tmpl`, which symlinks `skills/.agents` -> `~/.agents` so deploys land in `~/.agents/skills/` (cross-harness via existing symlinks).
- `docs/`: Repository documentation (e.g., `docs/codex.md` for Codex configuration).
- `scripts/`: Custom scripts used within the repository.
- `pyproject.toml`, `uv.lock`: Python environment definition managed by `uv`.

---

## IMPORTANT: How to Modify Configuration Settings

> [!IMPORTANT]
> **Never modify files directly in the user's active home directory (`/home/hayato/...` or `~/...`).**
> All configuration files are managed by Chezmoi.
> 
> To update any configuration, you **MUST**:
> 1. Edit the source template or file inside the repository's `home/` directory (e.g., `/home/hayato/.local/share/chezmoi/home/...`).
> 2. Run the command `chezmoi apply` to apply the changes to the user's home directory.
> 
> Failing to do so will result in your changes being overwritten the next time `chezmoi apply` is run.

---

## Tooling & Guidelines

- **Package Managers**: Prefer using `ni` (e.g., `ni`, `na`, `nr`, `nlx`) rather than calling package managers (npm, pnpm, yarn, bun) directly.
- **Python Execution**: `python` and `python3` in `~/.local/bin` are wrapper scripts routing through `uv run`. See `home/dot_agents/AGENTS.md` for details.
- **Rules of Conduct**: For coding standards, communication preferences, and safety guidelines, refer to [home/dot_agents/AGENTS.md](file:///home/hayato/.local/share/chezmoi/home/dot_agents/AGENTS.md).
