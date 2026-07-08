# golive-mcp

**Go Live — deploy from your AI agent in one command.**

Works with Claude Code, Cursor, Gemini CLI, Copilot CLI, or any MCP-compatible client.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![GitHub](https://img.shields.io/badge/github-abbylester1/golive--mcp-blue?logo=github)](https://github.com/abbylester1/golive-mcp)

## What is this?

Go Live is an MCP server that gives your AI agent superpowers: **create a GitHub PR, deploy to production, and verify it's live** — all from a single natural language request.

No YAML pipelines. No CI/CD config. Just tell your AI "deploy this" and it happens.

## Quick Start

```bash
# Run directly — no install needed
npx github:abbylester1/golive-mcp

# Or install globally
npm install -g github:abbylester1/golive-mcp
golive-mcp
```

Create a `deploy.config.json` in your project root, then tell your AI:

> "Deploy to production"

## Use Cases

| You want to... | Go Live handles it |
|----------------|-------------------|
| **Ship a fix fast** | Commit, push, create PR, deploy to cPanel — one command |
| **Deploy to shared hosting** | FTP upload to Spaceship CageFS + copy to real path + Passenger restart |
| **Deploy to Vercel** | Build + `npx vercel --prod` |
| **Deploy to any VPS** | Custom shell commands (rsync, scp, whatever you need) |
| **Verify it worked** | Health check on your deploy target, returns status + body |
| **Let non-tech people deploy** | They talk to the AI, the AI runs Go Live |
| **Multi-target pipeline** | Deploy to staging (Vercel) and production (cPanel) from the same config |
| **Quick rollback** | Switch branch, deploy again, verify the old version is gone |

## Installation

```bash
# Run without installing
npx github:abbylester1/golive-mcp

# Or install globally
npm install -g github:abbylester1/golive-mcp
golive-mcp
```

### MCP Client Setup

<details>
<summary><b>Claude Code</b></summary>

```bash
claude mcp add golive-mcp -- npx github:abbylester1/golive-mcp
```
</details>

<details>
<summary><b>Cursor</b></summary>

Add to `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "golive-mcp": {
      "command": "npx",
      "args": ["github:abbylester1/golive-mcp"],
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
    "golive-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["github:abbylester1/golive-mcp"]
    }
  }
}
```
</details>

<details>
<summary><b>OpenCode</b></summary>

```bash
opencode mcp add golive-mcp -- npx github:abbylester1/golive-mcp
```
</details>

## What it does

Three tools your AI can call:

### `create_pr`

Create a GitHub PR from your current branch.

```json
{
  "title": "Fix login bug",
  "body": "Closes #42",
  "base": "main",
  "commitMessage": "fix: login redirect"
}
```

If `commitMessage` is set, it auto-commits everything. Just need `gh` CLI installed.

### `deploy`

Build and deploy to production (or any target you've configured).

```json
{
  "target": "production",
  "skipBuild": false
}
```

Works with any hosting provider.

### `status`

Check if your site is live.

```json
{
  "target": "production"
}
```

Hits your health check URL and reports back what it got.

## Hosting you can deploy to

| Provider | How Go Live deploys |
|----------|--------------------|
| **Spaceship (cPanel)** | FTP over TLS to CageFS path, optional PHP copy to real path, Passenger restart |
| **Vercel** | Runs `npx vercel --prod` |
| **Any cPanel / Plesk** | Custom shell commands (rsync, curl, etc.) |
| **AWS EC2** | `rsync` + `ssh` to reload nginx |
| **AWS S3 + CloudFront** | `aws s3 sync` + CloudFront invalidation |
| **AWS Elastic Beanstalk** | `eb deploy` |
| **Google Cloud Run** | `gcloud builds submit` + `gcloud run deploy` |
| **Google Compute Engine** | `gcloud compute scp` + reload |
| **Azure App Service** | `az webapp deploy` |
| **DigitalOcean App Platform** | `doctl apps create-deployment` |
| **DigitalOcean Droplet** | `rsync` + reload |
| **Fly.io** | `fly deploy` |
| **Railway** | `railway up` |
| **Netlify** | `ntl deploy --prod` |
| **Render** | API curl to trigger deploy |
| **Heroku** | `git push heroku` |
| **Cloudflare Pages** | `wrangler pages deploy` |
| **GitHub Pages** | Push to `gh-pages` branch |
| **Any VPS** (Linode, Vultr, Hetzner, OVH) | `rsync` + reload |

If Go Live doesn't have a built-in provider for your host, use the `custom` provider — it runs any shell commands you want.

### Spaceship (cPanel shared hosting)

Go Live is the only MCP deploy tool that handles Spaceship's CageFS setup:

```json
{
  "targets": {
    "production": {
      "provider": "spaceship",
      "build": { "command": "npm run build", "cwd": "frontend" },
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

### Custom (any host not listed)

```json
{
  "targets": {
    "production": {
      "provider": "custom",
      "build": { "command": "npm run build", "cwd": "." },
      "custom": [
        "rsync -avz --delete out/ user@host:/var/www/html/",
        "ssh user@host 'systemctl reload nginx'"
      ],
      "healthCheckUrl": "https://mysite.com/api/health"
    }
  }
}
```

## Configuration

Create `deploy.config.json` in your project root (or Go Live finds it here):

1. `deploy.config.json` in current directory
2. `deploy.json` in current directory
3. `~/.config/golive-mcp/config.json`
4. `--config=/path/to/config.json` flag

## How it's different

| vs | They do | Go Live does |
|----|---------|-------------|
| **GitHub MCP servers** | GitHub API operations only | GitHub + build + deploy + verify |
| **AppDeploy / NEXUS AI** | Lock you into their cloud | Works with **your** hosting |
| **DeployPilot** | Heavy gateway (91 tools, Docker) | Lightweight MCP server, single binary |
| **EZKeel / Runway** | CLI tools, need a VPS | Works from any AI via MCP |
| **CI/CD pipelines** | Need YAML config | One JSON config, AI manages the rest |

## Why

Production deploys are the most error-prone part of AI-assisted coding. You write code, commit, push, create a PR, build, upload, copy files, restart, check if it's live — that's 9+ manual steps. Go Live turns it into one sentence: "deploy to production."

## License

MIT
