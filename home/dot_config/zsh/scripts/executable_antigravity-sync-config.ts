#!/usr/bin/env bun

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

function runCommand(cmd: string[]): string {
  const proc = Bun.spawnSync({
    cmd,
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = normalize(Buffer.from(proc.stdout).toString("utf-8")).trimEnd();
  const stderr = normalize(Buffer.from(proc.stderr).toString("utf-8")).trim();
  if (proc.exitCode !== 0) {
    throw new Error(stderr || `${cmd.join(" ")} failed with exit code ${proc.exitCode}`);
  }
  return stdout;
}

function findSourceRoot(path: string): string {
  let dir = dirname(path);
  while (dir && dir !== "/" && dir !== ".") {
    if (existsSync(join(dir, ".chezmoidata")) || existsSync(join(dir, ".chezmoiroot"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback to going up 3 levels
  return dirname(dirname(dirname(path)));
}

try {
  if (!existsSync(DEST_CONFIG)) {
    process.exit(0);
  }

  const sourcePath = runCommand(["chezmoi", "source-path", DEST_CONFIG]);
  if (!sourcePath) {
    throw new Error(`could not resolve source path for ${DEST_CONFIG}`);
  }

  const sourceRoot = findSourceRoot(sourcePath);
  const localDataPath = join(sourceRoot, ".chezmoidata", "gemini.local.toml");
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
  const message = error instanceof Error ? error.message : String(error);
  console.error(`antigravity-sync-config: ${message}`);
  process.exit(1);
}
