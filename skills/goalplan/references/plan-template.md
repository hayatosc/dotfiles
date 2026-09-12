# Plan Template

Use the sections relevant to the agreed goal. Include a run cap only when the user or harness specifies one. Checkpoints may use observed artifacts instead of commands.

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
