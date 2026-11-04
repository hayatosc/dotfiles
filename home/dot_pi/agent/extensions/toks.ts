import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent"

interface GenerationMetrics {
  tokens: number
  startTime: number
  firstTokenTime: number
  endTime: number
  ttftSec: number
  genDurationSec: number
  totalDurationSec: number
  tokPerSec: number
  estimated: boolean
}

interface SessionMetrics {
  totalRuns: number
  totalTokens: number
  totalGenDurationSec: number
  peakTokPerSec: number
  hasEstimates: boolean
  lastMetrics?: GenerationMetrics
}

const STATUS_KEY = "toks"

export default function tokensPerSecondExtension(pi: ExtensionAPI) {
  let enabled = true
  let isGenerating = false
  let startTime = 0
  let firstTokenTime: number | undefined
  let lastTokenTime: number | undefined
  let streamedBytes = 0
  let currentTokens = 0
  let lastStatusUpdate = -Infinity
  let samples: { time: number; tokens: number; since: number }[] = []
  const encoder = new TextEncoder()

  const sessionMetrics: SessionMetrics = {
    totalRuns: 0,
    totalTokens: 0,
    totalGenDurationSec: 0,
    peakTokPerSec: 0,
    hasEstimates: false,
  }

  function formatSessionAverage(ctx: ExtensionContext, tokens = 0, durationSec = 0, estimated = false): string {
    // Weight by decoding duration, not by response count; exclude tool/idle time.
    const totalDuration = sessionMetrics.totalGenDurationSec + durationSec
    if (totalDuration <= 0) return ""
    const average = (sessionMetrics.totalTokens + tokens) / totalDuration
    const prefix = estimated || sessionMetrics.hasEstimates ? "~" : ""
    return ctx.ui.theme.fg("dim", ` · session ${prefix}${average.toFixed(1)} tok/s`)
  }

  function formatStatus(
    ctx: ExtensionContext,
    speed: number,
    tokens: number,
    durationSec: number,
    isStreaming: boolean,
    estimated = isStreaming,
  ): string {
    const theme = ctx.ui.theme
    const icon = theme.fg("accent", "⚡")
    const speedStr = theme.fg(
      isStreaming ? "warning" : "success",
      `${estimated ? "~" : ""}${speed.toFixed(1)} tok/s`,
    )
    const details = isStreaming
      ? theme.fg("dim", `· avg ~${(tokens / durationSec).toFixed(1)} tok/s (${tokens} tok)`)
      : theme.fg("dim", `(${tokens}t in ${durationSec.toFixed(1)}s)`)

    const sessionAverage = isStreaming
      ? formatSessionAverage(ctx, tokens, durationSec, true)
      : formatSessionAverage(ctx)
    return `${icon} ${speedStr} ${details}${sessionAverage}`
  }

  function updateStatus(ctx: ExtensionContext, text: string | undefined) {
    if (!enabled) {
      ctx.ui.setStatus(STATUS_KEY, undefined)
      return
    }
    ctx.ui.setStatus(STATUS_KEY, text)
  }

  function resetState() {
    isGenerating = false
    startTime = 0
    firstTokenTime = undefined
    lastTokenTime = undefined
    streamedBytes = 0
    currentTokens = 0
    lastStatusUpdate = -Infinity
    samples = []
  }

  function resetMetrics() {
    sessionMetrics.totalRuns = 0
    sessionMetrics.totalTokens = 0
    sessionMetrics.totalGenDurationSec = 0
    sessionMetrics.peakTokPerSec = 0
    sessionMetrics.hasEstimates = false
    sessionMetrics.lastMetrics = undefined
  }

  pi.on("session_start", (_event, ctx) => {
    resetState()
    resetMetrics()
    updateStatus(ctx, undefined)
  })

  pi.on("message_start", (event, ctx) => {
    if (event.message.role !== "assistant") return
    resetState()
    isGenerating = true
    startTime = performance.now()
    const theme = ctx.ui.theme
    updateStatus(ctx, `${theme.fg("accent", "⚡")} ${theme.fg("dim", "streaming...")}${formatSessionAverage(ctx)}`)
  })

  pi.on("message_update", (event, ctx) => {
    if (!isGenerating) return

    const content = event.assistantMessageEvent
    const now = performance.now()
    if (content.type === "text_start" || content.type === "thinking_start" || content.type === "toolcall_start") {
      firstTokenTime ??= now
      return
    }
    if (content.type !== "text_delta" && content.type !== "thinking_delta" && content.type !== "toolcall_delta") return
    if (!content.delta) return

    firstTokenTime ??= now
    // Deltas are chunks, not tokens. This byte heuristic is only a live estimate;
    // cumulative provider usage can remain stale until message_end.
    streamedBytes += encoder.encode(content.delta).length
    const tokens = Math.max(1, Math.round(streamedBytes / 4))
    const since = lastTokenTime ?? firstTokenTime
    samples.push({ time: now, tokens: tokens - currentTokens, since })
    currentTokens = tokens
    lastTokenTime = now
    samples = samples.filter((sample) => sample.time >= now - 1000)

    // Throttle rendering, not measurement. Include the preceding gap when a
    // buffered burst arrives after a stall, rather than reporting a huge spike.
    if (now - lastStatusUpdate >= 80) {
      lastStatusUpdate = now
      const windowTokens = samples.reduce((total, sample) => total + sample.tokens, 0)
      const duration = Math.max(100, now - samples[0].since) / 1000
      const genDuration = Math.max(100, now - firstTokenTime) / 1000
      updateStatus(ctx, formatStatus(ctx, windowTokens / duration, currentTokens, genDuration, true))
    }
  })

  pi.on("message_end", (event, ctx) => {
    if (event.message.role !== "assistant") return
    if (!isGenerating) return

    const now = performance.now()
    const output = event.message.usage?.output
    const estimated = !(typeof output === "number" && Number.isFinite(output) && output > 0)
    const finalTokens = estimated ? currentTokens : output
    if (finalTokens <= 0 || firstTokenTime === undefined || lastTokenTime === undefined) {
      resetState()
      updateStatus(ctx, undefined)
      return
    }
    const totalDurationSec = (now - startTime) / 1000
    const ttftSec = (firstTokenTime - startTime) / 1000
    // Usage delivery and stream teardown are not decoding time. Sub-100ms
    // responses have limited timing precision, so use a 100ms timing floor.
    const genDurationSec = Math.max(100, lastTokenTime - firstTokenTime) / 1000
    const tokPerSec = finalTokens / genDurationSec

    const metrics: GenerationMetrics = {
      tokens: finalTokens,
      startTime,
      firstTokenTime,
      endTime: now,
      ttftSec,
      genDurationSec,
      totalDurationSec,
      tokPerSec,
      estimated,
    }

    if (finalTokens > 0) {
      sessionMetrics.totalRuns++
      sessionMetrics.hasEstimates ||= estimated
      sessionMetrics.totalTokens += finalTokens
      sessionMetrics.totalGenDurationSec += genDurationSec
      sessionMetrics.peakTokPerSec = Math.max(sessionMetrics.peakTokPerSec, tokPerSec)
      sessionMetrics.lastMetrics = metrics
    }

    isGenerating = false
    updateStatus(ctx, formatStatus(ctx, tokPerSec, finalTokens, genDurationSec, false, estimated))
  })

  pi.registerCommand("tok", {
    description: "Inspect or toggle tokens/second (tok/s) monitor: /tok [on|off|stats|reset]",
    getArgumentCompletions: (prefix) => {
      const options = ["stats", "on", "off", "reset"]
      const filtered = options.filter((o) => o.startsWith(prefix))
      return filtered.length > 0 ? filtered.map((o) => ({ value: o, label: o })) : null
    },
    handler: async (args, ctx) => {
      const action = args.trim().toLowerCase()

      if (action === "off") {
        enabled = false
        ctx.ui.setStatus(STATUS_KEY, undefined)
        ctx.ui.notify("tok/s monitor disabled", "info")
        return
      }

      if (action === "on") {
        enabled = true
        if (sessionMetrics.lastMetrics) {
          const m = sessionMetrics.lastMetrics
          updateStatus(ctx, formatStatus(ctx, m.tokPerSec, m.tokens, m.genDurationSec, false, m.estimated))
        } else {
          updateStatus(ctx, `${ctx.ui.theme.fg("accent", "⚡")} ${ctx.ui.theme.fg("dim", "ready")}`)
        }
        ctx.ui.notify("tok/s monitor enabled", "info")
        return
      }

      if (action === "reset") {
        resetMetrics()
        // Keep an in-flight measurement intact when clearing completed runs.
        updateStatus(ctx, undefined)
        ctx.ui.notify("tok/s session metrics reset", "info")
        return
      }

      // Default or "stats": show detailed statistics
      const last = sessionMetrics.lastMetrics
      const avgSpeed = sessionMetrics.totalGenDurationSec > 0
        ? (sessionMetrics.totalTokens / sessionMetrics.totalGenDurationSec).toFixed(1)
        : "0.0"

      const lines = [
        `tok/s Monitor: ${enabled ? "Enabled" : "Disabled"}`,
        `Current Model: ${ctx.model?.id ?? "unknown"}`,
        "",
        "--- Last Generation ---",
        last
          ? `Speed: ${last.estimated ? "~" : ""}${last.tokPerSec.toFixed(1)} tok/s (${last.tokens} tokens in ${last.genDurationSec.toFixed(2)}s, TTFT: ${last.ttftSec.toFixed(2)}s)`
          : "None yet",
        "",
        "TTFT: assistant message start to first content (excludes earlier request setup)",
        "Live: trailing 1s speed; avg: current response; session: all responses including the active one",
        "Averages: total output / total content duration (exclude TTFT, tools and idle time)",
        "~ marks estimates; final response counts use provider usage when available",
        "Timing floor: 100ms; buffering can hide server decoding speed",
        "",
        "--- Session Aggregate (includes estimates when usage is unavailable) ---",
        `Responses: ${sessionMetrics.totalRuns}`,
        `Total Tokens: ${sessionMetrics.totalTokens.toLocaleString()}`,
        `Average Speed: ${sessionMetrics.hasEstimates ? "~" : ""}${avgSpeed} tok/s`,
        `Peak Speed: ${sessionMetrics.peakTokPerSec.toFixed(1)} tok/s`,
      ]

      ctx.ui.notify(lines.join("\n"), "info")
    },
  })
}
