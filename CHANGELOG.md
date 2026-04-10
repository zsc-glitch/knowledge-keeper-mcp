# Changelog

All notable changes to this project will be documented in this file.

## [0.4.0-alpha.1] - 2026-04-10

### Added
- `knowledge_versions` tool for version history queries
- Now 8 MCP Tools total

## [0.3.0-alpha.1] - 2026-04-10

### Added
- 7 MCP Resources for read-only access
  - `knowledge:///list` - Knowledge base overview
  - `knowledge:///tags` - Tag index
  - `knowledge:///type/{concept|decision|todo|note|project}` - List by type

## [0.2.0-alpha.1] - 2026-04-10

### Added
- `knowledge_semantic_search` tool with TF-IDF embedding
- Semantic search capability (no external dependencies)
- Optional transformer model upgrade path via `EMBEDDING_MODEL=transformers`

## [0.1.0-alpha.1] - 2026-04-10

### Added
- Initial MCP Server implementation
- 6 MCP Tools:
  - `knowledge_save` - Save knowledge points
  - `knowledge_search` - Keyword search
  - `knowledge_get` - Get single knowledge point
  - `knowledge_update` - Update knowledge point
  - `knowledge_delete` - Delete knowledge point
  - `knowledge_tags` - List all tags
- STDIO transport for local usage
- Markdown storage with YAML frontmatter
- Local-first design (all data in `~/.knowledge-vault/`)

---

Made with 🧠 by [小影](https://github.com/zsc-glitch)