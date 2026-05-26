# Refactor Playbook

Use this file when choosing the next safe structural move.

## Start With the Simplest Move

- Prefer the smallest change that reduces complexity without changing behavior.
- If two moves are possible, choose the one that preserves more call sites and data shapes.
- When in doubt, make a preparatory refactor first, then perform the main cleanup.

## Common Moves

### Rename

Use when the main problem is misleading intent rather than structure.

- Rename variables, functions, modules, and types to match the role they already have.
- Prefer narrow renames over bundling renames with other structural changes.

### Extract

Use when one block has a clear sub-purpose or repeated logic appears more than once.

- Extract a helper when the new name makes the code easier to read than the inline block.
- Extract pure logic before moving or reusing it.
- Keep extracted units close to the original context until the structure stabilizes.

### Split

Use when one function, type, or module is carrying multiple reasons to change.

- Split long functions by phase: parsing, validation, decision-making, side effects, formatting.
- Split modules when responsibilities are coupled only by file history, not by runtime behavior.
- Split data transformation from effectful operations whenever possible.

### Move

Use when ownership is wrong but the abstraction is already clear.

- Move code toward the module that owns the data or invariant it operates on.
- Finish renames and extractions before moving code across files.
- Prefer one move at a time so imports and call sites remain easy to verify.

### Isolate Side Effects

Use when business logic is entangled with I/O, state mutation, or framework wiring.

- Push side effects to the edges and keep decision logic in small testable units.
- Separate time, randomness, environment, network, and filesystem access from pure computation.
- Add thin adapters instead of rewriting the entire flow.

### Remove Duplication

Use when repeated code expresses the same rule, not just similar syntax.

- Confirm the duplicated logic will evolve together before introducing an abstraction.
- Prefer extracting a shared helper over introducing a configurable abstraction too early.
- Stop if the abstraction becomes harder to read than the duplication.

#### When duplication already exists across files

1. **Detect**: search for similar functions, types, constants, or regexes using grep, structural search, or dependency analysis.
2. **Classify**: determine if the duplication is genuine (same rule, same evolution path) or accidental (similar syntax, different semantics).
3. **Verify one instance**: confirm behavior with existing tests or a manual repro before touching the second instance.
4. **Extract the shared unit**: create a helper, module, or shared file that captures the common logic without premature configurability.
5. **Migrate call sites one at a time**: replace the first duplicate, verify, then replace the second. Do not change both in the same commit unless the change is trivial.
6. **Delete the old code** only after all call sites are migrated and verified.

#### Common extraction targets in dotfiles and scripting

- Shell helpers that spawn commands, parse output, or normalize paths.
- TypeScript wrappers for file I/O, process spawning, or TOML/JSON parsing.
- Validation logic that appears in multiple templates or config generators.
- Regexes or awk/sed patterns that perform the same text transformation.

## Detecting Existing Duplication

Use when the user asks to reduce duplication or when you notice repeated logic while working.

### Search Strategy

1. **Textual similarity**: grep for distinctive strings, error messages, regex literals, or magic numbers.
2. **Structural similarity**: look for functions with the same parameter types, same control flow, or same return shape.
3. **Semantic similarity**: read the code to see if different-looking blocks encode the same rule (e.g., two awk scripts that extract the same TOML section).
4. **Dependency analysis**: check if multiple files import the same third-party utilities but wrap them differently.

### Classification Checklist

Ask these questions before unifying:

- Do both copies change for the same reason? (genuine duplication)
- Would one copy need to diverge while the other stays the same? (accidental similarity — do not unify)
- Is the repeated code a stable language idiom or a one-off pattern? (idioms are fine to repeat)
- Does unifying require adding configuration flags or conditionals that make the code harder to read? (stop if yes)

### Smell to Move Mapping

- Giant function: split by phase, then extract named helpers.
- Mixed pure logic and side effects: isolate side effects first.
- Misleading names: rename before deeper changes.
- Tangled dependencies: extract interfaces or seams before moving code.
- Repeated branching rules: extract shared decision logic if the rule is truly the same.
- **Scattered duplicate helpers: extract one canonical version, migrate callers incrementally, then delete the rest.**

## Sequencing Heuristics

- First make the code easier to change, then make the intended cleanup.
- Prefer many reversible steps over one clever transformation.
- Keep behavior-preserving refactors separate from feature additions.
- Verify after each slice, not only at the end.

## Stop Conditions

- Stop when the next change would alter behavior, not just structure.
- Stop when the code is clearly simpler and further cleanup is speculative.
- Stop when the remaining problems need product or API decisions rather than refactoring.
