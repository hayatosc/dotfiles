# ghq wrapper: register cloned repos in zoxide
function ghq() {
  command ghq "$@"
  local exit_code=$?
  if [[ "$1" == "get" && $exit_code -eq 0 ]]; then
    local repo="${@[-1]}"
    local full_path
    full_path=$(command ghq list --full-path "$repo" 2>/dev/null | head -1)
    [[ -n "$full_path" ]] && zoxide add "$full_path"
  fi
  return $exit_code
}

# yazi quick wrapper
function y() {
	local tmp="$(mktemp -t "yazi-cwd.XXXXXX")" cwd
	yazi "$@" --cwd-file="$tmp"
	IFS= read -r -d '' cwd < "$tmp"
	[ -n "$cwd" ] && [ "$cwd" != "$PWD" ] && builtin cd -- "$cwd"
	rm -f -- "$tmp"
}

# chezmoi wrapper: sync Codex config source after successful re-add
function chezmoi() {
  local subcommand=""
  local arg
  local index=1

  while (( index <= $# )); do
    arg="${@[$index]}"
    case "$arg" in
      --)
        break
        ;;
      --age-recipient|--age-recipient-file|--cache|--color|-c|--config|--config-format|-D|--destination|--mode|-o|--output|--override-data|--override-data-file|--persistent-state|--progress|-R|--refresh-externals|-S|--source|-W|--working-tree)
        (( index++ ))
        ;;
      --age-recipient=*|--age-recipient-file=*|--cache=*|--color=*|--config=*|--config-format=*|--destination=*|--mode=*|--output=*|--override-data=*|--override-data-file=*|--persistent-state=*|--progress=*|--refresh-externals=*|--source=*|--working-tree=*)
        ;;
      -*)
        ;;
      *)
        subcommand="$arg"
        break
        ;;
    esac
    (( index++ ))
  done

  command chezmoi "$@"
  local exit_code=$?

  if [[ "$subcommand" == "re-add" && $exit_code -eq 0 ]]; then
    if ! ~/.config/zsh/scripts/codex-sync-config.ts; then
      echo "warning: codex-sync-config failed after chezmoi re-add" >&2
    fi
  fi

  return $exit_code
}

# Python wrapper: run ad-hoc interactive snippets through uv-managed environments.
#
# Examples:
#   python <<'PY'
#   # /// script
#   # dependencies = ["requests"]
#   # ///
#   import requests
#   PY
#
#   PYTHON_WITH='requests rich' python -c 'import requests, rich'
#
# Escape hatch:
#   PYTHON_UV=0 python ...
function _uv_python() {
  local python_command="$1"
  shift

  if [[ "${PYTHON_UV:-1}" == "0" ]]; then
    command "$python_command" "$@"
    return
  fi

  if ! command -v uv >/dev/null 2>&1; then
    command "$python_command" "$@"
    return
  fi

  local -a uv_args
  uv_args=(--no-project --no-python-downloads)

  local package
  for package in ${(z)PYTHON_WITH:-}; do
    uv_args+=(--with "$package")
  done

  if [[ "${PYTHON_OFFLINE:-0}" == "1" ]]; then
    uv_args+=(--offline)
  fi

  if (( $# == 0 )) && [[ ! -t 0 ]]; then
    uv run "${uv_args[@]}" -
    return
  fi

  if [[ "${1:-}" == "-" ]]; then
    shift
    uv run "${uv_args[@]}" - "$@"
    return
  fi

  uv run "${uv_args[@]}" "$python_command" "$@"
}

function python() {
  _uv_python python "$@"
}

function python3() {
  _uv_python python3 "$@"
}
