import { execFile } from "node:child_process";

export interface SecretLocation {
	vault: string;
	item: string;
	field: string;
}

export function secretReference(secret: SecretLocation): string {
	return `op://${secret.vault}/${secret.item}/${secret.field}`;
}

export type SecretReader = typeof readSecret;

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Never attach child-process errors: they can contain captured secret output.
export function runOp(args: string[], signal?: AbortSignal): Promise<string> {
	return new Promise((resolve, reject) => {
		execFile("op", args, { encoding: "utf8", timeout: 10000, maxBuffer: 1024 * 1024, signal }, (error, stdout) => {
			if (error) reject(new Error(`1Password ${args.slice(0, 2).join(" ")} failed; check op authentication and vault permissions`));
			else resolve(stdout);
		});
	});
}

export async function readSecret(reference: string, signal?: AbortSignal): Promise<string> {
	const secret = (await runOp(["read", reference], signal)).trim();
	if (!secret) throw new Error("1Password returned an empty credential");
	return secret;
}
