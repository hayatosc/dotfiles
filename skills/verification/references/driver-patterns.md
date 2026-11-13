# Driver patterns

## CLI

- Build once, then run the binary against checked-in fixtures.
- Compare exit code, stdout/stderr, and produced files.
- Keep fixtures small and deterministic.

## HTTP service

- Start the service on an ephemeral port, wait for readiness, then send requests.
- Assert status, headers, and a stable part of the body.
- Always stop the process in a trap.

## Browser UI

- Reuse a project Playwright suite when it exists.
- Otherwise drive the harness browser tool through the user path: navigate, fill, submit, assert visible state.
- Capture a screenshot and the console errors on failure.

## Desktop

- Use the harness computer tool when available.
- Otherwise verify the underlying command or HTTP endpoint and state the coverage gap.

## Common rules

- One command per behavior; no interactive prompts.
- Fail with the expected and actual values.
- Keep secrets out of logs.
