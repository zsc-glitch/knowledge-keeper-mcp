# Knowledge Keeper — Hermes Memory Provider

> 🧠 Give Hermes Agent persistent, searchable, connected memory

## What It Does

Knowledge Keeper gives Hermes long-term memory across sessions:

- **Save knowledge** — concepts, decisions, todos, notes, projects
- **Hybrid search** — BM25 (R@5=95%) + TF-IDF semantic + RRF fusion (R@5=97%+)
- **Knowledge graph** — entity detection, relationships, Mermaid visualization
- **Version history** — diff & rollback any change
- **Audit trail** — SHA256 hash chain, integrity verification
- **Spaced repetition** — never forget what you've learned
- **Obsidian compatible** — read/write vault in Obsidian
- **Zero API keys** — no OpenAI, no embeddings API, fully local

## Install

### Option 1: Copy to Hermes plugins directory

```bash
# Clone the Knowledge Keeper MCP repo
git clone https://github.com/zsc-glitch/knowledge-keeper-mcp.git

# Copy plugin to Hermes
cp -r knowledge-keeper-mcp/hermes-plugin/knowledge-keeper \
      ~/.hermes/plugins/memory/knowledge-keeper

# Run setup
hermes memory setup
# Select "knowledge-keeper" from the list
```

### Option 2: One-liner

```bash
mkdir -p ~/.hermes/plugins/memory && \
npx -y @zsc-glitch/knowledge-keeper-mcp --hermes-plugin | tar -xzf - -C ~/.hermes/plugins/memory/
```

## Tools (10 exposed to Hermes)

| Tool | Description |
|------|-------------|
| `knowledge_save` | Save knowledge entry |
| `knowledge_search` | Keyword search |
| `knowledge_hybrid_search` | BM25 + semantic + RRF (best recall) |
| `knowledge_get` | Get by ID |
| `knowledge_update` | Update entry |
| `knowledge_delete` | Delete entry |
| `knowledge_tags` | Tag management |
| `knowledge_review` | Spaced repetition review |
| `knowledge_graph_query` | Query knowledge graph |
| `knowledge_analytics_overview` | Vault stats & health |

## Configuration

Run `hermes memory setup` and select knowledge-keeper. The only config option:

| Key | Default | Description |
|-----|---------|-------------|
| `vault_path` | `~/.knowledge-vault` | Path to vault directory |

You can also set `KK_VAULT_PATH` environment variable.

## Architecture

```
hermes-agent
  └── KnowledgeKeeperProvider (Python)
        └── MCP stdio bridge → npx @zsc-glitch/knowledge-keeper-mcp
              └── ~/.knowledge-vault/ (Markdown files, Obsidian compatible)
```

The provider launches the Knowledge Keeper MCP server as a subprocess and communicates
via JSON-RPC over stdio. This reuses the full 30-tool MCP server without rewriting logic.

## Differences from MCP-only Mode

| Feature | Hermes Plugin | MCP Config |
|---------|--------------|------------|
| Setup | `hermes memory setup` | Manual JSON config |
| Auto-prefetch | ✅ Before each API call | ❌ Manual only |
| Memory mirroring | ✅ Built-in writes → k-k | ❌ |
| Session tracking | ✅ Hermes session context | ❌ |
| Tools available | 10 curated | 30 full set |
| Obsidian | ✅ Same vault | ✅ Same vault |

## License

MIT — Free for commercial use.

Made with 🧠 by [小影](https://github.com/zsc-glitch)
