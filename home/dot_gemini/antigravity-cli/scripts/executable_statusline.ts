#!/usr/bin/env bun
// Antigravity CLI custom statusline script in Bun shell

import { $ } from "bun";
import { join } from "path";
import os from "os";

// ---------- Interfaces ----------
interface StatusInput {
  agent_state?: string;
  context_window?: {
    used_percentage?: number;
    total_input_tokens?: number;
    total_output_tokens?: number;
    context_window_size?: number;
    remaining_percentage?: number;
  };
  vcs?: {
    branch?: string;
    dirty?: boolean;
    type?: string;
    client?: string;
  };
  sandbox?: {
    enabled?: boolean;
    allow_network?: boolean;
  };
  artifact_count?: number;
  subagents?: any[];
  task_count?: number;
  model?: {
    id?: string;
    display_name?: string;
  };
  terminal_width?: number;
  cwd?: string;
  conversation_id?: string;
  product?: string;
  quota?: {
    "gemini-5h"?: {
      remaining_fraction?: number;
      reset_in_seconds?: number;
    };
    "gemini-weekly"?: {
      remaining_fraction?: number;
      reset_in_seconds?: number;
    };
    "gemini-7d"?: {
      remaining_fraction?: number;
      reset_in_seconds?: number;
    };
  };
}

// ---------- OneDark-ish Pastel Colors (Aligned with statusline.ts) ----------
const GREEN = "\x1b[38;2;151;201;195m";
const YELLOW = "\x1b[38;2;229;192;123m";
const RED = "\x1b[38;2;224;108;117m";
const GRAY = "\x1b[38;2;74;88;92m";
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const B = "\x1b[1m";         // Bold
const I = "\x1b[3m";         // Italic

// Add matching OneDark pastels for other roles
const BLUE = "\x1b[38;2;97;175;239m";
const MAGENTA = "\x1b[38;2;198;120;221m";
const CYAN = "\x1b[38;2;86;182;194m";
const BRIGHT_WHITE = "\x1b[38;2;220;223;228m";

const SEP = `${GRAY} │ ${RESET}`;

const homedir = os.homedir();
const sandboxLogPath = join(homedir, ".gemini/antigravity-cli/cli.log");

// ---------- Parse stdin ----------
let input: StatusInput = {};
try {
  const text = await Bun.stdin.text();
  if (text) {
    input = JSON.parse(text);
  }
} catch {
  // Use fallback values
}

// ---------- Configurable Fallback (Nerd Fonts) ----------
const useNerdFonts = process.env.USE_NERD_FONTS !== "false";

// State icons
const ICON_READY = useNerdFonts ? "" : "🟢";
const ICON_THINKING = useNerdFonts ? "󰟷" : "💭";
const ICON_WORKING = useNerdFonts ? "" : "⚙";
const ICON_TOOL = useNerdFonts ? "" : "⚒";

// Component icons
const ICON_FOLDER = useNerdFonts ? "" : "📁";
const ICON_MODEL = useNerdFonts ? "" : "💡";
const ICON_BRANCH = useNerdFonts ? "" : "⎇";
const ICON_CONV = useNerdFonts ? "󰍪" : "💬";
const ICON_CTX = useNerdFonts ? "󱍏" : "📊";
const ICON_TOK = useNerdFonts ? "" : "🪙";
const ICON_ART = useNerdFonts ? "" : "📄";
const ICON_SUB = useNerdFonts ? "󱙺" : "🤖";
const ICON_BG = useNerdFonts ? "" : "📋";

// Sandbox icons
const ICON_SB_NET = useNerdFonts ? "󰒙" : "📦";
const ICON_SB_NONET = useNerdFonts ? "󰴴" : "📦🔒";
const ICON_SB_OFF = useNerdFonts ? "󰦜" : "🚫";

// Quota icons (aligned with statusline.ts)
const ICON_QUOTA_5H = useNerdFonts ? "󱑀" : "⏳";
const ICON_QUOTA_7D = useNerdFonts ? "" : "📅";

// ---------- VCS directly from git ----------
const cwd = input.cwd || "";
let vcsBranch = input.vcs?.branch || "";
let vcsDirty = input.vcs?.dirty ?? false;

if (cwd) {
  try {
    const branchRes = await $`git -C ${cwd} rev-parse --abbrev-ref HEAD`.quiet().text();
    const branchName = branchRes.trim();
    if (branchName) {
      vcsBranch = branchName;
      const statusRes = await $`git -C ${cwd} status --porcelain`.quiet().text();
      vcsDirty = statusRes.trim().length > 0;
    }
  } catch {
    // ignore
  }
}

// ---------- Sandbox State Workaround ----------
let sandboxEnabled = input.sandbox?.enabled ?? false;
const sandboxNet = input.sandbox?.allow_network ?? false;

if (!sandboxEnabled) {
  try {
    const file = Bun.file(sandboxLogPath);
    if (await file.exists()) {
      const content = await file.text();
      if (content.includes("enabling terminal sandbox")) {
        sandboxEnabled = true;
      }
    }
  } catch {
    // ignore
  }
}

// ---------- Utility Functions ----------
function humanFormat(num: number): string {
  if (!num || num === 0) return "0";
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return String(num);
}

function fmtSeconds(s: number): string {
  if (!s || s <= 0) return "0s";
  if (s >= 3600) {
    return `${Math.floor(s / 3600)}h${Math.floor((s % 3600) / 60)}m`;
  }
  if (s >= 60) {
    return `${Math.floor(s / 60)}m`;
  }
  return `${s}s`;
}

function floatToPct(val: number | undefined | null): number {
  if (val === undefined || val === null || val === -1) return -1;
  return Math.round(val * 100);
}

function getResetTimeStr(resetInSeconds: number, isWeekly = false): string {
  if (!resetInSeconds || resetInSeconds <= 0) return "";
  const resetDate = new Date(Date.now() + resetInSeconds * 1000);
  
  const formattedHour = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(resetDate)
    .replace(" AM", "am")
    .replace(" PM", "pm");
    
  if (resetInSeconds > 86400 || isWeekly) {
    const month = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo",
      month: "short",
    }).format(resetDate);
    const day = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo",
      day: "numeric",
    }).format(resetDate);
    return `Resets ${month} ${day} at ${formattedHour} (Asia/Tokyo)`;
  }
  
  return `Resets ${formattedHour} (Asia/Tokyo)`;
}

function formatQuota(mode: "wide" | "med" | "narrow", type: "5h" | "7d", quotaFrac: number, quotaReset: number): string {
  const pct = floatToPct(quotaFrac);
  if (pct === -1) return "";

  const isWeekly = type === "7d";
  const icon = isWeekly ? ICON_QUOTA_7D : ICON_QUOTA_5H;
  const qReset = getResetTimeStr(quotaReset, isWeekly);
  
  if (mode === "narrow") {
    const timeStr = qReset ? ` ${GRAY}${qReset.replace(" (Asia/Tokyo)", "")}${RESET}` : "";
    return `${CYAN}${icon} ${type} ${BRIGHT_WHITE}${pct}%${RESET}${timeStr}`;
  }

  const len = mode === "med" ? 6 : 10;
  const bar = makeBar(len, pct, pct <= 10 ? RED : pct <= 40 ? YELLOW : GREEN);
  const timeStr = qReset ? `  ${DIM}${qReset}${RESET}` : "";

  return `${CYAN}${icon} ${type}  ${bar}  ${BRIGHT_WHITE}${pct}%${RESET}${timeStr}`;
}

function shortenPath(pathStr: string, maxLen: number): string {
  if (!pathStr) return "";
  let shortened = pathStr;
  if (shortened.startsWith(homedir)) {
    shortened = "~" + shortened.slice(homedir.length);
  }
  if (maxLen === 0) {
    if (shortened === "~") return "~";
    const parts = shortened.split("/");
    return parts[parts.length - 1] || "";
  }
  if (shortened.length > maxLen) {
    const parts = shortened.split("/");
    const base = parts[parts.length - 1] || "";
    return `.../${base}`;
  }
  return shortened;
}

function formatBranch(maxLen: number, branch: string, dirty: boolean): string {
  if (!branch) return "";
  let name = branch;
  if (maxLen > 0 && name.length > maxLen) {
    name = name.slice(0, maxLen) + "..";
  }
  if (dirty) {
    return `${RED}${ICON_BRANCH} ${name}${YELLOW}*${RESET}`;
  } else {
    return `${BLUE}${ICON_BRANCH} ${name}${RESET}`;
  }
}

function formatSandbox(mode: "wide" | "med" | "narrow", enabled: boolean, allowNet: boolean): string {
  if (enabled) {
    const icon = allowNet ? ICON_SB_NET : ICON_SB_NONET;
    const label = allowNet ? "ON (net)" : "ON (no-net)";
    if (mode === "wide") {
      return `${GREEN}${icon} ${B}${label}${RESET}`;
    } else if (mode === "med") {
      return `${GREEN}${icon} ${B}ON${RESET}`;
    } else {
      return `${GREEN}${icon}${RESET}`;
    }
  } else {
    if (mode === "wide" || mode === "med") {
      return `${RED}${ICON_SB_OFF} ${B}OFF${RESET}`;
    } else {
      return `${RED}${ICON_SB_OFF}${RESET}`;
    }
  }
}

function makeBar(len: number, pctInt: number, fillColor: string): string {
  const filled = Math.min(len, Math.max(0, Math.round((pctInt * len) / 100)));
  return `${fillColor}${"▰".repeat(filled)}${RESET}${GRAY}${"▱".repeat(len - filled)}${RESET}`;
}

function visibleLen(str: string): number {
  const cleanStr = str.replace(/\x1b\[[0-9;]*m/g, "");
  const codePoints = Array.from(cleanStr);
  const baseLen = codePoints.length;
  
  const iconRegex = /[󰟷󰍪󰒙󰴴󰦜󱍏󱙺󱑀🟢💭⚙⚒💡📁⎇💬📦🚫📊🪙📄🤖📋⏳📅]/g;
  const icons = cleanStr.match(iconRegex);
  const iconCount = icons ? icons.length : 0;
  
  const iconWidthAdjust = parseInt(process.env.ICON_WIDTH_ADJUST || "0", 10);
  return baseLen + iconCount * iconWidthAdjust;
}

function joinWithDot(...items: string[]): string {
  return items.filter(Boolean).join(SEP);
}

function joinWithSpace(...items: string[]): string {
  return items.filter(Boolean).join("  ");
}

function getRightAlignedString(left: string, right: string, totalCols: number): string {
  const leftVis = visibleLen(left);
  const rightVis = visibleLen(right);
  let pad = totalCols - leftVis - rightVis;
  if (pad < 1) pad = 1;
  return `${left}${" ".repeat(pad)}${right}`;
}

// ---------- State Indicator ----------
const agentState = input.agent_state || "idle";
let S = "";
switch (agentState) {
  case "idle":
    S = `${GREEN}${B}${ICON_READY} READY${RESET}`;
    break;
  case "thinking":
    S = `${YELLOW}${B}${ICON_THINKING} THINKING${RESET}`;
    break;
  case "working":
    S = `${CYAN}${B}${ICON_WORKING} WORKING${RESET}`;
    break;
  case "tool_use":
    S = `${MAGENTA}${B}${ICON_TOOL} TOOL${RESET}`;
    break;
  default:
    S = `${BRIGHT_WHITE}${B}${ICON_READY} ${agentState.toUpperCase()}${RESET}`;
    break;
}

// ---------- CWD Path Variants ----------
const CWD_WIDE_VAL = shortenPath(cwd, 25);
const DIR_WIDE = CWD_WIDE_VAL ? `${CYAN}${ICON_FOLDER} ${CWD_WIDE_VAL}${RESET}` : "";

const CWD_MED_VAL = shortenPath(cwd, 15);
const DIR_MED = CWD_MED_VAL ? `${CYAN}${ICON_FOLDER} ${CWD_MED_VAL}${RESET}` : "";

const CWD_NARROW_VAL = shortenPath(cwd, 0);
const DIR_NARROW = CWD_NARROW_VAL ? `${CYAN}${ICON_FOLDER} ${CWD_NARROW_VAL}${RESET}` : "";

// ---------- Model Name Variants ----------
const modelRaw = input.model?.display_name || input.model?.id || "";
const modelClean = modelRaw.replace(/^Gemini /, "").replace(/\s*\([^)]+\)/g, "");

const M_WIDE = modelRaw ? `${MAGENTA}${I}${ICON_MODEL} ${modelRaw}${RESET}` : "";
const M_MED = modelClean ? `${MAGENTA}${I}${ICON_MODEL} ${modelClean}${RESET}` : "";
const M_NARROW = modelClean ? `${MAGENTA}${I}${ICON_MODEL} ${modelClean.slice(0, 10)}${RESET}` : "";

// ---------- VCS Branch Variants ----------
const V_WIDE = formatBranch(15, vcsBranch, vcsDirty);
const V_MED = formatBranch(10, vcsBranch, vcsDirty);
const V_NARROW = formatBranch(6, vcsBranch, vcsDirty);

// ---------- Conversation ID Variants ----------
const CONV_ID = input.conversation_id || "";
const CONV_WIDE = CONV_ID ? `${GRAY}${ICON_CONV} ${CONV_ID.slice(0, 8)}${RESET}` : "";
const CONV_MED = CONV_ID ? `${GRAY}${ICON_CONV} ${CONV_ID.slice(0, 4)}${RESET}` : "";

// ---------- Sandbox Badge Variants ----------
const SB_WIDE = formatSandbox("wide", sandboxEnabled, sandboxNet);
const SB_MED = formatSandbox("med", sandboxEnabled, sandboxNet);
const SB_NARROW = formatSandbox("narrow", sandboxEnabled, sandboxNet);

// ---------- Context & Token Variants (NO GAUGE GRAPH) ----------
const usedPct = input.context_window?.used_percentage ?? 0;
const pctFmt = usedPct.toFixed(1);
const pctInt = Math.round(usedPct);

const inputTokens = input.context_window?.total_input_tokens ?? 0;
const outputTokens = input.context_window?.total_output_tokens ?? 0;
const ctxLimit = input.context_window?.context_window_size ?? 0;
const ctxUsed = inputTokens + outputTokens;

const inputTokFmt = humanFormat(inputTokens);
const outputTokFmt = humanFormat(outputTokens);
const ctxLimitFmt = humanFormat(ctxLimit);
const ctxUsedFmt = humanFormat(ctxUsed);

const ctxBarWide = `${YELLOW}${ICON_CTX} ${BRIGHT_WHITE}${pctFmt}% (${ctxUsedFmt}/${ctxLimitFmt})${RESET}`;
const ctxBarMed = `${YELLOW}${ICON_CTX} ${BRIGHT_WHITE}${pctFmt}% (${ctxUsedFmt}/${ctxLimitFmt})${RESET}`;
const ctxBarNarrow = `${YELLOW}${ICON_CTX} ${BRIGHT_WHITE}${pctInt}%${RESET}`;

let tokDetailsWide = "";
if (ctxUsed > 0) {
  tokDetailsWide = `${YELLOW}${ICON_TOK} ${RESET}(${inputTokFmt} in/${outputTokFmt} out)`;
}

let tokDetailsMed = "";
if (ctxUsed > 0) {
  tokDetailsMed = `${YELLOW}${ICON_TOK} ${RESET}(${inputTokFmt}/${outputTokFmt})`;
}

// ---------- Number Indicators Variants ----------
const artifacts = input.artifact_count ?? 0;
const subagentCount = Array.isArray(input.subagents) ? input.subagents.length : 0;
const tasks = input.task_count ?? 0;

const ART_WIDE = `${BLUE}${ICON_ART} ${artifacts}${RESET}`;
const SUB_WIDE = `${CYAN}${ICON_SUB} ${subagentCount}${RESET}`;
const BG_WIDE = `${MAGENTA}${ICON_BG} ${tasks}${RESET}`;

const ART_MED = `${BLUE}${ICON_ART} ${artifacts}${RESET}`;
const SUB_MED = `${CYAN}${ICON_SUB} ${subagentCount}${RESET}`;
const BG_MED = `${MAGENTA}${ICON_BG} ${tasks}${RESET}`;

const ART_NARROW = `${BLUE}${ICON_ART}${artifacts}${RESET}`;
const SUB_NARROW = `${CYAN}${ICON_SUB}${subagentCount}${RESET}`;
const BG_NARROW = `${MAGENTA}${ICON_BG}${tasks}${RESET}`;

// ---------- Quota Indicator Variants ----------
const quota5h = input.quota?.["gemini-5h"] || {};
const quota5hFrac = quota5h.remaining_fraction ?? -1;
const quota5hReset = quota5h.reset_in_seconds ?? 0;

const quota7d = input.quota?.["gemini-weekly"] || input.quota?.["gemini-7d"] || {};
const quota7dFrac = quota7d.remaining_fraction ?? -1;
const quota7dReset = quota7d.reset_in_seconds ?? 0;

const q5hWide = formatQuota("wide", "5h", quota5hFrac, quota5hReset);
const q5hMed = formatQuota("med", "5h", quota5hFrac, quota5hReset);
const q5hNarrow = formatQuota("narrow", "5h", quota5hFrac, quota5hReset);

const q7dWide = formatQuota("wide", "7d", quota7dFrac, quota7dReset);
const q7dMed = formatQuota("med", "7d", quota7dFrac, quota7dReset);
const q7dNarrow = formatQuota("narrow", "7d", quota7dFrac, quota7dReset);

const quotaWide = joinWithDot(q5hWide, q7dWide);
const quotaMed = joinWithDot(q5hMed, q7dMed);
const quotaNarrow = joinWithDot(q5hNarrow, q7dNarrow);

// ---------- Assemble Layouts ----------
const LINE1_WIDE = joinWithDot(S, M_WIDE, DIR_WIDE, V_WIDE, CONV_WIDE);
const LINE2_WIDE = joinWithDot(ART_WIDE, SUB_WIDE, BG_WIDE, SB_WIDE, quotaWide, ctxBarWide, tokDetailsWide);

const LINE1_MED = joinWithDot(S, M_MED, DIR_MED, V_MED);
const LINE2_MED = joinWithDot(ART_MED, SUB_MED, BG_MED, SB_MED, quotaMed, ctxBarMed, tokDetailsMed);

// ---------- Columns logic ----------
let COLS = input.terminal_width ?? 80;
if (typeof COLS !== "number" || isNaN(COLS)) {
  COLS = 80;
}

const MARGIN = 8;
const len1Wide = visibleLen(LINE1_WIDE);
const len2Wide = visibleLen(LINE2_WIDE);

if (COLS >= 135 && COLS >= (len1Wide + len2Wide + MARGIN)) {
  // 1. Single-row Wide Layout
  const output = getRightAlignedString(LINE1_WIDE, LINE2_WIDE, COLS);
  process.stdout.write(output + "\n");
} else if (COLS >= 100) {
  // 2. Double-Row Parallel Wide Layout
  const r1Left = joinWithDot(S, M_WIDE);
  const r1Right = joinWithDot(ART_WIDE, SUB_WIDE, BG_WIDE, SB_WIDE);
  const r2Left = joinWithDot(DIR_WIDE, V_WIDE, CONV_WIDE);
  const r2Right = joinWithDot(quotaWide, ctxBarWide, tokDetailsWide);
  
  const line1 = getRightAlignedString(r1Left, r1Right, COLS);
  const line2 = getRightAlignedString(r2Left, r2Right, COLS);
  process.stdout.write(`${line1}\n${line2}\n`);
} else if (COLS >= 75) {
  // 3. Double-Row Parallel Medium Layout
  const r1Left = joinWithDot(S, M_MED);
  const r1Right = joinWithDot(ART_MED, SUB_MED, BG_MED, SB_MED);
  const r2Left = joinWithDot(DIR_MED, V_MED, CONV_MED);
  const r2Right = joinWithDot(quotaMed, ctxBarMed, tokDetailsMed);
  
  const line1 = getRightAlignedString(r1Left, r1Right, COLS);
  const line2 = getRightAlignedString(r2Left, r2Right, COLS);
  process.stdout.write(`${line1}\n${line2}\n`);
} else if (COLS >= 50) {
  // 4. Double-Row Parallel Narrow Layout
  const r1Left = joinWithDot(S, M_NARROW);
  const r1Right = joinWithSpace(ART_NARROW, SUB_NARROW, BG_NARROW, SB_NARROW);
  const r2Left = joinWithDot(DIR_NARROW, V_NARROW);
  const r2Right = joinWithDot(quotaNarrow, ctxBarNarrow);
  
  const line1 = getRightAlignedString(r1Left, r1Right, COLS);
  const line2 = getRightAlignedString(r2Left, r2Right, COLS);
  process.stdout.write(`${line1}\n${line2}\n`);
} else {
  // 5. Extreme Fallback
  const mShort = modelClean ? `${GRAY} ╱ ${MAGENTA}${modelClean.slice(0, 8)}${RESET}` : "";
  const line1 = `${S}${mShort}`;
  const line2 = quotaNarrow ? joinWithDot(quotaNarrow, ctxBarNarrow) : ctxBarNarrow;
  process.stdout.write(`${line1}\n${line2}\n`);
}
