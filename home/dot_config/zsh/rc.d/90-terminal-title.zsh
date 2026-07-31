# Set terminal title to running command in zsh preexec/precmd
function title_preexec() {
    # 実行するコマンドラインの最初の単語（コマンド名）を抽出
    local cmd="${1%% *}"
    # パス形式の場合はファイル名部分のみ取得
    cmd="${cmd##*/}"
    # エスケープシーケンス OSC 2 でターミナルタイトルを設定
    print -n "\e]2;${cmd}\a"
}

function title_precmd() {
    print -n "\e]2;zsh\a"
}

autoload -Uz add-zsh-hook
add-zsh-hook preexec title_preexec
add-zsh-hook precmd title_precmd
