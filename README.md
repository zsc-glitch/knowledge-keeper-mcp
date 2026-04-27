# Knowledge Keeper MCP

> 🧠 **Give your AI agent long-term memory** — 23 MCP tools, works with Claude Code, Cursor, Gemini CLI, Windsurf, hermes-agent
> 
> **v1.0.0** — [npm](https://npm.im/@zsc-glitch/knowledge-keeper-mcp) | [GitHub](https://github.com/zsc-glitch/knowledge-keeper-mcp) | [Quick Start](QUICKSTART.md) | [Landing Page](https://zsc-glitch.github.io/knowledge-keeper-mcp)

**Why?** Your AI coding agent forgets everything between sessions. Knowledge Keeper gives it persistent, searchable, connected memory — all stored locally with zero cloud dependency.

## ✨ Features

## ✨ Features

- ✅ **23 MCP Tools** — Complete knowledge management toolkit
- ✅ **Knowledge Graph** — Entity detection, relationships, Mermaid visualization
- ✅ **BM25 Keyword Search** — Fast keyword matching
- ✅ **Semantic Search** — TF-IDF vector embeddings, zero API dependency
- ✅ **Version History** — Diff & rollback any change
- ✅ **Obsidian Compatible** — Read/write with Obsidian vault
- ✅ **Audit Trail** — SHA256 hash chain, integrity verification
- ✅ **Spaced Repetition** — Never forget what you've learned
- ✅ **Import/Export** — JSON, Markdown, CSV
- ✅ **Local-First** — All data on your machine, private by default
- ✅ **Zero AI Dependency** — No API keys needed. No OpenAI. No embeddings API.
- ✅ **Runs Anywhere** — Claude Code, Cursor, Gemini CLI, Windsurf, hermes-agent, OpenClaw

## Install

```bash
npm install @zsc-glitch/knowledge-keeper-mcp
```

## Quick Start

### Claude Code

```bash
claude mcp add knowledge-keeper -- npx @zsc-glitch/knowledge-keeper-mcp
```

### Cursor

在配置中添加：
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

在配置中添加：
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

## MCP Tools (23个)

### 基础操作
| Tool | 功能 |
|------|------|
| `knowledge_save` | 保存知识点 |
| `knowledge_get` | 获取知识点 |
| `knowledge_update` | 更新知识点 |
| `knowledge_delete` | 删除知识点 |

### 搜索
| Tool | 功能 |
|------|------|
| `knowledge_search` | 关键词搜索 |
| `knowledge_semantic_search` | 语义搜索（TF-IDF） |
| `knowledge_bm25_search` | BM25关键词检索 |

### 🆕 知识图谱（Phase 1）
| Tool | 功能 |
|------|------|
| `knowledge_graph_build` | 构建知识图谱（实体检测） |
| `knowledge_graph_query` | 查询实体关系 |
| `knowledge_graph_visualize` | 导出可视化（Mermaid） |

### 统计
| Tool | 功能 |
|------|------|
| `knowledge_tags` | 列出所有标签 |
| `knowledge_review` | 知识回顾统计 |
| `knowledge_bm25_stats` | BM25索引统计 |

### 版本
| Tool | 功能 |
|------|------|
| `knowledge_versions` | 版本历史 |

### 关联
| Tool | 功能 |
|------|------|
| `knowledge_link` | 创建知识关联 |
| `knowledge_unlink` | 删除知识关联 |
| `knowledge_get_linked` | 查询知识关联 |

### 图谱
| Tool | 功能 |
|------|------|
| `knowledge_graph` | 知识图谱可视化 |

### 导入导出
| Tool | 功能 |
|------|------|
| `knowledge_import` | 批量导入（JSON/Markdown） |
| `knowledge_export` | 导出（JSON/Markdown/CSV） |

### 批量
| Tool | 功能 |
|------|------|
| `knowledge_batch` | 批量操作（删除/标签管理） |

### 同步
| Tool | 功能 |
|------|------|
| `knowledge_sync` | Obsidian vault同步 |

### 合并
| Tool | 功能 |
|------|------|
| `knowledge_merge` | 知识合并 |

| Tool | 功能 |
|------|------|
| `knowledge_save` | 保存知识点 |
| `knowledge_search` | 关键词搜索 |
| `knowledge_semantic_search` | 语义搜索（TF-IDF） |
| `knowledge_bm25_search` | BM25 检索（对标 lancedb-pro） |
| `knowledge_get` | 获取单个知识点 |
| `knowledge_update` | 更新知识点 |
| `knowledge_delete` | 删除知识点 |
| `knowledge_tags` | 列出标签 |
| `knowledge_versions` | 版本历史 |
| `knowledge_bm25_stats` | BM25 统计 |
| `knowledge_review` | 🆕 知识回顾（今天/本周/本月统计） |

## MCP Resources (7个)

| Resource | URI | 说明 |
|----------|-----|------|
| 知识库概览 | `knowledge:///list` | 列出所有资源 |
| 标签索引 | `knowledge:///tags` | 所有标签及计数 |
| 概念类知识 | `knowledge:///type/concept` | 概念类知识点列表 |
| 决策类知识 | `knowledge:///type/decision` | 决策类知识点列表 |
| 待办事项 | `knowledge:///type/todo` | 待办类知识点列表 |
| 笔记 | `knowledge:///type/note` | 笔记类知识点列表 |
| 项目记录 | `knowledge:///type/project` | 项目类知识点列表 |

## Obsidian Vault 兼容 ✅

**v0.5.0 新增功能**

- **Backlinks 格式** - `[[link]]` 双向链接
- **aliases 元数据** - Obsidian 搜索优化
- **Related 部分** - 明确展示关联笔记

**使用方法：**

```bash
# 用 Obsidian 打开 vault
obsidian ~/.knowledge-vault/
```

所有知识点都是标准 Markdown 文件，可直接编辑。

## 数据存储

- 默认位置：`~/.knowledge-vault/`
- 知识点：`~/.knowledge-vault/{type}/{id}.md` ✅ Obsidian 兼容
- 向量索引：`~/.knowledge-vault/vectors.json`
- BM25 索引：`~/.knowledge-vault/bm25-index.json`
- 可通过环境变量 `KNOWLEDGE_KEEPER_DIR` 自定义

## 检索方式对比

| 检索方式 | 适用场景 | 特点 |
|---------|---------|------|
| **BM25 搜索** | 精确关键词 | 快速、准确关键词匹配 |
| **语义搜索** | 概念理解 | 理解语义，不依赖关键词 |
| **关键词搜索** | 快速查找 | 简单匹配，无索引 |

## 升级嵌入模型

默认使用 TF-IDF，零依赖。

**升级到 Transformer 模型：**
```bash
npm install @xenova/transformers
EMBEDDING_MODEL=transformers npx @zsc-glitch/knowledge-keeper-mcp
```

## 开发

```bash
# 构建
npm run build

# 本地测试
node dist/index.js
```

## 版本历史

| 版本 | 新增功能 |
|------|---------|
| 0.6.0-alpha.1 | BM25 关键词检索 ✅ |
| 0.5.0-alpha.1 | Obsidian vault 兼容 ✅ |
| 0.4.1-alpha.1 | QUICKSTART 文档 |
| 0.4.0-alpha.1 | 版本历史工具 |
| 0.3.0-alpha.1 | 7 MCP Resources |
| 0.2.0-alpha.1 | 语义搜索 |
| 0.1.0-alpha.1 | 基础 6 Tools |

## License

MIT

---

Made with 🧠 by [小影](https://github.com/zsc-glitch)
---

## ☕ 支持开发者

如果这些工具对你有帮助，欢迎请我喝杯咖啡 ☕

![微信赞赏码](https://raw.githubusercontent.com/zsc-glitch/assets/main/wechat-pay.png)

---

Made with ❤️ by [小影](https://github.com/zsc-glitch)

