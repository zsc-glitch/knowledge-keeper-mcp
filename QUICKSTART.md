# Quick Start Guide

Get Knowledge Keeper MCP running in under 60 seconds.

## Install

```bash
npm install @zsc-glitch/knowledge-keeper-mcp
```

Or use directly with npx (no install needed):

```bash
npx @zsc-glitch/knowledge-keeper-mcp
```

## Claude Code

```bash
claude mcp add knowledge-keeper -- npx @zsc-glitch/knowledge-keeper-mcp
```

That's it. Restart Claude Code and you'll have 30 memory tools.

## Cursor

Add to your Cursor MCP settings (`.cursor/mcp.json`):

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

## Gemini CLI

Add to your Gemini MCP config:

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

## Windsurf

Add to `.windsurf/mcp.json`:

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

## hermes-agent

### Option 1: MCP Config (basic)

Add to your hermes MCP config:

```yaml
mcp_servers:
  knowledge-keeper:
    command: npx
    args:
      - "@zsc-glitch/knowledge-keeper-mcp"
```

### Option 2: Memory Provider Plugin (recommended)

For deeper integration with auto-prefetch and memory mirroring:

```bash
# Copy plugin to hermes
cp -r knowledge-keeper-mcp/hermes-plugin/knowledge-keeper \
      ~/.hermes/plugins/memory/knowledge-keeper

# Run setup
hermes memory setup
# Select "knowledge-keeper" from the list
```

The plugin gives you:
- **Auto-prefetch** — relevant memory injected before each API call
- **Memory mirroring** — hermes built-in writes automatically saved to vault
- **Session tracking** — hermes session context preserved
- **CLI commands** — `hermes knowledge-keeper status`

## 30-Second Demo

Once connected, try these conversations in your AI assistant:

```
# Save something
"Remember that we decided to use PostgreSQL for the database"

# Search later  
"What database did we decide to use?"

# Build knowledge graph
"Build a knowledge graph from all my notes"

# Review what you've learned
"Show me knowledge items that are due for review"
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KK_VAULT_PATH` | `~/.knowledge-vault` | Path to store knowledge files |
| `KK_SYNC_URL` | - | Cloud sync server URL (Pro) |
| `KK_API_KEY` | - | API key for Pro features |
| `KK_ENCRYPTION_KEY` | - | Encryption key for cloud sync (Pro) |

## What Gets Stored

All knowledge is stored as **Markdown files** in your vault directory:

```
~/.knowledge-vault/
├── index.json          # Search index
├── concepts/           # Concept notes
├── decisions/          # Decision records
├── todos/              # Todo items
├── notes/              # General notes
└── projects/           # Project knowledge
```

Each file is a standard Markdown file with YAML frontmatter — you can open the entire vault in **Obsidian** for browsing and editing.

## 30 MCP Tools

### Core (Free)
| Tool | What it does |
|------|-------------|
| `knowledge_save` | Save a knowledge item |
| `knowledge_get` | Get item by ID |
| `knowledge_update` | Update an item |
| `knowledge_delete` | Delete an item |
| `knowledge_search` | Basic text search |
| `knowledge_semantic_search` | TF-IDF semantic search |
| `knowledge_bm25_search` | BM25 keyword search |
| `knowledge_hybrid_search` | RRF fusion (BM25 + semantic) |
| `knowledge_bm25_stats` | BM25 index statistics |
| `knowledge_tags` | List/manage tags |
| `knowledge_versions` | Version history |
| `knowledge_review` | Spaced repetition review |
| `knowledge_link` | Link two items |
| `knowledge_unlink` | Remove a link |
| `knowledge_get_linked` | Get linked items |
| `knowledge_graph` | Legacy graph tool |
| `knowledge_graph_build` | Build knowledge graph |
| `knowledge_graph_query` | Query the graph |
| `knowledge_graph_visualize` | Export Mermaid diagram |
| `knowledge_export` | Export vault data |
| `knowledge_import` | Import data |
| `knowledge_batch` | Batch operations |
| `knowledge_sync` | Local vault sync |
| `knowledge_merge` | Merge two vaults |

### Analytics (Free)
| Tool | What it does |
|------|-------------|
| `knowledge_analytics_overview` | Stats dashboard |
| `knowledge_analytics_insights` | Quality insights |
| `knowledge_analytics_timeline` | Time-series data |

### Cloud Sync (Pro — $9/month)
| Tool | What it does |
|------|-------------|
| `knowledge_sync_status` | Check sync status |
| `knowledge_sync` | Push/pull/full sync |
| `knowledge_license` | View license info |

## Upgrade to Pro

Cloud sync gives you end-to-end encrypted sync across devices. Server never sees your data.

1. Subscribe at [our landing page](https://zsc-glitch.github.io/knowledge-keeper-mcp/)
2. Set environment variables:
   ```bash
   export KK_SYNC_URL=https://your-sync-server.com
   export KK_API_KEY=kk_your_api_key
   export KK_ENCRYPTION_KEY=your-encryption-passphrase
   ```
3. Sync: `knowledge_sync` tool with direction "full"

## Troubleshooting

**"Module not found"** — Make sure you have Node.js 18+ installed:
```bash
node --version
```

**"Permission denied"** — Check vault directory permissions:
```bash
ls -la ~/.knowledge-vault/
```

**Tools not appearing** — Restart your AI tool after adding the MCP server.

---

Made with 👤 by [小影](https://github.com/zsc-glitch) • [GitHub](https://github.com/zsc-glitch/knowledge-keeper-mcp) • [npm](https://npm.im/@zsc-glitch/knowledge-keeper-mcp)
