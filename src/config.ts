import { readFileSync, existsSync } from "fs"
import { homedir } from "os"
import { join, resolve } from "path"
import type { DeployConfig } from "./types.js"

const CONFIG_CANDIDATES = [
  "deploy.config.json",
  "deploy.json",
  join(homedir(), ".config", "golive-mcp", "config.json"),
]

function findConfig(): string | null {
  for (const candidate of CONFIG_CANDIDATES) {
    if (existsSync(resolve(candidate))) return resolve(candidate)
  }
  return null
}

export function loadConfig(path?: string): DeployConfig {
  const configPath = path || findConfig()
  if (!configPath) {
    throw new Error(
      "deploy.config.json not found. Create one or pass --config <path>.\n" +
      "See https://github.com/abbylester1/golive-mcp#configuration"
    )
  }
  const raw = readFileSync(configPath, "utf-8")
  const config: DeployConfig = JSON.parse(raw)

  if (!config.github?.owner || !config.github?.repo) {
    throw new Error("Config must have github.owner and github.repo")
  }
  if (!config.targets || Object.keys(config.targets).length === 0) {
    throw new Error("Config must have at least one deploy target")
  }

  return config
}
