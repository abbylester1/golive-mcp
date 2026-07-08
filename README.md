# deploy-mcp

An MCP server that lets AI agents create GitHub PRs and deploy to production.
Works with any MCP client — Claude Code, Cursor, Gemini CLI, Copilot CLI, and more.

## Quick Start

```bash
npx deploy-mcp
```

That's it. Point it at `deploy.config.json` in your project root and go.

## Tools

| Tool | What it does |
|------|-------------|
| `create_pr` | Commits changes, pushes, creates a GitHub PR |
| `deploy` | Builds + uploads to your configured target |
| `status` | Health-check a deployed target |

### `create_pr`

```json
{
  "title": "feat: add dark mode",
  "body": "Closes #42",
  "base": "main",
  "draft": false,
  "commitMessage": "feat: add dark mode"
}
```

Creates a PR from whatever branch you're on. If `commitMessage` is set, it auto-commits
all staged and unstaged changes. Requires the `gh` CLI to be installed and authenticated.

### `deploy`

```json
{
  "target": "production",
  "skipBuild": false
}
```

Builds your app (unless `skipBuild`), then deploys using the configured provider.
Supplied providers:

### `status`

```json
{
  "target": "production"
}
```

Hits the `healthCheckUrl` for the target and returns status + response body.

## Providers

### Spaceship (FTP + CageFS)

Designed for cPanel shared hosting with CloudLinux CageFS. The flow:

1. **Build** — runs your build command (e.g. `npm run build` with `output: "standalone"`)
2. **Upload** — FTP with TLS to the CageFS path
3. **Copy** (optional) — you can configure a PHP endpoint to copy from CageFS → real path
4. **Restart** — Passenger restarts when files change, or touch `tmp/restart.txt`

### Vercel

Runs `npx vercel --prod`. Requires `VERCEL_TOKEN` or config credentials.

### Custom

Runs an arbitrary sequence of shell commands. Works with any deploy flow.

## Configuration

Create `deploy.config.json` in your project root:

```json
{
  "$schema": "https://raw.githubusercontent.com/your-org/deploy-mcp/main/schema.json",
  "github": {
    "owner": "your-org",
    "repo": "your-repo"
  },
  "targets": {
    "production": {
      "provider": "spaceship",
      "build": {
        "command": "npm run build",
        "cwd": "frontend"
      },
      "spaceship": {
        "host": "server43.shared.spaceship.host",
        "user": "user@domain.com",
        "password": "",
        "remotePath": "/app"
      },
      "healthCheckUrl": "https://mysite.com/api/health"
    }
  }
}
```

Copy `deploy.config.template.json` to get started.

### Config locations (in order):

1. `deploy.config.json` in current directory
2. `deploy.json` in current directory
3. `~/.config/deploy-mcp/config.json`
4. `--config=/path/to/config.json` CLI flag

## Integration

**Claude Code:**
```
claude mcp add deploy-mcp -- npx deploy-mcp
```

**Cursor:**
Add to `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "deploy-mcp": {
      "command": "npx",
      "args": ["deploy-mcp"],
      "env": {}
    }
  }
}
```

## Why

Production deploys are the most error-prone part of AI-assisted coding. AI agents can
write code all day, but when it's time to ship, you need to:
- Commit and push correctly
- Run the exact build process
- Get files to the right place on the server
- Verify it's actually live

This tool turns that whole flow into two MCP tool calls your AI can make.

## License

MIT
