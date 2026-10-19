# 1Password CLI

This repository uses the Linux `op` binary installed by `mise` and authenticates
headlessly with a 1Password **service account**. No Windows 1Password desktop
app integration is required, so `op` works from SSH sessions and other
non-interactive shells.

The relevant source files are:

- [home/dot_config/mise/config.toml](home/dot_config/mise/config.toml) — pins `1password` via mise
- [home/dot_zshenv](home/dot_zshenv) — loads the service account token for every zsh shell

---

## 1. How It Works

`mise` installs the `op` CLI, and `~/.zshenv` exports `OP_SERVICE_ACCOUNT_TOKEN`
when a token file exists:

- `op` resolves to the mise-managed Linux binary (no wrapper or `op.exe` delegation)
- `~/.zshenv` is read by interactive, non-interactive, and login shells, so the
  token is available over SSH without `op signin`
- The token file lives outside this repository and is never committed

---

## 2. Registering a Service Account

Create the service account in the 1Password web console:

1. Sign in to the 1Password web app as an administrator.
2. Open **Developer** → **Service Accounts** → **Create a service account**
   (or use **Integrations** → **Service Accounts** depending on the console layout).
3. Name the account (for example `dotfiles-headless`) and choose the vaults it
   can access. Grant **Read** access unless the account must also write.
4. Create the account and copy the generated token (`ops_...`).
   The token is shown only once.
5. Store the token on the machine:

```sh
mkdir -p ~/.config/op
printf '%s\n' 'ops_your_token_here' > ~/.config/op/service-account-token
chmod 600 ~/.config/op/service-account-token
```

Open a new shell (or run `exec zsh`) and verify:

```sh
op whoami     # User Type: SERVICE_ACCOUNT
op vault list # vaults shared with the service account
```

### Updating the token

Replace the token file contents; no config change is needed because
`~/.zshenv` reads the file on every shell startup. If the token was revoked in
1Password, create a new one and overwrite the file.

### Rotating or revoking access

- Revoke the old token in the 1Password console, then write a new token file.
- Adjust vault permissions in the service account settings; `op vault list`
  reflects the change on the next invocation.

---

## 3. Using Secrets

Read a single value:

```sh
op read "op://dev/OpenAI/credential"
```

Inject secrets into a command with an env template:

```dotenv
# .env.tpl
OPENAI_API_KEY="op://dev/OpenAI/credential"
ANTHROPIC_API_KEY="op://dev/Anthropic/credential"
```

```sh
op run --env-file=.env.tpl -- your-command
```

`op run` masks resolved secret values in the command output as
`<concealed by 1Password>`; pass `--no-masking` to disable masking when a
program needs a TTY.

### Field names

`op://<vault>/<item>/<field>` accepts either a field label or field ID. Use the
field ID when labels are ambiguous or localized:

```sh
op item get OpenAI --vault=dev --format=json \
  | jq -r '.fields[] | select(.type=="CONCEALED") | .id'
```

---

## 4. Scope and Limitations

- A service account only sees the vaults explicitly shared with it. Vaults
  without access are omitted from `op vault list` and fail on `op read`.
- Service accounts are separate from personal accounts; `op account list` does
  not include them, and `op signin` is not used.
- `op run` resolves secrets through `op`, so the command itself runs locally.
  There is no Windows interop dependency.
- The token is a long-lived credential. Keep the file `chmod 600`, do not commit
  it, and revoke it in 1Password if the machine is compromised.
