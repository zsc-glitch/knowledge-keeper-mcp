# 给你的 AI 编程助手装上"长期记忆"——零 API Key，30 秒搞定

*我做了个 30 个工具的 MCP 记忆服务器，Claude Code / Cursor / Gemini CLI 都能用，全本地运行，完全免费。*

---

## 痛点

每次重启 Claude Code 或 Cursor，你的 AI 助手就什么都忘了。架构决策、技术选型、项目上下文——全部清零。每次都要重新解释一遍。

我受够了。所以做了 **Knowledge Keeper MCP**。

## 30 秒安装

```bash
# Claude Code 用户，一行搞定：
claude mcp add knowledge-keeper -- npx @zsc-glitch/knowledge-keeper-mcp
```

完事。你的 AI 现在有持久记忆了。

## 核心能力

### 💾 保存知识
> "记住：用户服务选了 PostgreSQL 而不是 MongoDB，因为 ACID 需求"

### 🔍 搜索知识
> "我们为什么选的 PostgreSQL？"
> → "根据知识库记录，用户服务选择 PostgreSQL 而非 MongoDB，原因是 ACID 需求"

### 30 个 MCP 工具

| 类别 | 工具 |
|------|------|
| 增删改查 | save, get, update, delete |
| 搜索 | 基础搜索、TF-IDF 语义搜索、BM25 关键词搜索、混合搜索(RRF) |
| 组织 | tags, link, unlink, get_linked |
| 知识图谱 | graph_build, graph_query, graph_visualize |
| 质量 | review(间隔重复复习)、audit(SHA256审计)、versions(版本对比/回滚) |
| 分析 | overview, insights, timeline |
| 数据 | export, import, batch, sync, merge |
| 云同步(Pro) | sync_status, sync, license |

## 为什么做这个？

### 零 API Key
市面上大多数 AI 记忆工具需要 OpenAI embeddings API 或云服务。Knowledge Keeper 不需要。BM25 + TF-IDF 全本地运行，**不要 API Key，不要云端，不要月费**。

### Obsidian 兼容
知识库就是 Markdown 文件。直接用 Obsidian 打开。没有 lock-in。

### MIT 开源
有些"开源"记忆工具用 Elastic License 2.0（禁止商用）。我们是 MIT 协议——商业用途随便用。

### 原生 TypeScript
Claude Code / Cursor 用户本来就在 TypeScript 生态。不需要 Python 虚拟环境、pip、ChromaDB。`npx` 一行搞定。

## 检索效果

| 方法 | R@5 |
|------|-----|
| BM25 关键词 | 95% |
| 混合搜索 (BM25 + 语义 + RRF) | 97%+ |

不依赖任何 Embedding API，纯本地实现。

## 快速上手

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
同样的配置加到 MCP config 即可。

## Pro 版

- **云同步** — 端到端加密，服务器无法解密你的数据
- **多设备** — 在不同电脑间同步知识库
- **团队版** — 共享知识库，权限管理

$9/月起。

## 试试看

```bash
npx @zsc-glitch/knowledge-keeper-mcp
```

GitHub: https://github.com/zsc-glitch/knowledge-keeper-mcp
官网: https://zsc-glitch.github.io/knowledge-keeper-mcp/

---

*小影出品 • MIT 协议 • 70 个测试全通过*
