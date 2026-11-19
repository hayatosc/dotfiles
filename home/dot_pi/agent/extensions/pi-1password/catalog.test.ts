import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { RefreshModelsContext } from "@earendil-works/pi-ai";
import { builtinProviders } from "@earendil-works/pi-ai/providers/all";
import { ModelRuntime } from "@earendil-works/pi-coding-agent";
import { withRemoteCatalog } from "./catalog.ts";
import { providerBindings } from "./config.ts";
import { wrapProvider } from "./index.ts";

const openai = builtinProviders().find((provider) => provider.id === "openai");
assert.ok(openai);
const sampleModel = openai.getModels()[0];
assert.ok(sampleModel);

function createContext(
	overrides: Partial<RefreshModelsContext> = {},
): { context: RefreshModelsContext; persisted: Array<NonNullable<RefreshModelsContext["stored"]>> } {
	const persisted: Array<NonNullable<RefreshModelsContext["stored"]>> = [];
	const context: RefreshModelsContext = {
		stored: undefined,
		allowNetwork: false,
		signal: new AbortController().signal,
		async publish(publication) {
			if (publication.persist) persisted.push(publication.persist);
			publication.update?.();
			return true;
		},
		...overrides,
	};
	return { context, persisted };
}

test("withRemoteCatalog restores models from stored catalog and keeps chat filtering", async () => {
	const wrapped = withRemoteCatalog(openai);
	const baseCount = openai.getModels().length;
	const newChatModel = { ...sampleModel, id: "gpt-6.2-astra", name: "GPT-6.2 Astra" };
	const newImageModel = { ...sampleModel, id: "gpt-image-next", name: "GPT Image Next", api: "openai-images" as const, output: ["image" as const], type: "image" as const };
	const unrelatedModel = { ...sampleModel, id: "other-model", provider: "other-provider" };

	const { context } = createContext({
		stored: {
			models: [newChatModel, newImageModel, unrelatedModel],
			lastModified: Date.now(),
		},
	});
	await wrapped.refreshModels?.(context);

	const chatIds = wrapped.getModels().map((model) => model.id);
	const allIds = wrapped.getAllModels?.().map((model) => model.id) ?? [];
	assert.equal(wrapped.getModels().length, baseCount + 1);
	assert.ok(chatIds.includes("gpt-6.2-astra"));
	assert.ok(!chatIds.includes("gpt-image-next"));
	assert.ok(!chatIds.includes("other-model"));
	assert.ok(allIds.includes("gpt-image-next"));
});

test("withRemoteCatalog fetches remote models, sends etag, and handles 304", async () => {
	const requests: Array<{ url: string; ifNoneMatch: string | null }> = [];
	let mode: "ok" | "not-modified" = "ok";
	const fetchedModel = { ...sampleModel, id: "gpt-6.2-astra", name: "GPT-6.2 Astra" };

	const wrapped = withRemoteCatalog(openai, {
		catalogBaseUrl: "https://example.test",
		fetchFn: async (input, init) => {
			const headers = new Headers(init?.headers);
			requests.push({ url: String(input), ifNoneMatch: headers.get("if-none-match") });
			if (mode === "not-modified") {
				return new Response(null, { status: 304 });
			}
			return new Response(JSON.stringify({ models: [fetchedModel] }), {
				status: 200,
				headers: {
					"content-type": "application/json",
					etag: 'W/"abc123"',
					"last-modified": "Wed, 19 Nov 2026 14:00:00 GMT",
				},
			});
		},
	});

	const first = createContext({ allowNetwork: true, force: true });
	await wrapped.refreshModels?.(first.context);
	assert.equal(requests.length, 1);
	assert.equal(requests[0].url, "https://example.test/api/models/providers/openai?types=chat%2Cimage%2Cclassifier");
	assert.equal(requests[0].ifNoneMatch, null);
	assert.equal(first.persisted.length, 1);
	assert.equal(first.persisted[0].etag, 'W/"abc123"');
	assert.ok(wrapped.getModels().some((model) => model.id === "gpt-6.2-astra"));

	mode = "not-modified";
	const second = createContext({
		allowNetwork: true,
		force: true,
		stored: first.persisted[0],
	});
	await wrapped.refreshModels?.(second.context);
	assert.equal(requests.length, 2);
	assert.equal(requests[1].ifNoneMatch, 'W/"abc123"');
	assert.equal(second.persisted.length, 1);
	assert.equal(second.persisted[0].models.length, 1);
});

test("ModelRuntime restores stored catalog models when wrapped with 1Password auth", async () => {
	const directory = mkdtempSync(join(tmpdir(), "pi-1password-catalog-"));
	try {
		const authPath = join(directory, "auth.json");
		const storePath = join(directory, "models-store.json");
		writeFileSync(
			storePath,
			JSON.stringify({
				openai: {
					models: [{ ...sampleModel, id: "gpt-6.2-astra", name: "GPT-6.2 Astra" }],
					lastModified: Date.now(),
					checkedAt: Date.now(),
				},
			}),
		);

		const runtime = await ModelRuntime.create({
			authPath,
			modelsPath: join(directory, "models.json"),
			modelsStorePath: storePath,
			refreshOnCreate: false,
		});
		const binding = providerBindings.find((entry) => entry.providerId === "openai");
		assert.ok(binding);

		runtime.registerNativeProvider(wrapProvider(withRemoteCatalog(openai), binding));
		await runtime.refresh({ allowNetwork: false });

		const model = runtime.getModel("openai", "gpt-6.2-astra");
		assert.ok(model);
		assert.equal(model.name, "GPT-6.2 Astra");
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});
