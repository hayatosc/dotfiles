---
name: how
description: Explain subsystem architecture, runtime flow, data structures, and code placement. Use for "how does X work", code walkthroughs, or architectural placement questions ("where should this live", "which module owns this").
---

# How

Explain how a subsystem, module, or feature works.

Companion to `code-search` and `why`. While `code-search` locates definitions and `why` uncovers historical motivation, `how` builds a working architectural mental model for understanding and modifying code.

## Operating Principles

- **Build a Mental Model, Not a Code Dump:** Explain the system the way a senior engineer onboards a teammate. Focus on state ownership, data flow, and boundaries rather than narrating line-by-line syntax.
- **Trace the Real Execution Path:** Identify the trigger (CLI command, HTTP request, event, user action), follow the runtime pipeline step by step, and note where data transforms.
- **Ground Claims with Real Code:** Cite exact paths and lines (`path:line`) for key symbols, state holders, and boundary transformations.

## Investigation Workflow

1. **Scope and Anchor:**
   - For a narrow function/module: Trace callers and callees directly.
   - For a cross-cutting subsystem: Identify the entry point, the primary state/data model, the core transform pipeline, and the output or persistence layer.

2. **Map the Four Architecture Dimensions:**
   - **Data Shapes:** What core types, interfaces, or structs represent the domain? Where is state held?
   - **Runtime Flow:** What is the lifecycle from input to output? Where are the synchronous vs asynchronous boundaries?
   - **Ownership and Boundaries:** Which module owns which invariant? Where do trust boundaries and validations sit?
   - **Gotchas and Invariants:** What non-obvious constraints, concurrency considerations, or error handling mechanisms exist?

## Output Structure

Structure the explanation clearly:

- **Overview:** High-level summary of what the subsystem does and its primary role in the codebase.
- **Core Concepts and Data Shapes:** Key types, invariants, and organizing structures (cite `path:line`).
- **Runtime Flow:** Step-by-step lifecycle from entry point to completion, highlighting state transitions and async boundaries.
- **Placement and Ownership:** Where key responsibilities live across files and directories. Answer placement questions ("where should new logic live") directly.
- **Gotchas and Hidden Constraints:** Subtle assumptions, ordering requirements, failure modes, or edge-case handling to be aware of when changing this code.
