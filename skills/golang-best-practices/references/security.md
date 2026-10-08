# Security

Security is not a feature. It is a baseline requirement.

## Randomness and Identifiers

- Use `crypto/rand` for keys, tokens, passwords, and security-sensitive randomness.
- Use `rand.Text()` (Go 1.24+) for cryptographically secure random token strings.
- Use the standard `uuid` package (Go 1.27+) for RFC 9562 identifiers: `uuid.New()` for UUIDv4 or `uuid.NewV7()` for time-ordered UUIDv7.
- Never use `math/rand` or `math/rand/v2` for security purposes.

```go
import (
    "crypto/rand"
    "uuid"
)

func Token() string {
    return rand.Text() // Go 1.24+
}

func ID() string {
    return uuid.New().String() // Go 1.27+
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

## Path Traversal and File Access: os.Root (Go 1.24+)

- Use `os.Root` (`os.OpenRoot(baseDir)`) to confine filesystem operations within a designated directory.
- `os.Root` natively prevents directory traversal (`../`) and symlink escapes without fragile manual path cleaning.

```go
root, err := os.OpenRoot(uploadDir)
if err != nil {
    return err
}
defer root.Close()

// Secure against path traversal even if filename is "../../etc/passwd"
f, err := root.Open(untrustedFilename)
```

## Cryptography

- Use `crypto/hpke` (Go 1.26+) for Hybrid Public Key Encryption standards.
- Use `crypto/mldsa` (Go 1.27+) for post-quantum digital signatures (ML-DSA).
- Never use deprecated cryptographic algorithms (`crypto/md5`, `crypto/sha1`) for security purposes.

## Unsafe

- Avoid the `unsafe` package entirely unless you are writing low-level systems code or optimizing a hot path with profiling data.
- Any use of `unsafe` must be clearly documented and justified.

## Input Validation

- Validate all untrusted input at the system boundary (HTTP handlers, RPC endpoints, CLI args).
- Use `strconv` for numeric parsing; check bounds explicitly.
- Use `encoding/json/v2` (Go 1.27+) for strict JSON parsing that flags duplicate keys and malformed syntax by default.

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
