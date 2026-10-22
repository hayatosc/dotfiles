import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { OAuthAuth, OAuthCredential } from "@earendil-works/pi-ai";
import type { OAuthBinding } from "./config.ts";
import { isRecord, runOp, secretReference } from "./op.ts";

const MINIMUM_VALIDITY_MS = 5 * 60 * 1000;

export function parseCredential(text: string, validate?: OAuthBinding["validate"]): OAuthCredential {
	let value: unknown;
	try { value = JSON.parse(text); } catch { throw new Error("1Password OAuth credential is not valid JSON"); }
	if (
		!isRecord(value) || value.type !== "oauth" ||
		typeof value.access !== "string" || !value.access ||
		typeof value.refresh !== "string" || !value.refresh ||
		typeof value.expires !== "number" || !Number.isFinite(value.expires)
	) throw new Error("1Password does not contain a complete OAuth credential");
	const credential: OAuthCredential = { ...value, type: "oauth", access: value.access, refresh: value.refresh, expires: value.expires };
	validate?.(credential);
	return credential;
}

export function referenceCredential(credential: OAuthCredential, reference: string): OAuthCredential {
	return { type: "oauth", access: "", refresh: reference, expires: credential.expires };
}

function requireReference(credential: OAuthCredential, reference: string): void {
	if (credential.access !== "" || credential.refresh !== reference) {
		throw new Error("OAuth credential must use the configured 1Password reference; reload Pi to migrate");
	}
}

export interface OAuthStore {
	read(signal?: AbortSignal): Promise<OAuthCredential>;
	write(credential: OAuthCredential): Promise<void>;
}

export function createOAuthStore(binding: OAuthBinding): OAuthStore {
	const { vault, item: itemId, field: fieldId } = binding.secret;
	return {
		async read(signal) {
			return parseCredential(await runOp(["read", secretReference(binding.secret)], signal), binding.validate);
		},
		async write(credential) {
			parseCredential(JSON.stringify(credential), binding.validate);
			const text = await runOp(["item", "get", itemId, "--vault", vault, "--format", "json"]);
			let item: unknown;
			try { item = JSON.parse(text); } catch { throw new Error("Invalid 1Password item JSON"); }
			if (!isRecord(item) || !Array.isArray(item.fields)) throw new Error("Invalid 1Password item structure");
			const field = item.fields.find((field: unknown) => isRecord(field) && field.id === fieldId);
			if (!isRecord(field) || field.type !== "CONCEALED") throw new Error("OAuth credential must be a concealed 1Password field");
			field.value = JSON.stringify(credential);
			const notes = item.fields.find((field: unknown) => isRecord(field) && field.id === "notesPlain");
			if (isRecord(notes)) notes.value = `${binding.providerId} OAuth credential managed by the pi-1password extension. Tokens are read from this item and written back after login or refresh. Not an API key.`;

			// op does not recognize Node's socket-backed stdin as piped JSON. Use a
			// private tmpfs template, never an argument, environment variable, or disk file.
			const directory = await mkdtemp("/dev/shm/pi-1password-oauth-");
			try {
				const template = join(directory, "item.json");
				await writeFile(template, JSON.stringify(item), { mode: 0o600, flag: "wx" });
				await runOp(["item", "edit", itemId, "--vault", vault, "--template", template, "--format", "json"]);
				const saved = await this.read();
				if (JSON.stringify(saved) !== JSON.stringify(parseCredential(JSON.stringify(credential), binding.validate))) {
					throw new Error("1Password OAuth write verification failed");
				}
			} finally {
				await rm(directory, { recursive: true, force: true });
			}
		},
	};
}

export function withOnePasswordOAuth(oauth: OAuthAuth, secretReferenceValue: string, store: OAuthStore): OAuthAuth {
	// Retain a rotated token in memory if persistence fails so the same process
	// can retry the write instead of reusing an invalidated refresh token.
	let pending: OAuthCredential | undefined;
	const persist = async (credential: OAuthCredential) => {
		pending = credential;
		// Once a token has rotated, persist it even if the original request was cancelled.
		await store.write(credential);
		pending = undefined;
		return referenceCredential(credential, secretReferenceValue);
	};
	return {
		...oauth,
		async login(interaction, options) {
			return persist(await oauth.login(interaction, options));
		},
		async refresh(reference, signal) {
			requireReference(reference, secretReferenceValue);
			if (pending) return persist(pending);
			const current = await store.read(signal);
			// Another process may have refreshed and saved the vault item already.
			if (current.expires > reference.expires && current.expires > Date.now() + MINIMUM_VALIDITY_MS) {
				return referenceCredential(current, secretReferenceValue);
			}
			return persist(await oauth.refresh(current, signal));
		},
		async toAuth(reference) {
			requireReference(reference, secretReferenceValue);
			if (pending) await persist(pending);
			return oauth.toAuth(await store.read());
		},
	};
}
