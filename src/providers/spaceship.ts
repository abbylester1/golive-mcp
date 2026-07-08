import { Client } from "basic-ftp"
import { execSync } from "child_process"
import { existsSync, readFileSync } from "fs"
import { join, relative } from "path"
import type { SpaceshipConfig, BuildConfig } from "../types.js"

interface UploadManifest {
  localDir: string
  files: string[]
}

function collectFiles(root: string, prefix: string): string[] {
  const result: string[] = []
  const entries = execSync(`find "${root}" -type f`, { encoding: "utf-8" }).trim().split("\n")
  for (const entry of entries) {
    if (!entry) continue
    const rel = relative(root, entry)
    result.push(rel)
  }
  return result
}

export async function deploySpaceship(
  build: BuildConfig,
  config: SpaceshipConfig,
  healthCheckUrl?: string
): Promise<string[]> {
  const logs: string[] = []

  // 1. Build
  const cwd = build.cwd || process.cwd()
  logs.push(`Building: ${build.command} in ${cwd}`)
  execSync(build.command, { cwd, stdio: "pipe" })
  logs.push("Build complete")

  // 2. Determine standalone output
  const standaloneDir = join(cwd, ".next", "standalone")
  if (!existsSync(standaloneDir)) {
    throw new Error(`Standalone output not found at ${standaloneDir}. Ensure next.config.ts has output: "standalone"`)
  }

  // 3. Upload via FTP
  logs.push(`Connecting to ${config.host}...`)
  const client = new Client()
  client.ftp.verbose = false

  try {
    await client.access({
      host: config.host,
      user: config.user,
      password: config.password,
      secure: true,
    })
    logs.push("FTP connected")

    await client.ensureDir(config.remotePath)

    // Upload every file from the standalone build
    const allFiles = collectFiles(standaloneDir, "")
    for (const f of allFiles) {
      const local = join(standaloneDir, f)
      const remote = join(config.remotePath, f)
      await client.uploadFrom(local, remote)
    }
    logs.push(`Uploaded standalone build (${allFiles.length} files)`)

    // Upload public/
    const publicDir = join(cwd, "public")
    if (existsSync(publicDir)) {
      const publicFiles = collectFiles(publicDir, "")
      for (const f of publicFiles) {
        const local = join(publicDir, f)
        const remote = join(config.remotePath, "public", f)
        await client.uploadFrom(local, remote)
      }
      logs.push(`Uploaded public/ (${publicFiles.length} files)`)
    }

    client.close()
    logs.push("FTP upload complete")
  } catch (err: any) {
    client.close()
    throw new Error(`FTP upload failed: ${err.message}`)
  }

  // 4. Copy from CageFS path to real path via PHP endpoint
  if (config.cageFsPath && config.phpCopyUrl) {
    logs.push(`Triggering PHP copy: ${config.phpCopyUrl}`)
    try {
      const res = await fetch(config.phpCopyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: config.cageFsPath }),
        signal: AbortSignal.timeout(30000),
      })
      const text = await res.text()
      logs.push(`PHP copy response (${res.status}): ${text.trim().slice(0, 200)}`)
    } catch (err: any) {
      logs.push(`PHP copy failed: ${err.message}`)
    }
  } else if (config.cageFsPath) {
    logs.push("CageFS copy configured but no phpCopyUrl set — copy files manually after deploy")
  }

  // 5. Health check
  if (healthCheckUrl) {
    logs.push(`Health check: ${healthCheckUrl}`)
    try {
      const res = await fetch(healthCheckUrl, { signal: AbortSignal.timeout(15000) })
      const text = await res.text()
      logs.push(`Health check: ${res.status} ${text.trim().slice(0, 100)}`)
    } catch (err: any) {
      logs.push(`Health check failed: ${err.message}`)
    }
  }

  return logs
}
