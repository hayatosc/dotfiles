import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { AuthContext, ProviderAuthInteraction } from "@earendil-works/pi-ai";
import { builtinProviders } from "@earendil-works/pi-ai/providers/all";
import { ModelRuntime } from "@earendil-works/pi-coding-agent";
import { withOnePasswordApiKey } from "./api-key.ts";

const native = builtinProviders().find((provider) => provider.id === "opencode-go");
assert.ok(native?.auth.apiKey);
const apiKey = native.auth.apiKey;
const reference = "op://test-vault/any-provider/credential";
const ctx: AuthContext = { async env() { return undefined; }, async fileExists() { return false; } };
const interaction: ProviderAuthInteraction = {
	signal: new AbortController().signal,
	notify() {},
	async prompt() { throw new Error("Must not prompt for or store a plaintext key"); },
};

test("API key references are configurable and resolved without mutating the local credential", async () => {
	const wrapped = withOnePasswordApiKey(apiKey, reference, async (location, signal) => {
		assert.equal(location, reference);
		assert.equal(signal, interaction.signal);
		return "test-opencode-key";
	});
	const credential = { type: "api_key", key: reference } as const;
	const result = await wrapped.resolve({ credential, ctx, signal: interaction.signal });
	assert.deepEqual(result?.auth, { apiKey: "test-opencode-key" });
	assert.equal(result?.source, "1Password");
	assert.equal(credential.key, reference);
});

test("API key login verifies the vault and returns only a reference", async () => {
	const wrapped = withOnePasswordApiKey(apiKey, reference, async () => "test-opencode-key");
	assert.deepEqual(await wrapped.login?.(interaction), { type: "api_key", key: reference });
});

test("API key availability checks do not read secrets", async () => {
	const wrapped = withOnePasswordApiKey(apiKey, reference, async () => { throw new Error("Must not read secrets during listing"); });
	const result = await wrapped.check?.({ credential: { type: "api_key", key: reference }, ctx, signal: interaction.signal });
	assert.equal(result?.type, "api_key");
});

test("unconfigured API keys preserve the native environment fallback", async () => {
	const wrapped = withOnePasswordApiKey(apiKey, reference, async () => { throw new Error("Unexpected vault read"); });
	assert.equal(await wrapped.resolve({ ctx, signal: interaction.signal }), undefined);
	const envCtx: AuthContext = { ...ctx, async env(name) { return name === "OPENCODE_API_KEY" ? "test-env-key" : undefined; } };
	assert.equal((await wrapped.resolve({ ctx: envCtx, signal: interaction.signal }))?.auth.apiKey, "test-env-key");
});

test("API key vault errors, cancellation, and unexpected local keys fail closed", async () => {
	const wrapped = withOnePasswordApiKey(apiKey, reference, async (_reference, signal) => {
		signal?.throwIfAborted();
		throw new Error("Vault unavailable");
	});
	const credential = { type: "api_key", key: reference } as const;
	await assert.rejects(wrapped.resolve({ credential, ctx, signal: interaction.signal }), /Vault unavailable/);
	await assert.rejects(wrapped.resolve({ credential, ctx, signal: AbortSignal.abort() }), { name: "AbortError" });
	await assert.rejects(wrapped.resolve({ credential: { type: "api_key", key: "unexpected-plaintext" }, ctx, signal: interaction.signal }), /reload Pi to migrate/);
});

test("different providers keep their references and native request headers isolated", async () => {
	for (const id of ["anthropic", "google", "opencode-go"]) {
		const provider = builtinProviders().find((provider) => provider.id === id);
		assert.ok(provider?.auth.apiKey);
		const location = `op://test-vault/${id}/credential`;
		const key = `test-${id}-key`;
		const input = { credential: { type: "api_key", key } as const, ctx, signal: interaction.signal };
		const expected = await provider.auth.apiKey.resolve(input);
		const wrapped = withOnePasswordApiKey(provider.auth.apiKey, location, async (actual) => {
			assert.equal(actual, location);
			return key;
		});
		const result = await wrapped.resolve({ ...input, credential: { type: "api_key", key: location } });
		assert.deepEqual(result, { ...expected, source: "1Password" });
	}
});

test("native ModelRuntime resolves OpenCode Go through the wrapper and persists no key", async () => {
	const directory = await mkdtemp(join(tmpdir(), "pi-1password-runtime-"));
	try {
		const path = join(directory, "auth.json");
		const original = JSON.stringify({ "opencode-go": { type: "api_key", key: reference } });
		await writeFile(path, original, { mode: 0o600 });
		const runtime = await ModelRuntime.create({ authPath: path, modelsPath: null, modelsStorePath: join(directory, "models-cache.json"), refreshOnCreate: false });
		runtime.registerNativeProvider({ ...native, auth: { ...native.auth, apiKey: withOnePasswordApiKey(apiKey, reference, async () => "test-opencode-key") } });
		const result = await runtime.getAuth("opencode-go");
		assert.equal(result?.auth.apiKey, "test-opencode-key");
		assert.equal(result?.source, "1Password");
		assert.equal(await readFile(path, "utf8"), original);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});
