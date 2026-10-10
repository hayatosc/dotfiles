#!/bin/sh
# set -o pipefail; curl -q -fsSL https://raw.githubusercontent.com/hayatosc/dotfiles/main/scripts/install-agent-cloud.sh | sh
main() (
    set -eu
    die() { printf 'agent-cloud: %s\n' "$*" >&2; exit 1; }
    [ "$#" -eq 0 ] || die 'this installer takes no arguments'
    [ "$(uname -s)" = Linux ] || die 'Linux is required'
    for tool in curl tar sha256sum git mktemp readlink awk; do
        command -v "$tool" >/dev/null 2>&1 || die "required tool missing: $tool"
    done
    # The official APM and rtk releases are pinned to the repository's mise lock.
    case $(uname -m) in
        x86_64)
            arch=x86_64 checksum=e6374402c74318f7c8bef97a90d8572d049fdab0dc3871492c6b0647ae9e881f
            rtk_target=x86_64-unknown-linux-musl rtk_checksum=5028d3b19a8f0990d30fec9fbb07e32782bc5698e618fb1861aad8a9ccba4eb5 ;;
        aarch64)
            arch=arm64 checksum=ac40dd0efd1af35a56847beedde96854530d2f54851e026728da017d3af827f8
            rtk_target=aarch64-unknown-linux-gnu rtk_checksum=8d6d1aad9e69b42481eda7039507d1f7ee93698f87713cecd873d287c1931632 ;;
        *) die 'supported architectures: x86_64 and aarch64' ;;
    esac
    codex=${CODEX_HOME:-$HOME/.codex}
    claude=${CLAUDE_CONFIG_DIR:-$HOME/.claude}
    data=${XDG_DATA_HOME:-$HOME/.local/share}/dotfiles-agent-cloud
    agents_skills=$HOME/.agents/skills
    bin=$HOME/.local/bin
    # Each check walks every ancestor, so this also covers $claude itself.
    for path in "$codex" "$claude/skills" "$data" "$agents_skills" "$bin"; do
        case $path in /*) ;; *) die "absolute path required: $path" ;; esac
        while [ "$path" != / ] && [ "${path%/}" != "$path" ]; do path=${path%/}; done
        while [ "$path" != / ]; do
            [ ! -L "$path" ] || die "symlinked destination: $path"
            path=$(dirname "$path")
        done
    done
    # Resolve main once so every source file comes from the same commit.
    ref=${DOTFILES_REF:-}
    if [ -z "$ref" ]; then
        ref=$(GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null GIT_TERMINAL_PROMPT=0 \
            git ls-remote https://github.com/hayatosc/dotfiles refs/heads/main) || die 'cannot resolve main'
        ref=${ref%%[!0-9a-f]*}
    fi
    case $ref in *[!0-9a-f]*) die "full commit SHA required: $ref" ;; esac
    [ "${#ref}" -eq 40 ] || die "full commit SHA required: $ref"
    mkdir -p "$data"
    mkdir "$data/lock" 2>/dev/null || die "installation already running: $data/lock"
    work=
    stage=
    cleanup() {
        if [ -n "$stage" ] && [ "$(readlink "$data/current" 2>/dev/null || :)" = "$stage" ]; then stage=; fi
        rm -f -- "$data/lock/current"
        rm -rf -- "$work" "$stage"
        rmdir "$data/lock"
    }
    trap cleanup 0
    trap 'exit 130' INT
    trap 'exit 143' TERM
    work=$(mktemp -d)
    stage=$(mktemp -d "$data/install.XXXXXXXX")
    fetch() { curl -q -fsSL --proto '=https' --proto-redir '=https' "$1" -o "$2" || die "download failed: $1"; }
    fetch "https://codeload.github.com/hayatosc/dotfiles/tar.gz/$ref" "$work/source.tar.gz"
    repo=$work/source
    mkdir "$repo"
    tar -xzf "$work/source.tar.gz" -C "$repo" --strip-components=1
    fetch "https://github.com/microsoft/apm/releases/download/v0.33.0/apm-linux-$arch.tar.gz" "$work/apm.tar.gz"
    printf '%s  %s\n' "$checksum" "$work/apm.tar.gz" | sha256sum -c -
    tar -xzf "$work/apm.tar.gz" -C "$work"
    fetch "https://github.com/rtk-ai/rtk/releases/download/v0.51.0/rtk-$rtk_target.tar.gz" "$work/rtk.tar.gz"
    printf '%s  %s\n' "$rtk_checksum" "$work/rtk.tar.gz" | sha256sum -c -
    mkdir -p "$stage/.apm/skills" "$work/home"
    cp "$repo/skills/apm.yml" "$repo/skills/apm.lock.yaml" "$stage/"
    for skill in "$repo"/skills/*/SKILL.md; do
        cp -R "$(dirname "$skill")" "$stage/.apm/skills/"
    done
    # Forward only set proxy/CA variables; an empty value can disable a default.
    set --
    for var in HTTPS_PROXY HTTP_PROXY NO_PROXY https_proxy http_proxy no_proxy \
        SSL_CERT_FILE SSL_CERT_DIR REQUESTS_CA_BUNDLE CURL_CA_BUNDLE GIT_SSL_CAINFO; do
        eval "value=\${$var-}"
        [ -z "$value" ] || set -- "$@" "$var=$value"
    done
    # Native APM owns dependency resolution, frozen-lock validation, and staging.
    # Use a disposable HOME; don't load user Git credentials or lifecycle scripts.
    (cd "$stage" && env -i PATH="$PATH" HOME="$work/home" "$@" \
        GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null GIT_TERMINAL_PROMPT=0 \
        APM_NO_SCRIPTS=1 "$work/apm-linux-$arch/apm" \
        install --frozen --target agent-skills --only apm)
    cp "$repo/skills/.licenses/yomiyasu.LICENSE" "$stage/.agents/skills/yomiyasu/LICENSE"
    # Deployed skills are copies; drop the dependency cache and staged sources.
    rm -rf -- "$stage/apm_modules" "$stage/.apm"
    mkdir "$stage/bin"
    tar -xzf "$work/rtk.tar.gz" -C "$stage/bin" rtk
    printf '%s\n' "$ref" > "$stage/SOURCE_REF"
    # Shared preferences without the workstation-only section, plus cloud notes.
    awk '/^## /{skip=($0 == "## Local Environment")} !skip' \
        "$repo/home/dot_agents/AGENTS.md" > "$work/AGENTS.md"
    cat "$repo/cloud/AGENTS.md" >> "$work/AGENTS.md"
    # Preflight every name before publishing. Only our exact link is replaceable.
    preflight() {
        for skill in "$stage"/.agents/skills/*; do
            [ -f "$skill/SKILL.md" ] || die "missing SKILL.md: $skill"
            name=${skill##*/}
            dest=$1/$name
            if [ -e "$dest" ] || [ -L "$dest" ]; then
                [ -L "$dest" ] && [ "$(readlink "$dest")" = "$data/current/.agents/skills/$name" ] || die "existing skill: $dest"
            fi
        done
    }
    preflight "$agents_skills"
    preflight "$claude/skills"
    # rtk is optional tooling: an unmanaged rtk at the link path stays as is.
    link_rtk=1
    if [ -e "$bin/rtk" ] || [ -L "$bin/rtk" ]; then
        [ -L "$bin/rtk" ] && [ "$(readlink "$bin/rtk")" = "$data/current/bin/rtk" ] || link_rtk=
    fi
    if [ -e "$data/current" ] || [ -L "$data/current" ]; then
        [ -L "$data/current" ] || die "existing deployment: $data/current"
        case $(readlink "$data/current") in "$data"/install.*) ;; *) die 'unrecognized current deployment' ;; esac
    fi
    mkdir -p "$agents_skills" "$claude/skills" "$codex" "$bin"
    # Copy seed files only when absent, including dangling user symlinks.
    seed() { [ -e "$2" ] || [ -L "$2" ] || cp "$1" "$2"; }
    seed "$work/AGENTS.md" "$codex/AGENTS.md"
    seed "$repo/cloud/codex/config.toml" "$codex/config.toml"
    seed "$work/AGENTS.md" "$claude/CLAUDE.md"
    ln -s "$stage" "$data/lock/current"
    mv -Tf "$data/lock/current" "$data/current"
    live=$stage
    stage= # The published generation must survive cleanup.
    publish() {
        for skill in "$data"/current/.agents/skills/*; do
            name=${skill##*/}
            [ -L "$1/$name" ] || ln -s "$data/current/.agents/skills/$name" "$1/$name"
        done
        for dest in "$1"/*; do
            [ -L "$dest" ] || continue
            name=${dest##*/}
            if [ "$(readlink "$dest")" = "$data/current/.agents/skills/$name" ] && [ ! -e "$dest" ]; then
                rm "$dest"
            fi
        done
    }
    publish "$agents_skills"
    publish "$claude/skills"
    if [ -z "$link_rtk" ]; then
        printf 'agent-cloud: keeping existing %s\n' "$bin/rtk" >&2
    elif [ ! -L "$bin/rtk" ]; then
        ln -s "$data/current/bin/rtk" "$bin/rtk"
    fi
    # Commit as the owner in every repository checked out under the working
    # directory. Repository-local user.* outranks the platform's ~/.gitconfig.
    # Cloud sessions skip ~/.claude/settings.json, so the rtk hook goes into
    # each repository's local settings, excluded from Git.
    git_root=${DOTFILES_GIT_ROOT:-$PWD}
    find "$git_root" -maxdepth 3 -name .git -prune -print |
        while IFS= read -r dotgit; do
            repo_dir=${dotgit%/.git}
            git -C "$repo_dir" config user.name "${DOTFILES_GIT_NAME:-hayatosc}"
            git -C "$repo_dir" config user.email "${DOTFILES_GIT_EMAIL:-145091553+hayatosc@users.noreply.github.com}"
            printf 'agent-cloud: set commit identity in %s\n' "$repo_dir"
            if [ -L "$repo_dir/.claude" ]; then
                printf 'agent-cloud: skipping symlinked %s\n' "$repo_dir/.claude" >&2
                continue
            fi
            mkdir -p "$repo_dir/.claude"
            seed "$repo/cloud/claude/settings.local.json" "$repo_dir/.claude/settings.local.json"
            if ! git -C "$repo_dir" check-ignore -q .claude/settings.local.json; then
                exclude=$(git -C "$repo_dir" rev-parse --path-format=absolute --git-path info/exclude)
                mkdir -p "$(dirname "$exclude")"
                printf '%s\n' /.claude/settings.local.json >> "$exclude"
            fi
        done
    # Links resolve through current, so superseded generations are unreferenced.
    for old in "$data"/install.*; do
        [ "$old" = "$live" ] || rm -rf -- "$old"
    done
    printf 'Agent cloud skills installed from %s\n' "$ref"
)
main "$@"
