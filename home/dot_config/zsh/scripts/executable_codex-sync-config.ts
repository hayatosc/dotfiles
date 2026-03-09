#!/usr/bin/env bun

import { existsSync, mkdirSync, readFileSync } from "fs";
import { dirname, join } from "path";

const HOME = process.env.HOME;

if (!HOME) {
  console.error("codex-sync-config: HOME is not set");
  process.exit(1);
}

const DEST_CONFIG = `${HOME}/.codex/config.toml`;
const TEMPLATE_SUFFIX = `
{{- $codex := get . "codex" | default dict }}
{{- $projectsToml := get $codex "projects_toml" }}
{{- if $projectsToml }}

{{ $projectsToml }}
{{- else }}
{{- $trustedProjects := get $codex "trusted_projects" | default dict }}
{{- range $project := keys $trustedProjects | sortAlpha }}
[projects.{{ $project | quote }}]
trust_level = {{ index $trustedProjects $project | quote }}

{{- end }}
{{- end }}
`;

function normalize(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

function splitConfig(text: string): { shared: string; projects: string } {
  const normalized = normalize(text);
  const lines = normalized.match(/[^\n]*\n|[^\n]+$/g) ?? [];
  let currentIsProject = false;
  let shared = "";
  let projects = "";

  for (const line of lines) {
    const match = line.match(/^\s*\[([^\[\]]+)\]\s*(?:#.*)?$/);
    if (match) {
      currentIsProject = /^projects\."(?:[^"\\]|\\.)*"$/.test(match[1].trim());
    }

    if (currentIsProject) {
      projects += line;
    } else {
      shared += line;
    }
  }

  return {
    shared: shared.trimEnd(),
    projects: projects.trim() ? `${projects.trimEnd()}\n` : "",
  };
}

function buildTemplate(shared: string): string {
  const body = shared.trimEnd();
  return body ? `${body}\n${TEMPLATE_SUFFIX}` : TEMPLATE_SUFFIX.trimStart();
}

function buildLocalData(projects: string): string {
  if (!projects) {
    return 'codex.projects_toml = ""\n';
  }
  if (projects.includes("'''")) {
    throw new Error("projects block contains triple single quotes, cannot encode as TOML literal string");
  }
  return `codex.projects_toml = '''\n${projects}'''\n`;
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

try {
  if (!existsSync(DEST_CONFIG)) {
    process.exit(0);
  }

  const sourcePath = runCommand(["chezmoi", "source-path", DEST_CONFIG]);
  if (!sourcePath) {
    throw new Error(`could not resolve source path for ${DEST_CONFIG}`);
  }

  const sourceRoot = dirname(dirname(sourcePath));
  const localDataPath = join(sourceRoot, ".chezmoidata", "codex.local.toml");
  const liveConfig = normalize(readFileSync(DEST_CONFIG, "utf-8"));
  const desired = splitConfig(liveConfig);

  const templateContent = buildTemplate(desired.shared);
  const localDataContent = buildLocalData(desired.projects);

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
    console.log("codex-sync-config: updated Codex chezmoi sources");
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`codex-sync-config: ${message}`);
  process.exit(1);
}
