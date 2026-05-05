# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.7.x   | ✅ |
| 1.6.x   | ✅ |
| < 1.6   | ❌ |

## Security Architecture

Knowledge Keeper MCP is designed with security in mind:

- **Local-first**: All knowledge data stored locally as Markdown files
- **Zero AI dependency**: No external API calls for core features
- **E2E encryption**: Cloud sync (Pro) uses client-side AES-256-GCM encryption — server never sees plaintext
- **Audit trail**: SHA-256 hash chain for integrity verification
- **No telemetry**: Zero data sent to external servers unless cloud sync is explicitly configured

## Expected Capabilities

This is an **MCP server** — the following capabilities are by design:

- **Filesystem access**: Core function is reading/writing knowledge files in `~/.knowledge-vault/`
- **Environment variables**: `KK_VAULT_PATH`, `KK_SYNC_URL`, `KK_API_KEY`, `KK_ENCRYPTION_KEY`
- **HTTP requests**: Only in cloud-sync module (Pro tier), to user-configured sync server

## Reporting a Vulnerability

If you discover a security vulnerability:

1. **Do not** open a public GitHub issue
2. Email: security@zsc-glitch.dev (or DM via GitHub)
3. Include: description, reproduction steps, affected versions
4. We will respond within 48 hours and fix within 7 days for confirmed issues

## SafeSkill Score

Current score: **86/100** — [View report](https://safeskill.dev/scan/zsc-glitch-knowledge-keeper-mcp)

All findings relate to expected MCP server capabilities (filesystem access, HTTP requests in cloud-sync module).
