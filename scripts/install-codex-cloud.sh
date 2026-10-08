#!/bin/sh
# POSIX launcher: curl -fsSL <this URL> | sh (no arguments).
# Keep the reviewed payload commit and its entrypoint checksum together.
main() (
    set -eu
    die() { printf 'codex-cloud: %s\n' "$*" >&2; exit 1; }
    [ "$#" -eq 0 ] || die "this launcher takes no arguments; pin its URL to a commit for reproducible installation"
    for tool in curl mktemp python3 bash uname; do
        command -v "$tool" >/dev/null 2>&1 || die "required tool missing: $tool"
    done
    [ "$(uname -s)" = Linux ] || die "this installer is for Linux Codex cloud sessions"
    python3 -I -c 'import sys; assert sys.version_info >= (3, 11), "Python 3.11+ is required"'
    work=$(mktemp -d)
    trap 'rm -rf -- "$work"' 0
    trap 'exit 130' INT
    trap 'exit 143' TERM

    ref=260e8ffa0f642c78a2dcefc2402af791a804f3f0
    checksum=31f6baf87e8227b79111814ffa3594fe64244d0ef3c7789de5e24cda6e6515f0
    curl -q --fail --show-error --silent --location --proto '=https' --proto-redir '=https' \
        "https://raw.githubusercontent.com/hayatosc/dotfiles/$ref/scripts/install-codex-cloud-payload.sh" \
        -o "$work/payload.sh"
    python3 -I -c 'import hashlib, pathlib, sys; actual=hashlib.sha256(pathlib.Path(sys.argv[1]).read_bytes()).hexdigest(); actual == sys.argv[2] or sys.exit("codex-cloud: pinned installer checksum mismatch")' \
        "$work/payload.sh" "$checksum"
    # The complete, verified payload requires Bash. It checks its own bytes
    # against the repository archive at this same immutable ref.
    bash "$work/payload.sh" --ref "$ref"
)

# Defining the function has no installation side effects during pipe parsing.
main "$@"
