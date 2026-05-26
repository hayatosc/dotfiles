# Security

Security is not a feature. It is a baseline requirement.

## Randomness

- Use `crypto/rand` for keys, tokens, passwords, and any security-sensitive randomness.
- Never use `math/rand` or `math/rand/v2` for security purposes.

```go
import "crypto/rand"

func Token() string {
    return rand.Text() // Go 1.24+
}
```

## SQL Injection

- Always use parameterized queries with `database/sql`.
- Never concatenate user input into SQL strings.

```go
// Good
rows, err := db.Query("SELECT * FROM users WHERE id = ?", userID)

// Bad
rows, err := db.Query("SELECT * FROM users WHERE id = " + userID)
```

## Unsafe

- Avoid the `unsafe` package entirely unless you are writing low-level systems code or optimizing a hot path with profiling data.
- Any use of `unsafe` must be clearly documented and justified.

## Input Validation

- Validate all untrusted input at the system boundary (HTTP handlers, RPC endpoints, CLI args).
- Use `strconv` for numeric parsing; check bounds explicitly.
- Sanitize filenames if accepting file uploads. Never use user input directly as a file path.

## Secrets

- Never hard-code secrets or credentials in source code.
- Load secrets from environment variables, secret managers, or encrypted files.
- Do not log secrets. Redact them before logging.

## Dependencies

- Scan dependencies for known vulnerabilities: `govulncheck ./...`.
- Pin dependencies to specific versions in `go.mod`.
- Review dependency changes in PRs.

## TLS

- Use modern TLS configurations. Disable insecure protocols and ciphers.
- Set reasonable `ReadTimeout` and `WriteTimeout` on `http.Server`.

## Reflection

- Do not use reflection to deserialize untrusted input (e.g., `map[string]interface{}` from `json.Unmarshal` without schema validation).
- Prefer strongly-typed structs for unmarshaling.
