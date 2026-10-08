# Codex Cloud Sessions Only — Codexクラウドセッション専用

```sh
curl -fsSL https://raw.githubusercontent.com/hayatosc/dotfiles/ace0ffa391edada83dc795f8b2ddbc2aae7d0cce/scripts/install-codex-cloud.sh | sh
```

This installs the repository's common Agent Skills and minimal cloud Codex defaults. It does not run chezmoi or apply workstation settings. The installer URL is pinned to a full commit SHA, so it keeps working after the feature branch is deleted. The installer is covered by real first-install and rerun CI checks. To update it, replace the SHA with another reviewed and verified installer commit.

## How it works

One POSIX shell script downloads source inputs at commit `26cb6e7534d05149847048d32e30a7d1970c7812` and the official APM 0.33.0 Linux binary, verifying the binary's SHA-256 from the repository's mise lock. There is no separate payload, Python bootstrap, custom dependency resolver, or desktop integration.

It copies `skills/apm.yml`, `skills/apm.lock.yaml`, and local skills into a staged APM project, then runs:

```sh
APM_NO_SCRIPTS=1 apm install --frozen --target agent-skills --only apm
```

APM handles the frozen dependency installation and skill deployment. Local skills are staged under `.apm/skills`; the complete output is in `.agents/skills`. `apm install -g` is not equivalent: user scope reads `~/.apm/apm.yml` instead of this staged project's manifest. The installer preserves the upstream yomiyasu MIT notice alongside its skill; it does not install the optional yomiyasu executable.

APM runs with a disposable HOME, no inherited tokens or user/system Git configuration, lifecycle scripts disabled, and its normal security scanning enabled. Standard uppercase proxy and TLS certificate environment variables are passed through. Public dependency access must work without interactive authentication.

## Requirements and destinations

- Linux x86_64 or aarch64, glibc, POSIX sh, curl, tar, sha256sum, Git, mktemp, and standard GNU file utilities
- Public HTTPS access to GitHub, codeload.github.com, raw.githubusercontent.com and GitHub release downloads/redirects
- Absolute `HOME`, `CODEX_HOME` (default `~/.codex`), and `XDG_DATA_HOME` (default `~/.local/share`); paths with spaces work

Installed skills are links under `~/.agents/skills`, independently of `CODEX_HOME`. Generations and the `current` link live under `$XDG_DATA_HOME/dotfiles-codex-cloud`. Cloud `AGENTS.md` and the two reasoning defaults in `config.toml` are copied to `CODEX_HOME` only if absent. Existing files and dangling symlinks are left alone without reading their contents.

No auth, browser, account, security, shell startup, bundled Codex skills, unrelated skill directories, MCP servers, or optional skill CLIs are copied or configured. Symlinked destination parent directories are rejected.

## Repeated runs and failures

Each run installs into a fresh generation. All skill-name collisions are checked before publication. Existing skills are preserved unless their symlink points to this installer's exact `current/.agents/skills/<name>` path. There is no force/adopt option. Existing deployments made by the previous Python installer are treated as unmanaged; use a fresh cloud environment or explicitly review and move conflicting links before migrating.

Once installation succeeds, the `current` symlink switches atomically and missing owned skill links are created. Retired links belonging to this installer are removed. Existing unrelated skills remain untouched. Failed downloads, checksum checks, APM runs, or collision checks leave the previous skill deployment active. Old generations are retained; repeated runs do download/install again. Review old generations before removing any manually.

This deliberately does not provide a transactional multi-file publisher, a custom ownership database, or tamper detection for locally edited generations. Do not edit installed generations; change the source instead. A disk error or hard interruption during final publication can leave partially created links/config. Rerun after fixing the error. A stale `dotfiles-codex-cloud/lock` directory after SIGKILL must be removed only after confirming no installation is running.

The script pins its source inputs separately from its own URL. A source update requires reviewing and changing `ref` in the script. APM version/checksums must be updated together, matching the repository's mise configuration. Neither a new PR nor a changed branch automatically republishes saved environments.

## Saved environment Install script

Use the saved cloud environment's Install script, alongside project dependency setup. In Bash, enable `pipefail` so an outer curl failure is reported as a setup failure:

```bash
#!/usr/bin/env bash
set -euo pipefail
curl -q -fsSL https://raw.githubusercontent.com/hayatosc/dotfiles/ace0ffa391edada83dc795f8b2ddbc2aae7d0cce/scripts/install-codex-cloud.sh | sh
```

A plain POSIX pipeline reports only the receiving shell's status; an empty failed download can otherwise appear successful. The installer puts commands inside a function so incomplete function definitions do not start setup. Its own downloads complete before any downloaded code executes.

Run setup, check the success message and skill links, and confirm discovery in a new task. This source pin contains 19 local and 21 external skills. Save and Republish only after successful verification and the environment owner's approval. Existing tasks retain their own state.

## Verification

```sh
sh -n scripts/install-codex-cloud.sh
python3 -m unittest discover -s tests -v
```

The focused tests exercise the POSIX pipe entrypoint, first install/rerun, config/instruction preservation, unrelated skills, collisions, dependency/download/checksum failures, and redirected destinations in disposable homes. Python is test-only. CI also runs the actual downloaded APM installer twice in an isolated HOME. Desktop chezmoi/mise behavior is unchanged.
