import assert from "node:assert/strict";
import test from "node:test";
import fastExtension from "../home/dot_pi/agent/extensions/fast.ts";

function loadExtension(provider = "openai") {
  const handlers = new Map();
  const commands = new Map();
  const notifications = [];
  let status;
  const ctx = {
    model: provider ? { provider, id: "test-model" } : undefined,
    ui: {
      notify: (message, type) => notifications.push({ message, type }),
      setStatus: (key, value) => {
        assert.equal(key, "fast");
        status = value;
      },
    },
  };
  fastExtension({
    on: (name, handler) => handlers.set(name, handler),
    registerCommand: (name, command) => commands.set(name, command),
  });
  return {
    ctx, notifications,
    command: (args = "") => commands.get("fast").handler(args, ctx),
    request: (payload) => handlers.get("before_provider_request")({ payload }, ctx),
    emit: (name) => handlers.get(name)({}, ctx),
    status: () => status,
  };
}

for (const provider of ["openai", "openai-codex"]) {
  test(`${provider}: starts off, toggles priority on/off, preserves request fields`, async () => {
    const app = loadExtension(provider);
    const payload = { model: "test-model", stream: true, reasoning: { effort: "high" } };
    const original = structuredClone(payload);
    assert.equal(app.request(payload), undefined);
    await app.command();
    assert.deepEqual(app.request(payload), { ...payload, service_tier: "priority" });
    assert.deepEqual(payload, original);
    assert.match(app.status(), /priority requested/);
    assert.equal(app.notifications.at(-1).type, "warning");
    await app.command();
    assert.equal(app.request(payload), undefined);
    assert.equal(app.status(), undefined);
  });
}

test("explicit on/off are idempotent; status and invalid arguments do not change mode", async () => {
  const app = loadExtension();
  for (const args of ["on", " ON ", "status", "invalid"]) {
    await app.command(args);
    assert.equal(app.request({}).service_tier, "priority");
  }
  assert.equal(app.notifications.at(-1).type, "error");
  for (const args of ["off", "off", "status"]) {
    await app.command(args);
    assert.equal(app.request({}), undefined);
  }
});

for (const provider of ["anthropic", "google", "openrouter", "azure", "openai-compatible", undefined]) {
  test(`rejects commands and leaves payloads untouched for ${provider ?? "no model"}`, async () => {
    const app = loadExtension();
    await app.command("on");
    app.ctx.model = provider ? { provider, id: "gpt-test" } : undefined;
    for (const args of ["", "on", "off", "status"]) {
      await app.command(args);
      assert.equal(app.notifications.at(-1).type, "error");
      assert.match(app.notifications.at(-1).message, /only available for OpenAI/);
      assert.equal(app.request({}), undefined);
    }
  });
}

for (const event of ["session_start", "model_select"]) {
  test(`${event} resets fast mode`, async () => {
    const app = loadExtension();
    await app.command("on");
    app.emit(event);
    assert.equal(app.status(), undefined);
    assert.equal(app.request({}), undefined);
  });
}

test("enabled mode overrides a configured tier without mutating it; off leaves it alone", async () => {
  const app = loadExtension();
  const payload = { service_tier: "flex" };
  await app.command("on");
  assert.deepEqual(app.request(payload), { service_tier: "priority" });
  assert.equal(payload.service_tier, "flex");
  await app.command("off");
  assert.equal(app.request(payload), undefined);
});

test("ignores unexpected payload shapes", async () => {
  const app = loadExtension();
  await app.command("on");
  for (const payload of [null, undefined, "text", 1, []]) {
    assert.equal(app.request(payload), undefined);
  }
});
