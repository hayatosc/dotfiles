# Remote HTML Preview

Use this workflow when an artifact must be viewed from an SSH host or another device. A tunnel is a viewing aid: the original HTML remains a standalone offline deliverable. Updating this skill alone does not require launching a public preview.

## Choose the Connection

- For public-shareable content, expose an isolated local server through a Cloudflare Quick Tunnel. The URL is public to anyone who has it; it is not authentication.
- Use Wrangler when requested; otherwise prefer an already installed `cloudflared` for a standalone HTML file. `wrangler tunnel quick-start` starts cloudflared for the local server. Use the repository's command wrapper (`nlx wrangler` in this environment) when invoking Wrangler through the package manager. Check `nlx wrangler tunnel quick-start --help` rather than assuming every version supports this experimental command.
- For private plans, internal details, or secrets, use SSH forwarding below or an existing Cloudflare Access-protected route. Do not create DNS records, persistent tunnels, or deployments merely to preview a file.

## Serve Only the Artifact

Create a dedicated temporary directory outside the repository and copy the chosen self-contained HTML into it as `index.html`. Do not serve the repository, home directory, or a symlink to either. Keep server/tunnel logs outside the served directory.

On the remote host, replace the artifact path and select an available loopback port:

```sh
artifact_file='/absolute/path/to/artifact.html'
preview_dir=$(mktemp -d /tmp/html-preview.XXXXXXXX)
cp -- "$artifact_file" "$preview_dir/index.html"
PYTHON_UV=0 python3 -m http.server 8765 --bind 127.0.0.1 --directory "$preview_dir"
```

The final command runs in the foreground. Use a managed long-running tool session, or a terminal session that will remain alive while the user views the page. Record the session handle or owned PID, port, exact temporary directory, and original artifact path. `PYTHON_UV=0` bypasses this environment's Python wrapper; an ordinary Python installation can use `python3 -m http.server` directly.

In a second remote session, check that `http://127.0.0.1:8765/` serves the expected document, then choose one tunnel command:

```sh
cloudflared tunnel --url http://127.0.0.1:8765
```

Or, with a Wrangler version supporting this command:

```sh
nlx wrangler tunnel quick-start http://127.0.0.1:8765
```

Run the tunnel from the temporary directory to avoid picking up an unrelated project's Wrangler configuration. Keep this session separate from the server session.

Capture the actual HTTPS URL printed by the process. URL creation can precede connectivity; wait for a registered tunnel connection and fetch the URL before reporting it as usable. Compare the response with the staged HTML, not just its HTTP status: a tunnel error page is not the artifact. Store fetched responses outside the served directory. If the URL is not ready, inspect connection logs before retrying. An HTTP fetch checks delivery, not visual layout; inspect in a browser when available. If public delivery fails, diagnose the local server and tunnel separately and use the private fallback rather than inventing a URL.

For an existing Workers development project, Wrangler also supports `dev --tunnel`. A standalone HTML preview does not need a Workers project or `dev --remote`.

## Private SSH Fallback

Keep the same isolated server on the remote host. The user runs this on their own machine, replacing the SSH destination and using the actual remote preview port:

```sh
ssh -N -L 127.0.0.1:8765:127.0.0.1:8765 user@remote-host
```

Then open `http://127.0.0.1:8765/` on that machine. If its local port is occupied, change the first `8765` only. Do not guess the SSH hostname from the server's local hostname; use the known SSH destination or show a clearly labeled placeholder. Explain which command runs locally and which runs remotely.

## Handoff, Updates, and Cleanup

Return the original file path, verified URL (or SSH-forwarding command), and the process/session handles needed to stop the preview. A Quick Tunnel URL lasts only while its process runs. Do not claim it survives session termination; use an available persistent terminal/session mechanism when SSH disconnection must be supported, without installing a permanent service.

When the artifact changes, refresh the staged `index.html` and verify the updated page before reusing its URL. Keep the original as the source of truth.

The calling workflow or user's instructions determine when viewing ends. On viewing completion, stop only the owned tunnel and server processes, delete the exact staged `index.html`, and remove the now-empty owned temporary directory. Do not kill all Python/cloudflared processes or use recursive deletion. Record these handles and paths in the handoff so another agent can close the preview, then mark them closed.

Closing the preview does not delete the original HTML; its lifecycle belongs to the calling workflow or user's instructions. If a process or temporary file cannot be cleaned up, report that remaining resource explicitly.

## Verified Wrangler Behavior

On 2026-09-13, a Linux smoke test with Wrangler 4.131.1 and the existing cloudflared 2026.8.3 successfully served an isolated Python HTTP server through `nlx wrangler tunnel quick-start http://127.0.0.1:8765`.

- No login, Workers project, or deployment step was needed in this test. Wrangler reused the installed cloudflared executable; record both versions when diagnosing failures.
- The emitted HTTPS URL returned bytes identical to the staged HTML. A dedicated browser session displayed Japanese text correctly and opened a native `details` control; a screenshot confirmed the rendered page. Use a harmless, identifiable document for this check.
- Experimental-command, outdated-cloudflared, ICMP-permission, and UDP-buffer warnings appeared, but the HTTP preview worked. Judge HTTP delivery from the registered connection and actual response; these warnings alone do not justify changing system permissions or kernel settings.
- Ctrl-C in each owned foreground session stopped the tunnel and server. Verify the cloudflared child also exited, close the dedicated test browser, and remove the staged file and empty directory. Do not retain the test URL as a reusable endpoint.

## Official References

- [Wrangler tunnel commands](https://developers.cloudflare.com/workers/wrangler/commands/tunnel/)
- [Wrangler local development tunnels](https://developers.cloudflare.com/workers/local-development/local-dev-tunnels/)
- [Cloudflare Tunnel setup](https://developers.cloudflare.com/tunnel/get-started/)
