#!/usr/bin/env bash
# Internal Bash payload; called by the POSIX launcher with an immutable ref.
set -euo pipefail

die() { echo "codex-cloud: $*" >&2; exit 1; }
[[ $# == 2 && $1 == --ref && $2 =~ ^[0-9a-f]{40}$ ]] || die "usage: bash install-codex-cloud.sh --ref <40-character commit SHA>"
ref=$2
[[ -f ${BASH_SOURCE[0]} ]] || die "download the script to a file before executing it (see docs/codex-cloud.md)"
for tool in curl tar cmp mktemp python3; do
    command -v "$tool" >/dev/null || die "required tool missing: $tool"
done
python3 -I -c 'import sys, tarfile; assert sys.version_info >= (3, 11), "Python 3.11+ is required"; assert hasattr(tarfile, "data_filter"), "Python tarfile extraction filters are required"'
[[ -x /usr/bin/git ]] || die "required tool missing: /usr/bin/git"
[[ $(uname -s) == Linux ]] || die "this installer is for Linux Codex cloud sessions"
work=$(mktemp -d)
trap 'rm -rf -- "$work"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# -q prevents reading the user's curl configuration; HTTP failures stop setup.
curl -q --fail --show-error --silent --location --proto '=https' --proto-redir '=https' \
    "https://codeload.github.com/hayatosc/dotfiles/tar.gz/$ref" -o "$work/source.tar.gz"
tar -xzf "$work/source.tar.gz" -C "$work"
repo="$work/dotfiles-$ref"
cmp -s -- "${BASH_SOURCE[0]}" "$repo/scripts/install-codex-cloud-payload.sh" || \
    die "entrypoint differs from --ref; download the entrypoint from that exact commit"
python3 -I "$repo/scripts/codex_cloud.py" --ref "$ref"
