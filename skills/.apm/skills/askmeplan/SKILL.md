---
name: askmeplan
description: >
  Dialogue-driven planning that replaces one-shot plan generation with a Socratic conversation.
  Instead of producing a complete plan immediately, surface key decision points one round at a time,
  incorporate the user's answers, and converge on a co-created implementation plan.
  Use when the user says "/askmeplan", "let's plan together", "ask me before planning",
  "help me think through", or any request to plan something interactively rather than
  receiving a ready-made plan. Also use when the request is ambiguous or involves significant
  trade-offs that require human judgment before implementation can begin.
---

# askmeplan

Produce plans through structured Socratic dialogue rather than upfront analysis.
The goal is a plan co-created by both parties — not AI dictating, not user specifying every detail.

## Core Idea

Inspired by:
- **Socratic dialogue**: Uncover hidden assumptions through targeted questions
- **Iterative requirements elicitation (URef)**: Plan the question sequence to guide discovery
- **Human-in-the-loop planning**: Humans resolve trade-offs that AI cannot safely decide alone

The plan emerges *through* the conversation, not before it.

## Workflow

### Phase 1 — Parse and identify decision points

On receiving the request:

1. Read any relevant code, files, or context silently (run tools without narrating)
2. Internally identify all decision points: architecture choices, scope boundaries, constraints, trade-offs, unknowns
3. Rank them by impact on the final plan — high-impact decisions first
4. Do NOT write the plan yet

### Phase 2 — First question round

Open with a structured message:

```
## Key Planning Issues

There are [N] issues to resolve before implementing [request].

**Current assumptions:**
- [assumption 1]
- [assumption 2]

**First question ([1/N]):**

> [Single highest-impact question, phrased as a concrete choice with trade-offs]
>
> Option A: [description] → [consequence A]
> Option B: [description] → [consequence B]

I will ask the remaining issues in sequence.
```

Rules for Phase 2:
- Ask **exactly one question** per round — never multiple at once
- State current assumptions so the user can correct silent ones
- If multiple valid interpretations of the request exist, surface them — don't pick silently
- Frame questions as concrete choices with their consequences, not open-ended queries
- Show progress: `[1/N]` where N is total rounds estimated

### Phase 3 — Absorb and continue

After each user answer:

1. Acknowledge the decision in one sentence: `Decision: [what was decided].`
2. Update the emerging plan silently
3. If the answer resolves downstream questions, skip them and say so
4. Ask the next question in the same format, updating the `[X/N]` counter

Stop asking when:
- All high-impact decisions are resolved
- Remaining unknowns can be safely assumed (state each assumption explicitly)
- User signals readiness: "enough", "proceed", "just do it"

### Phase 4 — Propose the plan

When dialogue is complete, output:

```
## Implementation Plan

**Agreed decisions:**
- [decision 1]: [chosen direction]
- [decision 2]: [chosen direction]

**Implementation steps:**
1. [step] — [why this order] → verify: [check]
2. ...

**Assumptions held / out of scope:**
- [assumption]
- [excluded item]

Ready to proceed with this plan?
```

### Phase 5 — Execute

On confirmation, implement without re-planning. Act on what was agreed.

**Implementation-time decision guard**: The agreed plan covers high-level decisions. During implementation, you will encounter sub-decisions not explicitly covered. For each one, ask:
- Is this a user-visible design choice? (type signature, field name, error type, option shape, behavior in edge cases) → **Surface it before implementing.** Ask as a concise inline question: "実装中に判断が必要な点があります: [question]"
- Is this a pure internal detail with no user-visible consequence? (private variable name, loop structure, comment style) → Decide silently.

When in doubt, surface it. The cost of one extra question is lower than the cost of implementing the wrong contract and having to rework it.

If unexpected obstacles arise, surface them immediately and ask — do not silently diverge from the agreed plan.

## Question Design Rules

**Good questions** resolve unknowns the user would reasonably want input on:
- Scope: "Should authentication be included in this feature?"
- Architecture: "Should state live on the server or client?"
- Trade-offs: "Do you prefer performance or faster delivery here?"
- Constraints: "Does this need to stay backward-compatible with [X]?"
- **API/interface design** (when designing public-facing interfaces): type signatures of exported interfaces, field names in return values, error handling patterns, authentication configuration shapes, option naming. These are NOT derivable from context — they define the contract the user must live with.
- **Simpler alternatives**: If a significantly simpler approach exists that satisfies the core request, surface it as an option rather than silently following the more complex path.

**Bad questions** (avoid):
- Things already answered in prior messages
- Open-ended polls with no architectural consequence
- Internal implementation details with no user-visible consequence (e.g., private variable names, algorithm internals, test helper naming)

**Threshold rule**: Before skipping a decision as "derivable from context", ask: _would the user reasonably want input on this?_ If yes, surface it. Reserve "assumption" for decisions that have no user-facing consequence.

## Assumption Quality Gate

Before listing an item under "Current assumptions" in Phase 2, apply this test:
- Would the user reasonably disagree with this assumption?
- Does this assumption affect user-visible API, behavior, or constraints?

If yes to either, convert it to a question — do not list it as an assumption.

## Dialogue Hygiene

- **One question per message.** More splits user attention and delays convergence.
- **Show assumptions.** Silent assumptions that turn out wrong waste both parties' time.
- **Compress answered rounds.** One acknowledgment line per answer — do not re-summarize everything.
- **Allow fast-track.** If the user provides enough context upfront to skip to Phase 4, go directly there.
- **Mirror language.** Use the same language the user writes in.
- **Present options neutrally.** Do not state "I prefer X" or "I think X is better" in the question body. State tradeoffs objectively without advocating. If you have technical context to share (e.g., a constraint discovered from research), share the fact, not the preference.
