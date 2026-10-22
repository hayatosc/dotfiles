import { mkdir, readFile, rename, rm, unlink, utimes, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { randomUUID } from "node:crypto";
import type { OAuthBinding, ProviderBinding } from "./config.ts";
import { isRecord, readSecret, secretReference, type SecretReader } from "./op.ts";
import { createOAuthStore, parseCredential, referenceCredential, type OAuthStore } from "./oauth.ts";

export interface MigrationDependencies {
	read?: SecretReader;
	oauthStore?: (binding: OAuthBinding) => OAuthStore;
}

export async function migrateAuthFile(path: string, bindings: readonly ProviderBinding[], dependencies: MigrationDependencies = {}): Promise<void> {
	// Match Pi's proper-lockfile directory lock to serialize with local token refresh.
	const lock = `${path}.lock`;
	const deadline = Date.now() + 30000;
	for (;;) {
		try { await mkdir(lock, { mode: 0o700 }); break; } catch (error) {
			if (!isRecord(error) || error.code !== "EEXIST" || Date.now() >= deadline) throw new Error("Could not acquire the Pi auth.json lock; reload Pi to retry");
			await delay(100);
		}
	}
	const heartbeat = setInterval(() => {
		const now = new Date();
		void utimes(lock, now, now).catch(() => undefined);
	}, 1000);
	heartbeat.unref();
	try { await migrateLocked(path, bindings, dependencies); }
	finally {
		clearInterval(heartbeat);
		await rm(lock, { recursive: true, force: true });
	}
}

async function migrateLocked(path: string, bindings: readonly ProviderBinding[], dependencies: MigrationDependencies): Promise<void> {
	let original: string;
	try {
		original = await readFile(path, "utf8");
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") return;
		throw new Error("Could not read Pi auth.json");
	}
	let data: unknown;
	try { data = JSON.parse(original); } catch { throw new Error("Pi auth.json is not valid JSON"); }
	if (!isRecord(data)) throw new Error("Pi auth.json is not an object");
	let changed = false;
	for (const binding of bindings) {
		const credential = data[binding.providerId];
		if (!isRecord(credential) || credential.type !== binding.type) continue;
		const reference = secretReference(binding.secret);
		if (binding.type === "oauth") {
			if (credential.access === "" && credential.refresh === reference) continue;
			const current = parseCredential(JSON.stringify(credential), binding.validate);
			await (dependencies.oauthStore ?? createOAuthStore)(binding).write(current);
			data[binding.providerId] = referenceCredential(current, reference);
			changed = true;
		} else if (typeof credential.key === "string" && binding.migrateFrom?.includes(credential.key)) {
			await (dependencies.read ?? readSecret)(reference);
			data[binding.providerId] = { ...credential, key: reference };
			changed = true;
		}
	}
	if (!changed) return;
	const temporary = `${path}.${randomUUID()}.tmp`;
	try {
		await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600, flag: "wx" });
		// Do not overwrite changes made by another process during the vault operation.
		if (await readFile(path, "utf8") !== original) throw new Error("Pi auth.json changed during migration; retry after other Pi processes exit");
		await rename(temporary, path);
	} finally {
		await unlink(temporary).catch((error: unknown) => {
			if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
		});
	}
}
