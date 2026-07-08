# deploy-mcp-server

**An MCP server for AI agents to create GitHub PRs and deploy to production in one step.**

Works with Claude Code, Cursor, Gemini CLI, Copilot CLI, or any MCP-compatible client.

[![npm](https://img.shields.io/npm/v/deploy-mcp-server)](https://www.npmjs.com/package/deploy-mcp-server)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## Quick Start

```bash
# Install globally
npm install -g deploy-mcp-server

# Or run directly
npx deploy-mcp-server
```

Create a `deploy.config.json` in your project root, then tell your AI:

> "Deploy to production"

It will:
1. **create_pr** — commit, push, and open a PR on GitHub
2. **deploy** — build and upload to your server
3. **status** — verify it's live

## Installation

### Global install
```bash
npm install -g deploy-mcp-server
deploy-mcp-server
```

### npx (no install)
```bash
npx deploy-mcp-server
```

### MCP Client Setup

<details>
<summary><b>Claude Code</b></summary>

```bash
claude mcp add deploy-mcp -- npx deploy-mcp-server
```
</details>

<details>
<summary><b>Cursor</b></summary>

Add to `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "deploy-mcp": {
      "command": "npx",
      "args": ["deploy-mcp-server"],
      "env": {}
    }
  }
}
```
</details>

<details>
<summary><b>VS Code (via GitHub Copilot)</b></summary>

Add to `.vscode/mcp.json`:
```json
{
  "servers": {
    "deploy-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["deploy-mcp-server"]
    }
  }
}
```
</details>

<details>
<summary><b>OpenCode</b></summary>

```bash
opencode mcp add deploy-mcp -- npx deploy-mcp-server
```
</details>

## Tools

### `create_pr`

Create a GitHub PR from your current branch.

```json
{
  "title": "feat: add dark mode",
  "body": "Closes #42",
  "base": "main",
  "draft": false,
  "commitMessage": "feat: add dark mode"
}
```

- If `commitMessage` is set, all changes are auto-committed before pushing
- Requires `gh` CLI installed and authenticated (`gh auth login`)

### `deploy`

Build and deploy to a configured target.

```json
{
  "target": "production",
  "skipBuild": false
}
```

Supported providers:

| Provider | Method |
|----------|--------|
| **spaceship** | FTP with TLS to cPanel CageFS, optional PHP copy to real path |
| **vercel** | `npx vercel --prod` (requires `VERCEL_TOKEN`) |
| **custom** | Arbitrary shell commands |

### `status`

Check if a deployed target is live.

```json
{
  "target": "production"
}
```

Hits the `healthCheckUrl` and returns status code + response body.

## Configuration

Create `deploy.config.json` in your project root. Copy the template:

```bash
cp node_modules/deploy-mcp-server/deploy.config.template.json deploy.config.json
```

### Spaceship (cPanel shared hosting)

```json
{
  "github": {
    "owner": "my-org",
    "repo": "my-app"
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
        "remotePath": "/app",
        "cageFsPath": "/home/user/domain.com/kyro/app",
        "phpCopyUrl": "https://domain.com/deploy.php"
      },
      "healthCheckUrl": "https://domain.com/api/health"
    }
  }
}
```

- `remotePath` — the CageFS path (what FTP writes to)
- `cageFsPath` — the source path for PHP copy step
- `phpCopyUrl` — PHP endpoint that copies CageFS → real path and restarts Passenger

### Config file search order

1. `deploy.config.json` in current directory
2. `deploy.json` in current directory
3. `~/.config/deploy-mcp/config.json`
4. `--config=/path/to/config.json` CLI flag

## Why

Production deploys are the most error-prone part of AI-assisted coding. This tool turns a multi-step manual process (commit → push → PR → build → upload → copy → restart → verify) into two MCP tool calls your AI can make automatically.

## License

MIT
