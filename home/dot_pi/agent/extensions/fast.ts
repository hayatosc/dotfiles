import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent"

function isOpenAI(ctx: ExtensionContext): boolean {
  return ctx.model?.provider === "openai" || ctx.model?.provider === "openai-codex"
}

export default function (pi: ExtensionAPI) {
  let enabled = false

  const reset = (_event: unknown, ctx: ExtensionContext) => {
    enabled = false
    ctx.ui.setStatus("fast", undefined)
  }

  pi.on("session_start", reset)
  pi.on("model_select", reset)

  pi.registerCommand("fast", {
    description: "Toggle OpenAI fast mode (/fast [on|off|status])",
    handler: async (args, ctx) => {
      if (!isOpenAI(ctx)) {
        ctx.ui.notify("Fast mode is only available for OpenAI models.", "error")
        return
      }

      const action = args.trim().toLowerCase()
      if (!["", "on", "off", "status"].includes(action)) {
        ctx.ui.notify("Usage: /fast [on|off|status]", "error")
        return
      }

      if (action !== "status") {
        enabled = action === "" ? !enabled : action === "on"
      }
      ctx.ui.setStatus("fast", enabled ? "Fast: priority requested" : undefined)
      ctx.ui.notify(
        enabled
          ? "Fast mode ON: priority processing requested. Higher costs or usage limits apply; Pi's cost estimate may not reflect the tier."
          : "Fast mode OFF.",
        enabled ? "warning" : "info",
      )
    },
  })

  // Patch only the outgoing payload, without replacing the provider or its authentication.
  pi.on("before_provider_request", (event, ctx) => {
    if (!enabled || !isOpenAI(ctx)) return
    if (typeof event.payload !== "object" || event.payload === null || Array.isArray(event.payload)) return
    return { ...event.payload, service_tier: "priority" }
  })
}
