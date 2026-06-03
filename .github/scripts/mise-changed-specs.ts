#!/usr/bin/env bun
// Renovate PR で変更された mise ツールの `tool@version` 一覧を改行区切りで出力する。
// 1. config.toml のバージョン差分 (base→HEAD) を取る
// 2. 差分が無ければ mise.lock の差分から影響ツールを拾い、現行 config.toml の版を引く
// conda: バックエンドは Renovate 非対応かつ CI での導入が不安定なため除外する。
import { $ } from "bun";

const CONFIG = "home/dot_config/mise/config.toml";
const LOCK = "home/dot_config/mise/mise.lock";

const base = process.env.BASE_SHA;
if (!base) {
  console.error("BASE_SHA is not set");
  process.exit(1);
}

// config.toml の [tools] テーブルを { key -> version } に解析する。
function parseTools(content: string): Map<string, string> {
  const tools = new Map<string, string>();
  let inTools = false;
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("[")) {
      inTools = line === "[tools]";
      continue;
    }
    if (!inTools || line === "" || line.startsWith("#")) continue;

    const m = line.match(/^(?:"([^"]+)"|([A-Za-z0-9_.\/-]+))\s*=\s*(.+)$/);
    if (!m) continue;
    const key = m[1] ?? m[2];

    // 文字列値 (node = "24.16.0") かインラインテーブル (yazi = { version = "..." }) の両対応
    const value = m[3];
    const version =
      value.match(/^"([^"]+)"/)?.[1] ?? value.match(/version\s*=\s*"([^"]+)"/)?.[1];
    if (key && version) tools.set(key, version);
  }
  return tools;
}

async function gitShow(ref: string, path: string): Promise<string> {
  const r = await $`git show ${ref}:${path}`.nothrow().quiet();
  return r.exitCode === 0 ? r.stdout.toString() : "";
}

const headCfg = parseTools(await Bun.file(CONFIG).text());
const baseCfg = parseTools(await gitShow(base, CONFIG));

let specs = [...headCfg]
  .filter(([key, version]) => baseCfg.get(key) !== version)
  .map(([key, version]) => `${key}@${version}`);

// config.toml は変わらず mise.lock だけ更新される PR (lockFileMaintenance 等) のフォールバック
if (specs.length === 0) {
  const diff = (await $`git diff ${base}..HEAD -- ${LOCK}`.nothrow().quiet()).stdout.toString();
  const names = new Set<string>();
  for (const line of diff.split("\n")) {
    if (!line.startsWith("+") && !line.startsWith("-")) continue;
    const m =
      line.match(/^[+-]\[\[tools\."([^"]+)"\]\]/) ?? line.match(/^[+-]\[tools\."([^"]+)"\./);
    if (m) names.add(m[1]);
  }
  specs = [...names]
    .sort()
    .flatMap((key) => {
      const version = headCfg.get(key);
      return version ? [`${key}@${version}`] : [];
    });
}

specs = specs.filter((s) => !s.startsWith("conda:"));

console.log(specs.join("\n"));
