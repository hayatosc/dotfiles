# Legacy Safety Net

Use this file when tests are weak, behavior is unclear, or the code is brittle.

## Goal

Preserve current behavior well enough to refactor safely without pretending the system is better understood than it is.

## Minimum Safety Net Options

Choose the lightest option that still makes regressions visible:

- Existing unit, integration, or end-to-end tests
- A narrow characterization test around the code being touched
- A fixture with known input and output
- Snapshot or serialized output comparison
- A reliable manual repro with explicit steps and expected results
- Logging or tracing used only to understand current behavior before cleanup

## How to Work When Behavior Is Murky

- Identify the observable behavior at the boundary: return values, rendered output, emitted events, files written, HTTP responses, CLI output, or database mutations.
- Protect that boundary first, even if internal structure remains messy.
- Reduce the change surface until you can explain exactly what must stay the same.

## Creating Seams

Introduce seams when the code is hard to test or isolate directly.

- Wrap global state, time, randomness, or environment access behind small functions or adapters.
- Separate framework callbacks from domain logic.
- Pull data fetching and persistence behind narrow interfaces.
- Extract parsing and decision-making from effectful orchestration.

## Characterization Strategy

When no trustworthy tests exist:

- Capture representative inputs and outputs before editing.
- Prefer several narrow examples over one oversized fixture.
- Preserve odd edge-case behavior unless the user asked to change it.
- If the current behavior looks wrong, note it explicitly before preserving or changing it.

## Scope Control Rules

- Keep changes local to the behavior you can observe.
- Avoid opportunistic redesign in unstable areas.
- If you cannot describe the preserved behavior, do not widen the refactor.
- If every safe step still feels risky, pause and ask for a narrower goal or approval to add stronger tests first.

## Good Outcome

A good legacy refactor does not require perfect understanding. It requires a clear boundary, a small step, and a reliable enough check to tell you if you broke it.
