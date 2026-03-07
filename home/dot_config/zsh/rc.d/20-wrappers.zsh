# ghq wrapper: register cloned repos in zoxide
function ghq() {
  command ghq "$@"
  local status=$?
  if [[ "$1" == "get" && $status -eq 0 ]]; then
    local repo="${@[-1]}"
    local full_path
    full_path=$(command ghq list --full-path "$repo" 2>/dev/null | head -1)
    [[ -n "$full_path" ]] && zoxide add "$full_path"
  fi
  return $status
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

  for arg in "$@"; do
    case "$arg" in
      --)
        break
        ;;
      -*)
        ;;
      *)
        subcommand="$arg"
        break
        ;;
    esac
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
