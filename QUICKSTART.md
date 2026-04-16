# 快速开始指南

## 安装

```bash
npm install @zsc-glitch/knowledge-keeper-mcp@alpha
```

## 与 Claude Code 集成

### 方法 1: 命令行添加

```bash
claude mcp add knowledge-keeper -- npx @zsc-glitch/knowledge-keeper-mcp
```

### 方法 2: 手动配置

编辑 `~/.claude/claude_desktop_config.json`:

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

## 与 Cursor 集成

编辑 `~/.cursor/mcp.json`:

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

## 与 Gemini CLI 集成

编辑 Gemini CLI 配置文件:

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

## 可用工具

### 知识管理

| 工具 | 功能 | 示例 |
|------|------|------|
| `knowledge_save` | 保存知识点 | "保存这个概念到知识库" |
| `knowledge_search` | 关键词搜索 | "搜索关于React的知识" |
| `knowledge_semantic_search` | 语义搜索 | "找找关于状态管理的内容" |
| `knowledge_get` | 获取知识点 | "获取ID为kp-cp-xxx的知识" |
| `knowledge_update` | 更新知识点 | "更新这个知识的标签" |
| `knowledge_delete` | 删除知识点 | "删除这个知识点" |
| `knowledge_tags` | 列出标签 | "显示所有标签" |
| `knowledge_versions` | 版本历史 | "查看这个知识的版本历史" |

## 使用示例

### 保存知识

```
用户: 帮我记住：React 18 引入了并发特性，包括 useTransition 和 useDeferredValue
Claude: [调用 knowledge_save]
✅ 已保存知识点
📝 React 18 并发特性
类型: concept
ID: kp-cp-xxx
```

### 搜索知识

```
用户: 我之前学过什么关于React的？
Claude: [调用 knowledge_search]
🔍 找到 3 条关于 React 的知识
1. React 18 并发特性 (concept)
2. React Hooks 最佳实践 (note)
3. React 性能优化技巧 (project)
```

### 语义搜索

```
用户: 有什么能提高性能的方法？
Claude: [调用 knowledge_semantic_search]
🔍 语义搜索找到 2 条相关知识
1. React 性能优化技巧 [相似度: 85%]
2. 前端缓存策略 [相似度: 72%]
```

## 数据存储

所有数据存储在本地：

```
~/.knowledge-vault/
├── concepts/        # 概念类知识
├── decisions/       # 决策记录
├── todos/          # 待办事项
├── notes/          # 笔记
├── projects/       # 项目记录
├── index.json      # 索引
└── vectors.json    # 向量索引（语义搜索）
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `KNOWLEDGE_KEEPER_DIR` | `~/.knowledge-vault` | 知识库存储路径 |
| `EMBEDDING_MODEL` | `tfidf` | 嵌入模型（tfidf/transformers） |

## 升级到 Transformer 模型

默认使用 TF-IDF，零依赖。如需更好的语义搜索：

```bash
npm install @xenova/transformers
EMBEDDING_MODEL=transformers npx @zsc-glitch/knowledge-keeper-mcp
```

## 故障排除

### MCP 连接失败

1. 确保使用 Node.js 18+
2. 检查 npx 是否在 PATH 中
3. 尝试全局安装: `npm install -g @zsc-glitch/knowledge-keeper-mcp@alpha`

### 数据丢失

数据存储在 `~/.knowledge-vault/`，检查该目录是否存在。

---

有问题？提交 Issue: https://github.com/zsc-glitch/knowledge-keeper-mcp/issues