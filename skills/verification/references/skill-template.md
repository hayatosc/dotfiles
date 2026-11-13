---
name: verify-<app>
description: Drive <app> and prove runtime behavior. Use when a change affects <areas>.
---

# Verify <app>

## Run

```bash
<driver> doctor
<driver> start
<driver> exercise <feature>
<driver> stop
```

## Features

| Feature | Command | Expected |
|---|---|---|
| <feature> | `<driver> exercise <feature>` | <observable result> |

## Evidence

Write logs and screenshots to `tmp/verify-<app>/`. Report the command, expected result, actual result, and artifact path.

## Failure handling

- Port or lock busy: stop the stale process, then retry once.
- Missing dependency: report the exact install command instead of guessing.
- Non-zero exit: attach the last 40 lines of the captured log.
