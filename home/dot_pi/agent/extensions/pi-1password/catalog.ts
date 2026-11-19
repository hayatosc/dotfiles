import type { Api, AnyModel, Model, Provider, RefreshModelsContext } from "@earendil-works/pi-ai";

type CatalogModel<TApi extends Api> = ReturnType<NonNullable<Provider<TApi>["getAllModels"]>>[number];

const DEFAULT_CATALOG_BASE_URL = "https://pi.dev";
const REMOTE_CATALOG_ATTEMPT_TIMEOUT_MS = 4000;
const REMOTE_CATALOG_REFRESH_INTERVAL_MS = 4 * 60 * 60 * 1000;
const REMOTE_CATALOG_MODEL_TYPES = ["chat", "image", "classifier"] as const;

type CatalogEntry = NonNullable<RefreshModelsContext["stored"]>;

function getModelType(model: AnyModel): string {
	return model.type ?? "chat";
}

function isSupportedModelType(entry: Record<string, unknown>): boolean {
	return entry.type === undefined || (typeof entry.type === "string" && (REMOTE_CATALOG_MODEL_TYPES as readonly string[]).includes(entry.type));
}

function mergeModels<T extends AnyModel>(baseline: readonly T[], dynamic: readonly T[]): T[] {
	const merged = new Map<string, T>();
	for (const model of [...baseline, ...dynamic]) {
		merged.set(`${getModelType(model)}\0${model.id}`, model);
	}
	return [...merged.values()];
}

function parseCatalog(providerId: string, value: unknown): AnyModel[] {
	const entries = Array.isArray(value)
		? value
		: typeof value === "object" && value !== null && "models" in value && Array.isArray(value.models)
			? value.models
			: typeof value === "object" && value !== null
				? Object.values(value)
				: undefined;
	if (!entries) {
		throw new Error(`Invalid model catalog for provider "${providerId}"`);
	}
	return entries
		.filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null && "id" in entry)
		.filter(isSupportedModelType)
		.map((model) => ({ ...model, provider: providerId }) as AnyModel);
}

async function readCatalog(providerId: string, response: Response): Promise<CatalogEntry> {
	const lastModified = Date.parse(response.headers.get("last-modified") ?? "");
	return {
		models: parseCatalog(providerId, await response.json()),
		lastModified: Number.isNaN(lastModified) ? 0 : lastModified,
		etag: response.headers.get("etag") ?? undefined,
	};
}

export interface RemoteCatalogOptions {
	catalogBaseUrl?: string;
	fetchFn?: typeof fetch;
}

/**
 * Re-attaches Pi's remote catalog overlay (`models-store.json` + `pi.dev`) to a
 * static `builtinProviders()` instance before `pi.registerProvider(provider)` overrides
 * Pi's built-in wrapped provider.
 */
export function withRemoteCatalog<TApi extends Api = Api>(
	provider: Provider<TApi>,
	options: RemoteCatalogOptions = {},
): Provider<TApi> & { readonly refreshModelsAuth: "configured" } {
	const catalogBaseUrl = options.catalogBaseUrl ?? DEFAULT_CATALOG_BASE_URL;
	const fetchFn = options.fetchFn ?? fetch;
	let dynamicModels: CatalogModel<TApi>[] = [];

	const getAllModels = (): readonly CatalogModel<TApi>[] =>
		mergeModels(provider.getAllModels?.() ?? provider.getModels(), dynamicModels);

	const getModels = (): readonly Model<TApi>[] =>
		mergeModels(
			provider.getModels(),
			dynamicModels.filter((model): model is Model<TApi> => getModelType(model) === "chat"),
		);

	return {
		...provider,
		getModels,
		getAllModels,
		refreshModelsAuth: "configured",
		refreshModels: async (context: RefreshModelsContext) => {
			const stored = context.stored;
			const restored = (stored?.models ?? []).filter((model): model is CatalogModel<TApi> => model.provider === provider.id);
			if (!(await context.publish({ update: () => { dynamicModels = restored; } }))) {
				return;
			}
			if (!context.allowNetwork || context.signal.aborted) {
				return;
			}
			if (
				!context.force &&
				stored?.checkedAt !== undefined &&
				stored.lastModified !== undefined &&
				Date.now() - stored.checkedAt < REMOTE_CATALOG_REFRESH_INTERVAL_MS
			) {
				return;
			}

			const url = new URL(`/api/models/providers/${encodeURIComponent(provider.id)}`, catalogBaseUrl);
			url.searchParams.set("types", REMOTE_CATALOG_MODEL_TYPES.join(","));
			const validator = stored && stored.models.length > 0 ? stored.etag : undefined;
			const signal = AbortSignal.any([context.signal, AbortSignal.timeout(REMOTE_CATALOG_ATTEMPT_TIMEOUT_MS)]);
			const response = await fetchFn(url, {
				headers: {
					accept: "application/json",
					...(validator ? { "if-none-match": validator } : {}),
				},
				signal,
			});
			if (context.signal.aborted) {
				return;
			}

			const checkedAt = Date.now();
			if (response.status === 304 && stored) {
				await context.publish({ persist: { ...stored, checkedAt } });
				return;
			}
			if (response.status === 404 || response.status === 501) {
				await context.publish({
					persist: {
						...(stored ?? { models: [] }),
						checkedAt,
						lastModified: 0,
						etag: undefined,
					},
				});
				return;
			}
			if (!response.ok) {
				await context.publish({ persist: { ...(stored ?? { models: [] }), checkedAt } });
				throw new Error(`Model catalog request failed for ${provider.id}: ${response.status}`);
			}

			const catalog = await readCatalog(provider.id, response);
			if (context.signal.aborted) {
				return;
			}
			const entry: CatalogEntry = { ...catalog, checkedAt };
			const published = entry.models.filter((model): model is CatalogModel<TApi> => model.provider === provider.id);
			await context.publish({
				persist: entry,
				update: () => {
					dynamicModels = published;
				},
			});
		},
	};
}
