# Knowledge Keeper MCP Server

> 智能知识管理的 Model Context Protocol 实现，支持语义搜索

## 简介

让 **knowledge-keeper** 可被 Claude Code、Cursor、Gemini CLI、Windsurf 等工具调用。

## 特性

- ✅ **7 个 MCP Tools** - 完整的知识管理
- ✅ **语义搜索** - TF-IDF 向量嵌入，无外部依赖
- ✅ **本地优先** - 所有数据存储在本地
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

## MCP Tools (8个)

| Tool | 功能 |
|------|------|
| `knowledge_save` | 保存知识点 |
| `knowledge_search` | 关键词搜索 |
| `knowledge_semantic_search` | 语义搜索 |
| `knowledge_get` | 获取单个知识点 |
| `knowledge_update` | 更新知识点 |
| `knowledge_delete` | 删除知识点 |
| `knowledge_tags` | 列出标签 |
| `knowledge_versions` | 🆕 版本历史 |

## MCP Resources

| Resource | URI | 说明 |
|----------|-----|------|
| 知识库概览 | `knowledge:///list` | 列出所有资源 |
| 标签索引 | `knowledge:///tags` | 所有标签及计数 |
| 概念类知识 | `knowledge:///type/concept` | 概念类知识点列表 |
| 决策类知识 | `knowledge:///type/decision` | 决策类知识点列表 |
| 待办事项 | `knowledge:///type/todo` | 待办类知识点列表 |
| 笔记 | `knowledge:///type/note` | 笔记类知识点列表 |
| 项目记录 | `knowledge:///type/project` | 项目类知识点列表 |

## 数据存储

- 默认位置：`~/.knowledge-vault/`
- 知识点：`~/.knowledge-vault/{type}/{id}.md`
- 向量索引：`~/.knowledge-vault/vectors.json`
- 可通过环境变量 `KNOWLEDGE_KEEPER_DIR` 自定义

## 语义搜索

默认使用 TF-IDF 向量嵌入，无需额外依赖。

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

## License

MIT

---

Made with 🧠 by [小影](https://github.com/zsc-glitch)