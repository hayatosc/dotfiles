# Dotfiles Repository

Configurations are managed by chezmoi, with `home/` as its source root.
Edit sources here rather than deployed files in the active home directory.

## Edit Locations

- Application and shell settings: `home/dot_config/`, `home/dot_zsh*`, and other `home/dot_*` files.
- Shared agent preferences: `home/dot_agents/AGENTS.md`, symlinked by Codex, Claude Code, and Gemini.
- Shared agent role prompts: `home/.chezmoitemplates/agent_*`; harness wrappers live under `home/dot_codex/agents/`, `home/dot_claude/agents/`, and `home/dot_config/opencode/agents/`.
- Self-authored skills: `skills/<name>/SKILL.md` and their resources. External dependencies are declared in `skills/apm.yml`; do not edit installed copies or `skills/apm_modules/`.
- Chezmoi data and lifecycle scripts: `home/.chezmoidata/` and `home/.chezmoiscripts/`.

## Applying Changes

After editing configuration or skills, run `chezmoi apply --force` to deploy them.
Skill changes trigger `home/.chezmoiscripts/run_onchange_after_apm-install.sh.tmpl`: it uses `scripts/agent_skills.py` to stage and verify a frozen APM install, then publishes only owned skill links. See `docs/codex-cloud.md` for collision handling and the separate cloud entrypoint. Cloud-installer work uses disposable HOME tests rather than applying desktop configuration to the active home.
Inspect the pending apply scope first; resolve unrelated changes without overwriting user work.
Report an apply failure separately from source changes so the user knows what is active.

## Task-Specific References

- Agent prompt ownership and skill deployment: `docs/agents.md`.
- Codex configuration: `docs/codex.md`.
- Python tooling: `pyproject.toml` and `uv.lock`.
- Relevant project checks: `.github/workflows/`; select checks for the changed surface instead of replaying unrelated workflows.
