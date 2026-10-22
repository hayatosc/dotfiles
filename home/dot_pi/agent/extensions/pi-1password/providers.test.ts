import assert from "node:assert/strict";
import test from "node:test";
import { builtinProviders } from "@earendil-works/pi-ai/providers/all";
import type { ProviderBinding } from "./config.ts";
import { providerBindings } from "./config.ts";
import { wrapProvider } from "./index.ts";

const providers = builtinProviders();

test("configured bindings refer to distinct native providers with the expected auth methods", () => {
	assert.equal(new Set(providerBindings.map((binding) => binding.providerId)).size, providerBindings.length);
	for (const binding of providerBindings) {
		const provider = providers.find((provider) => provider.id === binding.providerId);
		assert.ok(provider);
		const wrapped = wrapProvider(provider, binding);
		assert.equal(wrapped.id, provider.id);
		assert.equal(typeof wrapped.getModels, "function");
		assert.equal(wrapped.getModels, provider.getModels);
		assert.equal(wrapped.getAllModels, provider.getAllModels);
		assert.equal(wrapped.stream, provider.stream);
		assert.equal(wrapped.streamSimple, provider.streamSimple);
		assert.equal(wrapped.baseUrl, provider.baseUrl);
		assert.equal(wrapped.headers, provider.headers);
		if (binding.type === "oauth") {
			assert.notEqual(wrapped.auth.oauth, provider.auth.oauth);
			assert.equal(wrapped.auth.apiKey, provider.auth.apiKey);
		} else {
			assert.notEqual(wrapped.auth.apiKey, provider.auth.apiKey);
			assert.equal(wrapped.auth.oauth, provider.auth.oauth);
		}
	}
});

test("new native providers can be wrapped with only a new binding", () => {
	for (const providerId of ["anthropic", "google"]) {
		const provider = providers.find((provider) => provider.id === providerId);
		assert.ok(provider);
		const binding: ProviderBinding = { providerId, type: "api_key", secret: { vault: "test", item: providerId, field: "credential" } };
		const wrapped = wrapProvider(provider, binding);
		assert.equal(wrapped.getModels, provider.getModels);
		assert.equal(wrapped.auth.apiKey?.name, provider.auth.apiKey?.name);
	}
});

test("mismatched provider bindings and unsupported auth methods are rejected", () => {
	const provider = providers.find((provider) => provider.id === "opencode-go");
	assert.ok(provider);
	const secret = { vault: "test", item: "test", field: "credential" };
	assert.throws(() => wrapProvider(provider, { providerId: "wrong-provider", type: "api_key", secret }), /do not match/);
	assert.throws(() => wrapProvider(provider, { providerId: provider.id, type: "oauth", secret }), /no native OAuth/);
});
