import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

async function clearSession(ctx: ExtensionCommandContext) {
	await ctx.waitForIdle();
	await ctx.newSession({
		withSession: async (sessionCtx) => {
			sessionCtx.ui.notify(
				"Context cleared & runtime reloaded — fresh session started",
				"info",
			);
			await sessionCtx.reload();
		},
	});
}

export default function (pi: ExtensionAPI) {
	pi.registerCommand("clear", {
		description: "Clear the conversation context and start a fresh session",
		handler: async (_args, ctx) => clearSession(ctx),
	});

	pi.registerCommand("c", {
		description: "Alias for /clear — fresh session + reload",
		handler: async (_args, ctx) => clearSession(ctx),
	});

	pi.on("input", async (event) => {
		if (event.source === "extension") return { action: "continue" };
		const trimmed = event.text.trim().toLowerCase();
		if (trimmed === "c" || trimmed === "clear") {
			pi.sendUserMessage("/clear");
			return { action: "handled" };
		}
	});
}
