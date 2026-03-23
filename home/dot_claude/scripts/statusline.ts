#!/usr/bin/env bun
// Claude Code statusline script
// Line 1: Model | Context% | +added/-removed | git branch
// Line 2: 5h rate limit progress bar
// Line 3: 7d rate limit progress bar

import { $ } from "bun";

// ---------- ANSI Colors ----------
const GREEN = "\x1b[38;2;151;201;195m";
const YELLOW = "\x1b[38;2;229;192;123m";
const RED = "\x1b[38;2;224;108;117m";
const GRAY = "\x1b[38;2;74;88;92m";
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const SEP = `${GRAY} │ ${RESET}`;

// ---------- Interfaces ----------
interface RateLimitWindow {
  used_percentage?: number;
  resets_at?: number | string; // Unix timestamp (seconds) or ISO string
}

interface StatusInput {
  model?: { display_name?: string };
  context_window?: { used_percentage?: number };
  cwd?: string;
  cost?: { total_lines_added?: number; total_lines_removed?: number };
  version?: string;
  rate_limits?: {
    five_hour?: RateLimitWindow;
    seven_day?: RateLimitWindow;
  };
}

// ---------- Parse stdin ----------
const input: StatusInput = JSON.parse((await Bun.stdin.text()) || "{}");

const modelName = input.model?.display_name ?? "Unknown";
const usedPct = input.context_window?.used_percentage ?? 0;
const cwd = input.cwd ?? "";
const linesAdded = input.cost?.total_lines_added ?? 0;
const linesRemoved = input.cost?.total_lines_removed ?? 0;
const rateLimits = input.rate_limits;

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

// ---------- Parse rate limits from stdin ----------
function parsePct(val: number | undefined): number | null {
  if (val === undefined || val === null) return null;
  // used_percentage is 0-100 directly from Claude Code
  return Math.round(val);
}

const fiveHourPct = parsePct(rateLimits?.five_hour?.used_percentage);
const sevenDayPct = parsePct(rateLimits?.seven_day?.used_percentage);

// ---------- Format reset time ----------
function parseResetTime(value: number | string | undefined): Date | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") {
    // Unix timestamp in seconds
    return new Date(value * 1000);
  }
  // Try epoch seconds as string
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

const fiveResetDate = parseResetTime(rateLimits?.five_hour?.resets_at);
const sevenResetDate = parseResetTime(rateLimits?.seven_day?.resets_at);
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
