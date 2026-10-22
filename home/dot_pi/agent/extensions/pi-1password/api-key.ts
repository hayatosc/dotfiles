import type { ApiKeyAuth } from "@earendil-works/pi-ai";
import { readSecret, type SecretReader } from "./op.ts";

export function withOnePasswordApiKey(apiKey: ApiKeyAuth, reference: string, read: SecretReader = readSecret): ApiKeyAuth {
	return {
		...apiKey,
		async login(interaction) {
			await read(reference, interaction.signal);
			return { type: "api_key", key: reference };
		},
		async check(input) {
			if (input.credential?.key) {
				return input.credential.key === reference ? { type: "api_key", source: "1Password" } : undefined;
			}
			if (apiKey.check) return apiKey.check(input);
			const result = await apiKey.resolve(input);
			return result ? { type: "api_key", source: result.source } : undefined;
		},
		async resolve(input) {
			if (!input.credential?.key) return apiKey.resolve(input);
			if (input.credential.key !== reference) {
				throw new Error("API key must use the configured 1Password reference; reload Pi to migrate");
			}
			const key = await read(reference, input.signal);
			const result = await apiKey.resolve({ ...input, credential: { ...input.credential, key } });
			return result ? { ...result, source: "1Password" } : undefined;
		},
	};
}
