#!/bin/bash
# Patch mise-moonbit post_install.lua to support both moon.mod.json (legacy)
# and moon.mod (new format) after chezmoi clones/refreshes the git-repo external.

set -euo pipefail

HOOK="${HOME}/.local/share/mise/plugins/moonbit/hooks/post_install.lua"

if [[ ! -f "${HOOK}" ]]; then
    echo "mise-moonbit hook not found, skipping patch: ${HOOK}"
    exit 0
fi

# Already patched?
if grep -q "Support both legacy moon.mod.json" "${HOOK}"; then
    exit 0
fi

# Insert comment + fallback block right after the manifest_path assignment line
awk '
/local manifest_path = core_dir \.\. "\/moon\.mod\.json"/ {
    print "    -- Support both legacy moon.mod.json and new moon.mod format"
    print $0
    print "    if os.execute(\"test -f \" .. sh_quote(manifest_path)) ~= 0 then"
    print "        manifest_path = core_dir .. \"/moon.mod\""
    print "    end"
    next
}
{ print }
' "${HOOK}" > "${HOOK}.tmp" && mv "${HOOK}.tmp" "${HOOK}"

echo "mise-moonbit: post_install.lua patched (moon.mod fallback added)"
