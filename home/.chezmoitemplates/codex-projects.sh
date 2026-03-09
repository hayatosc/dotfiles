#!/bin/sh

set -eu

config_path=${1:?config path is required}
local_data_path=${2:-}

extract_from_config() {
  awk '
    /^[[:space:]]*\[[^][]+\][[:space:]]*(#.*)?$/ {
      header = $0
      sub(/^[[:space:]]*\[/, "", header)
      sub(/\][[:space:]]*(#.*)?$/, "", header)
      in_projects = (header ~ /^projects\."([^"\\]|\\.)*"$/)
    }
    in_projects { print }
  ' "$1"
}

extract_from_local_data() {
  awk '
    /^codex\.projects_toml = '\''\''\''[[:space:]]*$/ {
      capture = 1
      next
    }
    capture && /^'\''\''\''[[:space:]]*$/ {
      exit
    }
    capture { print }
  ' "$1"
}

if [ -f "$config_path" ]; then
  extract_from_config "$config_path"
elif [ -n "$local_data_path" ] && [ -f "$local_data_path" ]; then
  extract_from_local_data "$local_data_path"
fi
