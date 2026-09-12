---
name: typescript-recommend-tools
description: Choose or migrate a TypeScript toolchain for a CLI, library, web app, or API. Use for tool selection requests, not routine work in an existing stack.
---

# TypeScript Tool Selection

Start from the repository's runtime, module system, lockfile, and package scripts. Preserve an established stack unless the user requests migration or a verified constraint requires it.

For an undecided project, recommend a concrete stack with the relevant tradeoff. Ask only if an unresolved runtime, deployment, or packaging requirement materially changes the choice. Use `ni` / `nr` / `nlx` where the environment requires them.

## Select a Reference

- Overall defaults and project matrix: [default-stacks.md](references/default-stacks.md).
- Package manager, framework, and exception decisions: [tool-selection-rules.md](references/tool-selection-rules.md).
- Linting and formatting configuration: [linting-and-formatting.md](references/linting-and-formatting.md).
- Node or CLI execution: [node-cli-toolchain.md](references/node-cli-toolchain.md).
- Library builds or web development: [library-and-web-toolchains.md](references/library-and-web-toolchains.md).

The references record preferred defaults, not guaranteed current compatibility. Verify version-sensitive claims against installed versions and official documentation before recommending or installing a migration.

For advice, deliver the choice and why it fits. For an authorized migration, finish the configuration changes and relevant checks, reporting any compatibility blocker. Tool selection alone does not authorize installing or replacing the stack.
