#!/bin/bash
set -euo pipefail

if ! command -v apt-get >/dev/null 2>&1; then
    echo "apt-get not found; skipping build-essential installation."
    exit 0
fi

sudo apt-get update && sudo apt-get install -y build-essential
