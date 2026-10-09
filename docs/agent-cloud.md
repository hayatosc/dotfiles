# Agent Cloud Sessions — Codex / Claude Code クラウドセッション専用

```sh
curl -fsSL https://raw.githubusercontent.com/hayatosc/dotfiles/main/scripts/install-agent-cloud.sh | sh
```

This installs the repository's Agent Skills and minimal cloud defaults for Codex cloud and Claude Code on the web. It does not run chezmoi or apply workstation settings.

## How it works

One POSIX shell script resolves `main` to a commit with `git ls-remote`, downloads that commit's source, and downloads the official APM 0.33.0 Linux binary. It verifies the binary's SHA-256 from the repository's mise lock. Set `DOTFILES_REF` to a full commit SHA to install a specific reviewed commit instead; CI uses this to test a pull request's own skills and lock.

The script copies `skills/apm.yml`, `skills/apm.lock.yaml`, and local skills into a staged APM project, then runs:

```sh
APM_NO_SCRIPTS=1 apm install --frozen --target agent-skills --only apm
```

APM handles frozen dependency installation and skill deployment into `.agents/skills`. The dependency cache and staged sources are removed afterwards, and the installed commit is recorded in `SOURCE_REF`. The upstream yomiyasu MIT notice is preserved alongside its skill; the optional yomiyasu executable is not installed.

APM runs with a disposable HOME, no inherited tokens or user/system Git configuration, lifecycle scripts disabled, and its normal security scanning enabled. Proxy variables (upper and lower case) and the `SSL_CERT_FILE`, `SSL_CERT_DIR`, `REQUESTS_CA_BUNDLE`, `CURL_CA_BUNDLE`, and `GIT_SSL_CAINFO` CA variables are forwarded only when set. Public dependency access must work without interactive authentication.

## Requirements and destinations

- Linux x86_64 or aarch64, glibc, POSIX sh, curl, tar, sha256sum, Git, mktemp, awk, and standard GNU file utilities
- Public HTTPS access to github.com, codeload.github.com, and GitHub release downloads/redirects
- Absolute `HOME`, `CODEX_HOME` (default `~/.codex`), `CLAUDE_CONFIG_DIR` (default `~/.claude`), and `XDG_DATA_HOME` (default `~/.local/share`); paths with spaces work

| Destination | Contents |
|---|---|
| `~/.agents/skills/<name>` | Skill links for Codex |
| `$CLAUDE_CONFIG_DIR/skills/<name>` | The same skill links for Claude Code |
| `$CODEX_HOME/AGENTS.md`, `$CLAUDE_CONFIG_DIR/CLAUDE.md` | Shared preferences, seeded only if absent |
| `$CODEX_HOME/config.toml` | [Codex reasoning defaults](../cloud/codex/config.toml), seeded only if absent |
| `$CLAUDE_CONFIG_DIR/settings.json` | [Claude Code effort and deny rules](../cloud/claude/settings.json), seeded only if absent |
| `$XDG_DATA_HOME/dotfiles-agent-cloud` | The installed generation and its `current` link |

The instruction file is generated from [`home/dot_agents/AGENTS.md`](../home/dot_agents/AGENTS.md) without its `## Local Environment` section, followed by the [cloud notes](../cloud/AGENTS.md). Keep that heading name when editing the shared file; a unit test guards it. The Claude Code deny rules mirror the workstation settings.

Existing files and dangling symlinks are left alone without reading their contents. Skills that the cloud platform already places in `~/.claude/skills` are untouched. No auth, browser, account, shell startup, plugins, hooks, MCP servers, or optional skill CLIs are copied or configured. Symlinked destination parent directories are rejected.

## Repeated runs and failures

Each run installs into a fresh generation. All skill-name collisions in both skill directories are checked before publication. Existing skills are preserved unless their symlink points to this installer's exact `current/.agents/skills/<name>` path. There is no force/adopt option.

Once installation succeeds, the `current` symlink switches atomically, missing skill links are created, retired links belonging to this installer are removed, and superseded generations are deleted. Failed resolution, downloads, checksum checks, APM runs, or collision checks leave the previous deployment active.

This deliberately does not provide a transactional multi-file publisher, a custom ownership database, or tamper detection for locally edited generations. Do not edit installed generations; change the source instead. A disk error or hard interruption during final publication can leave partially created links/config; rerun after fixing the error. A stale `dotfiles-agent-cloud/lock` directory after SIGKILL must be removed only after confirming no installation is running.

APM version and checksums must be updated together with the repository's mise configuration.

## Environment setup scripts

Add the command to each cloud environment's setup script, alongside project dependency setup. In Bash, enable `pipefail` so an outer curl failure is reported as a setup failure:

```bash
#!/usr/bin/env bash
set -euo pipefail
curl -q -fsSL https://raw.githubusercontent.com/hayatosc/dotfiles/main/scripts/install-agent-cloud.sh | sh
```

- **Codex cloud:** use the saved environment's setup script. Save and Republish only after a successful run and the environment owner's approval; existing tasks keep their own state.
- **Claude Code on the web:** open the cloud environment menu in the session's title bar, choose Edit, and set the Setup script. New sessions run the updated script.

A plain POSIX pipeline reports only the receiving shell's status; an empty failed download can otherwise appear successful. The installer puts commands inside a function so a truncated download does not start setup. Its own downloads complete before any downloaded code executes.

Both environments track `main`, so a merged skill change reaches new sessions without editing the setup script. To freeze an environment, replace `main` in the URL with a reviewed commit SHA on `main` and set `DOTFILES_REF` to the same SHA.

After setup, check the success message and skill links, and confirm skill discovery in a new task or session.

## Verification

```sh
sh -n scripts/install-agent-cloud.sh
python3 -m unittest discover -s tests -v
```

The focused tests exercise the POSIX pipe entrypoint, `main` resolution and explicit refs, first install/rerun, generation pruning, config/instruction preservation for both agents, unrelated skills, collisions, CA forwarding, dependency/download/checksum failures, and redirected destinations in disposable homes. Python is test-only. CI also runs the real APM installer twice for the pull request's commit in an isolated HOME. Desktop chezmoi/mise behavior is unchanged.
