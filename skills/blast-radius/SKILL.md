---
name: blast-radius
description: Find what a change could break beyond the immediate diff, and prove the one fact it's safe because of by running real code. Use for "blast radius of X", "what could this break", or evaluating risky diffs.
---

# Blast Radius

Identify what a change breaks outside its immediate diff before landing it. Use for "blast radius of X", "what could this break", or reviewing a change whose ripple effects are uncertain.

Grep or symbol search lists direct callers in seconds; the true job is uncovering the breakage that symbol search misses.

## Don't Trust a Plausible Writeup

A blast-radius explanation that sounds convincing is dangerous if unverified. Identify the critical facts the change's safety depends on, and prove them by executing code rather than asserting safety in prose.

### Confidence Ladder

For each safety-critical fact, reach the highest feasible level:

1. **Asserted:** Stated without proof (unreliable).
2. **Cited:** Pointed to exact code lines (`path:line`) or upstream definitions.
3. **Reasoned:** Traced control/data flow step by step to demonstrate unreachable failure.
4. **Executed:** Verified via an isolated script, test, or command that calls the real code and fails loudly if wrong.
5. **Observed:** Demonstrated in the live running application.

Any safety claim that cannot reach Level 4 or 5 must be explicitly reported as unproven.

## Investigation Workflow

1. **Examine the Change:** Inspect the diff, added/modified/removed symbols, contract shifts, and downstream behavioral changes.
2. **Isolate the Keystone Fact:** Most safe changes rely on one central fact (e.g., "this helper only touches stale entries"). Pinpoint that fact; proving it eliminates broad speculation.
3. **Probe Beyond Symbol Search:** Inspect serialization boundaries (JSON, DB schemas, network payloads), lifecycle timings (async microtasks, unmount hooks), feature flags, and multi-hop callers.
4. **Assess Concrete Risks:** Distinguish confirmed hazards from checked-and-cleared edge cases. Assign concrete impact and likelihood to remaining risks.
5. **Prove with Running Code:** Write a focused test or scratch script importing the real module to verify the keystone fact. Run it and report literal output.

## Output Structure

- **Summary of Change:** Observable behavioral shifts and non-obvious contract changes.
- **Keystone Safety Fact:** The central premise making the change safe, its level on the confidence ladder, and execution evidence.
- **Active Risks:** Real failure scenarios with `path:line` references, likelihood, impact, and reproduction steps.
- **Cleared Scenarios:** Examined edge cases confirmed safe and the rationale.
- **Verification Check:** The exact script or command used to prove safety.
