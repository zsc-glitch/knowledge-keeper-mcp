# Changelog

All notable changes to this project will be documented in this file.

## [0.6.0-alpha.1] - 2026-04-11

### Added
- `knowledge_bm25_search` tool for BM25 keyword search
- `knowledge_bm25_stats` tool for BM25 index statistics
- Independent BM25 index file (`bm25-index.json`)
- Chinese and English tokenization support
- Now 10 MCP Tools total

### Technical
- BM25 algorithm implementation with IDF + TF scoring
- Token-level relevance ranking
- Configurable top-k results

## [0.5.0-alpha.1] - 2026-04-11

### Added
- **Obsidian vault compatibility** - Open vault directly in Obsidian
- Backlinks format (`[[link]]`) for bidirectional linking
- `aliases` metadata field for Obsidian search optimization
- `related` section in knowledge files for explicit connections
- Frontmatter compatible with Obsidian properties

### Changed
- Knowledge files now fully Obsidian-readable
- Improved metadata structure for better tool integration

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