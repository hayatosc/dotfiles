import type { Provider } from "@earendil-works/pi-ai";
import { builtinProviders } from "@earendil-works/pi-ai/providers/all";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { join } from "node:path";
import { withOnePasswordApiKey } from "./api-key.ts";
import { providerBindings, type ProviderBinding } from "./config.ts";
import { migrateAuthFile } from "./migrate.ts";
import { createOAuthStore, withOnePasswordOAuth } from "./oauth.ts";
import { secretReference } from "./op.ts";

export function wrapProvider(provider: Provider, binding: ProviderBinding): Provider {
	if (provider.id !== binding.providerId) throw new Error("Provider and 1Password binding do not match");
	const reference = secretReference(binding.secret);
	if (binding.type === "oauth") {
		if (!provider.auth.oauth) throw new Error(`${binding.providerId} has no native OAuth implementation`);
		return { ...provider, auth: { ...provider.auth, oauth: withOnePasswordOAuth(provider.auth.oauth, reference, createOAuthStore(binding)) } };
	}
	if (!provider.auth.apiKey) throw new Error(`${binding.providerId} has no native API key implementation`);
	return { ...provider, auth: { ...provider.auth, apiKey: withOnePasswordApiKey(provider.auth.apiKey, reference) } };
}

export default async function (pi: ExtensionAPI) {
	const native = builtinProviders();
	const providers = providerBindings.map((binding) => {
		const provider = native.find((provider) => provider.id === binding.providerId);
		if (!provider) throw new Error(`Native provider not found: ${binding.providerId}`);
		return wrapProvider(provider, binding);
	});
	// Migrating a legacy credential also verifies the vault before replacing it.
	await migrateAuthFile(join(getAgentDir(), "auth.json"), providerBindings);
	for (const provider of providers) pi.registerProvider(provider);
}
