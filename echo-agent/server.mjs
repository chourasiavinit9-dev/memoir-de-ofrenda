// Ofrenda echo agent: a Mastra agent that runs on a local Ollama model and remembers earlier visits.
// Memory lives in a local file by default. Set OFRENDA_MEMORY=atlas + MONGODB_URI to use MongoDB Atlas instead (opt-in, cloud).
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Agent } from '@mastra/core/agent'
import { Memory } from '@mastra/memory'
import { LibSQLStore } from '@mastra/libsql'
import { MongoDBStore } from '@mastra/mongodb'
import { createOllama } from 'ollama-ai-provider-v2'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.MASTRA_PORT || 8787)
const OLLAMA = process.env.OLLAMA_URL || 'http://localhost:11434'
const useAtlas = process.env.OFRENDA_MEMORY === 'atlas'

if (useAtlas && !process.env.MONGODB_URI) {
  console.error('OFRENDA_MEMORY=atlas needs MONGODB_URI (your Atlas connection string).')
  process.exit(1)
}

const dataDir = path.resolve(HERE, '../ofrenda_data')
fs.mkdirSync(dataDir, { recursive: true })

const storage = useAtlas
  ? new MongoDBStore({
      id: 'ofrenda-memory',
      uri: process.env.MONGODB_URI,
      dbName: process.env.MONGODB_DB || 'ofrenda',
    })
  : new LibSQLStore({
      id: 'ofrenda-memory',
      url: 'file:' + path.join(dataDir, 'echo-memory.db'),
    })

const memory = new Memory({ storage, options: { lastMessages: 20, semanticRecall: false } })
const ollama = createOllama({ baseURL: `${OLLAMA}/api` })
const agents = new Map()

function agentFor({ id, model, instructions }) {
  const key = `${id}|${model}|${instructions}`
  if (!agents.has(key)) {
    agents.set(key, new Agent({
      id: `echo-${id}`,
      name: `Echo of ${id}`,
      instructions,
      model: ollama(model),
      memory,
    }))
  }
  return agents.get(key)
}

const ids = (id) => ({ resource: `person-${id}`, thread: `echo-${id}` })

async function readJson(req) {
  let raw = ''
  for await (const chunk of req) raw += chunk
  return raw ? JSON.parse(raw) : {}
}

function send(res, code, body) {
  const raw = JSON.stringify(body)
  res.writeHead(code, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(raw) })
  res.end(raw)
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      return send(res, 200, { ok: true, store: useAtlas ? 'atlas' : 'local' })
    }
    if (req.method === 'POST' && req.url === '/echo') {
      const { id, model, instructions, message } = await readJson(req)
      if (!id || !model || !instructions || !message) return send(res, 400, { error: 'id, model, instructions and message are required' })
      const out = await agentFor({ id, model, instructions }).generate(message, { memory: ids(id) })
      return send(res, 200, { text: out.text })
    }
    if (req.method === 'POST' && req.url === '/forget') {
      const { id } = await readJson(req)
      try { await memory.deleteThread(ids(id).thread) } catch { /* no thread yet */ }
      return send(res, 200, { ok: true })
    }
    send(res, 404, { error: 'not found' })
  } catch (e) {
    const msg = String(e?.message || e)
    send(res, 500, { error: /ECONNREFUSED|fetch failed/i.test(msg) ? `Cannot reach Ollama at ${OLLAMA}. Is it running?` : msg })
  }
})

server.listen(PORT, '127.0.0.1', () =>
  console.log(`Mastra echo agent on http://127.0.0.1:${PORT} (memory: ${useAtlas ? 'MongoDB Atlas' : 'local file'}, Ollama: ${OLLAMA})`))
