#!/usr/bin/env bun
import { $ } from "bun";

async function main() {
  try {
    const input = await Bun.stdin.text();
    if (!input.trim()) {
      console.log(JSON.stringify({ allow_tool: true }));
      return;
    }

    const inputData = JSON.parse(input);
    const toolCall = inputData.toolCall || {};
    const toolName = toolCall.name || "";
    const args = toolCall.args || {};

    if (toolName === "run_command" && args.CommandLine) {
      const originalCmd = args.CommandLine;

      // Execute rtk rewrite quietly and do not throw on non-zero exit codes
      const result = await $`rtk rewrite ${originalCmd}`.quiet().nothrow();

      if (result.exitCode === 0 || result.exitCode === 3) {
        const rewritten = result.stdout.toString().trim();
        if (rewritten && rewritten !== originalCmd) {
          console.log(JSON.stringify({
            allow_tool: true,
            overwrite: {
              name: "run_command",
              args: {
                CommandLine: rewritten
              }
            }
          }));
          return;
        }
      }
    }
  } catch (e) {
    // Fail-open on any errors
  }

  console.log(JSON.stringify({ allow_tool: true }));
}

main();
