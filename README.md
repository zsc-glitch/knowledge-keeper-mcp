# Knowledge Keeper MCP Server

> 智能知识管理的 Model Context Protocol 实现

## 简介

让 **knowledge-keeper** 可被 Claude Code、Cursor、Gemini CLI、Windsurf 等工具调用。

## 安装

```bash
npm install @zsc-glitch/knowledge-keeper-mcp
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

## MCP Tools

| Tool | 功能 |
|------|------|
| `knowledge_save` | 保存知识点 |
| `knowledge_search` | 搜索知识 |
| `knowledge_get` | 获取单个知识点 |
| `knowledge_update` | 更新知识点 |
| `knowledge_delete` | 删除知识点 |
| `knowledge_tags` | 列出标签 |

## MCP Resources（计划）

| Resource | URI | 说明 |
|----------|-----|------|
| 知识点 | `knowledge:///{id}` | 单个知识点内容 |
| 标签索引 | `knowledge:///tags` | 所有标签 |
| 类型目录 | `knowledge:///type/{type}` | 按类型列出 |

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