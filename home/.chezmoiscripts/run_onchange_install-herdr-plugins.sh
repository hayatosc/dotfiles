#!/bin/bash
set -euo pipefail

# Check if herdr command exists
if ! command -v herdr &> /dev/null; then
    echo "herdr is not installed. Skipping plugin installation."
    exit 0
fi

echo "Installing/updating herdr plugins..."

# List of plugins to manage
# Re-run the script if this list changes (via run_onchange_ prefix)
PLUGINS=(
    "persiyanov/herdr-reviewr"
)

for plugin in "${PLUGINS[@]}"; do
    echo "Installing ${plugin}..."
    herdr plugin install "${plugin}" --yes
done
