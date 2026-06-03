# Shared mise initialization for login and interactive zsh shells.

if command -v mise >/dev/null 2>&1; then
    eval "$(mise activate zsh)"
elif [ -x "$HOME/.local/bin/mise" ]; then
    eval "$("$HOME/.local/bin/mise" activate zsh)"
fi

# `mise activate` prepends managed tool bin dirs to PATH (including its own
# python), which shadows the python/python3 wrappers in ~/.local/bin. Re-prepend
# ~/.local/bin so the wrappers win. Do it both immediately (covers non-interactive
# login shells that never reach .zshrc) and via a precmd hook registered *after*
# mise's, since mise re-prepends its dirs on every prompt.
if [ -d "$HOME/.local/bin" ]; then
    _mise_local_bin_first() { path=("$HOME/.local/bin" ${path:#$HOME/.local/bin}) }
    _mise_local_bin_first
    autoload -Uz add-zsh-hook && add-zsh-hook precmd _mise_local_bin_first
fi
