# Funnel Playbook

## Commands by Stage

### Stage 0 — Orient
```bash
fd -t d -d 2 .                                            # Layout
fd -e json -e toml -d 2 'package|go.mod|Cargo|pyproject' # Manifests
```

### Stage 1 — Locate
```bash
rg -n 'symbolName' src/                                   # Content
fd -t f 'filename'                                        # Filename
ast-grep run -p 'createSession($$$ARGS)' src/*.ts          # Structural
```

### Stage 2 — Map Structure
```bash
ast-grep outline src/session.ts                           # Single file TOC
ast-grep outline src/session/*.ts                        # Directory TOC (glob required)
ast-grep outline src/session.ts --items imports           # Imports
```

### Stage 3 — Zoom & Special Sweeps
```bash
ast-grep outline src/session.ts --match SessionManager --view expanded # Symbol view
rg -n 'myTargetFunction\(' src/                            # Trace callers (Root cause)
fd 'util|helper|common' src/                               # Search codebase reuse
```

### Stage 4 — Read
Read bounded line ranges (`offset`/`limit`) only for surviving candidates.

## Fallback Chain
`ast-grep run` -> `rg -n -A 8 -B 2` -> bounded `Read`.

## Subagent Delegation
Sweep wide directories using **Explore** subagent to keep file dumps out of main context.
