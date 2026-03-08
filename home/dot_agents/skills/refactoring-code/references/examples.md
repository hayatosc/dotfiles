# Examples

Use these examples to match the expected structure and level of caution.

## Example 1: Duplicate Logic

Input:

`Refactor these two controllers. They repeat the same request parsing and validation logic.`

Good opening:

- `Goal:` extract the shared parsing and validation path from both controllers
- `Preserved behavior:` both endpoints must accept and reject the same inputs as before
- `Plan:` identify the shared branch, extract a helper without moving call sites yet, switch one controller, verify, then switch the second controller
- `Verification:` run the existing controller tests and compare error responses for one valid and one invalid request

## Example 2: Giant Function

Input:

`Clean up this 200-line function without changing behavior.`

Good opening:

- `Goal:` split the function into named phases so the control flow is easier to follow
- `Preserved behavior:` output values, error handling, and side effects must remain the same
- `Plan:` mark phase boundaries, extract pure helpers first, isolate side effects last, verify after each extraction
- `Verification:` run the narrowest tests covering the function and keep one manual repro for the longest branch

## Example 3: Legacy Code With Weak Tests

Input:

`Refactor this module. It is hard to maintain, but the test coverage is poor.`

Good opening:

- `Goal:` improve local structure in the module without widening the behavior surface
- `Preserved behavior:` current exported API and current file outputs must stay the same
- `Plan:` identify a small boundary, add a characterization check for representative input and output, introduce a seam around side effects, then extract one helper at a time
- `Verification:` run the new characterization check plus the existing module tests

## Example 4: Mixed Refactor and Feature Request

Input:

`Refactor this service and also add a new retry rule.`

Good opening:

- `Goal:` separate the structural cleanup from the retry behavior change
- `Preserved behavior:` current retry behavior stays unchanged during the refactor phase
- `Plan:` first perform the internal cleanup in small slices, verify the unchanged behavior, then handle the retry rule as a second phase
- `Verification:` run the existing retry tests before and after the refactor phase, then add coverage for the new rule separately
