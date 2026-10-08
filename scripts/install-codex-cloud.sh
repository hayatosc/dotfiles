#!/bin/sh
# curl -fsSL <this URL> | sh
main() (
    set -eu
    die() { printf 'codex-cloud: %s\n' "$*" >&2; exit 1; }
    [ "$#" -eq 0 ] || die 'this installer takes no arguments'
    [ "$(uname -s)" = Linux ] || die 'Linux is required'
    for tool in curl tar sha256sum git mktemp readlink; do
        command -v "$tool" >/dev/null 2>&1 || die "required tool missing: $tool"
    done
    # Source inputs and official APM release are independently pinned.
    ref=26cb6e7534d05149847048d32e30a7d1970c7812
    case $(uname -m) in
        x86_64) arch=x86_64; checksum=e6374402c74318f7c8bef97a90d8572d049fdab0dc3871492c6b0647ae9e881f ;;
        aarch64) arch=arm64; checksum=ac40dd0efd1af35a56847beedde96854530d2f54851e026728da017d3af827f8 ;;
        *) die 'supported architectures: x86_64 and aarch64' ;;
    esac
    codex=${CODEX_HOME:-$HOME/.codex}
    data=${XDG_DATA_HOME:-$HOME/.local/share}/dotfiles-codex-cloud
    skills=$HOME/.agents/skills
    for path in "$codex" "$data" "$skills"; do
        case $path in /*) ;; *) die "absolute path required: $path" ;; esac
        while [ "$path" != / ] && [ "${path%/}" != "$path" ]; do path=${path%/}; done
        while [ "$path" != / ]; do
            [ ! -L "$path" ] || die "symlinked destination: $path"
            path=$(dirname "$path")
        done
    done
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
    tar -xzf "$work/source.tar.gz" -C "$work"
    repo=$work/dotfiles-$ref
    fetch "https://github.com/microsoft/apm/releases/download/v0.33.0/apm-linux-$arch.tar.gz" "$work/apm.tar.gz"
    printf '%s  %s\n' "$checksum" "$work/apm.tar.gz" | sha256sum -c -
    tar -xzf "$work/apm.tar.gz" -C "$work"
    mkdir -p "$stage/.apm/skills" "$work/home"
    cp "$repo/skills/apm.yml" "$repo/skills/apm.lock.yaml" "$stage/"
    for skill in "$repo"/skills/*/SKILL.md; do
        cp -R "$(dirname "$skill")" "$stage/.apm/skills/"
    done
    # Native APM owns dependency resolution, frozen-lock validation, and staging.
    # Use a disposable HOME; don't load user Git credentials or lifecycle scripts.
    (cd "$stage" && env -i PATH="$PATH" HOME="$work/home" \
        HTTPS_PROXY="${HTTPS_PROXY:-}" HTTP_PROXY="${HTTP_PROXY:-}" NO_PROXY="${NO_PROXY:-}" \
        SSL_CERT_FILE="${SSL_CERT_FILE:-}" SSL_CERT_DIR="${SSL_CERT_DIR:-}" \
        GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null GIT_TERMINAL_PROMPT=0 \
        APM_NO_SCRIPTS=1 "$work/apm-linux-$arch/apm" \
        install --frozen --target agent-skills --only apm)
    cp "$repo/skills/.licenses/yomiyasu.LICENSE" "$stage/.agents/skills/yomiyasu/LICENSE"
    # Preflight every name before publishing. Only our exact link is replaceable.
    for skill in "$stage"/.agents/skills/*; do
        [ -f "$skill/SKILL.md" ] || die "missing SKILL.md: $skill"
        name=${skill##*/}
        dest=$skills/$name
        if [ -e "$dest" ] || [ -L "$dest" ]; then
            [ -L "$dest" ] && [ "$(readlink "$dest")" = "$data/current/.agents/skills/$name" ] || die "existing skill: $dest"
        fi
    done
    if [ -e "$data/current" ] || [ -L "$data/current" ]; then
        [ -L "$data/current" ] || die "existing deployment: $data/current"
        case $(readlink "$data/current") in "$data"/install.*) ;; *) die 'unrecognized current deployment' ;; esac
    fi
    mkdir -p "$skills" "$codex"
    # Copy seed files only when absent, including dangling user symlinks.
    for name in AGENTS.md config.toml; do
        if [ ! -e "$codex/$name" ] && [ ! -L "$codex/$name" ]; then
            cp "$repo/cloud/codex/$name" "$codex/$name"
        fi
    done
    ln -s "$stage" "$data/lock/current"
    mv -Tf "$data/lock/current" "$data/current"
    stage= # The published generation must survive cleanup.
    for skill in "$data"/current/.agents/skills/*; do
        name=${skill##*/}
        [ -L "$skills/$name" ] || ln -s "$data/current/.agents/skills/$name" "$skills/$name"
    done
    for dest in "$skills"/*; do
        [ -L "$dest" ] || continue
        name=${dest##*/}
        if [ "$(readlink "$dest")" = "$data/current/.agents/skills/$name" ] && [ ! -e "$dest" ]; then
            rm "$dest"
        fi
    done
    printf 'Codex cloud skills installed from %s\n' "$ref"
)
main "$@"
