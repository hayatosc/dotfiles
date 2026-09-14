---
name: why
description: Investigate the historical motivation, intent, and architectural decisions behind existing code. Use for "why was this built this way", "why did we choose X", regressions, or investigating legacy constraints.
---

# Why

Investigate the motivation, constraints, and historical intent behind existing code.

Companion to `code-search` and `coding-style`. While search reveals *what* the code does, `why` reveals *what forces and trade-offs led to its shape*.

## Investigation Workflow

### 1. Establish the Code Anchor

Identify the target symbols, file paths, and line ranges. Trace commit and review history:

```bash
# Blame target lines to find relevant commits
git blame -L <start>,<end> <file>

# Trace line evolution through renames and refactors
git log -L <start>,<end>:<file>

# Recent commits touching the file with commit messages
git log --oneline -20 -- <file>
```

When merge commits or commit messages reference PR numbers (`#1234`) or issue keys, inspect the discussion and linked tickets via `gh`:

```bash
gh pr view <number> --json title,body,author,createdAt,mergedAt,comments,reviews
gh issue view <number> --json title,body,comments
```

### 2. Evidence Sources (Consult in Parallel)

Query available evidence sources to gather context:

1. **Source Control & PRs:** Git log, blame, PR discussions, review comments, and associated commit rationale (always available).
2. **Issue / Ticket Trackers:** GitHub Issues, Linear, Jira (surfaces product/business forcing functions).
3. **Architecture Docs & ADRs:** Design documents, RFCs, ADRs, architectural decisions in the repository.
4. **Error & Incident History:** Postmortems, bug tickets, or defensively structured code (null checks, backoff retries, timeouts often originate from specific past outages).
5. **Communication Records:** Team discussions or MCP tools if available in the environment.

If an evidence category is unavailable, record it as an explicit coverage gap rather than guessing.

### 3. Epistemic Posture

Distinguish confirmed facts from inferences:

- **Documented Fact:** Directly stated in commit messages, PR descriptions, ADRs, or linked tickets with citations (`[PR #123]`, `[commit abcd12]`).
- **Strong Inference:** Directly implied by defensive code structures, regression test cases, or surrounding diffs.
- **Hypothesis:** Plausible design rationale consistent with the code, but lacking written confirmation. Mark explicitly as an unconfirmed hypothesis.

### 4. Output Structure

- **The Code Anchor:** Targeted file, symbols, and historical commit SHAs / PR references.
- **Documented Findings:** Quoted or cited rationale from PRs, commit messages, and issues.
- **Inferred Constraints:** Edge cases, backward compatibility needs, or external invariants the code protects against.
- **Open Unknowns:** Gaps where the paper trail is silent.
- **Guidance for Modifying:** If this inquiry precedes a code change, list what must be **Preserved**, what is safe to **Change**, and what **Risks** to mitigate.
