import { Plugin } from "@opencode/plugin"
import { spawnSync } from "node:child_process"

// RTK OpenCode plugin — rewrites commands to use rtk for token savings.
// Requires: rtk >= 0.23.0 in PATH.
//
// This is a thin delegating plugin: all rewrite logic lives in `rtk rewrite`,
// which is the single source of truth (src/discover/registry.rs).
// To add or change rewrite rules, edit the Rust registry — not this file.

export default Plugin.define({
  id: "rtk",
  async setup(ctx) {
    const check = spawnSync("which", ["rtk"], { stdio: "ignore" })
    if (check.status !== 0) {
      console.warn("[rtk] rtk binary not found in PATH — plugin disabled")
      return
    }

    ctx.tool.hook("execute.before", async (event) => {
      const tool = String(event.tool ?? "").toLowerCase()
      if (tool !== "bash" && tool !== "shell") return

      const input = event.input
      if (!input || typeof input !== "object") return

      const command = (input as Record<string, unknown>).command
      if (typeof command !== "string" || !command) return

      try {
        const res = spawnSync("rtk", ["rewrite", command], { encoding: "utf8", timeout: 2000 })
        const rewritten = res.stdout ? res.stdout.trim() : ""
        if (rewritten && rewritten !== command && (res.status === 0 || res.status === 3)) {
          ;(input as Record<string, unknown>).command = rewritten
        }
      } catch {
        // rtk rewrite failed — pass through unchanged
      }
    })
  },
})
