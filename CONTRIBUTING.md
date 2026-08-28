# Contributing

Thanks for your interest in improving golive-mcp!

## Development setup

```bash
git clone https://github.com/abbylester1/golive-mcp.git
cd golive-mcp
npm install
npm run build
```

- **Node.js 18+**
- `npm run dev` — rebuild on file change
- `npm run build` — one-off compile (`tsc`, output to `dist/`)

## Testing your changes locally

Point a real MCP client at your local build instead of the published package:

```json
{
  "mcpServers": {
    "golive-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/golive-mcp/dist/index.js", "--config=/path/to/your/deploy.config.json"]
    }
  }
}
```

Or run it directly against a config to check it starts cleanly:

```bash
node dist/index.js --config=deploy.config.template.json
```

CI runs `npm run build` plus a syntax check of the compiled entrypoint on every push and PR — see `.github/workflows/ci.yml`.

## Adding a new hosting provider

1. Add the provider's config shape to `DeployConfig` in `src/types.ts`
2. Implement the deploy logic — either a new file in `src/providers/` (see `src/providers/spaceship.ts` for the pattern) or a `case` in the `deploy` tool handler in `src/index.ts` for something that's just a shell command (see the `vercel` case)
3. Document it in the README's "Hosting you can deploy to" table
4. Add an example config block under "Hosting you can deploy to" if the shape isn't obvious from the table alone

## Pull request process

1. Fork the repo and create a feature branch
2. Make your changes
3. `npm run build` — must compile clean
4. Submit a PR with a clear description of what changed and why

## Reporting issues

Open an issue with:
- Which provider/target you're deploying to
- Your `deploy.config.json` **with all credentials redacted**
- What you expected to happen vs. what actually happened (include error output)
- Your environment (OS, Node version)

## Security

Found a security issue (e.g. a way credentials could leak, or an injection vector in a shell-command provider)? Please don't open a public issue — email the maintainer directly instead. See the repo's contact info on the [profile](https://github.com/abbylester1).

## License

By contributing, you agree that your contributions will be licensed under the MIT License (see [LICENSE](LICENSE)).
