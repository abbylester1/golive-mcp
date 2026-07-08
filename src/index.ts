#!/usr/bin/env node

import { loadConfig } from "./config.js"
import { getCurrentBranch, commitAll, pushBranch, createPullRequest } from "./github.js"
import { deploySpaceship } from "./providers/spaceship.js"
import type { DeployConfig } from "./types.js"

let config: DeployConfig

// ── MCP Protocol (JSON-RPC over stdio) ──────────────────────────────

function sendMsg(msg: object) {
  const json = JSON.stringify(msg)
  process.stdout.write(json.length + "\n" + json + "\n")
}

function readMsg(): Promise<any> {
  return new Promise((resolve) => {
    function onData(buf: Buffer) {
      const data = buf.toString()
      const match = data.match(/^(\d+)\n([\s\S]*)$/)
      if (match) {
        const len = parseInt(match[1], 10)
        const content = match[2].trimEnd()
        // Check if we got the full message
        if (Buffer.byteLength(content, "utf-8") >= len) {
          resolve(JSON.parse(content))
        }
      }
    }
    process.stdin.on("data", onData)
  })
}

// ── Tool Handlers ───────────────────────────────────────────────────

const TOOLS = {
  create_pr: {
    description: "Create a GitHub PR from the current branch. Commits and pushes first.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "PR title" },
        body: { type: "string", description: "PR body / description" },
        base: { type: "string", description: "Base branch (default: main)" },
        draft: { type: "boolean", description: "Create as draft PR" },
        commitMessage: { type: "string", description: "Commit message (omit to skip commit)" },
      },
      required: ["title"],
    },
    handler: async (args: any) => {
      try {
        const branch = getCurrentBranch()
        const msgs: string[] = [`Branch: ${branch}`]

        if (args.commitMessage) {
          commitAll(args.commitMessage)
          msgs.push("Changes committed")
        }

        pushBranch(branch)
        msgs.push("Pushed to origin")

        const url = createPullRequest(config.github, {
          title: args.title,
          body: args.body,
          base: args.base || "main",
          draft: args.draft || false,
        })
        msgs.push(`PR created: ${url}`)

        return { content: [{ type: "text", text: msgs.join("\n") }] }
      } catch (err: any) {
        return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true }
      }
    },
  },

  deploy: {
    description: "Build and deploy to a configured target (spaceship, vercel, custom).",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "string", description: "Deploy target name from config (e.g. production)" },
        skipBuild: { type: "boolean", description: "Skip the build step" },
      },
      required: ["target"],
    },
    handler: async (args: any) => {
      try {
        const target = config.targets[args.target]
        if (!target) {
          const available = Object.keys(config.targets).join(", ")
          return {
            content: [{ type: "text", text: `Unknown target "${args.target}". Available: ${available}` }],
            isError: true,
          }
        }

        let logs: string[] = []

        switch (target.provider) {
          case "spaceship":
            if (!target.spaceship) {
              return { content: [{ type: "text", text: "spaceship config missing for this target" }], isError: true }
            }
            logs = await deploySpaceship(target.build, target.spaceship, target.healthCheckUrl)
            break

          case "vercel": {
            const cwd = target.build.cwd || process.cwd()
            const cmds = target.build.command ? [target.build.command] : []
            if (target.vercel) {
              cmds.push(`npx vercel --token ${target.vercel.token} --prod`)
            }
            for (const cmd of cmds) {
              logs.push(`Running: ${cmd}`)
              try {
                const { execSync } = await import("child_process")
                const out = execSync(cmd, { cwd, encoding: "utf-8" })
                logs.push(out.trim())
              } catch (e: any) {
                logs.push(`Error: ${e.message}`)
              }
            }
            break
          }

          case "custom":
            if (target.custom) {
              const cwd = target.build.cwd || process.cwd()
              for (const cmd of target.custom) {
                logs.push(`Running: ${cmd}`)
                try {
                  const { execSync } = await import("child_process")
                  const out = execSync(cmd, { cwd, encoding: "utf-8" })
                  logs.push(out.trim())
                } catch (e: any) {
                  logs.push(`Error: ${e.message}`)
                }
              }
            }
            break
        }

        // Optional health check
        if (target.healthCheckUrl) {
          logs.push(`\nHealth check: ${target.healthCheckUrl}`)
        }

        return { content: [{ type: "text", text: logs.join("\n") }] }
      } catch (err: any) {
        return { content: [{ type: "text", text: `Deploy failed: ${err.message}` }], isError: true }
      }
    },
  },

  status: {
    description: "Check deployment status by hitting the health check URL.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "string", description: "Deploy target name" },
      },
      required: ["target"],
    },
    handler: async (args: any) => {
      const target = config.targets[args.target]
      if (!target?.healthCheckUrl) {
        return { content: [{ type: "text", text: "No health check URL configured for this target" }], isError: true }
      }
      try {
        const res = await fetch(target.healthCheckUrl, { signal: AbortSignal.timeout(10000) })
        const text = await res.text()
        return {
          content: [{
            type: "text",
            text: `Status: ${res.status}\nURL: ${target.healthCheckUrl}\nBody: ${text.slice(0, 500)}`,
          }],
        }
      } catch (err: any) {
        return { content: [{ type: "text", text: `Health check failed: ${err.message}` }], isError: true }
      }
    },
  },
}

// ── MCP Loop ────────────────────────────────────────────────────────

async function main() {
  const configPath = process.argv.find((a) => a.startsWith("--config="))?.split("=")[1]
  config = loadConfig(configPath)

  // Send initialize response
  sendMsg({
    jsonrpc: "2.0",
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "golive-mcp", version: "0.1.0" },
    },
  })

  // Listen for requests
  for await (const raw of process.stdin) {
    // The input is newline-delimited JSON-RPC messages
    // Format: content-length header + JSON body
    const data = raw.toString().trim()
    if (!data) continue

    // Parse JSON-RPC message
    // MCP transports messages as: one line of JSON per message
    let msg: any
    try {
      msg = JSON.parse(data)
    } catch {
      // Try to handle the length-prefix format
      const match = data.match(/^(\d+)\n([\s\S]*)$/)
      if (match) {
        try { msg = JSON.parse(match[2].trim()) } catch { continue }
      } else {
        continue
      }
    }

    if (!msg || msg.jsonrpc !== "2.0") continue

    const { id, method, params } = msg

    if (method === "tools/list") {
      const tools = Object.entries(TOOLS).map(([name, t]) => ({
        name,
        description: t.description,
        inputSchema: t.inputSchema,
      }))
      sendMsg({ jsonrpc: "2.0", id, result: { tools } })

    } else if (method === "tools/call") {
      const tool = TOOLS[params.name as keyof typeof TOOLS]
      if (!tool) {
        sendMsg({ jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown tool: ${params.name}` } })
        continue
      }
      const result = await tool.handler(params.arguments || {})
      sendMsg({ jsonrpc: "2.0", id, result })

    } else if (method === "notifications/initialized") {
      // Client acknowledges initialization — nothing to do

    } else if (method === "shutdown") {
      sendMsg({ jsonrpc: "2.0", id, result: null })
      process.exit(0)
    }
  }
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
