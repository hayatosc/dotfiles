import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import rtkExtension from "../home/dot_pi/agent/extensions/rtk.ts";

async function loadExtension(rewrite) {
  const handlers = new Map();
  await rtkExtension({
    on: (name, handler) => handlers.set(name, handler),
    exec: async (command, args, options) => {
      assert.equal(command, "rtk");
      if (args[0] === "--version") {
        return { code: 0, stdout: "rtk 0.52.0", killed: false };
      }
      return rewrite(args, options);
    },
  });
  return handlers.get("tool_call");
}

for (const code of [0, 3]) {
  test(`rewrites bash input on RTK exit ${code} and preserves other inputs`, async () => {
    const handler = await loadExtension(async () => ({
      code, stdout: "rtk git status\n", killed: false,
    }));
    const event = { toolName: "bash", input: { command: "git status", timeout: 30 } };
    assert.equal(await handler(event, {}), undefined);
    assert.deepEqual(event.input, { command: "rtk git status", timeout: 30 });
  });
}

for (const result of [
  { code: 1, stdout: "" },
  { code: 2, stdout: "" },
  { code: 4, stdout: "rtk git status" },
  { code: 0, stdout: "" },
  { code: 0, stdout: "rtk git status", killed: true },
]) {
  test(`passes through when rewrite is unavailable: ${JSON.stringify(result)}`, async () => {
    const handler = await loadExtension(async () => result);
    const event = { toolName: "bash", input: { command: "git status" } };
    assert.equal(await handler(event, {}), undefined);
    assert.equal(event.input.command, "git status");
  });
}

test("skips other tools, empty input, explicit RTK commands, and disabled mode", async (t) => {
  const handler = await loadExtension(async () => assert.fail("must not invoke RTK"));
  for (const event of [
    { toolName: "read", input: { path: "README.md" } },
    { toolName: "bash", input: { command: "  " } },
    { toolName: "bash", input: { command: "rtk proxy git status" } },
  ]) {
    const original = structuredClone(event);
    await handler(event, {});
    assert.deepEqual(event, original);
  }
  const previous = process.env.RTK_DISABLED;
  t.after(() => {
    if (previous === undefined) delete process.env.RTK_DISABLED;
    else process.env.RTK_DISABLED = previous;
  });
  process.env.RTK_DISABLED = "1";
  const event = { toolName: "bash", input: { command: "git status" } };
  await handler(event, {});
  assert.equal(event.input.command, "git status");
});

test("rewrite errors do not block bash execution", async (t) => {
  t.mock.method(console, "warn", () => {});
  const handler = await loadExtension(async () => { throw new Error("rtk unavailable"); });
  const event = { toolName: "bash", input: { command: "git status" } };
  assert.equal(await handler(event, {}), undefined);
  assert.equal(event.input.command, "git status");
});

for (const version of [{ code: 127, stdout: "" }, { code: 0, stdout: "rtk 0.22.0" }]) {
  test(`disables rewriting when RTK is missing or too old: ${JSON.stringify(version)}`, async (t) => {
    t.mock.method(console, "warn", () => {});
    const handlers = new Map();
    await rtkExtension({
      on: (name, handler) => handlers.set(name, handler),
      exec: async () => version,
    });
    assert.equal(handlers.has("tool_call"), false);
    let status;
    handlers.get("session_start")({}, { ui: { setStatus: (_key, text) => { status = text; } } });
    assert.match(status, /^RTK disabled:/);
  });
}

test("uses the working RTK binary to rewrite without executing the original command", async () => {
  const handler = await loadExtension(async (args, options) => {
    const result = spawnSync("rtk", args, { encoding: "utf8", timeout: options.timeout });
    if (result.error) throw result.error;
    return { code: result.status, stdout: result.stdout, killed: !!result.signal };
  });
  for (const [command, expected] of [
    ["git status", "rtk git status"],
    ["git status && git diff --stat", "rtk git status && rtk git diff --stat"],
    ["printf hello", "printf hello"],
    ["rtk proxy git status", "rtk proxy git status"],
  ]) {
    const event = { toolName: "bash", input: { command } };
    await handler(event, {});
    assert.equal(event.input.command, expected);
  }
});
