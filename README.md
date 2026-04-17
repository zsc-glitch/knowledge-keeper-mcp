# Knowledge Keeper MCP Server

> 智能知识管理的 Model Context Protocol 实现，**20 MCP Tools**，对标 mempalace
> 
> **最新版本**: v1.0.1-alpha.1 (2026-04-16) — [npm](https://npm.im/@zsc-glitch/knowledge-keeper-mcp) | [GitHub](https://github.com/zsc-glitch/knowledge-keeper-mcp)

## 简介

让 **knowledge-keeper** 可被 Claude Code、Cursor、Gemini CLI、Windsurf、hermes-agent 等工具调用。

## 特性

- ✅ **20 个 MCP Tools** - 完整的知识管理工具集
- ✅ **BM25 关键词检索** - 独有功能，mempalace无此功能
- ✅ **语义搜索** - TF-IDF 向量嵌入，无外部依赖
- ✅ **知识图谱** - 可视化知识关联网络
- ✅ **版本历史** - 独有功能，支持版本对比和回滚
- ✅ **Obsidian vault 兼容** - 双向同步，可用 Obsidian 打开
- ✅ **多格式导入导出** - JSON/Markdown/CSV
- ✅ **本地优先** - 所有数据存储在本地，隐私安全
- ✅ **独立运行** - 不依赖 OpenClaw 运行时

## 安装

```bash
npm install @zsc-glitch/knowledge-keeper-mcp@alpha
```

## 使用

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

## MCP Tools (20个)

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

