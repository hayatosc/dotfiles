#!/usr/bin/env bun

import { $ } from "bun";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { dirname, join } from "path";

const HOME = process.env.HOME;

if (!HOME) {
  console.error("antigravity-sync-config: HOME is not set");
  process.exit(1);
}

const DEST_CONFIG = `${HOME}/.gemini/antigravity-cli/settings.json`;

const TEMPLATE_HEADER = `{{- $gemini := get . "gemini" | default dict -}}
{{- $liveConfig := joinPath .chezmoi.homeDir ".gemini" "antigravity-cli" "settings.json" -}}
{{- $workspaces := list -}}
{{- if stat $liveConfig -}}
  {{- $data := include $liveConfig | fromJson -}}
  {{- $workspaces = $data.trustedWorkspaces -}}
{{- else -}}
  {{- $workspaces = get $gemini "trusted_workspaces" | default list -}}
{{- end -}}
`;

function normalize(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

try {
  if (!existsSync(DEST_CONFIG)) {
    process.exit(0);
  }

  const sourcePath = normalize(await $`chezmoi source-path ${DEST_CONFIG}`.quiet().text()).trim();
  if (!sourcePath) {
    throw new Error(`could not resolve source path for ${DEST_CONFIG}`);
  }

  const sourceDir = normalize(await $`chezmoi execute-template ${"{{ .chezmoi.sourceDir }}"}`.quiet().text()).trim();
  const localDataPath = join(sourceDir, ".chezmoidata", "gemini.local.toml");
  const liveConfigText = normalize(readFileSync(DEST_CONFIG, "utf-8"));
  const liveConfig = JSON.parse(liveConfigText);

  // Extract and sort trusted workspaces
  const trustedWorkspaces = Array.isArray(liveConfig.trustedWorkspaces)
    ? Array.from(new Set(liveConfig.trustedWorkspaces as string[])).sort()
    : [];

  // Build the local data content
  const localDataLines = [
    "[gemini]",
    "trusted_workspaces = [",
    ...trustedWorkspaces.map((ws, index) => {
      const comma = index === trustedWorkspaces.length - 1 ? "" : ",";
      return `  ${JSON.stringify(ws)}${comma}`;
    }),
    "]",
    ""
  ];
  const localDataContent = localDataLines.join("\n");

  // Build the template content
  const templateConfig = { ...liveConfig };
  templateConfig.trustedWorkspaces = "__TRUSTED_WORKSPACES_PLACEHOLDER__";
  let templateJson = JSON.stringify(templateConfig, null, 2);
  templateJson = templateJson.replace(
    `"__TRUSTED_WORKSPACES_PLACEHOLDER__"`,
    `{{ $workspaces | uniq | sortAlpha | toJson }}`
  );
  const templateContent = `${TEMPLATE_HEADER}${templateJson}\n`;

  let updated = false;
  const currentTemplate = existsSync(sourcePath)
    ? normalize(readFileSync(sourcePath, "utf-8"))
    : "";
  const currentLocalData = existsSync(localDataPath)
    ? normalize(readFileSync(localDataPath, "utf-8"))
    : "";

  if (currentTemplate !== templateContent) {
    await Bun.write(sourcePath, templateContent);
    updated = true;
  }

  if (currentLocalData !== localDataContent) {
    mkdirSync(dirname(localDataPath), { recursive: true });
    await Bun.write(localDataPath, localDataContent);
    updated = true;
  }

  if (updated) {
    console.log("antigravity-sync-config: updated Antigravity chezmoi sources");
  }
} catch (error) {
  const stderr = (error as { stderr?: Uint8Array }).stderr;
  const message = stderr ? normalize(Buffer.from(stderr).toString("utf-8")).trim() : error instanceof Error ? error.message : String(error);
  console.error(`antigravity-sync-config: ${message}`);
  process.exit(1);
}
