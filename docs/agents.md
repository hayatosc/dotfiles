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

## 3. Custom Skills

Custom agent skills are defined in the [home/dot_agents/skills/](file:///home/hayato/.local/share/chezmoi/home/dot_agents/skills/) directory. These are symlinked into the agent's execution environments (e.g. `~/.gemini/skills/` or `~/.claude/skills/`).

Key skills available:
- `agent-browser`: CLI browser automation.
- `askmeplan`: Socratic planning dialogue tool.
- `frontend-design` & `impeccable` & `emil-design-eng`: UI styling and premium frontend guidelines.
- `golang-best-practices` & `typescript-best-practices`: Language-specific programming guidelines.
- `nothing-design`: Nothing OS styling instructions.
- `empirical-prompt-tuning`: Evaluating and tuning agent prompts.
- `refactoring-code`: Safe step-by-step code refactoring.
