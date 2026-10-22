import type { OAuthCredential } from "@earendil-works/pi-ai";
import type { SecretLocation } from "./op.ts";

interface SecretBinding {
	providerId: string;
	secret: SecretLocation;
}

export interface ApiKeyBinding extends SecretBinding {
	type: "api_key";
	/** Exact legacy command strings that may be replaced without executing them. */
	migrateFrom?: readonly string[];
}

export interface OAuthBinding extends SecretBinding {
	type: "oauth";
	/** Provider-specific metadata required in addition to the standard token fields. */
	validate?: (credential: OAuthCredential) => void;
}

export type ProviderBinding = ApiKeyBinding | OAuthBinding;

export function validateOpenAI(credential: OAuthCredential): void {
	if (
		typeof credential.clientId !== "string" || !credential.clientId ||
		!Array.isArray(credential.scopes) || !credential.scopes.every((scope) => typeof scope === "string") ||
		!credential.scopes.includes("chatgpt.tokens.use.direct")
	) throw new Error("1Password does not contain a complete OpenAI OAuth credential");
}

// Add a binding here to reuse the native provider's models, transport, and auth flow.
export const providerBindings: readonly ProviderBinding[] = [
	{
		providerId: "openai",
		type: "oauth",
		secret: { vault: "se3eb3uxlsudn7iaovhnd5rhme", item: "vkrcbb5m7izub6iv5ffc2loehe", field: "credential" },
		validate: validateOpenAI,
	},
	{
		providerId: "opencode-go",
		type: "api_key",
		secret: { vault: "se3eb3uxlsudn7iaovhnd5rhme", item: "els2royogfchhan5dtsygmt7l4", field: "credential" },
		migrateFrom: ['!op read "op://dev/OpenCode/credential"'],
	},
];
