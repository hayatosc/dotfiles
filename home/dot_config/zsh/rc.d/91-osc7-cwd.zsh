# Report the working directory to the terminal via OSC 7.
# Without it, WezTerm on Windows falls back to the cwd of the wsl.exe process
# (a Windows path), so new tabs/panes start in /mnt/c/... instead of the
# directory the current pane is actually in.
function osc7_cwd() {
    emulate -L zsh -o extendedglob
    # C locale so multibyte paths are percent-encoded byte by byte
    local LC_ALL=C
    local encoded=${PWD//(#m)[^[:alnum:]\/._~-]/%${(l:2::0:)$(([##16]#MATCH))}}
    print -n "\e]7;file://${HOST}${encoded}\e\\"
}

autoload -Uz add-zsh-hook
add-zsh-hook chpwd osc7_cwd
osc7_cwd
