#!/usr/bin/env bun

import { $ } from "bun";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { dirname, join } from "path";

const HOME = process.env.HOME;

if (!HOME) {
  console.error("codex-sync-config: HOME is not set");
  process.exit(1);
}

const LIVE_CONFIG = `${HOME}/.codex/config.toml`;

function normalize(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

try {
  if (!existsSync(LIVE_CONFIG)) {
    process.exit(0);
  }

  const sourceDir = normalize(await $`chezmoi execute-template ${"{{ .chezmoi.sourceDir }}"}`.quiet().text()).trim();
  const localDataPath = join(sourceDir, ".chezmoidata", "codex.local.toml");

  const seedTemplate = `{{ pick (include ${JSON.stringify(LIVE_CONFIG)} | fromToml) "projects" "hooks" | toToml }}`;
  const seed = normalize(await $`chezmoi execute-template ${seedTemplate}`.quiet().text()).trimEnd();
  const seedContent = seed ? `${seed}\n` : "";

  const currentContent = existsSync(localDataPath)
    ? normalize(readFileSync(localDataPath, "utf-8"))
    : "";

  if (currentContent !== seedContent) {
    mkdirSync(dirname(localDataPath), { recursive: true });
    await Bun.write(localDataPath, seedContent);
    console.log("codex-sync-config: updated Codex local seed data");
  }
} catch (error) {
  const stderr = (error as { stderr?: Uint8Array }).stderr;
  const message = stderr ? normalize(Buffer.from(stderr).toString("utf-8")).trim() : error instanceof Error ? error.message : String(error);
  console.error(`codex-sync-config: ${message}`);
  process.exit(1);
}
