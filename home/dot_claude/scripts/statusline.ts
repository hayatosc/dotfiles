#!/usr/bin/env bun
// Claude Code statusline script
// Line 1: Model | Context% | +added/-removed | git branch
// Line 2: 5h rate limit progress bar
// Line 3: 7d rate limit progress bar

import { $ } from "bun";
import { readFileSync, statSync } from "fs";

// ---------- ANSI Colors ----------
const GREEN = "\x1b[38;2;151;201;195m";
const YELLOW = "\x1b[38;2;229;192;123m";
const RED = "\x1b[38;2;224;108;117m";
const GRAY = "\x1b[38;2;74;88;92m";
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const SEP = `${GRAY} │ ${RESET}`;

// ---------- Interfaces ----------
interface StatusInput {
  model?: { display_name?: string };
  context_window?: { used_percentage?: number };
  cwd?: string;
  cost?: { total_lines_added?: number; total_lines_removed?: number };
  version?: string;
}

interface UsageCache {
  five_hour_util?: string;
  five_hour_reset?: string;
  seven_day_util?: string;
  seven_day_reset?: string;
}

// ---------- Parse stdin ----------
const input: StatusInput = JSON.parse((await Bun.stdin.text()) || "{}");

const modelName = input.model?.display_name ?? "Unknown";
const usedPct = input.context_window?.used_percentage ?? 0;
const cwd = input.cwd ?? "";
const linesAdded = input.cost?.total_lines_added ?? 0;
const linesRemoved = input.cost?.total_lines_removed ?? 0;
const ccVersion = input.version ?? "0.0.0";

// ---------- Color by percentage ----------
function colorForPct(pct: number | null): string {
  if (pct === null) return GRAY;
  if (pct >= 80) return RED;
  if (pct >= 50) return YELLOW;
  return GREEN;
}

// ---------- Progress bar (10 segments) ----------
function progressBar(pct: number): string {
  const filled = Math.min(10, Math.max(0, Math.round(pct / 10)));
  return "▰".repeat(filled) + "▱".repeat(10 - filled);
}

// ---------- Git branch ----------
let gitBranch = "";
if (cwd) {
  try {
    gitBranch = (
      await $`git -C ${cwd} --no-optional-locks rev-parse --abbrev-ref HEAD`.quiet().text()
    ).trim();
  } catch {
    gitBranch = "";
  }
}

// ---------- Line stats ----------
const gitStats =
  linesAdded > 0 || linesRemoved > 0 ? `+${linesAdded}/-${linesRemoved}` : "";

// ---------- OAuth token ----------
function getOAuthToken(): string {
  if (process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    return process.env.CLAUDE_CODE_OAUTH_TOKEN;
  }
  const credsPath = `${process.env.HOME}/.claude/.credentials.json`;
  try {
    const creds = JSON.parse(readFileSync(credsPath, "utf-8"));
    return creds?.claudeAiOauth?.accessToken ?? "";
  } catch {
    return "";
  }
}

// ---------- Rate limit cache ----------
const CACHE_FILE = "/tmp/claude-usage-cache.json";
const CACHE_TTL = 360_000; // 360 seconds in ms

async function fetchUsage(accessToken: string): Promise<UsageCache | null> {
  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "User-Agent": `claude-code/${ccVersion}`,
        "anthropic-beta": "oauth-2025-04-20",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1,
        messages: [{ role: "user", content: "h" }],
      }),
      signal: AbortSignal.timeout(8000),
    });

    const h5u = resp.headers.get("anthropic-ratelimit-unified-5h-utilization");
    const h5r = resp.headers.get("anthropic-ratelimit-unified-5h-reset");
    const h7u = resp.headers.get("anthropic-ratelimit-unified-7d-utilization");
    const h7r = resp.headers.get("anthropic-ratelimit-unified-7d-reset");

    if (!h5u) return null;

    const cache: UsageCache = {
      five_hour_util: h5u ?? undefined,
      five_hour_reset: h5r ?? undefined,
      seven_day_util: h7u ?? undefined,
      seven_day_reset: h7r ?? undefined,
    };
    await Bun.write(CACHE_FILE, JSON.stringify(cache));
    return cache;
  } catch {
    return null;
  }
}

function loadCache(): UsageCache | null {
  try {
    const stat = statSync(CACHE_FILE);
    if (Date.now() - stat.mtimeMs < CACHE_TTL) {
      return JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
    }
  } catch {}
  return null;
}

async function getUsage(): Promise<UsageCache> {
  const cached = loadCache();
  if (cached) return cached;

  const token = getOAuthToken();
  if (token) {
    const fresh = await fetchUsage(token);
    if (fresh) return fresh;
  }

  // Fallback to stale cache
  try {
    return JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
  } catch {
    return {};
  }
}

const usage = await getUsage();

// ---------- Parse utilization (0.0–1.0 → integer %) ----------
function parsePct(val: string | undefined): number | null {
  if (!val) return null;
  const f = parseFloat(val);
  if (isNaN(f) || f === 0) return null;
  return Math.round(f * 100);
}

const fiveHourPct = parsePct(usage.five_hour_util);
const sevenDayPct = parsePct(usage.seven_day_util);

// ---------- Format reset time ----------
function parseResetTime(value: string | undefined): Date | null {
  if (!value) return null;
  // Try epoch seconds
  const epoch = parseFloat(value);
  if (!isNaN(epoch) && epoch > 1_000_000_000) return new Date(epoch * 1000);
  // Try ISO string
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function formatHour(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    hour: "numeric",
    hour12: true,
  })
    .format(date)
    .replace(" AM", "am")
    .replace(" PM", "pm");
}

function format5hReset(date: Date): string {
  return `Resets ${formatHour(date)} (Asia/Tokyo)`;
}

function format7dReset(date: Date): string {
  const month = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    month: "short",
  }).format(date);
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    day: "numeric",
  }).format(date);
  return `Resets ${month} ${day} at ${formatHour(date)} (Asia/Tokyo)`;
}

const fiveResetDate = parseResetTime(usage.five_hour_reset);
const sevenResetDate = parseResetTime(usage.seven_day_reset);
const fiveResetDisplay = fiveResetDate ? format5hReset(fiveResetDate) : "";
const sevenResetDisplay = sevenResetDate ? format7dReset(sevenResetDate) : "";

// ---------- Line 1 ----------
const ctxPct = Math.round(usedPct);
const ctxColor = colorForPct(ctxPct || null);
let line1 = `${modelName}${SEP}${ctxColor} ${ctxPct}%${RESET}`;
if (gitStats) line1 += `${SEP}${GREEN}${gitStats}${RESET}`;
if (gitBranch) line1 += `${SEP} ${gitBranch}`;

// ---------- Line 2 (5h) ----------
let line2: string;
if (fiveHourPct !== null) {
  const c5 = colorForPct(fiveHourPct);
  const bar5 = progressBar(fiveHourPct);
  line2 = `${c5}󱑀 5h  ${bar5}  ${fiveHourPct}%${RESET}`;
  if (fiveResetDisplay) line2 += `  ${DIM}${fiveResetDisplay}${RESET}`;
} else {
  line2 = `${GRAY}󱑀 5h  ▱▱▱▱▱▱▱▱▱▱  --%${RESET}`;
}

// ---------- Line 3 (7d) ----------
let line3: string;
if (sevenDayPct !== null) {
  const c7 = colorForPct(sevenDayPct);
  const bar7 = progressBar(sevenDayPct);
  line3 = `${c7} 7d  ${bar7}  ${sevenDayPct}%${RESET}`;
  if (sevenResetDisplay) line3 += `  ${DIM}${sevenResetDisplay}${RESET}`;
} else {
  line3 = `${GRAY} 7d  ▱▱▱▱▱▱▱▱▱▱  --%${RESET}`;
}

// ---------- Output ----------
process.stdout.write(`${line1}\n${line2}\n${line3}`);
