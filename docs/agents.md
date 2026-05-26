# AI Agents Environment

This repository features integrated support and rules for AI coding agents (such as Gemini, Claude Code, and Codex) to work efficiently and preserve system safety.

## 1. Rules & Guidelines (`AGENTS.md`)

- **Root `AGENTS.md`**: Provides an overview of the dotfiles repository and explains how to modify configuration files (i.e. edit files under `home/` and run `chezmoi apply`).
- **`home/dot_agents/AGENTS.md`**: Provides general guidelines, tool aliases, and programming standards. This file is deployed to `~/.agents/AGENTS.md` and symlinked to client configurations:
  - `~/.claude/CLAUDE.md`
  - `~/.codex/AGENTS.md`
  - `~/.gemini/GEMINI.md`

The deployment is managed automatically via the chezmoi script:
[home/.chezmoiscripts/run_once_symlink-agents.sh.tmpl](file:///home/hayato/.local/share/chezmoi/home/.chezmoiscripts/run_once_symlink-agents.sh.tmpl)

---

## 2. RTK (Rust Token Killer)

Commands executed by AI agents are automatically optimized using [rtk](https://github.com/rtk-ai/rtk) to reduce token usage by 60-90%.

### Meta Commands
- `rtk gain`: Show token savings analytics.
- `rtk gain --history`: Show command usage history with token savings.
- `rtk discover`: Analyze history for missed optimization opportunities.
- `rtk proxy <cmd>`: Run commands directly without filtering (useful for debugging).

### Hooks
For agents like Gemini, hooks automatically intercept calls. The hook scripts are located under `home/dot_gemini/hooks/` and execute `rtk hook gemini`.

For more details, see [home/dot_agents/private_RTK.md](file:///home/hayato/.local/share/chezmoi/home/dot_agents/private_RTK.md).

---

## 3. Agent Skills (managed by APM)

Agent skills are managed under [skills/](file:///home/hayato/.local/share/chezmoi/skills/) at the chezmoi repository root, using [Microsoft APM](https://github.com/microsoft/apm) (Agent Package Manager). This directory is **outside** chezmoi's source root (`.chezmoiroot=home`), so it is not deployed by `chezmoi apply` as files — instead, an `apm install` run during apply populates the actual deploy target.

- `skills/apm.yml` / `skills/apm.lock.yaml`: dependency manifest for external skills.
- `skills/.apm/skills/`: self-authored skills.
- `skills/.agents`: symlink to `~/.agents` (gitignored), created by the chezmoi script below so that APM's `agent-skills` target deploys to `~/.agents/skills/`.

Deployment flow:

1. `chezmoi apply` runs [home/.chezmoiscripts/run_onchange_after_apm-install.sh.tmpl](file:///home/hayato/.local/share/chezmoi/home/.chezmoiscripts/run_onchange_after_apm-install.sh.tmpl) when `apm.yml` or `.apm/skills/` changes.
2. The script ensures the `skills/.agents -> ~/.agents` symlink exists, then runs `apm install --target agent-skills` from `skills/`.
3. APM deploys all skills (self-authored + external dependencies) to `~/.agents/skills/`.
4. Each harness reads via the symlinks set up by `run_once_symlink-agents.sh.tmpl`: `~/.claude/skills`, `~/.codex/skills`, `~/.gemini/skills` all point to `~/.agents/skills/`.
