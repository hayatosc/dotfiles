---
name: askmeplan
description: >
  Dialogue-driven planning through Socratic questioning, inspired by grill-me.
  Surface key decisions one at a time with recommended answers, explore the codebase
  to self-answer when possible, and converge on a co-created implementation plan.
  Use when the user says "/askmeplan", "let's plan together", "ask me before planning",
  "help me think through", "grill me", or any request to plan interactively.
  Also use when the request is ambiguous or involves significant trade-offs
  that require human judgment before implementation can begin.
---

# askmeplan

Co-create plans through Socratic dialogue. The plan emerges *through* conversation.

## Workflow

### Phase 1 — Explore and identify decisions

1. Silently read relevant code, files, and context (use tools without narrating)
2. Identify all decision points: architecture, scope, constraints, trade-offs, unknowns
3. Self-answer any decision that the codebase already resolves — do NOT ask the user about these; instead report: "I checked [file] and found [X], proceeding with [decision]."
4. Rank remaining decisions by impact. High-impact first.
5. Assess scope size. If the scope is very large, suggest splitting into smaller independently-plannable chunks before starting questions.

### Phase 2 — Ask one question at a time

Use the dedicated user-question tool when available. Fall back to text output only if no such tool exists.

Known tool names by platform:
- Claude Code: `AskUserQuestion`
- Codex CLI: `ask_user_question`
- Cline: `ask_followup_question`
- Antigravity: `ask_question`
- Gemini CLI: `ask_user`

For each question:
- Ask **exactly one** per round
- Provide a **(Recommended)** option with technical rationale when you have a well-grounded reason
- Present all options with honest trade-offs so the user can override
- Show progress: `[X/N]`
- State current assumptions so the user can correct silent ones

Tool usage example:
```
ask_question(
  question: "Where should session state live? [1/5]",
  options: [
    "(Recommended) Server-side sessions — simpler auth, avoids token theft",
    "Client-side JWT — stateless, easier horizontal scaling"
  ],
  is_multi_select: false
)
```

### Phase 3 — Absorb and continue

After each answer:
1. One-line acknowledgment: `Decision: [what was decided].`
2. If the answer resolves downstream questions, skip them and say so
3. Ask next question

### Phase 4 — Propose and preserve the plan

When all high-impact decisions are resolved, output the implementation plan as an **artifact file** (markdown) so decisions survive context clearing.

Include: agreed decisions, implementation steps with ordering rationale, assumptions held, and out-of-scope items. Ask: "Ready to proceed?"

### Phase 5 — Execute

Implement without re-planning. For sub-decisions during implementation:
- User-visible choices (API shape, error types, behavior) → surface as inline question
- Pure internal details → decide silently

## Question Fidelity

Not all questions are answerable through text.

| Type | Answerable via text? | Example |
|------|---------------------|---------|
| **Low fidelity** | ✓ Yes | "What URL should this route use?" |
| **High fidelity** | ✗ Needs prototype | "How should this form flow feel?" |

When you hit a high-fidelity question: flag it, defer it, and suggest the **handoff pattern** (plan → prototype → resume planning). Do not pressure the user to answer abstract UI/UX questions.

## Don't Over-Plan

Planning has diminishing returns. AI can surprise you with better solutions than you'd specify.

- If the user has ~50% clarity and the scope is small, suggest: "We have enough direction. Want me to build a first version and iterate from there?"
- Leave room for AI creativity — don't lock down every detail. Specify *what* and *why*, let the agent figure out *how*.
- Prefer "build and adjust" over "plan exhaustively" when the cost of iteration is low.

## Dialogue Rules

- **One question per message.** Never multiple at once.
- **Show assumptions.** Hidden wrong assumptions waste time.
- **Compress acknowledged decisions.** One line per answer, no re-summarization.
- **Allow fast-track.** If the user provides enough upfront context, skip to Phase 4.
- **Mirror language.** Match the user's language.
- **Explore before asking.** If a question can be answered by reading the codebase, read the codebase instead.
- **Know when to stop.** If remaining unknowns are low-impact, stop grilling and propose the plan.
