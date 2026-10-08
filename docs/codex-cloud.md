# Codex Cloud Sessions Only — Codexクラウドセッション専用

This is a small Linux installer for a saved **Codex cloud environment's Install script**. It prepares user-scope Codex instructions and the repository's common Agent Skills. It does not run the workstation `chezmoi apply` workflow in [README.md](../README.md).

## Scope

The installer publishes:

- The self-authored skills under `skills/<name>/SKILL.md` and external dependencies from `skills/apm.yml`, reproduced at the commits and content hashes in `skills/apm.lock.yaml`.
- The upstream MIT notice for yomiyasu, alongside the complete APM-managed skill. There is no separate yomiyasu installer; its optional executable is not trusted or installed.
- [Cloud instructions](../cloud/codex/AGENTS.md) at `$CODEX_HOME/AGENTS.md`, only if absent or already owned by this installer.
- [Two reasoning defaults](../cloud/codex/config.toml) at `$CODEX_HOME/config.toml`, only if absent. Once seeded, config is left alone on every subsequent run.

Existing Codex config and unmanaged instructions are preserved **without reading their contents**. Existing unrelated skills, Codex's bundled/system skills, `$CODEX_HOME/skills`, repository skills, auth files, tokens, private keys, browser profiles, account settings, security settings, shell startup files, and other workstation dotfiles are not copied or changed. This installer does not install Codex, chezmoi, mise, uv, GUI tools, MCP servers, hooks, or the optional CLIs mentioned by skills. Skill availability does not imply that every skill's optional tool is available.

The cloud instructions deliberately avoid workstation aliases and Python wrappers. The desktop Codex template contains account, plugin, and approval settings and is **not** used here. Repository instructions still apply in each project.

## Requirements and paths

Use a Linux development image with Bash, curl, tar, cmp, mktemp, Git at `/usr/bin/git`, and Python 3.11+ (including `tarfile` extraction filters). Supported APM binaries are glibc Linux x86_64 and aarch64. A missing prerequisite fails setup; there is no sudo/package-manager fallback.

`HOME` must be an absolute path. The installer respects an absolute `CODEX_HOME` (default `$HOME/.codex`), `XDG_DATA_HOME` (default `$HOME/.local/share`), and `XDG_STATE_HOME` (default `$HOME/.local/state`). User skills are always discovered from `$HOME/.agents/skills`, independently of `CODEX_HOME` and `XDG_CONFIG_HOME`, as described in [Build skills](https://learn.chatgpt.com/docs/build-skills). Config/cache XDG paths are not modified; APM uses a separate disposable HOME and disposable XDG directories. Paths with spaces are supported. Symlinked destination parent directories are rejected to avoid writing through a redirect.

The entrypoint first retrieves this repository at a **full commit SHA** and checks that its own bytes match that commit's script. It then downloads PyYAML's pure Python source using `uv.lock`, and APM's native release using only the APM entry in the existing mise config and `mise.lock`. Both downloads are checked against the committed SHA-256 checksums. Tools/libraries remain temporary and are removed after success or ordinary failure. The installer never invokes the all-tools mise config.

APM runs `install --frozen --target agent-skills` in scratch, with local skills staged under `.apm/skills`, lifecycle scripts disabled, a disposable HOME, no inherited tokens, and no user/system Git config or credential helper. Network proxy and CA environment values are retained for public HTTPS access. APM's content security checks remain enabled. The installer additionally verifies that APM retained all external dependency identities and hashes, checks every locked deployed file, and compares local skill contents and executable bits before publishing.

## Download and run

Download to a file and execute only after curl succeeds. A `curl | bash` pipeline can execute a partial download before curl reports failure, so this entrypoint requires a downloaded file. Keep `set -euo pipefail` in the calling Install script so a failed fetch or install fails environment setup.

This change starts on the PR branch `feat/codex-cloud-bootstrap`. **Until the PR is merged, `main` does not contain this entrypoint.** For PR verification, copy its latest full head SHA from GitHub, or resolve that branch's current head through the public API:

```bash
set -euo pipefail
DOTFILES_REF=$(curl -q --fail --show-error --silent \
  https://api.github.com/repos/hayatosc/dotfiles/commits/feat/codex-cloud-bootstrap \
  | python3 -I -c 'import json, sys; print(json.load(sys.stdin)["sha"])')
bootstrap=$(mktemp)
trap 'rm -f -- "$bootstrap"' EXIT
curl -q --fail --show-error --silent --location --proto '=https' --proto-redir '=https' \
  "https://raw.githubusercontent.com/hayatosc/dotfiles/$DOTFILES_REF/scripts/install-codex-cloud.sh" \
  -o "$bootstrap"
bash "$bootstrap" --ref "$DOTFILES_REF"
```

For a fixed version, replace the resolution command with `DOTFILES_REF='<full 40-character commit SHA containing this installer>'`; the rest is identical. This is the recommended saved-environment form: the entrypoint, skills, manifests, libraries, and APM version are tied to that reviewed commit. Do not use the pre-PR base commit, which lacks this installer, or fetch a branch's script and pass a different ref.

**After merge only**, a one-time resolution of the latest main version can use:

```bash
DOTFILES_REF=$(curl -q --fail --show-error --silent \
  https://api.github.com/repos/hayatosc/dotfiles/commits/main \
  | python3 -I -c 'import json, sys; print(json.load(sys.stdin)["sha"])')
```

Then use the same download/run block. Record the resolved SHA in the Install script to keep subsequent environment builds reproducible. A changing branch is not a saved version pin.

## Saved environment workflow

Follow the current [Cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environments) workflow: open **Settings > Codex Cloud > Environments**, choose the environment's **… > Edit**, and add the fixed-commit download/run block to its **Install script** alongside project dependency setup. **Start skill** is for starting and checking services; this installer belongs in Install script. These are the current fields, rather than the older setup/maintenance script model.

Run and inspect the setup before publishing. Verify the final installer message, the ownership manifest at `${XDG_STATE_HOME:-$HOME/.local/state}/dotfiles-agent-skills/manifest.json`, the skill links, and `$CODEX_HOME/AGENTS.md` if it was installed. For example:

```bash
python3 -I - <<'PY'
import json, os
from pathlib import Path
home = Path(os.environ['HOME'])
state = Path(os.environ.get('XDG_STATE_HOME', str(home / '.local/state')))
manifest = json.loads((state / 'dotfiles-agent-skills/manifest.json').read_text())
for destination, target in manifest['links'].items():
    path = Path(destination)
    assert path.is_symlink() and os.readlink(path) == target and path.exists(), destination
print('Verified links; installed source:', manifest['ref'])
PY
```

The installer verifies managed file hashes as part of each run. The snippet above provides an additional link/source check and does not inspect existing config or credentials. Confirm the expected skills are discoverable in a **new** task. For the version first tested here, there are 19 self-authored and 21 external skills (40 total); the count follows the selected repository commit.

Save the verified change and select **Republish**. New tasks start from the published prepared filesystem. Existing tasks retain their own saved state and are **not automatically updated**. Repository refresh does not rerun installation/startup commands. Local computer skills do not sync automatically to cloud environments. Updating this repository or opening a PR alone does not update a saved environment. Republish and production setup changes require the environment owner's separate approval.

## Ownership, updates, and failures

Each published skill is a symlink to a content-addressed generation below `$XDG_DATA_HOME/dotfiles-agent-skills/generations`. The state manifest records exactly the owned destinations, targets, and file hashes. A repeated identical run reuses the generation and leaves links/manifest unchanged. An update switches only recorded links, removes only previously owned retired skill links, and retains old generations. Unmanaged skills and instructions are not adopted based on equal contents.

All collisions and previous managed content are checked before link changes. Missing/replaced managed links, edited managed files, an incompatible manifest, or redirected parent directories fail with a path-specific error. Concurrent installers are refused by a state-directory file lock. Publication failures roll back changed links and remove newly created config/generation. A hard kill, machine failure, or concurrent manual edits cannot be made fully transactional across filesystems; inspect the recorded manifest and named paths before retrying. Do not edit these destinations while installation runs.

To update, select a reviewed full commit SHA, change the Install script's pin, run setup and verify it, then Republish. Retired generation directories are kept deliberately; remove an old generation manually only after confirming that no skill/instruction symlink uses it. Never delete all of `~/.agents/skills` or the ownership manifest as a routine update.

If an unmanaged skill has the same directory name, installation stops and leaves it intact. Review the reported path; keep it and omit the conflicting dependency in a reviewed repository change, or move it to a backup location yourself before retrying. There is no force/adopt option. Existing directories from the old desktop copy/rsync deployment are unmanaged on first use of this installer, so desktop migration also requires reviewing those collisions rather than silently claiming them. To retain a manual change to a managed skill, save it outside the generation and incorporate it into the appropriate source before updating. Restore an accidentally removed managed link to its recorded target before retrying; do not erase ownership history.

On dependency, checksum, APM, or network failure, the command exits nonzero before publication and preserves the previous deployment. Check the reported public host and the environment's allowed network destinations (GitHub, raw.githubusercontent.com, codeload.github.com, GitHub release redirects such as release-assets.githubusercontent.com, and files.pythonhosted.org). Resolve access through the environment's normal administration flow and retry the same pinned version; the installer does not inspect credentials or change network/security settings. Do not Republish a failed setup. A GitHub API lookup is needed only for the optional branch-to-SHA resolution example; fixed-commit installs do not need it.

Changing HOME, CODEX_HOME, or XDG ownership paths after installation is a migration, not a normal version update. Keep those paths stable or use a fresh environment. Temporary downloads, APM scratch projects, and staged files are cleaned on success and ordinary exceptions; SIGKILL/power loss may leave temporary directories that should be reviewed separately.

## Verification and desktop reuse

Run `uv run --frozen python -m unittest discover -s tests -v` for the isolated behavior tests, plus `bash -n scripts/install-codex-cloud.sh home/dot_config/mise/tasks/executable_apm`. Tests cover first install, repeated runs, managed updates/removals, config/instruction preservation without reading, unrelated skills, collisions, edited/replaced managed content, missing dependencies, network/content/version failures, path redirects/spaces, rollback, locking, ref mismatch, and temporary cleanup.

The desktop chezmoi hook and `mise run apm install` call the same staged skill deployer using the repository's uv environment and the mise-pinned APM. They fail when APM is missing. Other `mise run apm <command>` operations keep their direct APM behavior for manifest/lock maintenance. After changing dependencies with APM, review and commit both manifest and lockfile, then run the install task. Cloud use never invokes chezmoi or reads machine-local seed data.

APM 0.33.0 (mise's configured version) accepted the previous 0.30.0 lockfile with unchanged dependency commits, but retained 37 obsolete deployed-file records that failed actual file verification (one renamed guide and 36 unrelated herdr vendor images). Deployment metadata was regenerated with 0.33.0 at the **same 21 dependency commits and source content hashes**. The resulting 439 external file hashes verify against disk, and all 19 local skills are staged once without nested duplicates. Normal installs reconcile only in scratch; original manifest/lock files are unchanged. When upgrading APM or dependencies, repeat the real isolated install and check these contracts; a different lock format or rewritten dependency identity fails closed.
