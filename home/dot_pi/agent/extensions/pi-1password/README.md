# pi-1password

Use 1Password for selected native Pi providers without replacing their models,
request transport, headers, or login flow. Requires Pi 1.3.0's native provider
API, an authenticated `op` CLI with read/write access to the configured items,
and Linux `/dev/shm` for private, memory-backed OAuth write templates.

## Provider configuration

`config.ts` is the only provider registry. Each binding specifies:

- `providerId`: the exact ID of a built-in Pi provider.
- `type`: `api_key` or `oauth`.
- `secret`: the vault, item, and field IDs in 1Password. IDs survive renames.
- `validate` (optional, OAuth): checks provider-specific credential metadata.
- `migrateFrom` (optional, API key): exact old command strings that may be
  replaced by the reference. They are never executed by the extension.

OpenAI OAuth and OpenCode Go API keys are configured initially. To add an API
key provider, create its concealed credential in 1Password and add a binding:

```ts
{
  providerId: "anthropic",
  type: "api_key",
  secret: { vault: "VAULT_ID", item: "ITEM_ID", field: "credential" },
}
```

Reload Pi, then use `/login` and select that provider's API key method. This
verifies the vault field and saves only its `op://` reference; it does not prompt
for or save a plaintext API key. Include the new reference in the chezmoi auth
source if it should be deployed to other machines. Never add plaintext tokens
to the source file.

For a built-in OAuth provider, use `type: "oauth"` and a concealed field holding
the complete JSON credential (`type`, `access`, `refresh`, `expires`, and any
provider-specific metadata). Either let the extension migrate the existing
local credential on reload or use the provider's normal OAuth `/login` flow.
The generic wrapper preserves extra metadata. Only OpenAI's configured validator
requires its client ID and subscription scopes. A provider without the requested
native auth method is rejected rather than silently reconfigured.

## Storage and lifecycle

- API keys are read for actual requests. Availability checks do not unlock the
  vault. Without a local credential, the native environment fallback is retained.
- OAuth tokens are read from 1Password for requests. Login and refresh write the
  entire credential back and verify it before Pi receives a reference.
- Local OAuth entries contain only `type: "oauth"`, an empty `access`, an
  `op://` value in `refresh`, and an expiry timestamp. Do not remove this extension
  while these entries are active: native Pi cannot resolve OAuth references.
- The chezmoi auth source uses expiry `0`. On first use, an already valid vault
  token is reused without rotation. Runtime expiry updates are safe to reset to
  `0` on a later apply; do not copy real tokens back into the source.
- Migration uses Pi's auth-file directory lock, preserves unrelated providers,
  and atomically replaces the local file with mode `0600` only after vault
  verification succeeds. Unrecognized API key values are not migrated.
- If a refresh-token write fails, the rotated token stays in this Pi process's
  memory for retry. Resolve the vault error before exiting the process.
- The local file lock coordinates sessions on this machine, not different
  machines sharing the same OAuth credential. Avoid simultaneous refreshes on
  different machines; 1Password is not a distributed refresh lock.
- An `op` failure blocks a request instead of falling back to a saved plaintext
  credential. CLI errors omit captured secret output. Temporary templates use
  private directories in `/dev/shm` and are removed after each write.

## Development checks

The development dependencies target the currently installed Pi 1.3.0 API; Pi
itself supplies these modules when loading the extension. In a disposable copy
of this directory, use the repository's JavaScript package wrapper:

```sh
ni
nr test
nr check
```

Tests use fake credentials and temporary auth files. They cover generic API key
and OAuth handling, provider metadata preservation, native model-runtime
integration, multiple-provider isolation, login, token rotation, write retries,
failed/cancelled requests, migration rollback, and auth-file locking. Live
connectivity is checked separately and must never print credentials.
