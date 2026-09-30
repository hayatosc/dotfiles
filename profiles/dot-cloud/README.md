# dot cloud profile

This explicit profile adapts the repository to dot's managed Linux x86_64 cloud computer. It does not attempt to identify arbitrary containers automatically.

## One-time setup

Prerequisites: Git, Zsh, and Python 3. No sudo is required. The repository-owned bootstrap obtains the checksum-pinned official chezmoi binary and selects the profile explicitly.

The managed `/home/agent` is mounted read-only even with normal write approval. Use a separate writable shell HOME; do not remount the managed home, move credentials, or change runtime permissions.

From this repository, run once:

```sh
python3 profiles/dot-cloud/bootstrap.py --home /workspace/shared/dot-cloud-home --state /workspace/shared/dot-cloud-state
```

This installs the explicit configuration below the dedicated HOME, then runs chezmoi. To enter the configured shell:

```sh
/workspace/shared/dot-cloud-home/.local/bin/dot-shell
```

Inside that shell, the only update command is:

```sh
chezmoi apply
```

The launcher sets HOME and XDG configuration/data/cache/state paths for that shell only. The active host assistant, default Bash, credential locations, and agent control plane are unchanged. No managed Codex configuration or credentials are copied into the dedicated HOME. Commands requiring those accounts need their normal authorized connection flow.

`chezmoi.toml.example` documents the explicit profile configuration. Adjust absolute home, state, and source paths if using another writable location; preserve an existing configuration rather than overwriting it. Home and state must be separate non-nested directories. SourceDir points at the repository root; `.chezmoiroot` selects `home/` automatically. Re-running the bootstrap with the same configuration is safe but not required for updates.

No manual installer, full `mise install`, or APM command is needed after setup. Runtime state lives in the explicitly configured writable directory. The original repository remains the source of truth.

## Managed scope

- Guarded Zsh startup, interactive completions, optional FZF integration, and the `dot-shell` launcher
- Catppuccin Mocha Starship prompt, tmux bindings, Helix settings, and Git ignore patterns
- Official pinned Starship, zoxide, eza, bat, fd, fzf, and chezmoi binaries under `~/.local/bin`
- The 19 self-authored skill directories and their reference assets under `~/.agents/skills`, deployed additively
- Four prose agent-role descriptions/prompts kept as reference assets; no model or approval settings activated

The prompt's Nerd Font symbols depend on the terminal font. tmux and Helix configuration is available when those optional applications are installed. Skills become available for filesystem discovery; installing them does not hot-reload a running assistant's tool catalog.

## Preservation and safety

The dot profile ignores upstream runtime configurations, authentication/signing files, shell plugin managers, custom permission hooks, local Python wrappers, and WSL-specific settings. It disables all existing upstream lifecycle scripts, including system package installation and APM's replace/delete sync. Non-dot profiles preserve their original rendered content and behavior.

Every downloaded archive and extracted binary is SHA256-pinned in `tools.json`, with official upstream provenance. Only the named regular binary file is extracted. No remote shell installer is executed. Changes to versions/checksums are explicit repository edits and must be reviewed.

The installer records hashes of its owned tool and skill files. Unmanaged files or edits to previously installed files cause an error rather than being overwritten. Unrelated skills are preserved, and stale files are not automatically deleted. Repeated unchanged applies do not download, replace, or rewrite these files.

The profile does not read, replace, or symlink the runtime's `.codex` directory, copy credentials, alter approval modes, enable persistent external access, or publish repository changes. Copied skills remain subordinate to the host assistant's current instructions, tools, and permission requirements.

## Maintenance

Edit source files here, then run `chezmoi diff` or `chezmoi apply --dry-run --verbose` to inspect the target scope before applying. Do not remove the profile selection or run the default upstream profile in the managed cloud home.

`apply.py tools` and `apply.py skills` are implementation details called by chezmoi, not extra user deployment steps. The former prepares required binaries and writable shell-state directories before file deployment; the latter updates additive skill assets afterward. The functions are independently testable in an isolated destination.

## Checks

Run `python3 profiles/dot-cloud/test_apply.py -v` for the focused ownership, conflict, executable-mode, and symlink checks. Validate a complete profile with two consecutive chezmoi applies against an isolated `destDir` and separate `dotCloudStateDir`; compare file bytes, modes, and modification times after the source has stabilized. Place unrelated-skill and `.codex/config.toml` sentinels in that fixture to verify preservation. Normal-profile compatibility checks should render only, never execute its lifecycle scripts in the cloud runtime.
