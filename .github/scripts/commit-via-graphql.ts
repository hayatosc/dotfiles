#!/usr/bin/env bun
// GitHub GraphQL `createCommitOnBranch` で $FILES をコミットする。
// GitHub App インストールトークン ($GH_TOKEN) を使うと <app>[bot] 名義の
// 署名付きコミットになり、GITHUB_TOKEN と違い後続ワークフローを再トリガーできる。
//
// 必須 env: GH_TOKEN / REPO (owner/name) / BRANCH / FILES (空白区切り) / MESSAGE
// 任意 env: REGENERATE_CMD (各試行前に実行し $FILES を再生成) / MAX_ATTEMPTS (既定 3)
import { $ } from "bun";

function req(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`${name} required`);
    process.exit(1);
  }
  return v;
}

const token = req("GH_TOKEN");
const repo = req("REPO");
const branch = req("BRANCH");
const files = req("FILES").trim().split(/\s+/);
const message = req("MESSAGE");
const regenerateCmd = process.env.REGENERATE_CMD ?? "";
const maxAttempts = Number(process.env.MAX_ATTEMPTS ?? "3");

const query = `mutation($input: CreateCommitOnBranchInput!) {
  createCommitOnBranch(input: $input) { commit { url oid } }
}`;

for (let attempt = 1; ; attempt++) {
  if (regenerateCmd) await $`bash -c ${regenerateCmd}`;

  // core.fileMode=false: createCommitOnBranch は executable bit を扱えず tree mode が
  // 100644 固定になる一方、再生成コマンドが fs に +x を付けうる。mode 差を「変更あり」と
  // 誤認して空コミットを打ち続けないよう、ここでは mode 差を無視する。
  if ((await $`git -c core.fileMode=false diff --quiet -- ${files}`.nothrow()).exitCode === 0) {
    console.log(`No changes in: ${files.join(" ")} — nothing to commit.`);
    process.exit(0);
  }

  const expectedHeadOid = (await $`git rev-parse HEAD`.text()).trim();

  const additions = await Promise.all(
    files.map(async (path) => ({
      path,
      contents: Buffer.from(await Bun.file(path).arrayBuffer()).toString("base64"),
    })),
  );

  const input = {
    branch: { repositoryNameWithOwner: repo, branchName: branch },
    expectedHeadOid,
    message: { headline: message },
    fileChanges: { additions },
  };

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { authorization: `bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ query, variables: { input } }),
  });
  const body = (await res.json()) as {
    data?: { createCommitOnBranch?: { commit?: { url: string } } };
    errors?: unknown;
  };

  if (res.ok && !body.errors) {
    console.log(body.data?.createCommitOnBranch?.commit?.url ?? "committed");
    process.exit(0);
  }

  console.error(`createCommitOnBranch failed: ${JSON.stringify(body.errors ?? body)}`);
  if (attempt >= maxAttempts) {
    console.error(`Giving up after ${maxAttempts} attempts.`);
    process.exit(1);
  }

  console.error(`Refetching origin/${branch} and retrying...`);
  await $`git fetch origin ${branch}`;
  await $`git reset --hard origin/${branch}`;
}
