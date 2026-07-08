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

## Use Cases

| Scenario | How deploy-mcp helps |
|----------|---------------------|
| **AI SaaS on shared hosting** | Next.js with `output: "standalone"` → FTP to cPanel CageFS → PHP copy to real path → Passenger restart. Single AI command. |
| **Serverless deployment** | Build + `npx vercel --prod` via the Vercel provider. PR and deploy in one step. |
| **Static site on VPS** | Build a static export → `rsync` or `scp` to any VPS via custom shell commands. |
| **Multi-target pipeline** | Deploy to staging (Vercel) and production (cPanel) from the same config. AI picks the target. |
| **CI/CD without YAML** | AI commits, pushes, creates a PR, and deploys — no GitHub Actions config needed. |
| **Quick rollback** | Switch branch, run deploy again. `status` confirms the previous version is gone. |
| **Headless CMS deploy** | Build a SSG site, upload to any static host (S3, Netlify, Nginx server). |
| **Internal tool ship** | Commit, PR, deploy to staging — all from a chat command. No context switching. |

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

### `status`

Check if a deployed target is live.

```json
{
  "target": "production"
}
```

Hits the `healthCheckUrl` and returns status code + response body.

## Supported Hosting Providers

| Provider | Type | Method | When to use |
|----------|------|--------|-------------|
| **Spaceship** | cPanel shared (CageFS) | FTP with TLS | Budget-friendly Next.js hosting. Passenger auto-restarts. Requires CageFS → real path copy. |
| **Vercel** | Serverless platform | `npx vercel --prod` | Zero-config deploys for Next.js, Svelte, etc. Integrates with git. |
| **cPanel / Plesk** | Shared hosting | Custom shell (rsync/curl) | Any shared panel with SSH or API. Works with most PHP, Node.js apps. |
| **AWS EC2** | VPS / cloud VM | Custom shell (rsync/ssh) | Full control. Use with Nginx, PM2, Docker. |
| **AWS Elastic Beanstalk** | PaaS | Custom shell (eb deploy) | Managed Node.js/Python environments. |
| **AWS S3 + CloudFront** | Static hosting | Custom shell (aws s3 sync) | Static sites, SPAs. Sync to S3 and invalidate cache. |
| **Google Cloud Run** | Serverless container | Custom shell (gcloud run deploy) | Auto-scaling containers, pay-per-request. |
| **Google Compute Engine** | VPS | Custom shell (gcloud scp) | Traditional VM with full root access. |
| **Azure App Service** | PaaS | Custom shell (az webapp deploy) | Managed Windows/Linux app hosting. |
| **DigitalOcean App Platform** | PaaS | Custom shell (doctl apps deploy) | Simple managed deploys from git or Docker. |
| **DigitalOcean Droplet** | VPS | Custom shell (rsync/ssh) | Inexpensive VPS. Can run any stack. |
| **Fly.io** | Edge PaaS | Custom shell (fly deploy) | Global edge deployment. Docker containers. |
| **Railway** | PaaS | Custom shell (railway up) | Fast deploys from GitHub. Auto-builds. |
| **Netlify** | Static + serverless | Custom shell (ntl deploy) | Static sites, serverless functions. Auto rollbacks. |
| **Render** | PaaS | Custom shell (render deploy) | Static sites, web services, background workers. |
| **Heroku** | PaaS | Custom shell (git push heroku) | Classic PaaS. Buildpacks or Docker. |
| **Cloudflare Pages** | Edge static | Custom shell (wrangler pages) | Fast static hosting at the edge. |
| **GitHub Pages** | Static | Custom shell (git push) | Free static hosting from a GitHub repo. |
| **Any VPS** (Linode, Vultr, Hetzner, OVH) | VPS | Custom shell (rsync/ssh) | Any Linux server. Full flexibility. |
| **Any SFTP/SSH host** | Generic | Custom shell (rsync/scp) | Works with any server that supports SSH file transfer. |

### Provider: Spaceship (cPanel CageFS)

Designed for shared hosting with CloudLinux CageFS abstraction layer.

```json
{
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

**How it works:**
1. Builds locally with `output: "standalone"` (Next.js)
2. FTP over TLS uploads files to the CageFS path
3. Optionally calls a PHP endpoint to copy CageFS → real path
4. Passenger auto-restarts on file change or PHP touches `tmp/restart.txt`

**Required setup:**
- A PHP script at `phpCopyUrl` that reads `{ source: "/cagefs/path" }`, runs `cp -r`, and restarts Passenger
- Node.js app configured in cPanel → Setup Node.js App

### Provider: Vercel (Serverless)

```json
{
  "targets": {
    "production": {
      "provider": "vercel",
      "build": {
        "command": "npm run build",
        "cwd": "."
      },
      "vercel": {
        "token": "vercel_api_token",
        "projectId": "prj_xxx",
        "orgId": "team_xxx"
      },
      "healthCheckUrl": "https://my-app.vercel.app"
    }
  }
}
```

- Runs `npx vercel --prod --token <token>` after build
- Requires a Vercel API token (generate at vercel.com/account/tokens)

### Provider: Custom (Any Host)

For every other hosting platform, use the `custom` provider with an array of shell commands.

```json
{
  "targets": {
    "production": {
      "provider": "custom",
      "build": {
        "command": "npm run build",
        "cwd": "."
      },
      "custom": [
        "rsync -avz --delete out/ user@host:/var/www/html/",
        "ssh user@host 'systemctl reload nginx'"
      ],
      "healthCheckUrl": "https://mysite.com/api/health"
    }
  }
}
```

**Platform-specific custom command examples:**

| Platform | Custom commands |
|----------|----------------|
| **AWS EC2** | `rsync -avz --delete ./dist/ ubuntu@ec2-ip:/var/www/` then `ssh ubuntu@ec2-ip 'sudo systemctl reload nginx'` |
| **AWS S3** | `aws s3 sync ./dist/ s3://my-bucket/ --delete` then `aws cloudfront create-invalidation --distribution-id XXX --paths "/*"` |
| **AWS Elastic Beanstalk** | `eb deploy production` |
| **Google Cloud Run** | `gcloud builds submit --tag gcr.io/my-project/my-app:latest` then `gcloud run deploy my-app --image gcr.io/my-project/my-app:latest` |
| **Google Compute Engine** | `gcloud compute scp --recurse ./dist/ instance:/var/www/` then `gcloud compute ssh instance --command 'sudo systemctl reload nginx'` |
| **Azure App Service** | `az webapp deploy --resource-group my-rg --name my-app --src-path ./dist/ --type zip` |
| **DigitalOcean App Platform** | `doctl apps create-deployment $APP_ID` |
| **DigitalOcean Droplet** | `rsync -avz --delete ./dist/ root@droplet-ip:/var/www/html/` |
| **Fly.io** | `fly deploy --local-only` |
| **Railway** | `railway up --detach` |
| **Netlify** | `ntl deploy --prod --dir=dist/` |
| **Render** | `curl -X POST https://api.render.com/v1/services/$SERVICE_ID/deploys -H "Authorization: Bearer $RENDER_API_KEY"` |
| **Heroku** | `git push heroku main` |
| **Cloudflare Pages** | `wrangler pages deploy dist/ --project-name=my-project` |
| **GitHub Pages** | `git push origin main:gh-pages` |
| **Any VPS (Linode, Vultr, Hetzner, OVH)** | `rsync -avz --delete ./dist/ user@host:/var/www/html/` then `ssh user@host 'sudo systemctl reload nginx'` |

## Configuration

Create `deploy.config.json` in your project root. Copy the template:

```bash
cp node_modules/deploy-mcp-server/deploy.config.template.json deploy.config.json
```

### Config file search order

1. `deploy.config.json` in current directory
2. `deploy.json` in current directory
3. `~/.config/deploy-mcp/config.json`
4. `--config=/path/to/config.json` CLI flag

## Why

Production deploys are the most error-prone part of AI-assisted coding. This tool turns a multi-step manual process (commit → push → PR → build → upload → copy → restart → verify) into two MCP tool calls your AI can make automatically.

## License

MIT
