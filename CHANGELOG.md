# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Changed
- `dist/` is no longer committed to git. A `prepare` script now builds it automatically on `npm install`, including for the `npx github:abbylester1/golive-mcp` install path — the actual fix for the problem `dist/` being committed was originally working around.

### Fixed
- `deploy.config.json` (holds real credentials) is now gitignored — it never was before.
- Removed a dangling `$schema` reference in `deploy.config.template.json` that pointed at a `schema.json` which never existed in the repo.

### Added
- CI: install, build, and a syntax-check of the compiled entrypoint on every push and PR.
- `CONTRIBUTING.md` and issue templates.

## [0.1.0] - 2026-07-08

### Added
- Initial release: MCP server with `create_pr`, `deploy`, and `status` tools.
- Built-in `spaceship` (cPanel/CageFS) and `vercel` providers, plus a `custom` provider for arbitrary shell-command deploys.
- MCP client setup docs for Claude Code, Cursor, VS Code, and OpenCode.
