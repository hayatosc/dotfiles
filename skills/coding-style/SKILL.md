---
name: coding-style
description: Apply shared readability, minimal-code, and safety rules when implementing or reviewing code. Includes a compact implementation workflow across models.
---

# Coding Style

Prefer the smallest clear implementation that satisfies the requested behavior and fits the repository. Language-specific conventions take precedence over generic preferences.

## Default Workflow

1. Establish the required behavior and affected callers; find the project's relevant check command.
2. Choose the simplest sufficient implementation in this order: existing code, standard library or platform feature, installed dependency, then new code. Do not add speculative features or abstractions.
3. Make a coherent change, preserving compatibility and validation. Prefer early returns to control flags and named subproblems to deeply nested logic when they clarify the flow.
4. Run the relevant check and resolve failures caused by the change. Report changes, evidence, and anything unverified. A typo or mechanical edit does not need a new test or a written plan.

## Implementation Rules

- Reuse existing code, standard libraries, platform features, and installed dependencies when they fit. Add an abstraction when it represents a real shared contract or simplifies the current task.
- Name units and meaningful boundaries explicitly (`delay_ms`, `raw_html`, inclusive versus exclusive bounds). Follow the language's naming conventions.
- Keep control flow and resource ownership easy to follow. Use early returns, explanatory variables, or extracted functions where they improve clarity; do not optimize for line count alone.
- Comments explain intent, non-obvious constraints, or tradeoffs. Document a deliberate limitation and its upgrade trigger when that information will help a future maintainer.
- Trace relevant callers before changing shared behavior. Preserve existing public compatibility requirements; remove obsolete code when those requirements permit it.
- Keep validation at trust boundaries, corruption-preventing error handling, security controls, and basic accessibility intact.

Use the project's relevant linters, typechecks, and tests to establish the requested behavior. Add a focused regression test when an uncovered failure needs one; do not invent a self-check for every edit. Finish once the outcome and relevant checks are satisfied, reporting any concrete blocker.
