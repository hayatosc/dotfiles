import assert from "node:assert/strict"
import { test, type TestContext } from "node:test"
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent"
import tokensPerSecondExtension from "../toks.ts"

function harness(t: TestContext) {
  let now = 0
  t.mock.method(performance, "now", () => now)
  let status: string | undefined
  let notification = ""
  type Handler = (event: unknown, ctx: ExtensionContext) => void
  const handlers = new Map<string, Handler>()
  let command: (args: string, ctx: ExtensionContext) => Promise<void>
  // The extension only uses these members of the host API and UI.
  const ctx = {
    ui: {
      theme: { fg: (_color: string, text: string) => text },
      setStatus: (_key: string, text: string | undefined) => { status = text },
      notify: (text: string) => { notification = text },
    },
  } as unknown as ExtensionContext
  tokensPerSecondExtension({
    on: (name: string, handler: Handler) => { handlers.set(name, handler) },
    registerCommand: (_name: string, options: { handler: typeof command }) => { command = options.handler },
  } as unknown as ExtensionAPI)
  const emit = (name: string, at: number, event: unknown = {}) => {
    now = at
    handlers.get(name)?.(event, ctx)
  }
  return {
    emit,
    start: (at = 0) => emit("message_start", at, { message: { role: "assistant" } }),
    update: (at: number, type: string, delta = "", output = 0) => emit("message_update", at, {
      assistantMessageEvent: { type, delta }, message: { usage: { output } },
    }),
    end: (at: number, output = 0) => emit("message_end", at, {
      message: { role: "assistant", usage: { output } },
    }),
    command: async (action: string) => { await command(action, ctx); return notification },
    status: () => status,
  }
}

test("measures content only, ignoring metadata, TTFT and trailing usage latency", async (t) => {
  const h = harness(t)
  h.start()
  h.update(100, "start")
  h.update(500, "text_start")
  h.update(500, "text_delta", "a".repeat(200))
  h.update(2500, "text_delta", "b".repeat(200))
  h.update(3000, "text_end")
  h.end(4000, 100)
  assert.equal(h.status(), "⚡ 50.0 tok/s (100t in 2.0s) · session 50.0 tok/s")
  assert.match(await h.command("stats"), /TTFT: 0.50s/)
})

test("uses a trailing window instead of the whole response for live speed", (t) => {
  const h = harness(t)
  h.start()
  h.update(0, "text_start")
  h.update(0, "text_delta", "a".repeat(4))
  h.update(1000, "text_delta", "a".repeat(4))
  h.update(2000, "text_delta", "a".repeat(400))
  h.update(2500, "text_delta", "a".repeat(200))
  assert.equal(h.status(), "⚡ ~100.0 tok/s · avg ~60.8 tok/s (152 tok) · session ~60.8 tok/s")
})

test("includes the preceding stall when a buffered burst arrives", (t) => {
  const h = harness(t)
  h.start()
  h.update(0, "text_delta", "a".repeat(80))
  h.update(5000, "text_delta", "a".repeat(2000))
  assert.match(h.status()!, /~100.0 tok\/s/)
})

test("does not freeze live counts at stale reported usage", (t) => {
  const h = harness(t)
  h.start()
  h.update(0, "thinking_delta", "a".repeat(40), 1)
  h.update(1000, "text_delta", "b".repeat(40), 1)
  assert.match(h.status()!, /\(20 tok\)/)
  h.end(1100, 30)
  assert.equal(h.status(), "⚡ 30.0 tok/s (30t in 1.0s) · session 30.0 tok/s")
})

test("zero or absent final usage preserves an explicitly estimated count", (t) => {
  const h = harness(t)
  h.start()
  h.update(0, "text_delta", "a".repeat(40))
  h.update(1000, "text_delta", "b".repeat(40))
  h.end(1200)
  assert.equal(h.status(), "⚡ ~20.0 tok/s (20t in 1.0s) · session ~20.0 tok/s")
})

test("counts thinking and all tool arguments but not empty or metadata events", (t) => {
  const h = harness(t)
  h.start()
  h.update(0, "thinking_delta", "a".repeat(40))
  h.update(500, "toolcall_delta", "b".repeat(40))
  h.update(750, "toolcall_end")
  h.update(1000, "toolcall_delta", "c".repeat(40))
  h.update(1200, "text_delta")
  h.end(2000)
  assert.equal(h.status(), "⚡ ~30.0 tok/s (30t in 1.0s) · session ~30.0 tok/s")
})

test("estimates UTF-8 output without treating a Japanese character as ASCII", (t) => {
  const h = harness(t)
  h.start()
  h.update(0, "text_delta", "あ".repeat(4))
  h.update(1000, "text_delta", "い".repeat(4))
  h.end(1000)
  assert.equal(h.status(), "⚡ ~6.0 tok/s (6t in 1.0s) · session ~6.0 tok/s")
})

test("short responses remain finite and duplicate message_end is ignored", async (t) => {
  const h = harness(t)
  h.start()
  h.update(0, "text_delta", "a")
  h.end(0, 1)
  assert.equal(h.status(), "⚡ 10.0 tok/s (1t in 0.1s) · session 10.0 tok/s")
  h.end(1000, 1)
  assert.match(await h.command("stats"), /Responses: 1/)
})

test("does not invent a speed for a response without content timing", async (t) => {
  const h = harness(t)
  h.start()
  h.update(100, "start")
  h.end(1000, 20)
  assert.equal(h.status(), undefined)
  assert.match(await h.command("stats"), /Responses: 0/)
})

test("excludes tool execution and next-response TTFT from the weighted average", async (t) => {
  const h = harness(t)
  h.start()
  h.update(0, "text_delta", "a")
  h.update(2000, "text_delta", "a")
  h.end(2200, 100)
  h.start(10000)
  h.update(15000, "toolcall_delta", "a")
  h.update(17000, "toolcall_delta", "a")
  h.end(18000, 200)
  assert.match(await h.command("stats"), /Average Speed: 75.0 tok\/s/)
  assert.equal(h.status(), "⚡ 100.0 tok/s (200t in 2.0s) · session 75.0 tok/s")
})

test("reset preserves an active response and session_start clears old metrics", async (t) => {
  const h = harness(t)
  h.start()
  h.update(0, "text_delta", "a")
  await h.command("reset")
  h.update(1000, "text_delta", "a")
  h.end(1000, 100)
  assert.match(await h.command("stats"), /Responses: 1/)
  h.emit("session_start", 2000)
  assert.equal(h.status(), undefined)
  assert.match(await h.command("stats"), /Responses: 0/)
})

test("off hides the monitor without disabling measurement; on restores it", async (t) => {
  const h = harness(t)
  await h.command("off")
  h.start()
  h.update(0, "text_delta", "a")
  h.update(1000, "text_delta", "a")
  h.end(1200, 100)
  assert.equal(h.status(), undefined)
  await h.command("on")
  assert.equal(h.status(), "⚡ 100.0 tok/s (100t in 1.0s) · session 100.0 tok/s")
})

test("session speed weights unequal durations and reconciles the active estimate", (t) => {
  const h = harness(t)
  h.start()
  h.update(0, "text_delta", "a")
  h.update(1000, "text_delta", "a")
  h.end(1000, 100)
  h.start(10000)
  assert.match(h.status()!, /session 100.0 tok\/s/)
  h.update(11000, "text_start")
  h.update(11000, "text_delta", "a".repeat(400))
  h.update(14000, "text_delta", "a".repeat(400))
  assert.match(h.status()!, /avg ~66.7 tok\/s/)
  assert.match(h.status()!, /session ~75.0 tok\/s/)
  h.end(15000, 500)
  assert.match(h.status()!, /session 150.0 tok\/s/)
})

test("session retains the estimate marker until reset when any usage is missing", async (t) => {
  const h = harness(t)
  h.start()
  h.update(0, "text_delta", "a".repeat(40))
  h.update(1000, "text_delta", "a".repeat(40))
  h.end(1000)
  h.start(2000)
  h.update(2000, "text_delta", "a")
  h.update(3000, "text_delta", "a")
  h.end(3000, 100)
  assert.match(h.status()!, /session ~60.0 tok\/s/)
  assert.match(await h.command("stats"), /Average Speed: ~60.0 tok\/s/)
  await h.command("reset")
  h.start(4000)
  h.update(4000, "text_delta", "a")
  h.update(5000, "text_delta", "a")
  h.end(5000, 100)
  assert.match(h.status()!, /session 100.0 tok\/s/)
})
