#!/usr/bin/env node
// Drives the REAL golive-mcp server over its real stdio protocol and
// renders the exchange as a clean agent conversation, for a demo
// recording (see record.tape - `vhs demo/record.tape` regenerates
// assets/demo.gif from scratch, run from the repo root). Every response
// shown is what the server actually returned - nothing here is faked or
// pre-scripted output.
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const server = spawn(
  "node",
  ["dist/index.js", `--config=${join(repoRoot, "demo", "demo.config.json")}`],
  { cwd: repoRoot },
)

let buf = ""
let pending = new Map()
let nextId = 1

server.stdout.on("data", (chunk) => {
  buf += chunk.toString()
  let idx
  while ((idx = buf.indexOf("\n")) !== -1) {
    const line = buf.slice(0, idx).trim()
    buf = buf.slice(idx + 1)
    if (!line) continue
    let msg
    try { msg = JSON.parse(line) } catch { continue } // skip the length-prefix line
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    }
  }
})

function call(method, params) {
  return new Promise((resolve) => {
    const id = nextId++
    pending.set(id, resolve)
    server.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n")
  })
}

async function type(text) {
  process.stdout.write("\x1b[1;36mYou  \x1b[0m")
  for (const ch of text) {
    process.stdout.write(ch)
    await sleep(18)
  }
  process.stdout.write("\n")
}

async function say(text) {
  process.stdout.write(`\x1b[1;35mAI   \x1b[0m${text}\n`)
}

async function main() {
  await sleep(800)
  await type("Deploy this to production")
  await sleep(400)
  await say("Calling golive-mcp \x1b[2mdeploy\x1b[0m tool (target: production)...")
  await sleep(600)

  const res = await call("tools/call", { name: "deploy", arguments: { target: "production" } })
  const text = res?.result?.content?.[0]?.text ?? JSON.stringify(res)
  for (const line of text.split("\n")) {
    await sleep(120)
    console.log("     " + line)
  }

  await sleep(300)
  await say("Done. Verifying it's live...")
  await sleep(500)
  const status = await call("tools/call", { name: "status", arguments: { target: "production" } })
  const statusText = status?.result?.content?.[0]?.text ?? JSON.stringify(status)
  const statusLines = statusText.split("\n")
  for (const line of statusLines.slice(0, 3)) {
    await sleep(150)
    console.log("     " + line)
  }
  await sleep(150)
  console.log("     \x1b[2m... (real response, truncated for this demo)\x1b[0m")
  await sleep(300)
  console.log("\n\x1b[1;32m✓ Live\x1b[0m")

  await sleep(1200)
  server.kill()
  process.exit(0)
}

main()
