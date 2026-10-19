# WSL / Windows integration settings
if [[ -z "$WSL_DISTRO_NAME" ]]; then
  return 0
fi

# HACK: Start gnome-keyring-daemon for WSL2 (enables CLI token persistence)
# Temporary workaround for: https://discuss.ai.google.dev/t/bug-antigravity-cli-agy-fails-to-persist-authentication-state-in-wsl-2-environment/146059
# TODO: Remove once Antigravity CLI natively supports headless keyring or file-based token storage
if [[ -z "$DISPLAY" ]]; then
  export $(dbus-launch 2>/dev/null)
  eval "$(echo "" | gnome-keyring-daemon --unlock 2>/dev/null)"
  eval "$(gnome-keyring-daemon --start 2>/dev/null)"
  export SSH_AUTH_SOCK
fi

# Open URLs and files in the Windows default browser
export BROWSER="$HOME/.local/bin/xdg-open"
