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
