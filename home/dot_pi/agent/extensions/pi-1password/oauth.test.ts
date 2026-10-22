import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { OAuthAuth, OAuthCredential, ProviderAuthInteraction } from "@earendil-works/pi-ai";
import { builtinProviders } from "@earendil-works/pi-ai/providers/all";
import { ModelRuntime } from "@earendil-works/pi-coding-agent";
import { validateOpenAI } from "./config.ts";
import { parseCredential, referenceCredential, withOnePasswordOAuth, type OAuthStore } from "./oauth.ts";

const reference = "op://test-vault/any-provider/credential";
const asReference = (value: OAuthCredential) => referenceCredential(value, reference);

function credential(expires = Date.now() + 3600000): OAuthCredential {
	// Deliberately omit OpenAI-specific metadata to prove the wrapper is generic.
	return { type: "oauth", access: "test-access", refresh: "test-refresh", expires, providerMetadata: { preserved: true } };
}

function fixture(initial = credential()) {
	let saved = initial;
	let refreshes = 0;
	let writes = 0;
	const refreshed = { ...credential(), access: "rotated-access", refresh: "rotated-refresh" };
	const store: OAuthStore = {
		async read(signal) { signal?.throwIfAborted(); return structuredClone(saved); },
		async write(value) { saved = structuredClone(value); writes++; },
	};
	const oauth: OAuthAuth = {
		name: "Test OAuth", isSubscription: true, loginLabel: "Test login",
		async login() { return credential(); },
		async refresh(current, signal) {
			signal.throwIfAborted();
			assert.deepEqual(current, saved);
			refreshes++;
			return refreshed;
		},
		async toAuth(current) { return { apiKey: current.access }; },
	};
	return { store, oauth, refreshed, saved: () => saved, refreshes: () => refreshes, writes: () => writes };
}

const interaction: ProviderAuthInteraction = {
	signal: new AbortController().signal,
	notify() {},
	async prompt() { throw new Error("Unexpected prompt"); },
};

test("generic OAuth parsing preserves provider metadata and rejects invalid JSON without leaking it", () => {
	assert.throws(() => parseCredential("PRIVATE-TOKEN"), { message: "1Password OAuth credential is not valid JSON" });
	assert.throws(() => parseCredential(JSON.stringify({ ...credential(), access: "" })), /complete OAuth credential/);
	const value = credential();
	assert.deepEqual(parseCredential(JSON.stringify(value)), value);
});

test("only the configured OpenAI validator requires client and subscription scopes", () => {
	assert.throws(() => parseCredential(JSON.stringify(credential()), validateOpenAI), /complete OpenAI OAuth/);
	const value = { ...credential(), clientId: "test-client", scopes: ["chatgpt.tokens.use.direct"] };
	assert.deepEqual(parseCredential(JSON.stringify(value), validateOpenAI), value);
	assert.throws(() => parseCredential(JSON.stringify({ ...value, scopes: [] }), validateOpenAI), /complete OpenAI OAuth/);
});

test("reference credentials contain no tokens or provider metadata", () => {
	assert.deepEqual(asReference(credential(123)), { type: "oauth", access: "", refresh: reference, expires: 123 });
});

test("request auth comes from the complete vault credential, not the reference", async () => {
	const f = fixture();
	f.oauth.toAuth = async (current) => {
		assert.deepEqual(current, f.saved());
		return { apiKey: current.access };
	};
	const wrapped = withOnePasswordOAuth(f.oauth, reference, f.store);
	assert.equal(wrapped.isSubscription, true);
	assert.deepEqual(await wrapped.toAuth(asReference(f.saved())), { apiKey: "test-access" });
	assert.equal(f.writes(), 0);
});

test("refresh writes rotated tokens before returning only a reference", async () => {
	const f = fixture(credential(1));
	const wrapped = withOnePasswordOAuth(f.oauth, reference, f.store);
	assert.deepEqual(await wrapped.refresh(asReference(f.saved()), interaction.signal), asReference(f.refreshed));
	assert.deepEqual(f.saved(), f.refreshed);
	assert.equal(f.refreshes(), 1);
	assert.equal(f.writes(), 1);
});

test("a newer vault token is reused instead of refreshing twice", async () => {
	const f = fixture();
	const wrapped = withOnePasswordOAuth(f.oauth, reference, f.store);
	assert.deepEqual(await wrapped.refresh(asReference(credential(1)), interaction.signal), asReference(f.saved()));
	assert.equal(f.refreshes(), 0);
	assert.equal(f.writes(), 0);
});

test("login persists the full credential and returns a reference", async () => {
	const f = fixture();
	const wrapped = withOnePasswordOAuth(f.oauth, reference, f.store);
	assert.deepEqual(await wrapped.login(interaction, { agentName: "Pi" }), asReference(f.saved()));
	assert.equal(f.writes(), 1);
});

test("a failed write is retried without rotating the refresh token again", async () => {
	const f = fixture(credential(1));
	const write = f.store.write;
	let fail = true;
	f.store.write = async (value) => {
		if (fail) throw new Error("Vault unavailable");
		await write(value);
	};
	const wrapped = withOnePasswordOAuth(f.oauth, reference, f.store);
	const local = asReference(f.saved());
	await assert.rejects(wrapped.refresh(local, interaction.signal), /Vault unavailable/);
	fail = false;
	assert.deepEqual(await wrapped.refresh(local, interaction.signal), asReference(f.refreshed));
	assert.equal(f.refreshes(), 1);
});

test("vault errors, wrong references, and cancelled refreshes fail closed", async () => {
	const f = fixture();
	const wrapped = withOnePasswordOAuth(f.oauth, reference, f.store);
	await assert.rejects(wrapped.refresh(asReference(f.saved()), AbortSignal.abort()), { name: "AbortError" });
	assert.equal(f.refreshes(), 0);
	f.store.read = async () => { throw new Error("Vault locked"); };
	await assert.rejects(wrapped.toAuth(asReference(f.saved())), /Vault locked/);
	await assert.rejects(wrapped.toAuth(credential()), /reload Pi to migrate/);
	await assert.rejects(wrapped.toAuth(referenceCredential(f.saved(), "op://wrong/item/field")), /reload Pi to migrate/);
});

test("native ModelRuntime resolves vault auth and never persists real tokens", async () => {
	const directory = await mkdtemp(join(tmpdir(), "pi-oauth-runtime-"));
	try {
		const path = join(directory, "auth.json");
		const f = fixture(credential(1));
		await writeFile(path, JSON.stringify({ openai: asReference(f.saved()) }), { mode: 0o600 });
		const runtime = await ModelRuntime.create({ authPath: path, modelsPath: null, modelsStorePath: join(directory, "models-cache.json"), refreshOnCreate: false });
		const provider = builtinProviders().find((provider) => provider.id === "openai");
		assert.ok(provider);
		runtime.registerNativeProvider({ ...provider, auth: { ...provider.auth, oauth: withOnePasswordOAuth(f.oauth, reference, f.store) } });
		const resolved = await runtime.getAuth("openai", { minOAuthValidityMs: 300000 });
		assert.equal(resolved?.auth.apiKey, "rotated-access");
		assert.equal(resolved?.source, "OAuth");
		assert.deepEqual(JSON.parse(await readFile(path, "utf8")).openai, asReference(f.refreshed));
		assert.equal(f.refreshes(), 1);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});
