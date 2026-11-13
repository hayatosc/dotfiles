# Bug fix

Use surgical mode by default; do not refactor or clean up while fixing.

1. Reproduce with the smallest failing input; add a regression test when the suite can express it.
2. Find the root cause and fix the shared cause, not the symptom.
3. Review the diff for scope and regressions.
4. Verify with the real app and the reproduction.
5. Report the failing case, the fix, and evidence.
