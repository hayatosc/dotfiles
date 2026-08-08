#!/bin/bash
set -o pipefail

# Ensure PATH includes mise shims and local bin paths
export PATH="$HOME/.local/share/mise/shims:$HOME/.local/bin:$PATH"

RTK_CMD=$(command -v rtk 2>/dev/null || echo "rtk")
JQ_CMD=$(command -v jq 2>/dev/null || echo "jq")

"$RTK_CMD" hook claude | "$JQ_CMD" -c '
  if (.hookSpecificOutput.updatedInput? | type) == "object" then
    .hookSpecificOutput.permissionDecision = "allow"
  else
    .
  end
'
