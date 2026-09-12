# Worked example

One complete pass, compressed: what the interview settled, the contract that came out of it, and
the `PLAN.md` that shipped with it. The repeated test runs and turn cap are specific user choices in this example, not requirements for other goals.

## Request

> /goalplan ログイン周りの E2E が不安定で CI が赤くなる。直すための /goal を計画して。

## Step 1 — what exploration resolved (reported to the user, not asked)

- Checked `.github/workflows/ci.yml`: `pnpm test:e2e` runs on every PR → **verification surface**.
- Checked `e2e/auth.spec.ts` + last 20 CI runs: 3 of 42 specs fail intermittently, all in
  `auth.spec.ts`, all on the same `waitForTimeout` → **scope is one file**.
- Checked `git status`: clean → a goal run may mutate the repo.
- No existing `PLAN.md`; repo has no `docs/plans/` convention → **repo-root `PLAN.md`**.

## Step 2 — what only the user could decide (round 1, 3 questions)

| Question | Answer |
|---|---|
| Finish line: "10 consecutive green runs" or "no `waitForTimeout` left + green"? | 10 consecutive green local runs |
| May the fix change app code, or test code only? | Test code only; app change needs a separate goal |
| Cap? | 15 turns, then report |

Round 2 was empty: the answers unblocked nothing new. The frontier closed after one round.

## Step 3 — the contract

```text
/goal Make e2e/auth.spec.ts deterministic, verified by `pnpm test:e2e --grep auth` passing 10 consecutive runs with no `waitForTimeout` left in the file, while every other spec keeps passing and no file under src/ changes.
Follow ./PLAN.md: work its checkpoints in order and update its progress log after each attempt.
Use only e2e/ and playwright.config.ts.
Between iterations, append a row to the PLAN.md progress log and pick the next action from the last failure output.
If blocked, stop and report the flaky spec, the attempted waits, the captured trace path, and what input you need; or stop after 15 turns.
```

## Step 4 — the PLAN.md

```markdown
# e2e/auth.spec.ts を決定的にする

## Definition of done
`pnpm test:e2e --grep auth` が 10 回連続で成功し、`e2e/auth.spec.ts` に `waitForTimeout` が残っていない。

## Verification
- `pnpm test:e2e --grep auth` → exit 0（10 連続）
- `rg 'waitForTimeout' e2e/auth.spec.ts` → 0 hits
- `pnpm test:e2e` → exit 0（他のスペックの回帰なし）

## Constraints & invariants
- `src/` 以下は変更しない（アプリ側の修正は別ゴール）
- 既存のテスト名とアサーションの意味は変えない
- スキップ・リトライ設定でごまかさない（`test.skip` / `retries` の追加禁止）

## Boundaries
- 変更可: `e2e/`, `playwright.config.ts`
- 参照のみ: `src/`, CI ログ
- ネットワークアクセスなし

## Checkpoints
- [ ] C1 失敗を再現する — verify: `pnpm test:e2e --grep auth --repeat-each 10` — evidence: 失敗回数とトレース
- [ ] C2 待機を web-first assertion に置き換える — verify: `rg 'waitForTimeout' e2e/auth.spec.ts` が 0 — evidence: diff
- [ ] C3 10 連続成功 — verify: `for i in $(seq 10); do pnpm test:e2e --grep auth || break; done` — evidence: 連続 exit 0
- [ ] C4 全体の回帰確認 — verify: `pnpm test:e2e` — evidence: exit 0

## Progress log
| date | checkpoint | change | evidence | next |
|------|-----------|--------|----------|------|

## Blocked & risks
- 不安定の原因がアプリ側（セッション競合）の場合、テストだけでは決定的にできない → C1 のトレースで切り分け、該当したら停止して報告
- `--repeat-each 10` が CI 時間を超える可能性 → ローカル実行に限定

## Stop conditions
- 上記のブロック条件に該当したら停止し、試した待機方法・トレースパス・必要な判断を報告
- 15 ターンで停止して報告
```

Note the shape: the log starts empty, every checkpoint carries its own command, and the constraints
forbid the cheap escapes (`retries`, `test.skip`) that would satisfy the letter of the goal.
