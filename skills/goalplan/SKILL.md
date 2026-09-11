---
name: goalplan
description: >
  Co-create a ready-to-run `/goal` completion contract plus a PLAN.md through a
  grilling-style interview. Trigger ONLY when the user explicitly asks for a `/goal`
  plan: "/goalplan", "/goalのための計画をして", "/goal の計画", "goalplan", "goal を作って",
  "make a plan for /goal", or any phrasing that names `/goal` as the thing being planned.
  Do not trigger on general planning or long-running-task requests that do not mention `/goal`.
  This skill produces the goal text, PLAN.md, and a PLAN.html explanation rendered with the
  html-artifacts skill; it does not implement the task.
---

# goalplan

Co-create two artifacts through a grilling-style interview:

1. **A `/goal` completion contract** — the exact text to run next in this session.
2. **A `PLAN.md`** — the plan the working agent follows across turns, since a single goal line cannot hold milestones, evidence commands, and progress state.

The plan is not a to-do list. It is a *contract*: what must become true, how that is proven, what must not break, and when the run must stop and report.

The interview phase follows Matt Pocock's grilling pattern: model the decisions as a design tree, ask the whole frontier in rounds, and stop only when the frontier is empty.

## Step 0 — Triage before planning

A goal needs three properties:

- **one durable objective** — bigger than one prompt, smaller than a backlog
- **an evidence-based finish line** — a command, artifact, or report that proves it
- **a path that needs several turns** — the next step depends on what the last step learned

If the finish line cannot become concrete, say so and help define proxy evidence (a screenshot, a review checklist, a measured threshold) or recommend a normal prompt instead. Never emit a goal whose completion cannot be demonstrated. If the request bundles unrelated work, split it into separate goals before continuing.

Some desired end states only become specifiable through a prototype (UI feel, design quality). When that happens, make the first goal the prototype itself (`build X to match reference Y, verified by screenshots`), then re-plan the real goal from the artifact.

## Step 1 — Explore before asking (hard gate)

Real tool calls, not stated intent. Read what the goal will touch:

- test / lint / build / benchmark commands and CI config — these are candidate verification surfaces
- relevant source, design docs, issues, logs; acceptance criteria often already exist there
- repo conventions for planning artifacts, and any existing `PLAN.md` (never silently overwrite)
- whether the worktree is clean, since goal runs mutate the repo unattended

Self-answer everything the repository resolves and report it as `Checked <file>: <finding> → assuming <decision>`. Only genuinely user-owned decisions go to Step 2. Alongside the first round, list what was checked and what it resolved; if nothing was checked, go back to Step 1.

## Step 2 — Grill the contract closed

Model the goal as a **design tree**: the objective branches into the decisions that hang off it. The eight fields below are the main branches.

Work the tree in **rounds**. The **frontier** is every question whose prerequisites are already settled — what you can ask now without guessing at answers you have not heard yet. Ask the whole frontier in one round, then wait for answers before the next round. Answers reshape the tree: settled decisions push the frontier outward and unblock questions that depended on them. A question whose answer depends on another question still open this round belongs to a later round.

Use the dedicated user-question tool when available, passing the whole frontier in one call with a `(Recommended)` option and a one-line reason per question. Fall back to numbered text questions, each followed by your recommended answer, only if no such tool exists.

Known tool names by platform:
- Claude Code: `AskUserQuestion`
- Codex CLI: `ask_user_question`
- Cline: `ask_followup_question`
- Antigravity: `ask_question`
- Gemini CLI: `ask_user`

These tools cap a call (`AskUserQuestion`: 4 questions, 4 options each, short labels). When the
frontier is wider, send the highest-leverage four first and the remainder in an immediately
following call — that is still one round. Options must be mutually exclusive one-liners, with the
reason in the option description and the recommended option first. Anything that does not fit that
shape (a path, a threshold, free text) goes as a numbered text question instead.

Rules:

- **Facts are your job, decisions are the user's.** Anything the repo, docs, or commands can answer, look up — dispatch a sub-agent for searches large enough to be worth isolating. A running lookup is an unsettled prerequisite: only its downstream questions wait; ask the rest of the frontier now.
- **No artificial cap.** Some goals close in three questions, some need thirty. Keep digging until every branch is resolved, and do not invent questions once it is.
- **Escape hatch.** If the user says to wrap up (`まとめて`, `just draft it`), stop grilling, summarize every assumption inline, and move unresolved items into `PLAN.md` under risks.
- **One round at a time.** Wait for the user's answers before recomputing the frontier.
- **Mirror the user's language** for the dialogue and artifacts.

The eight branches:

1. **Objective** — one measurable end state. If the user names two, split them.
2. **Verification surface** — the exact command(s) or artifact that proves it, reproducible in this session by the agent itself.
3. **Constraints** — what must not regress (other tests, public API, performance, generated files).
4. **Boundaries** — which files, directories, tools, data, and resources the run may use.
5. **Iteration policy** — progress log location and format, plus how to choose the next action between attempts.
6. **Blocked stop condition** — what counts as blocked, what to report (attempted paths, evidence, blocker, next input needed), and when to pause instead of pushing on.
7. **Cap** — a turn or time clause that bounds the run.
8. **PLAN.md location** — default repo-root `PLAN.md`; respect existing `docs/plans/`-style conventions; if a foreign `PLAN.md` exists, ask before replacing it or use `<repo>/docs/plans/<slug>.md`.

## Step 3 — Write the `/goal` contract

When the frontier is empty and nothing is silently assumed, assemble the fields into one self-contained text:

```text
/goal <desired end state>, verified by <specific evidence>, while preserving <constraints>.
Follow <path>/PLAN.md: work its checkpoints in order and update its progress log after each attempt.
Use <boundaries>.
Between iterations, record <progress log> and pick the next best action from the evidence.
If blocked, stop and report <attempted paths, evidence, blocker, next input needed>; or stop after <N turns>.
```

Rules:

- **Outcome-shaped and imperative.** The contract is both the condition and the first instruction.
- **No unfalsifiable adjectives.** `production-ready`, `polished`, `better` must be replaced by an observable definition or dropped.
- **Make each constraint checkable**, e.g. `no other test file is modified` rather than `don't break things`.
- **Make the evidence observable.** If proof lives only in a file, include the command that prints it into the session.
- **Name the plan file.** The contract is the only thing the working agent is handed; without the
  `PLAN.md` path it never reads the checkpoints, and the plan becomes dead paper.
- **Keep it compact:** one objective, one check, the plan path, the constraints, the stop rule.

Weak → strong:

```text
/goal Improve performance
/goal Reduce p95 latency below 120 ms, verified by `npm run bench:checkout`, while the correctness suite stays green
```

```text
/goal Refactor the code
/goal Split src/session.ts into modules under 300 lines until `npm test` and `tsc --noEmit` exit 0, with no change to exported symbols
```

`references/example.md` holds one worked end-to-end output: interview outcome, contract, PLAN.md.

### Contract self-check before showing the user

- [ ] One objective; one measurable end state
- [ ] Exact verification command(s) or artifact, with exit codes or comparable thresholds
- [ ] `PLAN.md` path named, so the working agent can find the checkpoints
- [ ] Constraints and boundaries are explicit
- [ ] Iteration policy and progress log location named
- [ ] Blocked stop condition and cap included
- [ ] Evidence is observable in the session, not only inside a file
- [ ] Compact enough to run as a single command

## Step 4 — Write the PLAN.md

Draft the PLAN.md now and show it together with the contract; step 5 writes it once the user confirms the shared understanding. Always write it in the end — it is the worker's durable memory. Keep it operational, not narrative:

```markdown
# <Objective>

## Definition of done
<the measurable end state, copied from the goal contract>

## Verification
<copy-paste commands and the expected result of each>

## Constraints & invariants
<what must not regress or change>

## Boundaries
<allowed paths, tools, data, resources; explicit no-go zones>

## Checkpoints
- [ ] C1 <outcome-sized step> — verify: `<command>` — evidence: <artifact or observation>
- [ ] C2 ...

## Progress log
| date | checkpoint | change | evidence | next |
|------|-----------|--------|----------|------|

## Blocked & risks
<known unknowns, fallbacks, what unlocks progress>

## Stop conditions
<blocked rule, cap, and what to report on stop>
```

Each checkpoint should be small enough to verify in one turn, and every checkpoint needs its own verification command — a checkpoint without evidence is a wish. The progress log is append-only; the agent records, never rewrites.

If the harness has no writable workspace (chat-only), output the PLAN.md content inline instead of writing a file.

Then use the `html-artifacts` skill to render the confirmed plan as `PLAN.html` next to `PLAN.md`: a detailed, easy-to-understand HTML explanation of the same plan for the human reviewer — objective, definition of done, verification commands, constraints, checkpoints, and risks — following the Digital Agency Design System. `PLAN.md` stays the source of truth for the executing agent; `PLAN.html` is what the user reads. Link the two files from each other. If the `html-artifacts` skill is not installed, skip `PLAN.html`, say so in the handoff, and do not hand-roll a substitute.

## Step 5 — Hand off

Once the user confirms the contract and the plan draft, write `PLAN.md`, render `PLAN.html`, then print the contract in a fenced code block as the thing to run now in this session — with the `PLAN.md` path inside it. Do not start implementing the task: the goal loop drives it. Exception: when the user asks to seed the work, do only the first step named in `PLAN.md`.

## Dialogue rules

- **Explore before asking.** A question the repository can answer is a wasted round; facts are yours to find.
- **Rounds, not dribbles.** Ask the whole frontier per round with recommendations, then wait.
- **Show assumptions.** Hidden wrong assumptions poison the contract.
- **Compress decisions** to one line; do not re-summarize.
- **Escape hatch on explicit wrap-up**, then mark assumptions and open items in `PLAN.md`.
- **Stop when the frontier is empty.** Remaining low-impact unknowns belong in `PLAN.md` under risks.
