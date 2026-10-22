import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { OAuthCredential } from "@earendil-works/pi-ai";
import { providerBindings, type ProviderBinding } from "./config.ts";
import { migrateAuthFile } from "./migrate.ts";
import { referenceCredential, type OAuthStore } from "./oauth.ts";
import { secretReference } from "./op.ts";

async function withAuthFile(run: (path: string) => Promise<void>) {
	const directory = await mkdtemp(join(tmpdir(), "pi-1password-migrate-"));
	try { await run(join(directory, "auth.json")); }
	finally { await rm(directory, { recursive: true, force: true }); }
}

const credential: OAuthCredential = {
	type: "oauth", access: "test-access", refresh: "test-refresh", expires: 123,
	clientId: "test-client", scopes: ["chatgpt.tokens.use.direct"],
};

function storeFixture() {
	let writes = 0;
	const store: OAuthStore = {
		async read() { return credential; },
		async write(current) { assert.deepEqual(current, credential); writes++; },
	};
	return { store, writes: () => writes };
}

test("migration converts configured providers and preserves unrelated credentials with mode 600", async () => {
	await withAuthFile(async (path) => {
		const f = storeFixture();
		const oauth = providerBindings.find((binding) => binding.type === "oauth");
		const apiKey = providerBindings.find((binding) => binding.type === "api_key");
		assert.ok(oauth && apiKey);
		const other = { type: "api_key", key: "unrelated-test-key" };
		const env = { TEST_ACCOUNT_ID: "preserved-account" };
		await writeFile(path, JSON.stringify({ [oauth.providerId]: credential, [apiKey.providerId]: { type: "api_key", key: apiKey.migrateFrom?.[0], env }, other }));
		await migrateAuthFile(path, providerBindings, { oauthStore: () => f.store, read: async (reference) => {
			assert.equal(reference, secretReference(apiKey.secret));
			return "test-api-key";
		} });
		const saved = JSON.parse(await readFile(path, "utf8"));
		assert.deepEqual(saved[oauth.providerId], referenceCredential(credential, secretReference(oauth.secret)));
		assert.deepEqual(saved[apiKey.providerId], { type: "api_key", key: secretReference(apiKey.secret), env });
		assert.deepEqual(saved.other, other);
		assert.equal((await stat(path)).mode & 0o777, 0o600);
		assert.equal(f.writes(), 1);
		await migrateAuthFile(path, providerBindings, { oauthStore: () => f.store, read: async () => { throw new Error("Already migrated"); } });
		assert.equal(f.writes(), 1);
	});
});

test("a newly configured OAuth provider migrates without OpenAI-specific assumptions", async () => {
	await withAuthFile(async (path) => {
		const binding: ProviderBinding = { providerId: "future-provider", type: "oauth", secret: { vault: "other-vault", item: "other-item", field: "tokens" } };
		const value: OAuthCredential = { type: "oauth", access: "future-access", refresh: "future-refresh", expires: 456, custom: "preserved" };
		let stored: OAuthCredential | undefined;
		await writeFile(path, JSON.stringify({ "future-provider": value }));
		await migrateAuthFile(path, [binding], { oauthStore: (actual) => {
			assert.deepEqual(actual, binding);
			return { async read() { return value; }, async write(current) { stored = current; } };
		} });
		assert.deepEqual(stored, value);
		assert.deepEqual(JSON.parse(await readFile(path, "utf8")), { "future-provider": { type: "oauth", access: "", refresh: "op://other-vault/other-item/tokens", expires: 456 } });
	});
});

test("API-only migration needs no OAuth credential and preserves the file on vault errors", async () => {
	await withAuthFile(async (path) => {
		const binding = providerBindings.find((binding) => binding.type === "api_key");
		assert.ok(binding);
		const original = JSON.stringify({ [binding.providerId]: { type: "api_key", key: binding.migrateFrom?.[0] } });
		await writeFile(path, original);
		await assert.rejects(migrateAuthFile(path, providerBindings, { read: async () => { throw new Error("Vault locked"); } }), /Vault locked/);
		assert.equal(await readFile(path, "utf8"), original);
		await migrateAuthFile(path, providerBindings, { read: async () => "test-key" });
		assert.deepEqual(JSON.parse(await readFile(path, "utf8")), { [binding.providerId]: { type: "api_key", key: secretReference(binding.secret) } });
	});
});

test("failed OAuth persistence leaves local credentials intact", async () => {
	await withAuthFile(async (path) => {
		const f = storeFixture();
		const original = JSON.stringify({ openai: credential });
		await writeFile(path, original);
		f.store.write = async () => { throw new Error("Write denied"); };
		await assert.rejects(migrateAuthFile(path, providerBindings, { oauthStore: () => f.store }), /Write denied/);
		assert.equal(await readFile(path, "utf8"), original);
	});
});

test("concurrent migrations share Pi's auth file lock", async () => {
	await withAuthFile(async (path) => {
		const f = storeFixture();
		await writeFile(path, JSON.stringify({ openai: credential }));
		const dependencies = { oauthStore: () => f.store };
		await Promise.all([migrateAuthFile(path, providerBindings, dependencies), migrateAuthFile(path, providerBindings, dependencies)]);
		assert.equal(f.writes(), 1);
	});
});

test("missing files and unrecognized API keys are not rewritten or executed", async () => {
	await withAuthFile(async (path) => {
		await migrateAuthFile(path, providerBindings);
		const original = JSON.stringify({ "opencode-go": { type: "api_key", key: "!unrecognized-command" } });
		await writeFile(path, original);
		await migrateAuthFile(path, providerBindings, { read: async () => { throw new Error("Must not execute arbitrary commands"); } });
		assert.equal(await readFile(path, "utf8"), original);
	});
});
