---
name: code-search
description: Locate definitions, callers, and ownership in unfamiliar or large codebases. Use when the relevant files or execution path are unclear.
---

# Code Search

Start from the question and supplied paths. Use `rg --files` for filenames and `rg` for symbols or text; narrow by directory or language before expanding the search.

Read enough context to establish the relevant behavior and callers. For a large file, use an available outline tool or bounded reads. Small or known files can be read directly; no mandatory sequence of tools is needed.

- For shared behavior changes, trace relevant callers and existing helpers before choosing the edit location.
- Use `ast-grep` when syntax-aware matching will resolve ambiguity that text search cannot.
- Read [funnel-playbook.md](references/funnel-playbook.md) for navigation commands and fallback patterns when ordinary searches are insufficient.
- Delegate a broad sweep only when delegation is authorized and it can run independently of useful local work.

Stop when the assigned question is answered or the edit's affected path is understood. Report supporting file references and unresolved gaps, not a full repository map.
