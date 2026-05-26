# Project Layout

Follow the [Standard Go Project Layout](https://github.com/golang-standards/project-layout) conventions.

## Directory Structure

```
project-root/
├── go.mod
├── go.sum
├── README.md
├── Makefile
├── cmd/              # Main applications for this project
│   └── myapp/
│       └── main.go
├── internal/         # Private application and library code
│   └── app/
│       └── server.go
├── pkg/              # Public library code; use sparingly
│   └── utils/        # Avoid generic names like util, common, helpers
│       └── helpers.go
├── api/              # API contract definitions (OpenAPI, proto, graphql)
├── web/              # Web application specific components (static assets, templates)
├── configs/          # Configuration file templates or defaults
├── scripts/          # Build, install, analysis scripts
├── test/             # Additional external test data and test helpers
├── docs/             # Design and user documentation
└── build/            # Packaging and CI configurations
```

## Rules

- `cmd/`: One directory per binary. The directory name becomes the binary name.
- `internal/`: Code that should not be imported by other projects. Use this for the majority of your application code.
- `pkg/`: Only use if you explicitly intend for external projects to import the code. Prefer descriptive names over `pkg/util`.
- Avoid meaningless package names: `util`, `common`, `misc`, `api`, `types`, `interfaces`.
- `api/`: Keep schema definitions here, separate from implementation.
- `scripts/`: Keep build and utility scripts here, not scattered at the root.
- `test/`: Use for fixtures, golden files, and integration test data.

## Module Management

- Keep `go.mod` at the repository root.
- Use a module path matching the repository URL (e.g., `github.com/org/project`).
- Prefer minimal module sprawl. A single module per repository is usually sufficient unless there are clear versioning boundaries.
- Run `go mod tidy` before every commit.
- Pin dependencies intentionally. Review `go.sum` changes in PRs.
- Do not commit vendor directories unless required by your organization's policy.

## Version Support

- Target the latest two Go releases for production services.
- Use `go` directive in `go.mod` to declare the minimum supported version.
- CI should test against the minimum declared version and the latest stable version.
