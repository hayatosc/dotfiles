# Shared mise initialization for login and interactive zsh shells.

if command -v mise >/dev/null 2>&1; then
    eval "$(mise activate zsh)"
elif [ -x "$HOME/.local/bin/mise" ]; then
    eval "$("$HOME/.local/bin/mise" activate zsh)"
fi
