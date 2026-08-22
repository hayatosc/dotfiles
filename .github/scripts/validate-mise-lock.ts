#!/usr/bin/env bun
// Validate that every lockfile entry whose backend resolves downloadable assets
// actually carries at least one platform entry with a URL and checksum.
//
// `mise lock` exits 0 even when resolution partially fails (e.g. GitHub API
// rate limits), silently committing a degraded lockfile that later breaks
// `mise install --locked`. Backends like npm:/vfox:/conda: legitimately carry
// no URLs (they resolve at install time), so only asset-resolving backends are
// checked. Exit 1 lists offending tools.
import { $ } from "bun";

const lockPath = process.argv[2];
if (!lockPath) {
  console.error("usage: bun validate-mise-lock.ts <path-to-mise.lock>");
  process.exit(1);
}

const content = await Bun.file(lockPath).text();
const lines = content.split("\n");

type Block = { header: string; body: string[] };

// Split into top-level sections keyed by their TOML table/array-of-tables header.
const blocks: Block[] = [];
for (const line of lines) {
  const m = line.match(/^\[+\s*tools[^\]]*\]+/);
  if (m) blocks.push({ header: line.trim(), body: [] });
  else if (blocks.length > 0) blocks.at(-1)!.body.push(line);
}

const ASSET_BACKEND = /^(github|aqua|https?):/;
const isToolBlock = (b: Block) => b.header.startsWith("[[");
const backendOf = (b: Block) =>
  b.body.find((l) => l.startsWith("backend"))?.split("=")[1]?.trim().replaceAll('"', "") ?? "";

let failed = false;
for (let i = 0; i < blocks.length; i++) {
  const b = blocks[i];
  if (!isToolBlock(b) || !ASSET_BACKEND.test(backendOf(b))) continue;

  // Collect platform sub-tables belonging to this tool block (until the next [[tools.*]]).
  const platformBlocks = [];
  for (let j = i + 1; j < blocks.length && !isToolBlock(blocks[j]); j++) {
    if (/platforms\./.test(blocks[j].header)) platformBlocks.push(blocks[j]);
  }

  // A URL alone proves the asset was resolved; some upstreams (e.g. claude,
  // ttyd) publish no checksums, so a missing checksum is not degradation.
  const hasAssetEntry = platformBlocks.some((p) => p.body.some((l) => l.startsWith("url")));
  if (!hasAssetEntry) {
    console.error(`no platform url/checksum entry for: ${b.header} (backend=${backendOf(b)})`);
    failed = true;
  }
}

if (failed) {
  console.error("mise.lock is incomplete; refusing to commit a degraded lockfile");
  process.exit(1);
}
console.log("mise.lock validation passed");
