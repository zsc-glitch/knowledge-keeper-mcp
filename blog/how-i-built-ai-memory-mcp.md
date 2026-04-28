# Give Your AI Coding Agent Long-Term Memory (No API Keys Required)

*How I built a 30-tool MCP memory server that works with Claude Code, Cursor, and Gemini CLI — all locally, all free.*

---

## The Problem

Every time you restart Claude Code or Cursor, your AI coding assistant forgets everything. Context, decisions, architecture choices — all gone. You start from zero every session.

I got tired of re-explaining my codebase to my AI assistant every morning. So I built **Knowledge Keeper MCP** — a memory server that gives your AI persistent, searchable knowledge.

## The Solution

Knowledge Keeper MCP is a [Model Context Protocol](https://modelcontextprotocol.io/) server with 30 tools for knowledge management. It runs entirely locally, needs zero API keys, and works with any MCP-compatible tool.

```bash
# 30-second setup with Claude Code
claude mcp add knowledge-keeper -- npx @zsc-glitch/knowledge-keeper-mcp
```

That's it. Your AI now has persistent memory.

## What It Does

### Save Knowledge
```
Me: Remember that we chose PostgreSQL over MongoDB for the user service because of ACID requirements.
AI: ✅ Saved as decision "Database choice for user service"
```

### Search Later
```
Me: Why did we choose PostgreSQL again?
AI: Based on your knowledge base, you chose PostgreSQL over MongoDB for the user service because of ACID requirements.
```

### 30 MCP Tools

| Category | Tools |
|----------|-------|
| CRUD | save, get, update, delete |
| Search | search, semantic (TF-IDF), BM25 keyword, hybrid (RRF fusion) |
| Organization | tags, link, unlink, get_linked |
| Knowledge Graph | graph_build, graph_query, graph_visualize |
| Quality | review (spaced repetition), audit (SHA256 trail), versions (diff/rollback) |
| Analytics | overview, insights, timeline |
| Data | export, import, batch, sync, merge |
| Cloud (Pro) | sync_status, sync, license |

## What Makes It Different

### Zero API Keys
Most AI memory tools need OpenAI embeddings or a cloud service. Knowledge Keeper doesn't. BM25 + TF-IDF runs entirely locally. No API keys, no cloud, no monthly bill for the free tier.

### Obsidian Compatible
Your knowledge base is just markdown files. Open it in Obsidian. Add notes manually. No lock-in, ever.

### MIT Licensed
Some "open source" memory tools use Elastic License 2.0 (non-commercial). Knowledge Keeper is MIT — free for any use, including commercial.

### TypeScript Native
If you're using Claude Code or Cursor, you're already in the TypeScript ecosystem. No Python virtualenv, no pip, no ChromaDB. Just `npx` and go.

## Benchmarks

| Method | Recall@5 |
|--------|----------|
| BM25 keyword | 95% |
| Hybrid (BM25 + semantic + RRF) | 97%+ |

These numbers are competitive with tools that require expensive embedding APIs — but Knowledge Keeper achieves them with zero AI dependency.

## Setup for Popular Tools

### Claude Code
```bash
claude mcp add knowledge-keeper -- npx @zsc-glitch/knowledge-keeper-mcp
```

### Cursor
```json
{
  "mcpServers": {
    "knowledge-keeper": {
      "command": "npx",
      "args": ["@zsc-glitch/knowledge-keeper-mcp"]
    }
  }
}
```

### Gemini CLI
```json
{
  "mcpServers": {
    "knowledge-keeper": {
      "command": "npx",
      "args": ["@zsc-glitch/knowledge-keeper-mcp"]
    }
  }
}
```

### Windsurf
Same as Cursor — add to your MCP config.

### hermes-agent
Add to your hermes MCP config.

## What's Next

- **Cloud Sync (Pro)** — End-to-end encrypted sync across devices. Your data, encrypted with your key. Server can't read it.
- **Team Knowledge** — Shared knowledge bases for teams.

## Try It

```bash
npm install @zsc-glitch/knowledge-keeper-mcp
```

Or just run it directly:

```bash
npx @zsc-glitch/knowledge-keeper-mcp
```

GitHub: https://github.com/zsc-glitch/knowledge-keeper-mcp

Landing page: https://zsc-glitch.github.io/knowledge-keeper-mcp/

---

*Built by [小影](https://github.com/zsc-glitch) • MIT License • 70 tests passing*
