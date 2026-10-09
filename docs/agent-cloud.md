# Agent Cloud Sessions — Codex / Claude Code クラウドセッション専用

```bash
#!/usr/bin/env bash
set -euo pipefail
curl -q -fsSL https://raw.githubusercontent.com/hayatosc/dotfiles/main/scripts/install-agent-cloud.sh | sh
```

This installs the repository's Agent Skills, rtk, and minimal cloud defaults into a Claude Code on the web or Codex cloud environment. It does not run chezmoi or apply workstation settings. Add the block above to the environment's **Setup script** (Claude Code) or **Install script** (Codex), as described per platform below.

Keep `pipefail`: a plain POSIX pipeline reports only the receiving shell's status, so a failed download could otherwise look successful. The installer wraps its commands in a function, so a truncated download does not start running, and its own downloads complete before any downloaded code executes.

## What it installs

| Destination | Contents |
|---|---|
| `~/.agents/skills/<name>` | Skill links for Codex |
| `$CLAUDE_CONFIG_DIR/skills/<name>` | The same skill links for Claude Code |
| `$CODEX_HOME/AGENTS.md`, `$CLAUDE_CONFIG_DIR/CLAUDE.md` | Shared preferences, written only if absent |
| `$CODEX_HOME/config.toml` | [Codex reasoning defaults](../cloud/codex/config.toml), written only if absent |
| `~/.local/bin/rtk` | Link to [rtk](https://github.com/rtk-ai/rtk) 0.51.0, the version pinned in mise |
| `$XDG_DATA_HOME/dotfiles-agent-cloud` | The installed generation and its `current` link |

Defaults: `CODEX_HOME=~/.codex`, `CLAUDE_CONFIG_DIR=~/.claude`, `XDG_DATA_HOME=~/.local/share`.

The instruction file is generated from [`home/dot_agents/AGENTS.md`](../home/dot_agents/AGENTS.md) without its `## Local Environment` section, followed by the [cloud notes](../cloud/AGENTS.md). Keep that heading name when editing the shared file; a unit test guards it.

The cloud notes tell the agent to prefix output-heavy commands with `rtk`. On the workstation a PreToolUse hook rewrites commands automatically, but neither cloud platform gives this installer a documented way to register that hook (see below), so the cloud uses rtk explicitly.

Existing files and dangling symlinks are left alone without reading their contents. An existing `~/.local/bin/rtk` that this installer did not create is kept. Skills the platform already places in `~/.claude/skills` are untouched. No auth, account, shell startup, plugins, hooks, MCP servers, or other optional skill CLIs are configured.

## Claude Code on the web

Findings from the official [cloud environments](https://code.claude.com/docs/en/cloud-environments) and [settings](https://code.claude.com/docs/en/settings#settings-in-cloud-sessions) documentation:

### Configure the environment

1. At [claude.ai/code](https://claude.ai/code), select the cloud icon showing the current environment's name, in the row above the message box. In the Desktop app the same selector is in the prompt box.
2. Select **Cloud**, then hover over the environment and select its settings icon, or select **Add cloud environment**.
3. Paste the block above into **Setup script** and save.
4. Leave **Network access** at **Trusted**, or see [Network access](#network-access).

Environments you create are personal. Shared environments created by an organization Owner open read-only; an Owner edits those on the **Cloud environments** admin page.

### How the setup script runs

- Bash, as root, on Ubuntu 24.04 x86_64, before Claude Code launches in a new session. `HOME` is `/root`.
- A non-zero exit makes the session fail to start. Keep `set -euo pipefail`: a failed install is then retried by the next session instead of being cached.
- When setup finishes within roughly five minutes, the filesystem is snapshotted and reused by later sessions, which skip the script. The script runs again when you change it or the allowed network hosts, or after the cache expires (roughly seven days). It does not run when an idle session resumes.

Because of that cache, tracking `main` takes effect only when the snapshot is rebuilt. To pick up a merged skill change immediately, edit the setup script (for example, update a dated comment) to force a rebuild.

### Network access

**Trusted** (the default) already allows every host the installer needs: `github.com`, `codeload.github.com`, `raw.githubusercontent.com`, and `release-assets.githubusercontent.com`. With **Custom**, add those hosts or check **Also include default list of common package managers**. With **None**, the install fails.

Traffic passes through an HTTPS-intercepting proxy. The installer forwards the proxy and CA variables (`SSL_CERT_FILE`, `REQUESTS_CA_BUNDLE`, `GIT_SSL_CAINFO`, and so on) to APM when they are set.

### What Claude Code reads

| File | Read in a cloud session? |
|---|---|
| `~/.claude/CLAUDE.md` written by a setup script | Yes, documented; `/context` lists `/root/.claude/CLAUDE.md` under Memory files |
| `~/.claude/settings.json` | No, documented: user settings are not read, so the installer does not write one |
| `~/.claude/skills/<name>` written by a setup script | Not documented; the platform itself places skills in this directory. Verify after setup |
| Repository `.claude/settings.json` | Yes, in a session with one repository |

Because user settings are not read, choose the model, effort, and permission mode in the session UI. For permission rules or hooks, commit them to a repository's `.claude/settings.json`. For example, this enables the rtk rewrite hook for one repository and does nothing where rtk is absent:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "command -v rtk >/dev/null && rtk hook claude || true" }
        ]
      }
    ]
  }
}
```

### Verify

Start a new session and check:

- The setup step shows `Agent cloud skills installed from <sha>`.
- `/context` lists `/root/.claude/CLAUDE.md`.
- Asking Claude which skills are available lists the repository skills, for example `coding-style`.
- `rtk --version` prints `rtk 0.51.0`.
- `git config --local user.email` in the repository prints `145091553+hayatosc@users.noreply.github.com`.

## Codex cloud

Findings from the official [Codex Cloud](https://learn.chatgpt.com/docs/environments/cloud-environments), [hooks](https://learn.chatgpt.com/docs/hooks), [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md), and [skills](https://learn.chatgpt.com/docs/build-skills) documentation. This describes the current Codex Cloud; **Codex Cloud (Legacy)**, still used for Code Review and the Linear and GitHub integrations, has [its own setup-script model](https://learn.chatgpt.com/docs/environments/cloud-environment).

### How the current environments work

- Environment setup is a conversation. Codex inspects the selected repositories, installs dependencies, tests the workflow, and records what worked in two fields: **Install script** and **Start skill**. There is no separate setup or maintenance script to fill in first.
- **Publish** captures the prepared filesystem. Each new task starts from that snapshot; existing tasks keep their own files.
- Background repository refresh keeps dependency caches but does not rerun installation. Skills therefore update only when you edit the environment, let Codex rerun the install, and **Republish**. Tracking `main` means "the latest `main` at the last Republish".
- Tasks run in a VM. The docs no longer describe a default image, user, `HOME`, or `PATH`, so do not assume the legacy `codex-universal` image (root, `~/.local/bin` on `PATH`).

### Configure the environment

1. In Codex on the web or the desktop app, open **Settings** > **Codex Cloud** > **Environments**. For an existing environment, open its **…** menu and select **Edit**. For a new one, select **Create environment** (or, in a new task, **Work in** > **Cloud** > **Select environment** > **Create environment**) and select the repositories.
2. Turn on **Allow Codex to access internet** and allow the hosts in [Network access](#network-access-1).
3. In the setup conversation, ask Codex to run the block above and keep it in the **Install script**, after the project's own install steps.
4. Have Codex run the [verification](#verify-1) checks during setup, then save and **Publish** (or **Republish**). Republish only after a successful run and the environment owner's approval.
5. Start a new task to use the result.

If initial setup fails, **Try again** retries it. Use **Personal vault** (**Settings** > **Codex Cloud** > **Personal vault**) for your own environment variables and network secrets.

### Network access

Internet access is off until **Allow Codex to access internet** is on, and it applies during setup and tasks. The **Package managers** preset includes `github.com`, `codeload.github.com`, and `release-assets.githubusercontent.com`, which cover `git ls-remote`, the source archive, and the APM and rtk release downloads. It does **not** include `raw.githubusercontent.com`, from which the block above downloads the installer, so add it under **Additional allowed domains**. With **Custom domains only**, allow all four hosts. Traffic passes through an HTTP/HTTPS proxy.

### What Codex reads

| Location | Status in Codex Cloud |
|---|---|
| Repository `AGENTS.md` and `.agents/skills/` | Read, documented: "Skills stored in your repository are available in cloud tasks." |
| `~/.codex/AGENTS.md`, `~/.agents/skills`, `~/.codex/config.toml` written by the install script | Not documented. These are the personal locations for local Codex, and personal skills on your own computer are not synced, but the docs do not say whether a cloud task reads them from the prepared VM |
| `~/.codex/hooks.json` | Not used by this installer. Non-managed hooks run only after you review and trust their exact definition, which a cloud task cannot do |

If a new task does not pick up the instructions or skills, the documented fallback is to commit them to the repository (`AGENTS.md`, `.agents/skills/`).

### Verify

During setup, and again in a new task after publishing, ask Codex to:

- Print `$HOME`, `id -un`, and `$PATH`, list `~/.agents/skills`, run `rtk --version` (or `~/.local/bin/rtk --version` if `rtk` is not on `PATH`), and run `git config --local user.email` in the repository.
- Report which instruction files it loaded and whether it sees the repository skills, for example `coding-style`.

Check that `$HOME` is the same during setup and in the task; the skill and rtk links point into `$HOME/.local/share/dotfiles-agent-cloud`.

## Commit identity

Cloud agents commit with the platform's identity; Claude Code on the web, for example, writes `Claude <noreply@anthropic.com>` to `~/.gitconfig`. After installing, the installer looks for Git repositories in its working directory and up to three levels below, and runs `git config user.name` and `git config user.email` in each one. The repository-local values outrank the platform's global ones, so both the author and the committer become `hayatosc <145091553+hayatosc@users.noreply.github.com>`, the GitHub noreply address that links commits to the account without exposing a mail address.

- Set `DOTFILES_GIT_ROOT` to search another directory, and `DOTFILES_GIT_NAME` / `DOTFILES_GIT_EMAIL` to use another identity.
- Global Git configuration is not changed, and repositories outside the searched directory keep the platform identity.
- The platform still signs commits with its own key. With the committer no longer matching that key's account, GitHub may show the signature as **Unverified**.
- The identity is set when the installer runs. A repository cloned after setup, or a fresh clone in a session that reuses a cached setup, does not get it; see the verification steps.

## How it works

One POSIX shell script resolves `main` to a commit with `git ls-remote`, downloads that commit's source, and downloads the official APM 0.33.0 and rtk 0.51.0 Linux binaries. Both are verified against the SHA-256 values in the repository's mise lock. Set `DOTFILES_REF` to a full commit SHA to install a specific reviewed commit instead; CI uses this to test a pull request's own skills and lock. To freeze an environment, replace `main` in the URL with a reviewed commit SHA on `main` and run the script with `DOTFILES_REF` set to the same SHA.

The script copies `skills/apm.yml`, `skills/apm.lock.yaml`, and local skills into a staged APM project, then runs:

```sh
APM_NO_SCRIPTS=1 apm install --frozen --target agent-skills --only apm
```

APM handles frozen dependency installation and skill deployment into `.agents/skills`. The dependency cache and staged sources are removed afterwards, and the installed commit is recorded in `SOURCE_REF`. The upstream yomiyasu MIT notice is preserved alongside its skill; the optional yomiyasu executable is not installed.

APM runs with a disposable HOME, no inherited tokens or user/system Git configuration, lifecycle scripts disabled, and its normal security scanning enabled. Proxy variables (upper and lower case) and the `SSL_CERT_FILE`, `SSL_CERT_DIR`, `REQUESTS_CA_BUNDLE`, `CURL_CA_BUNDLE`, and `GIT_SSL_CAINFO` CA variables are forwarded only when set. Public dependency access must work without interactive authentication.

Requirements: Linux x86_64 or aarch64, POSIX sh, curl, tar, sha256sum, Git, mktemp, awk, and GNU coreutils; absolute `HOME`, `CODEX_HOME`, `CLAUDE_CONFIG_DIR`, and `XDG_DATA_HOME` (paths with spaces work). Symlinked destination directories are rejected.

## Repeated runs and failures

Each run installs into a fresh generation. All skill-name collisions in both skill directories are checked before publication. Existing skills are preserved unless their symlink points to this installer's exact `current/.agents/skills/<name>` path. There is no force/adopt option.

Once installation succeeds, the `current` symlink switches atomically, missing skill and rtk links are created, retired links belonging to this installer are removed, and superseded generations are deleted. Failed resolution, downloads, checksum checks, APM runs, or collision checks leave the previous deployment active.

This deliberately does not provide a transactional multi-file publisher, a custom ownership database, or tamper detection for locally edited generations. Do not edit installed generations; change the source instead. A disk error or hard interruption during final publication can leave partially created links/config; rerun after fixing the error. A stale `dotfiles-agent-cloud/lock` directory after SIGKILL must be removed only after confirming no installation is running.

APM and rtk versions and checksums must be updated together with the repository's mise configuration.

## Verification

```sh
sh -n scripts/install-agent-cloud.sh
python3 -m unittest discover -s tests -v
```

The focused tests exercise the POSIX pipe entrypoint, `main` resolution and explicit refs, first install/rerun, generation pruning, instruction/config preservation for both agents, the rtk link, per-repository commit identity, unrelated skills, collisions, CA forwarding, dependency/download/checksum failures, and redirected destinations in disposable homes. Python is test-only. CI also runs the real installer twice for the pull request's commit in an isolated HOME. Desktop chezmoi/mise behavior is unchanged.
