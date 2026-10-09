---
name: anything-else
description: Wrap up a session by surfacing remaining work — related issue triage and updates, forgotten tasks worth filing, and useful follow-ups to do now. Use when the user asks "anything else?" or invokes /anything-else near the end of a session.
---

# Anything Else

Answer "what else should be done before we stop?" with specific, evidence-backed items, not a generic checklist.

## 1. Gather evidence

Read the session first; then inspect only what it touched.

- Session: stated goals, deferred items ("later", "TODO", "out of scope"), unresolved errors, skipped checks, assumptions made, and tasks the user mentioned in passing and that were never done.
- Repository: `git status`, `git diff --stat`, unpushed commits, current branch and any open PR (state, review comments, CI).
- Issues: if `gh` is available and the repo has a remote, list open issues and PRs related to the touched files, features, or branch (`gh issue list --search`, `gh pr list`). Read candidates before judging them.

## 2. Classify findings

- **Issue upkeep**: issues this work resolves (close or comment with the commit/PR), partially advances (update the checklist or add a progress note), makes stale or duplicate, or whose description is now wrong.
- **Forgotten tasks**: follow-ups that surfaced mid-session and are not tracked. Check for an existing issue before proposing a new one.
- **Do now**: small, high-value actions that are cheaper now than later: uncommitted or unpushed work, unrun relevant checks, docs or config that drifted, `chezmoi apply` or deployment not yet performed, temp files or debug code left behind, notes worth persisting.
- **Skip**: anything speculative, cosmetic, or unrelated to the session. Omit it rather than padding the list.

## 3. Act within authorization

- Read-only inspection and local reversible fixes within the session's scope may proceed.
- Creating, editing, commenting on, or closing issues and PRs, pushing, and committing change shared state: propose them with ready-to-run content (title, body, labels, target issue number) and perform them only if the user asked or confirms. If the user invoked this skill explicitly asking you to file or update issues, do so.
- Never invent issue numbers, statuses, or check results; mark anything you could not verify.

## 4. Report

Lead with the answer: either "nothing remaining" or a short prioritized list. For each item give what, why (the session evidence), and the exact action or command. Group as Issue upkeep / New issues / Do now. Draft new issue titles and bodies in the repository's language and conventions (English unless the repository uses another). Keep it concise; the user reads this at the end of a session.
